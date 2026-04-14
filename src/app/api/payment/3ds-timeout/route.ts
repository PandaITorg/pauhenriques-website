import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, auth } from "@/lib/firebase-admin";
import { sendPaymentFailed } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Called by the frontend when the 3DS challenge times out (no postMessage from
 * the bank's ACS within ~3 minutes). Marks the order as failed and sends a
 * "payment not completed" email so the user knows what happened.
 *
 * Nuvei will auto-reverse the transaction on their side, so no money is charged.
 */
export async function POST(request: NextRequest) {
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

  const { orderId } = await request.json();
  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
  }

  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const orderRef = dbAdmin.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();
  if (!orderDoc.exists) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const orderData = orderDoc.data()!;

  if (decodedToken.uid !== orderData.userId) {
    return NextResponse.json({ error: "Usuario no coincide" }, { status: 403 });
  }

  // Only mark as failed if still in 3ds-pending (don't override completed orders)
  if (orderData.status !== "3ds-pending") {
    return NextResponse.json({ alreadyResolved: true });
  }

  await orderRef.update({
    status: "failed",
    failureReason: "3ds-timeout",
    chargeResponseAt: new Date(),
    updatedAt: new Date(),
  });

  const userEmail = orderData.userEmail || decodedToken.email || "";
  if (userEmail) {
    sendPaymentFailed({
      to: userEmail,
      customerName: orderData.shippingAddress?.fullName || "",
      orderId,
      errorMessage:
        "No completaste la verificación 3DS a tiempo. Tu pago no fue procesado. Intenta de nuevo.",
      items: orderData.items || [],
      total: orderData.total || 0,
    }).catch((err) =>
      console.error("[3ds-timeout] Failed to send email:", err),
    );
  }

  return NextResponse.json({ ok: true });
}
