import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, auth } from "@/lib/firebase-admin";
import { debitWithToken, deleteCard } from "@/lib/nuvei";
import { sendPaymentConfirmation, sendPaymentFailed } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";
import { getPriceDisplay } from "@/lib/pricing";
import { verifyTurnstile } from "@/lib/turnstile";
import { ensureEnrollmentForPaidOrder } from "@/lib/talleres/enrollment";
import { docToTaller } from "@/lib/talleres/firestore";
import { getTallerPriceDisplay } from "@/lib/talleres/pricing";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

// Nuvei/Paymentez status_detail codes → user-friendly messages in Spanish
const NUVEI_ERROR_MESSAGES: Record<number, string> = {
  0: "Error del procesador de pagos. Intenta de nuevo.",
  // 1 = review/pending — handled separately, not shown as error
  2: "Error en la validación del banco. Verifica los datos de tu tarjeta.",
  // 3 = success, not used here
  4: "Tarjeta rechazada por el banco. Intenta con otra tarjeta.",
  5: "Transacción no permitida por el banco emisor.",
  6: "Error de comunicación con el banco. Intenta en unos minutos.",
  7: "Tarjeta reportada como perdida o robada. Contacta a tu banco.",
  8: "Tarjeta rechazada por seguridad antifraude.",
  9: "Transacción denegada por el banco. Contacta a tu banco o intenta con otra tarjeta.",
  10: "La tarjeta no pudo ser procesada. Intenta con otra tarjeta.",
  11: "Transacción rechazada por el sistema antifraude.",
  12: "Tarjeta en lista restringida. Contacta a tu banco.",
  13: "Tarjeta inválida o deshabilitada. Contacta a tu banco.",
  14: "El monto excede el límite permitido por tu tarjeta.",
  19: "Transacción rechazada por filtro antifraude.",
  20: "Tarjeta vencida. Actualiza tu método de pago.",
  21: "Código de seguridad (CVV) incorrecto.",
  22: "Tipo de tarjeta no soportado para esta transacción.",
  23: "Transacción rechazada. Intenta de nuevo más tarde.",
  31: "Tu banco requiere verificación OTP. Ingresa el código enviado a tu teléfono.",
  36: "Tu banco requiere verificación adicional 3DS. Completa el proceso en la ventana emergente.",
  37: "Tu banco requiere verificación adicional 3DS. Completa el proceso en la ventana emergente.",
};

const THREEDS_AUTH_MESSAGES: Record<string, string> = {
  N: "Autenticación 3DS rechazada por tu banco. Intenta con otra tarjeta.",
  R: "Tu banco rechazó la autenticación 3DS.",
  U: "No se pudo verificar la autenticación 3DS. Intenta de nuevo.",
};

// Map course products to their dedicated guest checkout page so retry emails
// take the user back to the correct flow (not /checkout which requires auth).
const COURSE_RETRY_PATHS: Record<string, string> = {
  "curso-toxica-sin-toxicos": "/pago/toxica-sin-toxicos",
};

function getRetryUrl(courseId?: string | null): string {
  const base = "https://pauhenriques.com";
  if (courseId && COURSE_RETRY_PATHS[courseId]) {
    return `${base}${COURSE_RETRY_PATHS[courseId]}`;
  }
  return `${base}/checkout`;
}

function getNuveiUserMessage(statusDetail?: number, rawMessage?: string | null): string {
  if (statusDetail !== undefined && NUVEI_ERROR_MESSAGES[statusDetail]) {
    return NUVEI_ERROR_MESSAGES[statusDetail];
  }
  // Fallback: clean common raw messages
  if (rawMessage?.toLowerCase().includes("insufficient")) {
    return NUVEI_ERROR_MESSAGES[9];
  }
  if (rawMessage?.toLowerCase().includes("expired")) {
    return NUVEI_ERROR_MESSAGES[20];
  }
  if (rawMessage?.toLowerCase().includes("cvv")) {
    return NUVEI_ERROR_MESSAGES[21];
  }
  return "No se pudo procesar el pago. Verifica los datos de tu tarjeta o intenta con otra.";
}

interface BrowserInfo {
  accept_header: string;
  user_agent: string;
  language: string;
  timezone_offset: number;
  screen_width: number;
  screen_height: number;
  color_depth: number;
  js_enabled: boolean;
  java_enabled: boolean;
  ip_address?: string;
}

