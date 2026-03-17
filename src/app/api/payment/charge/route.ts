import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, auth } from "@/lib/firebase-admin";
import { debitWithToken } from "@/lib/nuvei";
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
  orderId: string;
  amount: number;
  vat: number;
  description: string;
  userId: string;
  userEmail: string;
  browserInfo?: BrowserInfo;
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

    const body: ChargeRequestBody = await request.json();
    const { token, orderId, amount, vat, description, userId, userEmail, browserInfo } = body;

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
        const stock = productData.stock ?? 0;
        if (stock < item.quantity) {
          return NextResponse.json(
            { error: `Stock insuficiente para "${item.name}" (disponible: ${stock})` },
            { status: 409 },
          );
        }
        const currentPrice = productData.price ?? 0;
        if (currentPrice !== item.price) {
          return NextResponse.json(
            { error: `El precio de "${item.name}" ha cambiado. Por favor, actualiza tu carrito.` },
            { status: 409 },
          );
        }
        verifiedSubtotal += currentPrice * item.quantity;
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
    }

    // Build term_url for 3DS challenge callback — include orderId so 3ds-return can identify the order
    // Derive base URL from request headers so it works automatically in local/staging/production
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
    const termUrl = `${baseUrl}/api/payment/3ds-callback?orderId=${orderId}`;

    // Inject server-side client IP into browserInfo (required by Paymentez 3DS2)
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const enrichedBrowserInfo = browserInfo
      ? { ...browserInfo, ip_address: clientIp }
      : undefined;

    // Call Nuvei debit with token (include 3DS params if browser info provided)
    const nuveiData = await debitWithToken({
      userId,
      userEmail,
      amount,
      description,
      devReference: orderId,
      cardToken: token,
      vat: vat ?? 0,
      ...(enrichedBrowserInfo ? { browserInfo: enrichedBrowserInfo, termUrl } : {}),
    });
    console.log("[charge] Nuvei debit response:", JSON.stringify({
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
      // Update order — charge sets "paid" and transaction data.
      // Webhook may also update; we use merge-friendly fields so neither overwrites the other.
      if (dbAdmin) {
        const batch = dbAdmin.batch();
        const orderRef = dbAdmin.collection("orders").doc(orderId);

        batch.update(orderRef, {
          status: "paid",
          paymentTransactionId: nuveiData.transaction.id,
          authorizationCode: nuveiData.transaction.authorization_code || null,
          chargeResponseAt: new Date(),
          updatedAt: new Date(),
        });

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
      }

      return NextResponse.json({
        success: true,
        transactionId: nuveiData.transaction.id,
        authorizationCode: nuveiData.transaction.authorization_code,
        orderId,
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

      if (challengeHtml) {
        if (dbAdmin) {
          await dbAdmin.collection("orders").doc(orderId).update({
            status: "3ds-pending",
            nuveiTransactionId: nuveiData.transaction?.id || null,
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
      if (dbAdmin) {
        const currentOrder = await dbAdmin.collection("orders").doc(orderId).get();
        if (currentOrder.data()?.status === "pending") {
          await dbAdmin.collection("orders").doc(orderId).update({
            status: "failed",
            chargeResponseAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
      return NextResponse.json(
        { error: THREEDS_AUTH_MESSAGES[threeDSStatus] },
        { status: 400 },
      );
    }

    // Generic charge failed — mark as failed but let webhook override if it has different info
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
    }

    return NextResponse.json(
      {
        error: getNuveiUserMessage(
          nuveiData.transaction?.status_detail,
          nuveiData.transaction?.message || nuveiData.error?.description,
        ),
      },
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
