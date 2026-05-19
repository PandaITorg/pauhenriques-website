// Wireup for @pandait.tech/payment-nuvei handler factories.
//
// Centralizes the Pau-specific dependencies the route.ts files inject into
// each createXHandler() call: Firebase admin, Resend email service,
// anti-abuse (Turnstile + rate limit), pricing, plus the Pau-specific
// post-payment side effects (course enrollment, paymentLink usage tracking,
// Plan Novios webhook handling, courses retry URL routing).

import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { dbAdmin, auth } from "@/lib/firebase-admin";
import {
  sendPaymentConfirmation as pauSendPaymentConfirmation,
  sendPaymentFailed as pauSendPaymentFailed,
  sendPaymentPending as pauSendPaymentPending,
} from "@/lib/email";
import { getPriceDisplay as pauGetPriceDisplay } from "@/lib/pricing";
import { ensureEnrollmentForPaidOrder } from "@/lib/talleres/enrollment";
import { docToTaller } from "@/lib/talleres/firestore";
import { getTallerPriceDisplay } from "@/lib/talleres/pricing";
import type {
  CustomOrderValidationResult,
  EmailService,
  GetPriceDisplayFn,
  MinimalOrder,
  PaymentConfirmationArgs,
  PaymentFailedArgs,
  PaymentPendingArgs,
  ValidateCustomOrderFn,
  WebhookHandlerDeps,
} from "@pandait.tech/payment-nuvei/handlers";

// --- Firebase admin services (used by every handler) ---

if (!dbAdmin || !auth) {
  // Will surface as a 500 from the handlers if it ever happens (firebase-admin
  // bootstraps at module load); throwing here would crash the whole server.
  // eslint-disable-next-line no-console
  console.error("[nuvei-deps] dbAdmin or auth not initialized");
}

export const firebase = {
  db: dbAdmin!,
  auth: auth!,
};

// --- Email service ---
//
// Pau's email functions and the package's email contract have small
// shape differences:
//   - items: Pau wants `{ name, quantity, price }[]` required;
//     package passes `{ productId, name, price, quantity }[] | undefined`.
//     Adapter coerces undefined -> [] and strips productId.

type PauItem = { name: string; quantity: number; price: number };

function adaptItems(
  items: PaymentConfirmationArgs["items"] | PaymentFailedArgs["items"],
): PauItem[] {
  if (!items) return [];
  return items.map(({ name, quantity, price }) => ({ name, quantity, price }));
}

export const email: EmailService = {
  sendPaymentConfirmation: (args: PaymentConfirmationArgs) =>
    pauSendPaymentConfirmation({
      ...args,
      items: adaptItems(args.items),
    }),
  sendPaymentFailed: (args: PaymentFailedArgs) =>
    pauSendPaymentFailed({
      ...args,
      items: adaptItems(args.items),
    }),
  sendPaymentPending: (args: PaymentPendingArgs) =>
    pauSendPaymentPending({
      ...args,
      items: adaptItems(args.items),
    }),
};

// --- Pricing function ---
//
// Pau's getPriceDisplay accepts a typed product shape (price + autoDiscounts
// as AutoDiscountLike[]). The package passes autoDiscounts as `unknown` to
// avoid coupling to Pau's product type. Cast is safe because the AutoDiscount
// shape stored in Firestore is identical to AutoDiscountLike.
export const getPriceDisplay: GetPriceDisplayFn = (product) =>
  pauGetPriceDisplay(
    product as Parameters<typeof pauGetPriceDisplay>[0],
  );

// --- Anti-abuse (re-exported for handler config) ---

export { checkRateLimit as rateLimit } from "@/lib/rateLimit";

/**
 * Turnstile wrapper that adapts Pau's `verifyTurnstile(token, ip?)` signature
 * (which returns `{ success: boolean; ... }`) to the package's expected
 * `(token, ip?) => Promise<{ success: boolean }>` shape.
 */
import { verifyTurnstile as pauVerifyTurnstile } from "@/lib/turnstile";
export const turnstile = async (
  token: string,
  ip?: string,
): Promise<{ success: boolean }> => {
  const result = await pauVerifyTurnstile(token, ip);
  return { success: result.success };
};

// --- Pau-specific retry URL for payment-failed emails ---

