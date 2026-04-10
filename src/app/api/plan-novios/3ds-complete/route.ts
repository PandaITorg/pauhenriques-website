import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { verifyThreeDS, deleteCard } from "@/lib/nuvei";
import { sendContributionConfirmation, sendContributionNotification } from "@/lib/email-plan-novios";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ThreeDSSchema = z.object({
  contributionId: z.string().min(1),
  planId: z.string().min(1),
  nuveiUserId: z.string().min(1),
  type: z.enum(["AUTHENTICATION_CONTINUE", "BY_CRES", "BY_OTP"]),
  nuveiTransactionId: z.string().optional(),
  otpCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    if (!dbAdmin) {
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }

    const rawBody = await request.json();
    const parsed = ThreeDSSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const { contributionId, planId, nuveiUserId, type, nuveiTransactionId: bodyTxId, otpCode } = parsed.data;

    // Read contribution
    const contribRef = dbAdmin.collection("planNovios").doc(planId).collection("contributions").doc(contributionId);
    const contribDoc = await contribRef.get();
    if (!contribDoc.exists) {
      return NextResponse.json({ error: "Contribucion no encontrada" }, { status: 404 });
    }

    const contribData = contribDoc.data()!;

    // Idempotency
    if (contribData.status === "paid") {
      return NextResponse.json({
        success: true,
        contributionId,
        transactionId: contribData.paymentTransactionId,
      });
    }

    if (contribData.status !== "3ds-pending" && contribData.status !== "otp-pending") {
      return NextResponse.json({ error: "Esta contribucion ya fue procesada" }, { status: 409 });
    }

    // Check for failed 3DS auth status stored by callback
    const storedTransStatus = contribData.threeDSTransStatus;
    if (storedTransStatus && storedTransStatus !== "Y" && storedTransStatus !== "A") {
      await contribRef.update({ status: "failed", updatedAt: new Date() });
      const msg =
        storedTransStatus === "N" ? "Autenticacion 3DS rechazada por tu banco." :
        storedTransStatus === "R" ? "Tu banco rechazo la autenticacion 3DS." :
        "No se pudo verificar la autenticacion 3DS.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const transactionId = contribData.nuveiTransactionId || bodyTxId;
    if (!transactionId) {
      return NextResponse.json({ error: "No se encontro el ID de transaccion" }, { status: 400 });
    }

    // Polling: challenge still in progress
    if (type === "AUTHENTICATION_CONTINUE" && !contribData.isDeviceFingerprint && !contribData.threeDSCres) {
      return NextResponse.json({ pending: true });
    }

    // Upgrade AUTHENTICATION_CONTINUE → BY_CRES if cres stored
    const actualType = (type === "AUTHENTICATION_CONTINUE" && contribData.threeDSCres)
      ? "BY_CRES" as const
      : type;

    const cresValue = (actualType === "BY_CRES") ? contribData.threeDSCres : undefined;
    if (actualType === "BY_CRES" && !cresValue) {
      return NextResponse.json({ error: "No se encontro el valor de autenticacion 3DS" }, { status: 400 });
    }

    if (type === "BY_OTP" && !otpCode) {
      return NextResponse.json({ error: "Debes ingresar el codigo OTP" }, { status: 400 });
    }

    const verifyValue = type === "BY_OTP" ? otpCode : cresValue;
    const userId = contribData.nuveiUserId || nuveiUserId;

    const verifyResult = await verifyThreeDS({
      transactionId,
      userId,
      type: actualType,
      value: verifyValue,
    });
    console.log("[plan-novios/3ds-complete] Verify response:", JSON.stringify(verifyResult));

    // Normalize response (nested vs flat)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = verifyResult as any;
    const txStatus = verifyResult.transaction?.status ?? raw.status;
    const txStatusDetail = verifyResult.transaction?.status_detail ?? raw.status_detail;
    const txId = verifyResult.transaction?.id ?? raw.transaction_id ?? transactionId;
    const txAuthCode = verifyResult.transaction?.authorization_code ?? raw.authorization_code ?? null;

    const isSuccess = (txStatus === "success" || txStatus === 1) && txStatusDetail === 3;

    if (isSuccess) {
      const batch = dbAdmin.batch();

      batch.update(contribRef, {
        status: "paid",
        paymentTransactionId: txId,
        authorizationCode: txAuthCode,
        updatedAt: new Date(),
        threeDSCres: FieldValue.delete(),
        threeDSTransStatus: FieldValue.delete(),
        isDeviceFingerprint: FieldValue.delete(),
      });

      // Increment plan balance
      const planRef = dbAdmin.collection("planNovios").doc(planId);
      batch.update(planRef, {
        totalContributed: FieldValue.increment(contribData.amount),
        balance: FieldValue.increment(contribData.amount),
        updatedAt: new Date(),
      });

      await batch.commit();

      // Read plan for emails
      const planDoc = await dbAdmin.collection("planNovios").doc(planId).get();
      const planData = planDoc.data();
      const coupleNames = planData ? `${planData.partner1Name} y ${planData.partner2Name}` : "";
      const slug = planData?.slug || "";

      // Delete guest card
      if (!contribData.authenticatedUserId) {
        const cardToken = contribData.paymentToken || "";
        if (cardToken) {
          deleteCard(cardToken, userId).catch(() => {});
        }
      }

      // Emails (non-blocking)
      if (contribData.guestEmail) {
        sendContributionConfirmation({
          to: contribData.guestEmail,
          guestName: contribData.guestName,
          coupleNames,
          amount: contribData.amount,
          slug,
        }).catch(() => {});
      }
      if (planData?.userEmail) {
        sendContributionNotification({
          to: planData.userEmail,
          coupleNames,
          guestName: contribData.guestName,
          amount: contribData.amount,
          guestMessage: contribData.guestMessage || undefined,
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        contributionId,
        transactionId: txId,
      });
    }

    // Escalation: 35 → 36/37
    if (txStatusDetail === 36 || txStatusDetail === 37) {
      const challengeHtml =
        verifyResult["3ds"]?.browser_response?.challenge_request ||
        verifyResult["3ds"]?.browser_response?.hidden_iframe ||
        "";
      if (challengeHtml) {
        await contribRef.update({
          nuveiTransactionId: txId,
          isDeviceFingerprint: FieldValue.delete(),
          threeDSCres: FieldValue.delete(),
          updatedAt: new Date(),
        });
        return NextResponse.json({
          challenge: true,
          challengeHtml,
          isDeviceFingerprint: false,
          contributionId,
          planId,
          nuveiTransactionId: txId,
          nuveiUserId: userId,
          statusDetail: txStatusDetail,
        });
      }
    }

    // Failure
    await contribRef.update({
      status: "failed",
      updatedAt: new Date(),
      threeDSCres: FieldValue.delete(),
    });

    return NextResponse.json(
      { error: "Pago rechazado tras autenticacion 3DS." },
      { status: 400 },
    );
  } catch (error) {
    console.error("[plan-novios/3ds-complete] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
