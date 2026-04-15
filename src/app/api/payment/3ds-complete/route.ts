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

    // Idempotency: if already paid, return success with stored data
    if (orderData.status === "paid") {
      return NextResponse.json({
        success: true,
        transactionId: orderData.paymentTransactionId,
        authorizationCode: orderData.authorizationCode || null,
        orderId,
      });
    }

    // Strong idempotency: prevent concurrent verify calls (postMessage + polling race)
    if (orderData.verifyCalledAt) {
      console.log(`[3ds-complete] verify already called for order ${orderId}, returning current state`);
      return NextResponse.json({
        error: "Pago ya procesado",
      }, { status: 409 });
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

    // Strategy: always call Nuvei's verify — Nuvei tracks CRES internally
    // when the ACS completes the challenge (server-to-server), so
    // AUTHENTICATION_CONTINUE is sufficient even for status 36/37. If we
    // happen to have captured a CRES via term_url, prefer BY_CRES.
    const actualType = (type === "AUTHENTICATION_CONTINUE" && orderData.threeDSCres)
      ? "BY_CRES" as const
      : type;

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

    // Optimistic lock: mark verify-in-progress atomically. If another
    // concurrent call wins, throw ALREADY_CALLED and bail out.
    const orderRef = dbAdmin.collection("orders").doc(orderId);
    try {
      await dbAdmin.runTransaction(async (tx) => {
        const doc = await tx.get(orderRef);
        if (doc.data()?.verifyCalledAt) {
          throw new Error("ALREADY_CALLED");
        }
        tx.update(orderRef, { verifyCalledAt: new Date() });
      });
    } catch (err) {
      if ((err as Error).message === "ALREADY_CALLED") {
        console.log(`[3ds-complete] Lost verify lock race for order ${orderId}`);
        return NextResponse.json({ error: "Pago ya procesado" }, { status: 409 });
      }
      throw err;
    }

    // Call Nuvei Verify API
    console.log(`[3ds-complete] BEFORE verify: orderId=${orderId}, type=${actualType}, hasValue=${!!verifyValue}`);
    const verifyResult = await verifyThreeDS({
      transactionId,
      userId,
      type: actualType,
      value: verifyValue,
    });
    console.log(`[3ds-complete] AFTER verify: authCode=${verifyResult.transaction?.authorization_code ?? "MISSING"} status=${verifyResult.transaction?.status} detail=${verifyResult.transaction?.status_detail}`);

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
      const hasValidAuthCode =
        typeof txAuthCode === "string" &&
        txAuthCode.trim().length > 0 &&
        txAuthCode !== "null";

      const batch = dbAdmin.batch();

      if (hasValidAuthCode) {
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
      } else {
        // Audit: verify succeeded but no auth_code — wait for webhook
        console.error(
          `[AUDIT:MISSING_AUTH_CODE] orderId=${orderId} txId=${txId} verifyResponse=${JSON.stringify(verifyResult)}`,
        );
        batch.update(orderRef, {
          status: "paid",
          paymentTransactionId: txId,
          missingAuthCodeFlagged: true,
          missingAuthCodeLoggedAt: new Date(),
          emailPending: true,
          chargeResponseAt: new Date(),
          updatedAt: new Date(),
          threeDSCres: FieldValue.delete(),
          threeDSTransStatus: FieldValue.delete(),
          isDeviceFingerprint: FieldValue.delete(),
        });
      }

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

      // Send confirmation email ONLY if we have auth_code.
      // Otherwise webhook will send it later (or timeout handler).
      let emailSent = false;
      if (hasValidAuthCode) {
        const userEmail = orderData.userEmail || decodedToken.email || "";
        const emailResult = await sendPaymentConfirmation({
          to: userEmail,
          customerName: orderData.shippingAddress?.fullName || "",
          orderId,
          transactionId: txId,
          authorizationCode: txAuthCode as string,
          items: orderData.items || [],
          subtotal: orderData.subtotal || orderData.total,
          discount: orderData.discount || undefined,
          couponCode: orderData.couponCode,
          vat: orderData.vat || 0,
          total: orderData.total,
        }).catch(() => ({ success: false }));
        emailSent = emailResult.success;
        if (emailSent) {
          await orderRef.update({ emailSentAt: new Date() });
        }
      }

      // Delete card from Nuvei if user chose not to save it
      if (orderData.deleteCardAfterPayment && orderData.paymentToken) {
        deleteCard(orderData.paymentToken, orderData.userId).catch((err) =>
          console.error("[3ds-complete] Failed to delete card after payment:", err)
        );
      }

      return NextResponse.json({
        success: true,
        transactionId: txId,
        authorizationCode: hasValidAuthCode ? txAuthCode : null,
        emailSent,
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
