import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendPaymentConfirmation, sendPaymentPending } from "@/lib/email";
import { verifyThreeDS } from "@/lib/nuvei";
import { ensureEnrollmentForPaidOrder } from "@/lib/talleres/enrollment";

export const dynamic = "force-dynamic";

/**
 * Extract CRES from webhook payload. Tries multiple possible field paths
 * because Nuvei's webhook structure for 3DS callbacks is not fully documented
 * and may vary (Anthony confirmed CRES arrives via debit webhook).
 */
function extractCres(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = payload as any;
  const candidates = [
    p?.cres,
    p?.CRes,
    p?.value,
    p?.["3ds"]?.authentication?.cres,
    p?.["3ds"]?.browser_response?.cres,
    p?.["3ds"]?.cres,
    p?.transaction?.cres,
    p?.transaction?.["3ds"]?.authentication?.cres,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) return c;
  }
  return null;
}

/**
 * Nuvei Callback/Webhook endpoint.
 * Nuvei sends transaction notifications here as JSON POST requests.
 * Reference: https://developers.paymentez.com/api/#webhook
 *
 * dev_reference convention:
 * - "pn_<contributionId>" → Plan Novios contribution
 * - anything else → regular order
 */

interface NuveiWebhookPayload {
  transaction: {
    id: string;
    status: string;
    status_detail: number;
    dev_reference: string;
    amount: number;
    authorization_code: string | null;
    message: string | null;
    carrier_code: string | null;
  };
  user: {
    id: string;
    email: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload: NuveiWebhookPayload = await request.json();

    // Log full webhook payload to inspect 3DS structure (per Anthony: CRES
    // may arrive via the debit webhook and must be captured for verify).
    console.log("[webhook] Full payload:", JSON.stringify(payload));

    const { transaction } = payload;
    if (!transaction?.id || !transaction?.dev_reference) {
      return NextResponse.json(
        { error: "Payload inválido" },
        { status: 400 },
      );
    }

    const incomingCres = extractCres(payload);
    if (incomingCres) {
      console.log(
        `[webhook] CRES present in webhook payload (len=${incomingCres.length}) for txId=${transaction.id}`,
      );
    }

    if (!dbAdmin) {
      console.error("Webhook: Firebase Admin not initialized");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const devRef = transaction.dev_reference;

    // Route to Plan Novios handler if prefixed with "pn_"
    if (devRef.startsWith("pn_")) {
      return handlePlanNoviosWebhook(transaction);
    }

    // --- Regular order webhook ---
    const orderId = devRef;

    const orderRef = dbAdmin.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      console.error(`Webhook: Order ${orderId} not found`);
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 },
      );
    }

    // If webhook brings CRES AND order is still in 3ds-pending (verify never
    // called yet), complete the 3DS flow by calling verify with BY_CRES here.
    // This covers the case where the browser-side postMessage never arrived
    // but Nuvei's server-to-server webhook delivered the CRES.
    const orderDataEarly = orderDoc.data()!;
    if (
      incomingCres &&
      orderDataEarly.status === "3ds-pending" &&
      !orderDataEarly.verifyCalledAt
    ) {
      try {
        await dbAdmin.runTransaction(async (tx) => {
          const doc = await tx.get(orderRef);
          if (doc.data()?.verifyCalledAt) throw new Error("ALREADY_CALLED");
          tx.update(orderRef, {
            verifyCalledAt: new Date(),
            threeDSCres: incomingCres,
          });
        });

        console.log(`[webhook] Calling verify BY_CRES for order ${orderId}`);
        const verifyResult = await verifyThreeDS({
          transactionId: orderDataEarly.nuveiTransactionId || transaction.id,
          userId: orderDataEarly.userId,
          type: "BY_CRES",
          value: incomingCres,
        });
        console.log(
          `[webhook] verify response: ${JSON.stringify(verifyResult)}`,
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = verifyResult as any;
        const vStatus =
          verifyResult.transaction?.status ?? raw.status;
        const vDetail =
          verifyResult.transaction?.status_detail ?? raw.status_detail;
        const vAuthCode =
          verifyResult.transaction?.authorization_code ??
          raw.authorization_code ??
          null;
        const vTxId =
          verifyResult.transaction?.id ??
          raw.transaction_id ??
          orderDataEarly.nuveiTransactionId ??
          transaction.id;
        const verifySuccess =
          (vStatus === "success" || vStatus === 1) && vDetail === 3;

        if (verifySuccess) {
          const hasAuth =
            typeof vAuthCode === "string" &&
            vAuthCode.trim().length > 0 &&
            vAuthCode !== "null";
          await orderRef.update({
            status: "paid",
            paymentTransactionId: vTxId,
            ...(hasAuth
              ? { authorizationCode: vAuthCode }
              : {
                  missingAuthCodeFlagged: true,
                  missingAuthCodeLoggedAt: new Date(),
                  emailPending: true,
                }),
            chargeResponseAt: new Date(),
            updatedAt: new Date(),
            threeDSCres: FieldValue.delete(),
            threeDSTransStatus: FieldValue.delete(),
          });

          if (hasAuth && orderDataEarly.userEmail) {
            await sendPaymentConfirmation({
              to: orderDataEarly.userEmail,
              customerName:
                orderDataEarly.shippingAddress?.fullName || "",
              orderId,
              transactionId: vTxId,
              authorizationCode: vAuthCode as string,
              items: orderDataEarly.items || [],
              subtotal:
                orderDataEarly.subtotal || orderDataEarly.total || 0,
              discount: orderDataEarly.discount || undefined,
              couponCode: orderDataEarly.couponCode,
              vat: orderDataEarly.vat || 0,
              total: orderDataEarly.total || 0,
            }).catch(() => {});
            await orderRef.update({ emailSentAt: new Date() });
          }

          // Asegurar enrollment si la orden es de un taller (idempotente).
          try {
            await ensureEnrollmentForPaidOrder(dbAdmin, orderId);
          } catch (err) {
            console.error(`[webhook] Failed to ensure enrollment for ${orderId}:`, err);
          }

          return NextResponse.json({ received: true, verifiedFromWebhook: true });
        }
      } catch (err) {
        if ((err as Error).message !== "ALREADY_CALLED") {
          console.error(
            `[webhook] Failed to verify BY_CRES for order ${orderId}:`,
            err,
          );
        }
      }
    }

    const isApproved =
      transaction.status === "success" && transaction.status_detail === 3;

    const currentStatus = orderDoc.data()?.status;

    // Never downgrade a "paid" order — webhook is idempotent
    const finalStatuses = ["paid", "delivered", "shipped"];
    const shouldUpdateStatus =
      isApproved || !finalStatuses.includes(currentStatus);

    const orderData = orderDoc.data()!;
    const webhookAuthCode = transaction.authorization_code;
    const hasValidAuthCode =
      typeof webhookAuthCode === "string" &&
      webhookAuthCode.trim().length > 0 &&
      webhookAuthCode !== "null";

    const updatePayload: Record<string, unknown> = {
      ...(shouldUpdateStatus && {
        status: isApproved ? "paid" : "cancelled",
      }),
      paymentTransactionId: transaction.id,
      authorizationCode: webhookAuthCode || null,
      webhookStatus: transaction.status,
      webhookStatusDetail: transaction.status_detail,
      webhookReceivedAt: new Date(),
      updatedAt: new Date(),
    };

    // If email was pending (verify returned success without auth_code) and
    // webhook now brings the auth_code, send the confirmation email.
    const shouldSendPendingEmail =
      isApproved &&
      orderData.emailPending === true &&
      hasValidAuthCode &&
      orderData.userEmail;

    if (shouldSendPendingEmail) {
      updatePayload.emailPending = FieldValue.delete();
      updatePayload.missingAuthCodeFlagged = FieldValue.delete();
      updatePayload.emailSentAt = new Date();
    }

    await orderRef.update(updatePayload);

    if (shouldSendPendingEmail) {
      try {
        await sendPaymentConfirmation({
          to: orderData.userEmail,
          customerName: orderData.shippingAddress?.fullName || "",
          orderId,
          transactionId: transaction.id,
          authorizationCode: webhookAuthCode as string,
          items: orderData.items || [],
          subtotal: orderData.subtotal || orderData.total || 0,
          discount: orderData.discount || undefined,
          couponCode: orderData.couponCode,
          vat: orderData.vat || 0,
          total: orderData.total || 0,
        });
        console.log(`[webhook] Pending confirmation email sent for order ${orderId}`);
      } catch (err) {
        console.error(`[webhook] Failed to send pending confirmation email:`, err);
      }
    } else if (
      isApproved &&
      orderData.emailPending === true &&
      !hasValidAuthCode &&
      orderData.userEmail
    ) {
      // Webhook approved the order but still NO auth_code — send pending email
      // (not a success confirmation). Keep flag for audit.
      console.error(
        `[AUDIT:EMAIL_SENT_WITHOUT_AUTH_CODE] orderId=${orderId} txId=${transaction.id}`,
      );
      try {
        await sendPaymentPending({
          to: orderData.userEmail,
          customerName: orderData.shippingAddress?.fullName || "",
          orderId,
          transactionId: transaction.id,
          items: orderData.items || [],
          subtotal: orderData.subtotal || orderData.total || 0,
          discount: orderData.discount || undefined,
          couponCode: orderData.couponCode,
          vat: orderData.vat || 0,
          total: orderData.total || 0,
        });
        await orderRef.update({
          emailPending: FieldValue.delete(),
          emailSentAt: new Date(),
        });
      } catch (err) {
        console.error(`[webhook] Failed to send pending-status email:`, err);
      }
    }

    const newStatus = shouldUpdateStatus
      ? (isApproved ? "paid" : "cancelled")
      : currentStatus;
    console.log(
      `Webhook: Order ${orderId} → ${newStatus} (status_detail: ${transaction.status_detail})`,
    );

    // Si la orden quedó pagada (recién o ya estaba), asegurar enrollment.
    if (newStatus === "paid" && dbAdmin) {
      try {
        await ensureEnrollmentForPaidOrder(dbAdmin, orderId);
      } catch (err) {
        console.error(`[webhook] Failed to ensure enrollment for ${orderId}:`, err);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 },
    );
  }
}

