import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, auth } from "@/lib/firebase-admin";
import { debitWithToken, deleteCard } from "@pandait.tech/payment-nuvei";
import { sendContributionConfirmation, sendContributionNotification } from "@/lib/email-plan-novios";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

export const dynamic = "force-dynamic";

const BillingDataSchema = z.object({
  name: z.string().min(2).max(100),
  cedula: z.string().min(10).max(13),
  address: z.string().min(5).max(300),
  phone: z.string().min(7).max(15),
});

const ContributeSchema = z.object({
  planId: z.string().min(1),
  slug: z.string().min(1),
  guestName: z.string().min(1).max(100),
  guestEmail: z.string().email().optional().or(z.literal("")),
  guestMessage: z.string().max(500).optional().or(z.literal("")),
  amount: z.number().min(1).max(10000),
  token: z.string().min(1),
  cvc: z.string().optional(),
  billingData: BillingDataSchema.optional(),
  browserInfo: z
    .object({
      accept_header: z.string(),
      user_agent: z.string(),
      language: z.string(),
      timezone_offset: z.number(),
      screen_width: z.number(),
      screen_height: z.number(),
      color_depth: z.number(),
      js_enabled: z.boolean(),
      java_enabled: z.boolean(),
      ip_address: z.string().optional(),
    })
    .optional(),
});

// Nuvei status_detail codes (reused from charge route)
const NUVEI_ERROR_MESSAGES: Record<number, string> = {
  0: "Error del procesador de pagos. Intenta de nuevo.",
  2: "Error en la validacion del banco. Verifica los datos de tu tarjeta.",
  4: "Tarjeta rechazada por el banco. Intenta con otra tarjeta.",
  5: "Transaccion no permitida por el banco emisor.",
  6: "Error de comunicacion con el banco. Intenta en unos minutos.",
  7: "Tarjeta reportada como perdida o robada. Contacta a tu banco.",
  8: "Tarjeta rechazada por seguridad antifraude.",
  9: "Transaccion denegada por el banco. Contacta a tu banco o intenta con otra tarjeta.",
  10: "La tarjeta no pudo ser procesada. Intenta con otra tarjeta.",
  11: "Transaccion rechazada por el sistema antifraude.",
  12: "Tarjeta en lista restringida. Contacta a tu banco.",
  13: "Tarjeta invalida o deshabilitada. Contacta a tu banco.",
  14: "El monto excede el limite permitido por tu tarjeta.",
  19: "Transaccion rechazada por filtro antifraude.",
  20: "Tarjeta vencida. Actualiza tu metodo de pago.",
  21: "Codigo de seguridad (CVV) incorrecto.",
  22: "Tipo de tarjeta no soportado para esta transaccion.",
  23: "Transaccion rechazada. Intenta de nuevo mas tarde.",
  31: "Tu banco requiere verificacion OTP. Ingresa el codigo enviado a tu telefono.",
  36: "Tu banco requiere verificacion adicional 3DS.",
  37: "Tu banco requiere verificacion adicional 3DS.",
};

function getNuveiUserMessage(statusDetail?: number, rawMessage?: string | null): string {
  if (statusDetail !== undefined && NUVEI_ERROR_MESSAGES[statusDetail]) {
    return NUVEI_ERROR_MESSAGES[statusDetail];
  }
  if (rawMessage?.toLowerCase().includes("insufficient")) return NUVEI_ERROR_MESSAGES[9];
  if (rawMessage?.toLowerCase().includes("expired")) return NUVEI_ERROR_MESSAGES[20];
  if (rawMessage?.toLowerCase().includes("cvv")) return NUVEI_ERROR_MESSAGES[21];
  return "No se pudo procesar el pago. Verifica los datos de tu tarjeta o intenta con otra.";
}