interface ChargeRequestBody {
  token: string;
  cvc?: string;
  orderId: string;
  amount: number;
  vat: number;
  description: string;
  userId: string;
  userEmail: string;
  browserInfo?: BrowserInfo;
  installments?: number;
  installmentsType?: number;
  deleteCardAfterPayment?: boolean;
  /** Token generado por el widget Turnstile en el cliente. */
  turnstileToken?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify session
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie || !auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    } catch {
      return NextResponse.json({ error: "Sesion invalida" }, { status: 401 });
    }

    // Client IP — used both for rate limiting and as Turnstile remoteip hint.
    const clientIpForLimit =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Rate limit: 10 charge attempts per IP per 15 minutes. Anti-abuse for
    // guest flows where anyone with the link could otherwise hammer the
    // endpoint with stolen cards. Legitimate users rarely retry > 3 times.
    const allowed = await checkRateLimit(
      `charge:${clientIpForLimit}`,
      10,
      15 * 60 * 1000,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intentá de nuevo en unos minutos." },
        { status: 429 },
      );
    }

    // Turnstile — captcha v3 invisible. Fail-closed: si falta el token o la
    // verificación falla, rechazamos. El cliente siempre manda el token
    // porque el botón Pagar está disabled hasta que el widget produce uno.
    const body: ChargeRequestBody = await request.json();
    const turnstileToken = body.turnstileToken;
    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Verificación de seguridad faltante. Recargá la página." },
        { status: 403 },
      );
    }
    const turnstileResult = await verifyTurnstile(
      turnstileToken,
      clientIpForLimit === "unknown" ? undefined : clientIpForLimit,
    );
    if (!turnstileResult.success) {
      return NextResponse.json(
        { error: "No pudimos verificar que sos humano. Recargá la página." },
        { status: 403 },
      );
    }

    const { token, cvc, orderId, amount, vat, description, userId, userEmail, browserInfo, installments, installmentsType } = body;

    console.log("[charge] Request:", { token: token?.substring(0, 10) + "...", orderId, amount, userId: userId?.substring(0, 8) + "..." });

    if (!token || !orderId || !amount) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 },
      );
    }

    // Verify the user matches the session
    if (decodedToken.uid !== userId) {
      return NextResponse.json({ error: "Usuario no coincide" }, { status: 403 });
    }

    // Re-validate order exists and is pending (prevents double charge)
    if (dbAdmin) {
      const orderDoc = await dbAdmin.collection("orders").doc(orderId).get();
      if (!orderDoc.exists) {
        return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
      }
      const orderData = orderDoc.data();
      if (orderData?.status !== "pending") {
        return NextResponse.json(
          { error: "Esta orden ya fue procesada" },
          { status: 409 },
        );
      }

      // Branch: orden de paymentLink (taller). El precio es FIJO al precio
      // del link al momento de crearlo — no depende de products ni de
      // descuentos automáticos. Validamos contra el doc del paymentLink y
      // saltamos toda la validación de products/promociones.
      const paymentLinkId =
        typeof orderData?.paymentLinkId === "string"
          ? orderData.paymentLinkId
          : null;
      if (paymentLinkId) {
        const linkSnap = await dbAdmin
          .collection("paymentLinks")
          .doc(paymentLinkId)
          .get();
        if (!linkSnap.exists) {
          return NextResponse.json(
            { error: "El link de pago ya no existe" },
            { status: 409 },
          );
        }
        const linkData = linkSnap.data() ?? {};
        if (linkData.active === false) {
          return NextResponse.json(
            { error: "Este link de pago fue desactivado" },
            { status: 409 },
          );
        }
        const expiresAtRaw = linkData.expiresAt;
        const expiresAt: Date | null =
          expiresAtRaw?.toDate?.() ??
          (expiresAtRaw instanceof Date ? expiresAtRaw : null);
        if (expiresAt && expiresAt.getTime() < Date.now()) {
          return NextResponse.json(
            { error: "Este link de pago expiró" },
            { status: 409 },
          );
        }
        const linkPrice =
          typeof linkData.price === "number" ? linkData.price : 0;
        if (linkPrice <= 0 || Math.abs(linkPrice - amount) > 0.02) {
          return NextResponse.json(
            { error: "El monto no coincide con el precio del link." },
            { status: 409 },
          );
        }
        // Skip products + promotions validation entirely.
        // Continue to the Nuvei debit call below.
      } else if (typeof orderData?.tallerId === "string" && orderData.tallerId) {
        // Branch: orden del link OFICIAL del taller (/pago/[slug]). El precio
        // viene de los discountTiers del taller (tier activo o basePrice).
        // No depende de products ni de paymentLinks. Recalculamos el tier
        // activo AHORA y comparamos contra el monto enviado.
        const tallerSnap = await dbAdmin
          .collection("talleres")
          .doc(orderData.tallerId)
          .get();
        if (!tallerSnap.exists) {
          return NextResponse.json(
            { error: "El taller ya no existe" },
            { status: 409 },
          );
        }
        const taller = docToTaller(tallerSnap);
        if (!taller.active) {
          return NextResponse.json(
            { error: "Este taller no está disponible" },
            { status: 409 },
          );
        }
        const display = getTallerPriceDisplay(taller);
        if (Math.abs(display.finalPrice - amount) > 0.02) {
          return NextResponse.json(
            {
              error:
                "El precio del taller cambió. Recargá la página para ver el precio actualizado.",
            },
            { status: 409 },
          );
        }
        // Skip products + promotions validation.
      } else {

      // Validate stock and prices for each item before charging
      const orderItems: Array<{ productId: string; name: string; price: number; quantity: number }> =
        orderData?.items || [];
      let verifiedSubtotal = 0;
      for (const item of orderItems) {
        const productDoc = await dbAdmin.collection("products").doc(item.productId).get();
        if (!productDoc.exists || !productDoc.data()?.isActive) {
          return NextResponse.json(
            { error: `El producto "${item.name}" ya no está disponible` },
            { status: 409 },
          );
        }
        const productData = productDoc.data()!;
        const isDigital = productData.isDigital === true;
        const stock = productData.stock ?? 0;
        if (!isDigital && stock < item.quantity) {
          return NextResponse.json(
            { error: `Stock insuficiente para "${item.name}" (disponible: ${stock})` },
            { status: 409 },
          );
        }
        // Precio efectivo = descuento auto activo o precio base. Si el item
        // trae un precio distinto al que el servidor calcula AHORA, se
        // rechaza para que el cliente recargue la página.
        const display = getPriceDisplay({
          price: productData.price ?? 0,
          autoDiscounts: productData.autoDiscounts,
        });
        const expectedItemSubtotal = display.finalSubtotal;
        if (Math.abs(expectedItemSubtotal - item.price) > 0.02) {
          return NextResponse.json(
            {
              error: `El precio de "${item.name}" cambió. Recargá la página para ver el precio actualizado.`,
            },
            { status: 409 },
          );
        }
        verifiedSubtotal += expectedItemSubtotal * item.quantity;
      }

      // Re-validate coupon if one was applied to the order
      let verifiedDiscount = 0;
      const orderDiscount = orderData?.discount ?? 0;
      const orderPromotionId = orderData?.promotionId;

      if (orderPromotionId && orderDiscount > 0) {
        const promoDoc = await dbAdmin.collection("promotions").doc(orderPromotionId).get();
        if (!promoDoc.exists || !promoDoc.data()?.isActive) {
          return NextResponse.json(
            { error: "El cupon aplicado ya no es valido. Remuevelo y vuelve a intentar." },
            { status: 409 },
          );
        }
        const promo = promoDoc.data()!;

        // Check date range
        const now = new Date();
        const validFrom = promo.rules.validFrom.toDate ? promo.rules.validFrom.toDate() : new Date(promo.rules.validFrom);
        const validUntil = promo.rules.validUntil.toDate ? promo.rules.validUntil.toDate() : new Date(promo.rules.validUntil);
        if (now < validFrom || now > validUntil) {
          return NextResponse.json(
            { error: "El cupon aplicado ha expirado. Remuevelo y vuelve a intentar." },
            { status: 409 },
          );
        }

        // Check max uses
        if (promo.rules.maxTotalUses && promo.currentUses >= promo.rules.maxTotalUses) {
          return NextResponse.json(
            { error: "El cupon aplicado ya alcanzo su limite de usos." },
            { status: 409 },
          );
        }

        // Recalculate discount server-side
        if (promo.type === "percentage") {
          verifiedDiscount = verifiedSubtotal * (promo.value / 100);
          if (promo.maxDiscountAmount) {
            verifiedDiscount = Math.min(verifiedDiscount, promo.maxDiscountAmount);
          }
        } else if (promo.type === "fixed_amount") {
          verifiedDiscount = Math.min(promo.value, verifiedSubtotal);
        }
        verifiedDiscount = Math.round(verifiedDiscount * 100) / 100;
      }

      // Verify total matches server-calculated amount (accounting for discount)
      const verifiedDiscountedSubtotal = Math.max(0, verifiedSubtotal - verifiedDiscount);
      const verifiedVat = Math.round(verifiedDiscountedSubtotal * 0.15 * 100) / 100;
      const verifiedTotal = Math.round((verifiedDiscountedSubtotal + verifiedVat) * 100) / 100;
      if (verifiedTotal !== amount) {
        return NextResponse.json(
          { error: "El monto no coincide con los precios actuales. Actualiza tu carrito." },
          { status: 409 },
        );
      }
      } // end of else (non-paymentLink branch)
    }

    // Build term_url for 3DS challenge callback — Cloud Function receives the
    // CRES POST from Alignet (confirmed via webhook.site probe 2026-04-15).
    const functionsBase = process.env.CLOUD_FUNCTIONS_BASE_URL
      || "https://us-central1-pau-henriques-web-v1.cloudfunctions.net";
    const termUrl = `${functionsBase}/threeDSCallback?orderId=${orderId}`;

    // Inject server-side client IP into browserInfo (required by Paymentez 3DS2)
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const enrichedBrowserInfo = browserInfo
      ? { ...browserInfo, ip_address: clientIp }
      : undefined;

    // Call Nuvei debit with token (include 3DS params if browser info provided)
    const discountedSubtotalForTax = amount - (vat ?? 0);
    const nuveiData = await debitWithToken({
      userId,
      userEmail,
      amount,
      description,
      devReference: orderId,
      cardToken: token,
      ...(cvc ? { cvc } : {}),
      vat: vat ?? 0,
      taxableAmount: discountedSubtotalForTax,
      ...(installments ? { installments, installmentsType: installmentsType ?? 0 } : {}),
      ...(enrichedBrowserInfo ? { browserInfo: enrichedBrowserInfo, termUrl } : {}),
    });
    // Log FULL debit response to inspect all fields (per Anthony: cres / value
    // may be returned directly in the debit response when status_detail is 36).
    console.log("[charge] Nuvei debit response FULL:", JSON.stringify(nuveiData));
    console.log("[charge] Nuvei debit response summary:", JSON.stringify({
      status: nuveiData.transaction?.status,
      status_detail: nuveiData.transaction?.status_detail,
      id: nuveiData.transaction?.id,
      "3ds_auth": nuveiData["3ds"]?.authentication?.status,
      error: nuveiData.error,
    }));

    if (
      nuveiData.transaction &&
      nuveiData.transaction.status === "success" &&
      nuveiData.transaction.status_detail === 3
    ) {
      const rawAuthCode = nuveiData.transaction.authorization_code;
      const hasValidAuthCode =
        typeof rawAuthCode === "string" &&
        rawAuthCode.trim().length > 0 &&
        rawAuthCode !== "null";

      if (dbAdmin) {
        const batch = dbAdmin.batch();
        const orderRef = dbAdmin.collection("orders").doc(orderId);

        if (hasValidAuthCode) {
          batch.update(orderRef, {
            status: "paid",
            paymentTransactionId: nuveiData.transaction.id,
            authorizationCode: rawAuthCode,
            ...(installments ? { installments, installmentsType: installmentsType ?? 0 } : {}),
            chargeResponseAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          console.error(
            `[AUDIT:MISSING_AUTH_CODE] orderId=${orderId} txId=${nuveiData.transaction.id} debitResponse=${JSON.stringify(nuveiData)}`,
          );
          batch.update(orderRef, {
            status: "paid",
            paymentTransactionId: nuveiData.transaction.id,
            missingAuthCodeFlagged: true,
            missingAuthCodeLoggedAt: new Date(),
            emailPending: true,
            ...(installments ? { installments, installmentsType: installmentsType ?? 0 } : {}),
            chargeResponseAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // Atomically increment promotion usage if coupon was applied
        const orderSnap = await orderRef.get();
        const orderInfo = orderSnap.data();
        if (orderInfo?.promotionId) {
          const promoRef = dbAdmin.collection("promotions").doc(orderInfo.promotionId);
          batch.update(promoRef, {
            currentUses: FieldValue.increment(1),
          });

          const usageRef = promoRef.collection("usages").doc();
          batch.set(usageRef, {
            userId: orderInfo.userId,
            orderId,
            discountApplied: orderInfo.discount || 0,
            usedAt: new Date(),
          });
        }

        await batch.commit();

        // Crea el courseEnrollment si la orden es de un taller (tiene
        // courseId + guestInfo). Idempotente y best-effort — si falla no
        // tumba la orden pagada.
        try {
          await ensureEnrollmentForPaidOrder(dbAdmin, orderId);
        } catch (err) {
          console.error(`[charge] Failed to create enrollment for order ${orderId}:`, err);
        }

        // Si el pago vino desde un paymentLink, incrementar timesPaid y
        // registrar lastPaidAt para que el admin vea cuantas veces se uso.
        const paymentLinkId: string | undefined = orderInfo?.paymentLinkId;
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
              `[charge] Failed to increment paymentLink ${paymentLinkId}:`,
              err,
            );
          }
        }

        // Send confirmation email ONLY if we have a valid auth_code.
        // Otherwise webhook or timeout handler will deliver it.
        let emailSent = false;
        if (hasValidAuthCode) {
          const emailResult = await sendPaymentConfirmation({
            to: userEmail,
            customerName: orderInfo?.shippingAddress?.fullName || "",
            orderId,
            transactionId: nuveiData.transaction.id,
            authorizationCode: rawAuthCode as string,
            items: orderInfo?.items || [],
            subtotal: orderInfo?.subtotal || amount,
            discount: orderInfo?.discount || undefined,
            couponCode: orderInfo?.couponCode,
            vat: orderInfo?.vat || vat,
            total: amount,
            ...(orderInfo?.postPurchaseNote ? { postPurchaseNote: orderInfo.postPurchaseNote } : {}),
          }).catch(() => ({ success: false }));
          emailSent = emailResult.success;
          if (emailSent) {
            await orderRef.update({ emailSentAt: new Date() });
          }
        }

        // Delete card from Nuvei if user chose not to save it
        if (body.deleteCardAfterPayment && token) {
          deleteCard(token, userId).catch((err) =>
            console.error("[charge] Failed to delete card after payment:", err)
          );
        }

        return NextResponse.json({
          success: true,
          transactionId: nuveiData.transaction.id,
          authorizationCode: hasValidAuthCode ? rawAuthCode : null,
          orderId,
          emailSent,
        });
      }

      return NextResponse.json({
        success: true,
        transactionId: nuveiData.transaction.id,
        authorizationCode: nuveiData.transaction.authorization_code,
        orderId,
        emailSent: false,
      });
    }

    // Review/pending transaction (status "pending", status_detail 1): payment is under review
    if (
      nuveiData.transaction?.status === "pending" &&
      nuveiData.transaction?.status_detail === 1
    ) {
      if (dbAdmin) {
        await dbAdmin.collection("orders").doc(orderId).update({
          status: "processing",
          paymentTransactionId: nuveiData.transaction.id || null,
          chargeResponseAt: new Date(),
          updatedAt: new Date(),
        });
      }
      return NextResponse.json({
        review: true,
        orderId,
        transactionId: nuveiData.transaction.id,
      });
    }

    // 3DS method requested (status_detail 35): frictionless — hidden iframe + wait 5s + verify
    if (nuveiData.transaction?.status_detail === 35) {
      const threeDSData = nuveiData["3ds"];
      const hiddenIframeHtml = threeDSData?.browser_response?.hidden_iframe || "";

      if (dbAdmin) {
        await dbAdmin.collection("orders").doc(orderId).update({
          status: "3ds-pending",
          isDeviceFingerprint: true,
          nuveiTransactionId: nuveiData.transaction.id || null,
          updatedAt: new Date(),
        });
      }
      return NextResponse.json({
        challenge: true,
        challengeHtml: hiddenIframeHtml,
        isDeviceFingerprint: true,
        orderId,
        nuveiTransactionId: nuveiData.transaction.id,
        statusDetail: 35,
      });
    }

    // OTP verification requested (status_detail 31): show OTP form to capture code
    if (nuveiData.transaction?.status_detail === 31) {
      if (dbAdmin) {
        await dbAdmin.collection("orders").doc(orderId).update({
          status: "otp-pending",
          nuveiTransactionId: nuveiData.transaction.id || null,
          updatedAt: new Date(),
        });
      }
      return NextResponse.json({
        otpRequired: true,
        orderId,
        nuveiTransactionId: nuveiData.transaction.id,
        statusDetail: 31,
      });
    }

    // 3DS challenge requested (status_detail 36 or 37): interactive challenge
    if (nuveiData.transaction?.status_detail === 36 || nuveiData.transaction?.status_detail === 37) {
      const threeDSData = nuveiData["3ds"];
      const challengeHtml =
        threeDSData?.browser_response?.challenge_request ||
        threeDSData?.browser_response?.hidden_iframe ||
        "";

      // Capture any CRES/value field the debit response may carry so verify
      // can use it. Per Anthony: the value for verify BY_CRES is returned in
      // the debit response when status_detail is 36.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawDebit = nuveiData as any;
      const debitCres: string | null =
        rawDebit?.["3ds"]?.authentication?.cres ||
        rawDebit?.["3ds"]?.browser_response?.cres ||
        rawDebit?.["3ds"]?.cres ||
        rawDebit?.transaction?.cres ||
        rawDebit?.cres ||
        rawDebit?.value ||
        null;
      console.log(`[charge] status 36 — debitCres captured: ${debitCres ? "YES (len=" + debitCres.length + ")" : "NO"}`);

      if (challengeHtml) {
        if (dbAdmin) {
          await dbAdmin.collection("orders").doc(orderId).update({
            status: "3ds-pending",
            nuveiTransactionId: nuveiData.transaction?.id || null,
            ...(debitCres ? { threeDSCres: debitCres } : {}),
            updatedAt: new Date(),
          });
        }
        return NextResponse.json({
          challenge: true,
          challengeHtml,
          isDeviceFingerprint: false,
          orderId,
          nuveiTransactionId: nuveiData.transaction?.id,
          statusDetail: nuveiData.transaction?.status_detail,
        });
      }
    }

    // 3DS frictionless failure — map authentication status to user message
    const threeDSStatus = nuveiData["3ds"]?.authentication?.status;
    if (threeDSStatus && THREEDS_AUTH_MESSAGES[threeDSStatus]) {
      const threeDSErrorMsg = THREEDS_AUTH_MESSAGES[threeDSStatus];
      if (dbAdmin) {
        const currentOrder = await dbAdmin.collection("orders").doc(orderId).get();
        const orderData = currentOrder.data();
        if (orderData?.status === "pending") {
          await dbAdmin.collection("orders").doc(orderId).update({
            status: "failed",
            chargeResponseAt: new Date(),
            updatedAt: new Date(),
          });
        }
        if (userEmail && orderData) {
          sendPaymentFailed({
            to: userEmail,
            customerName: orderData.shippingAddress?.fullName || "",
            orderId,
            errorMessage: threeDSErrorMsg,
            items: orderData.items || [],
            total: orderData.total || amount,
            retryUrl: getRetryUrl(orderData.courseId),
          }).catch(() => {});
        }
      }
      return NextResponse.json(
        { error: threeDSErrorMsg },
        { status: 400 },
      );
    }

    // Generic charge failed — mark as failed but let webhook override if it has different info
    const failedErrorMsg = getNuveiUserMessage(
      nuveiData.transaction?.status_detail,
      nuveiData.transaction?.message || nuveiData.error?.description,
    );

    if (dbAdmin) {
      const currentOrder = await dbAdmin.collection("orders").doc(orderId).get();
      const currentStatus = currentOrder.data()?.status;
      // Only downgrade if webhook hasn't already set a final status
      if (currentStatus === "pending") {
        await dbAdmin.collection("orders").doc(orderId).update({
          status: "failed",
          chargeResponseAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Send failure email (non-blocking)
      const orderData = currentOrder.data();
      if (userEmail && orderData) {
        sendPaymentFailed({
          to: userEmail,
          customerName: orderData.shippingAddress?.fullName || "",
          orderId,
          errorMessage: failedErrorMsg,
          items: orderData.items || [],
          total: orderData.total || amount,
          retryUrl: getRetryUrl(orderData.courseId),
        }).catch(() => {});
      }
    }

    return NextResponse.json(
      { error: failedErrorMsg },
      { status: 400 },
    );
  } catch (error) {
    console.error("Payment charge error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