/**
 * Handle webhook for Plan Novios contributions.
 * dev_reference format: "pn_<contributionId>"
 * We search across all planNovios subcollections for the contribution.
 */
async function handlePlanNoviosWebhook(
  transaction: NuveiWebhookPayload["transaction"],
) {
  const contributionId = transaction.dev_reference.replace("pn_", "");

  // Find the contribution across all planNovios subcollections
  // Strategy: scan plans and check for the contribution by ID
  let contribRef: FirebaseFirestore.DocumentReference | null = null;
  let contribData: FirebaseFirestore.DocumentData | null = null;

  const plansSnapshot = await dbAdmin!.collection("planNovios").get();
  for (const planDoc of plansSnapshot.docs) {
    const cDoc = await dbAdmin!
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

  // Never downgrade a "paid" contribution
  if (currentStatus === "paid") {
    console.log(`Webhook: Contribution ${contributionId} already paid, skipping`);
    return NextResponse.json({ received: true });
  }

  if (isApproved) {
    const batch = dbAdmin!.batch();

    batch.update(contribRef, {
      status: "paid",
      paymentTransactionId: transaction.id,
      authorizationCode: transaction.authorization_code || null,
      webhookStatus: transaction.status,
      webhookStatusDetail: transaction.status_detail,
      webhookReceivedAt: new Date(),
      updatedAt: new Date(),
    });

    // Atomically increment plan balance
    const planId = contribData.planId;
    if (planId) {
      const planRef = dbAdmin!.collection("planNovios").doc(planId);
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
    console.log(`Webhook: Contribution ${contributionId} → failed (status_detail: ${transaction.status_detail})`);
  }

  return NextResponse.json({ received: true });
}
