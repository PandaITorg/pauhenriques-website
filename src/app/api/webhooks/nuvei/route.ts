import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * Nuvei Callback/Webhook endpoint.
 * Nuvei sends transaction notifications here as JSON POST requests.
 * Reference: https://developers.paymentez.com/api/#webhook
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

    const orderId = transaction.dev_reference;

    if (!dbAdmin) {
      console.error("Webhook: Firebase Admin not initialized");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

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

    await orderRef.update({
      status: isApproved ? "paid" : "cancelled",
      paymentTransactionId: transaction.id,
      authorizationCode: transaction.authorization_code || null,
      webhookStatus: transaction.status,
      webhookStatusDetail: transaction.status_detail,
      webhookReceivedAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(
      `Webhook: Order ${orderId} updated to ${isApproved ? "paid" : "cancelled"} (status_detail: ${transaction.status_detail})`,
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