// Map course products to their dedicated guest checkout page so retry emails
// take the user back to the correct flow (not /checkout which requires auth).
const COURSE_RETRY_PATHS: Record<string, string> = {
  "curso-toxica-sin-toxicos": "/pago/toxica-sin-toxicos",
};

const SITE_URL = "https://pauhenriques.com";

export function getRetryUrl(order: MinimalOrder & { id: string }): string {
  const courseId = typeof order.courseId === "string" ? order.courseId : undefined;
  if (courseId && COURSE_RETRY_PATHS[courseId]) {
    return `${SITE_URL}${COURSE_RETRY_PATHS[courseId]}`;
  }
  return `${SITE_URL}/checkout`;
}

// --- Pau-specific post-success hook ---

/**
 * Runs after charge / 3ds-complete / webhook transitions an order to "paid".
 * Idempotent and best-effort: errors here are logged and swallowed by the
 * package's hook invoker so they don't fail the response.
 *
 *  1. Course enrollment if the order has courseId + guestInfo (idempotent).
 *  2. paymentLink usage tracking (timesPaid increment + lastPaidAt).
 */
export async function onPaymentSucceeded(
  order: MinimalOrder & { id: string },
): Promise<void> {
  if (!dbAdmin) return;

  try {
    await ensureEnrollmentForPaidOrder(dbAdmin, order.id);
  } catch (err) {
    console.error(`[nuvei-deps] enrollment failed for order ${order.id}:`, err);
  }

  const paymentLinkId =
    typeof order.paymentLinkId === "string" ? order.paymentLinkId : null;
  if (paymentLinkId) {
    try {
      await dbAdmin
        .collection("paymentLinks")
        .doc(paymentLinkId)
        .update({
          timesPaid: FieldValue.increment(1),
          lastPaidAt: new Date(),
          updatedAt: new Date(),
        });
    } catch (err) {
      console.error(
        `[nuvei-deps] paymentLink ${paymentLinkId} usage tracking failed:`,
        err,
      );
    }
  }
}

// --- Pau-specific custom order validation ---

/**
 * Validates the two Pau-specific order flows that bypass the package's
 * standard product/promotion validation in createChargeHandler:
 *
 *  1. paymentLinkId — order came from a dynamic /pago/t/[token] flow. The
 *     amount must match the link's stored price (within 2 cents). The link
 *     must exist, be active, and not expired.
 *  2. tallerId — order came from /pago/[slug] (official taller link). The
 *     amount must match the taller's current effective price (basePrice or
 *     active discount tier, recomputed at charge time).
 *
 * Returns `{ handled: false }` for everything else so the package runs its
 * standard validation against `products` + `promotions`.
 */
export const validateCustomOrder: ValidateCustomOrderFn = async ({
  orderData,
  amount,
}): Promise<CustomOrderValidationResult> => {
  if (!dbAdmin) {
    return {
      handled: true,
      valid: false,
      error: "Server configuration error",
      status: 500,
    };
  }

  const paymentLinkId =
    typeof orderData.paymentLinkId === "string" ? orderData.paymentLinkId : null;

  if (paymentLinkId) {
    const linkSnap = await dbAdmin
      .collection("paymentLinks")
      .doc(paymentLinkId)
      .get();
    if (!linkSnap.exists) {
      return {
        handled: true,
        valid: false,
        error: "El link de pago ya no existe",
        status: 409,
      };
    }
    const linkData = linkSnap.data() ?? {};
    if (linkData.active === false) {
      return {
        handled: true,
        valid: false,
        error: "Este link de pago fue desactivado",
        status: 409,
      };
    }
    const expiresAtRaw = linkData.expiresAt;
    const expiresAt: Date | null =
      expiresAtRaw?.toDate?.() ??
      (expiresAtRaw instanceof Date ? expiresAtRaw : null);
    if (expiresAt && expiresAt.getTime() < Date.now()) {
      return {
        handled: true,
        valid: false,
        error: "Este link de pago expiró",
        status: 409,
      };
    }
    const linkPrice =
      typeof linkData.price === "number" ? linkData.price : 0;
    if (linkPrice <= 0 || Math.abs(linkPrice - amount) > 0.02) {
      return {
        handled: true,
        valid: false,
        error: "El monto no coincide con el precio del link.",
        status: 409,
      };
    }
    return { handled: true, valid: true };
  }

  const tallerId =
    typeof orderData.tallerId === "string" ? orderData.tallerId : null;
  if (tallerId) {
    const tallerSnap = await dbAdmin.collection("talleres").doc(tallerId).get();
    if (!tallerSnap.exists) {
      return {
        handled: true,
        valid: false,
        error: "El taller ya no existe",
        status: 409,
      };
    }
    const taller = docToTaller(tallerSnap);
    if (!taller.active) {
      return {
        handled: true,
        valid: false,
        error: "Este taller no está disponible",
        status: 409,
      };
    }
    const display = getTallerPriceDisplay(taller);
    if (Math.abs(display.finalPrice - amount) > 0.02) {
      return {
        handled: true,
        valid: false,
        error:
          "El precio del taller cambió. Recargá la página para ver el precio actualizado.",
        status: 409,
      };
    }
    return { handled: true, valid: true };
  }

  return { handled: false };
};

