import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendPaymentConfirmation, sendPaymentPending } from "@/lib/email";

export const dynamic = "force-dynamic";

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

    const { transaction } = payload;
    if (!transaction?.id || !transaction?.dev_reference) {
      return NextResponse.json(
        { error: "Payload inválido" },
        { status: 400 },
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
