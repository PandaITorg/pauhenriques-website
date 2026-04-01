import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, auth } from "@/lib/firebase-admin";
import { verifyThreeDS, deleteCard } from "@/lib/nuvei";
import { sendPaymentConfirmation, sendPaymentFailed } from "@/lib/email";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

const ThreeDSCompleteSchema = z.object({
  orderId: z.string().min(1),
  userId: z.string().min(1),
  type: z.enum(["AUTHENTICATION_CONTINUE", "BY_CRES", "BY_OTP"]),
  nuveiTransactionId: z.string().optional(),
  otpCode: z.string().optional(),
});

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

    const rawBody = await request.json();
    const parsed = ThreeDSCompleteSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const { orderId, userId, type, nuveiTransactionId: bodyTxId, otpCode } = parsed.data;

    if (decodedToken.uid !== userId) {
      return NextResponse.json({ error: "Usuario no coincide" }, { status: 403 });
    }

    if (!dbAdmin) {
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }

    // Read order from Firestore
    const orderDoc = await dbAdmin.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const orderData = orderDoc.data()!;

    // Idempotency: if already paid, return success
    if (orderData.status === "paid") {
      return NextResponse.json({
        success: true,
        transactionId: orderData.paymentTransactionId,
        orderId,
      });
    }

    if (orderData.status !== "3ds-pending" && orderData.status !== "otp-pending") {
      return NextResponse.json(
        { error: "Esta orden ya fue procesada" },
        { status: 409 },
      );
    }

    // Check if the Cloud Function callback stored a failed transStatus
    const storedTransStatus = orderData.threeDSTransStatus;
    if (storedTransStatus && storedTransStatus !== "Y" && storedTransStatus !== "A") {
      // Authentication failed — mark order as failed
      await dbAdmin.collection("orders").doc(orderId).update({
        status: "failed",
        chargeResponseAt: new Date(),
        updatedAt: new Date(),
      });
      const msg =
        storedTransStatus === "N" ? "Autenticación 3DS rechazada por tu banco." :
        storedTransStatus === "R" ? "Tu banco rechazó la autenticación 3DS." :
        "No se pudo verificar la autenticación 3DS.";
      // Send failure email (non-blocking)
      const userEmail = orderData.userEmail || decodedToken.email || "";
      if (userEmail) {
        sendPaymentFailed({
          to: userEmail,
          customerName: orderData.shippingAddress?.fullName || "",
          orderId,
          errorMessage: msg,
          items: orderData.items || [],
          total: orderData.total || 0,
        }).catch(() => {});
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Get transaction ID from order (preferred) or request body (fallback)
    const transactionId = orderData.nuveiTransactionId || bodyTxId;
    if (!transactionId) {
      return NextResponse.json(
        { error: "No se encontró el ID de transacción para verificar" },
        { status: 400 },
      );
    }

    // For AUTHENTICATION_CONTINUE on a 3DS challenge (36/37), check if the
    // Cloud Function callback has stored the cres first. If not, the challenge
    // is still in progress — return "pending" without calling Nuvei.
    if (type === "AUTHENTICATION_CONTINUE" && orderData.threeDSCres) {
      // Cloud Function already stored the cres — upgrade to BY_CRES
      console.log("[3ds-complete] Polling detected stored cres, upgrading to BY_CRES");
    } else if (type === "AUTHENTICATION_CONTINUE" && !orderData.isDeviceFingerprint) {
      // Challenge still in progress — no cres yet, don't call Nuvei
      return NextResponse.json({ pending: true });
    }

    // Determine the actual verify type and value
    const actualType = (type === "AUTHENTICATION_CONTINUE" && orderData.threeDSCres)
      ? "BY_CRES" as const
      : type;

    // For BY_CRES, get the cres value stored by 3ds-callback
    const cresValue = (actualType === "BY_CRES") ? orderData.threeDSCres : undefined;
    if (actualType === "BY_CRES" && !cresValue) {
      return NextResponse.json(
        { error: "No se encontró el valor de autenticación 3DS (cres)" },
        { status: 400 },
      );
    }

    // For BY_OTP, get the OTP code from the request body
    if (type === "BY_OTP" && !otpCode) {
      return NextResponse.json(
        { error: "Debes ingresar el código OTP" },
        { status: 400 },
      );
    }

    // Determine the value to send: cres for 3DS, otpCode for OTP
    const verifyValue = type === "BY_OTP" ? otpCode : cresValue;

    // Call Nuvei Verify API instead of a second debit
    console.log("[3ds-complete] Calling verify:", { transactionId, type: actualType, hasValue: !!verifyValue });
    const verifyResult = await verifyThreeDS({
      transactionId,
      userId,
      type: actualType,
      value: verifyValue,
    });
    console.log("[3ds-complete] Verify response:", JSON.stringify(verifyResult));

    // The verify API can return two different response structures:
    // 1. Nested (DebitResponse): { transaction: { status: "success", status_detail: 3, id: "..." } }
    // 2. Flat: { status: 1, status_detail: 3, transaction_id: "..." }
    // We normalize to handle both.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = verifyResult as any;
    const txStatus = verifyResult.transaction?.status ?? raw.status;
    const txStatusDetail = verifyResult.transaction?.status_detail ?? raw.status_detail;
    const txId = verifyResult.transaction?.id ?? raw.transaction_id ?? transactionId;
    const txAuthCode = verifyResult.transaction?.authorization_code ?? raw.authorization_code ?? null;

    // Success: status "success" or status 1, with status_detail 3
    const isSuccess =
      (txStatus === "success" || txStatus === 1) && txStatusDetail === 3;

    if (isSuccess) {
      const batch = dbAdmin.batch();
      const orderRef = dbAdmin.collection("orders").doc(orderId);

      batch.update(orderRef, {
        status: "paid",
        paymentTransactionId: txId,
        authorizationCode: txAuthCode,
        chargeResponseAt: new Date(),
        updatedAt: new Date(),
        threeDSCres: FieldValue.delete(),
        threeDSTransStatus: FieldValue.delete(),
        isDeviceFingerprint: FieldValue.delete(),
      });

      // Increment promotion usage if coupon was applied
      if (orderData.promotionId) {
        const promoRef = dbAdmin.collection("promotions").doc(orderData.promotionId);
        batch.update(promoRef, {
          currentUses: FieldValue.increment(1),
        });
        const usageRef = promoRef.collection("usages").doc();
        batch.set(usageRef, {
          userId: orderData.userId,
          orderId,
          discountApplied: orderData.discount || 0,
          usedAt: new Date(),
        });
      }

      await batch.commit();

      // Send confirmation email (non-blocking)
      const userEmail = orderData.userEmail || decodedToken.email || "";
      const emailResult = await sendPaymentConfirmation({
        to: userEmail,
        customerName: orderData.shippingAddress?.fullName || "",
        orderId,
        transactionId: txId,
        authorizationCode: txAuthCode,
        items: orderData.items || [],
        subtotal: orderData.subtotal || orderData.total,
        discount: orderData.discount || undefined,
        couponCode: orderData.couponCode,
        vat: orderData.vat || 0,
        total: orderData.total,
      }).catch(() => ({ success: false }));

      // Delete card from Nuvei if user chose not to save it
      if (orderData.deleteCardAfterPayment && orderData.paymentToken) {
        deleteCard(orderData.paymentToken, orderData.userId).catch((err) =>
          console.error("[3ds-complete] Failed to delete card after payment:", err)
        );
      }

      return NextResponse.json({
        success: true,
        transactionId: txId,
        authorizationCode: txAuthCode,
        emailSent: emailResult.success,
        orderId,
      });
    }

    // Escalation: verify after status 35 returned status 36 (challenge required)
    if (txStatusDetail === 36 || txStatusDetail === 37) {
      const threeDSData = verifyResult["3ds"];
      const challengeHtml =
        threeDSData?.browser_response?.challenge_request ||
        threeDSData?.browser_response?.hidden_iframe ||
        "";

      if (challengeHtml) {
        // Update transaction ID and clear fingerprint flag (escalation 35→36)
        await dbAdmin.collection("orders").doc(orderId).update({
          nuveiTransactionId: txId,
          isDeviceFingerprint: FieldValue.delete(),
          updatedAt: new Date(),
          threeDSCres: FieldValue.delete(),
        });

        return NextResponse.json({
          challenge: true,
          challengeHtml,
          isDeviceFingerprint: false,
          orderId,
          nuveiTransactionId: txId,
          statusDetail: txStatusDetail,
        });
      }
    }

    // Failure
    await dbAdmin.collection("orders").doc(orderId).update({
      status: "failed",
      chargeResponseAt: new Date(),
      updatedAt: new Date(),
      threeDSCres: FieldValue.delete(),
    });

    // Send failure email (non-blocking)
    const userEmail = orderData.userEmail || decodedToken.email || "";
    if (userEmail) {
      sendPaymentFailed({
        to: userEmail,
        customerName: orderData.shippingAddress?.fullName || "",
        orderId,
        errorMessage: "Pago rechazado tras autenticación 3DS.",
        items: orderData.items || [],
        total: orderData.total || 0,
      }).catch(() => {});
    }

    return NextResponse.json(
      { error: "Pago rechazado tras autenticación 3DS." },
      { status: 400 },
    );
  } catch (error) {
    console.error("3DS complete error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