// --- Pau-specific Plan Novios webhook routing ---

type CustomDevReferenceFn = NonNullable<
  WebhookHandlerDeps["handleCustomDevReference"]
>;
type NuveiTransaction = Parameters<CustomDevReferenceFn>[1];

/**
 * Intercepts webhooks where dev_reference is prefixed with "pn_" (Plan Novios
 * contribution). Looks up the contribution across the planNovios/{plan}/
 * contributions subcollections, updates its status, and atomically bumps the
 * plan's totalContributed + balance. Returns null for non-"pn_" prefixes so
 * the package's standard order webhook flow runs.
 */
export const handleCustomDevReference: CustomDevReferenceFn = async (
  devRef: string,
  transaction: NuveiTransaction,
): Promise<NextResponse | null> => {
  if (!devRef.startsWith("pn_")) return null;
  if (!dbAdmin) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const contributionId = devRef.replace("pn_", "");

  let contribRef: FirebaseFirestore.DocumentReference | null = null;
  let contribData: FirebaseFirestore.DocumentData | null = null;

  const plansSnapshot = await dbAdmin.collection("planNovios").get();
  for (const planDoc of plansSnapshot.docs) {
    const cDoc = await dbAdmin
      .collection("planNovios")
      .doc(planDoc.id)
      .collection("contributions")
      .doc(contributionId)
      .get();
    if (cDoc.exists) {
      contribRef = cDoc.ref;
      contribData = cDoc.data()!;
      break;
    }
  }

  if (!contribRef || !contribData) {
    console.error(`Webhook: Plan Novios contribution ${contributionId} not found`);
    return NextResponse.json(
      { error: "Contribucion no encontrada" },
      { status: 404 },
    );
  }

  const isApproved =
    transaction.status === "success" && transaction.status_detail === 3;
  const currentStatus = contribData.status;

  if (currentStatus === "paid") {
    console.log(`Webhook: Contribution ${contributionId} already paid, skipping`);
    return NextResponse.json({ received: true });
  }

  if (isApproved) {
    const batch = dbAdmin.batch();
    batch.update(contribRef, {
      status: "paid",
      paymentTransactionId: transaction.id,
      authorizationCode: transaction.authorization_code || null,
      webhookStatus: transaction.status,
      webhookStatusDetail: transaction.status_detail,
      webhookReceivedAt: new Date(),
      updatedAt: new Date(),
    });

    const planId = contribData.planId;
    if (planId) {
      const planRef = dbAdmin.collection("planNovios").doc(planId);
      batch.update(planRef, {
        totalContributed: FieldValue.increment(contribData.amount),
        balance: FieldValue.increment(contribData.amount),
        updatedAt: new Date(),
      });
    }

    await batch.commit();
    console.log(`Webhook: Contribution ${contributionId} → paid`);
  } else {
    await contribRef.update({
      status: "failed",
      webhookStatus: transaction.status,
      webhookStatusDetail: transaction.status_detail,
      webhookReceivedAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(
      `Webhook: Contribution ${contributionId} → failed (status_detail: ${transaction.status_detail})`,
    );
  }

  return NextResponse.json({ received: true });
};

// --- Pau-specific Nuvei branding for init-checkout ---

export const merchantName = "Pau Henriques";
export const merchantDescription = "Pago Pau Henriques";
export const themeColors = {
  primary: "#a68a63",
  secondary: "#1a1a1a",
} as const;

export const cloudFunctionsBaseUrl =
  process.env.CLOUD_FUNCTIONS_BASE_URL ||
  "https://us-central1-pau-henriques-web-v1.cloudfunctions.net";