export async function POST(request: NextRequest) {
  try {
    if (!dbAdmin) {
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }

    // Check for optional auth — logged-in users get their real userId
    let authenticatedUserId: string | null = null;
    const sessionCookie = request.cookies.get("__session")?.value;
    if (sessionCookie && auth) {
      try {
        const decoded = await auth.verifySessionCookie(sessionCookie, true);
        authenticatedUserId = decoded.uid;
      } catch {
        // Session expired or invalid — continue as guest
      }
    }

    const rawBody = await request.json();
    const parsed = ContributeSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos incompletos o invalidos" },
        { status: 400 },
      );
    }

    const { planId, slug, guestName, guestEmail, guestMessage, amount, token, cvc, billingData, browserInfo } = parsed.data;

    // Validate plan exists and is active
    const planDoc = await dbAdmin.collection("planNovios").doc(planId).get();
    if (!planDoc.exists) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    const planData = planDoc.data()!;
    if (planData.status !== "active" || !planData.isActive) {
      return NextResponse.json({ error: "Este plan no esta aceptando contribuciones" }, { status: 409 });
    }

    if (planData.slug !== slug) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    // Round amount to 2 decimals
    const roundedAmount = Math.round(amount * 100) / 100;

    // Create contribution document
    const contributionRef = dbAdmin.collection("planNovios").doc(planId).collection("contributions").doc();
    const contributionId = contributionRef.id;

    await contributionRef.set({
      planId,
      guestName,
      guestEmail: guestEmail || null,
      guestMessage: guestMessage || null,
      amount: roundedAmount,
      currency: "USD",
      status: "pending",
      authenticatedUserId: authenticatedUserId || null,
      billingData: billingData || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Build Nuvei user ID: real userId if authenticated, temp ID if guest
    const nuveiUserId = authenticatedUserId || `guest_${planId}_${Date.now()}`;
    const nuveiUserEmail = guestEmail || "guest@pauhenriques.com";

    // Build term_url for 3DS
    const functionsBase = process.env.CLOUD_FUNCTIONS_BASE_URL
      || "https://us-central1-pau-henriques-web-v1.cloudfunctions.net";
    const termUrl = `${functionsBase}/threeDSCallbackPlanNovios?contributionId=${contributionId}&planId=${planId}`;

    // Inject client IP
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const enrichedBrowserInfo = browserInfo
      ? { ...browserInfo, ip_address: clientIp }
      : undefined;

    const coupleNames = `${planData.partner1Name} y ${planData.partner2Name}`;

    // Call Nuvei debit — contributions have no VAT
    const nuveiData = await debitWithToken({
      userId: nuveiUserId,
      userEmail: nuveiUserEmail,
      amount: roundedAmount,
      description: `Contribucion Plan Novios - ${coupleNames}`,
      devReference: `pn_${contributionId}`,
      cardToken: token,
      ...(cvc ? { cvc } : {}),
      vat: 0,
      taxableAmount: roundedAmount,
      ...(enrichedBrowserInfo ? { browserInfo: enrichedBrowserInfo, termUrl } : {}),
    });

    console.log("[plan-novios/contribute] Nuvei response:", JSON.stringify({
      status: nuveiData.transaction?.status,
      status_detail: nuveiData.transaction?.status_detail,
      id: nuveiData.transaction?.id,
      error: nuveiData.error,
    }));

    // SUCCESS
    if (
      nuveiData.transaction?.status === "success" &&
      nuveiData.transaction?.status_detail === 3
    ) {
      const batch = dbAdmin.batch();

      batch.update(contributionRef, {
        status: "paid",
        paymentTransactionId: nuveiData.transaction.id,
        authorizationCode: nuveiData.transaction.authorization_code || null,
        updatedAt: new Date(),
      });

      // Atomically increment plan balance
      const planRef = dbAdmin.collection("planNovios").doc(planId);
      batch.update(planRef, {
        totalContributed: FieldValue.increment(roundedAmount),
        balance: FieldValue.increment(roundedAmount),
        updatedAt: new Date(),
      });

      await batch.commit();

      // Delete card token (guests never save cards)
      if (!authenticatedUserId) {
        deleteCard(token, nuveiUserId).catch((err) =>
          console.error("[plan-novios/contribute] Failed to delete guest card:", err),
        );
      }

      // Send emails (non-blocking)
      if (guestEmail) {
        sendContributionConfirmation({
          to: guestEmail,
          guestName,
          coupleNames,
          amount: roundedAmount,
          slug,
        }).catch(() => {});
      }
      if (planData.userEmail) {
        sendContributionNotification({
          to: planData.userEmail,
          coupleNames,
          guestName,
          amount: roundedAmount,
          guestMessage: guestMessage || undefined,
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        contributionId,
        transactionId: nuveiData.transaction.id,
      });
    }

    // REVIEW/PENDING (status_detail 1)
    if (
      nuveiData.transaction?.status === "pending" &&
      nuveiData.transaction?.status_detail === 1
    ) {
      await contributionRef.update({
        status: "pending",
        paymentTransactionId: nuveiData.transaction.id || null,
        updatedAt: new Date(),
      });
      return NextResponse.json({ review: true, contributionId });
    }

    // 3DS DEVICE FINGERPRINT (status_detail 35)
    if (nuveiData.transaction?.status_detail === 35) {
      const hiddenIframeHtml = nuveiData["3ds"]?.browser_response?.hidden_iframe || "";
      await contributionRef.update({
        status: "3ds-pending",
        isDeviceFingerprint: true,
        nuveiTransactionId: nuveiData.transaction.id || null,
        nuveiUserId,
        updatedAt: new Date(),
      });
      return NextResponse.json({
        challenge: true,
        challengeHtml: hiddenIframeHtml,
        isDeviceFingerprint: true,
        contributionId,
        planId,
        nuveiTransactionId: nuveiData.transaction.id,
        nuveiUserId,
        statusDetail: 35,
      });
    }

    // OTP (status_detail 31)
    if (nuveiData.transaction?.status_detail === 31) {
      await contributionRef.update({
        status: "otp-pending",
        nuveiTransactionId: nuveiData.transaction.id || null,
        nuveiUserId,
        updatedAt: new Date(),
      });
      return NextResponse.json({
        otpRequired: true,
        contributionId,
        planId,
        nuveiTransactionId: nuveiData.transaction.id,
        nuveiUserId,
        statusDetail: 31,
      });
    }

    // 3DS CHALLENGE (status_detail 36 or 37)
    if (nuveiData.transaction?.status_detail === 36 || nuveiData.transaction?.status_detail === 37) {
      const challengeHtml =
        nuveiData["3ds"]?.browser_response?.challenge_request ||
        nuveiData["3ds"]?.browser_response?.hidden_iframe ||
        "";
      if (challengeHtml) {
        await contributionRef.update({
          status: "3ds-pending",
          nuveiTransactionId: nuveiData.transaction.id || null,
          nuveiUserId,
          updatedAt: new Date(),
        });
        return NextResponse.json({
          challenge: true,
          challengeHtml,
          isDeviceFingerprint: false,
          contributionId,
          planId,
          nuveiTransactionId: nuveiData.transaction.id,
          nuveiUserId,
          statusDetail: nuveiData.transaction.status_detail,
        });
      }
    }

    // FAILURE
    const failedErrorMsg = getNuveiUserMessage(
      nuveiData.transaction?.status_detail,
      nuveiData.transaction?.message || nuveiData.error?.description,
    );

    await contributionRef.update({
      status: "failed",
      updatedAt: new Date(),
    });

    // Clean up guest card
    if (!authenticatedUserId) {
      deleteCard(token, nuveiUserId).catch(() => {});
    }

    return NextResponse.json({ error: failedErrorMsg }, { status: 400 });
  } catch (error) {
    console.error("[plan-novios/contribute] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
