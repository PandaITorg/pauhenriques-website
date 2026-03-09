import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, auth } from "@/lib/firebase-admin";
import { refundTransaction } from "@/lib/nuvei";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie || !auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    } catch {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json(
        { error: "orderId requerido" },
        { status: 400 },
      );
    }

    if (!dbAdmin) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const orderDoc = await dbAdmin.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 },
      );
    }

    const order = orderDoc.data()!;

    // Only the order owner can request a refund
    if (order.userId !== decodedToken.uid) {
      return NextResponse.json(
        { error: "No autorizado para esta orden" },
        { status: 403 },
      );
    }

    if (order.status !== "paid") {
      return NextResponse.json(
        { error: "Solo se pueden reembolsar órdenes pagadas" },
        { status: 400 },
      );
    }

    if (!order.paymentTransactionId) {
      return NextResponse.json(
        { error: "No se encontró ID de transacción" },
        { status: 400 },
      );
    }

    const result = await refundTransaction(order.paymentTransactionId);

    if (result.status === "success") {
      await dbAdmin.collection("orders").doc(orderId).update({
        status: "cancelled",
        refundedAt: new Date(),
        updatedAt: new Date(),
      });

      return NextResponse.json({ success: true, detail: result.detail });
    }

    return NextResponse.json(
      { error: result.detail || "Error al procesar reembolso" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Refund error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
