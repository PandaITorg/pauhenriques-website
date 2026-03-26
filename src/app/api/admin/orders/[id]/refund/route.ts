import { NextRequest, NextResponse } from "next/server";
import { auth, dbAdmin } from "@/lib/firebase-admin";
import { refundTransaction } from "@/lib/nuvei";

export const dynamic = "force-dynamic";

async function verifyAdmin(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie || !auth) return false;
  try {
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    return decoded.admin === true;
  } catch {
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const { id } = await params;
  const orderDoc = await dbAdmin.collection("orders").doc(id).get();

  if (!orderDoc.exists) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const orderData = orderDoc.data()!;

  if (orderData.status !== "paid") {
    return NextResponse.json(
      { error: "Solo se pueden reembolsar órdenes pagadas" },
      { status: 400 },
    );
  }

  if (!orderData.paymentTransactionId) {
    return NextResponse.json(
      { error: "No se encontró el ID de transacción para reembolsar" },
      { status: 400 },
    );
  }

  if (orderData.refundedAt) {
    return NextResponse.json(
      { error: "Esta orden ya fue reembolsada" },
      { status: 409 },
    );
  }

  try {
    console.log("[refund] Calling Nuvei refund for transaction:", orderData.paymentTransactionId);
    const result = await refundTransaction(orderData.paymentTransactionId);
    console.log("[refund] Nuvei response:", JSON.stringify(result));

    if (result.status === "success" || result.detail === "Completed") {
      await dbAdmin.collection("orders").doc(id).update({
        status: "refunded",
        refundedAt: new Date(),
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: "Reembolso procesado correctamente",
      });
    }

    return NextResponse.json(
      { error: `Nuvei rechazó el reembolso: ${result.detail || result.status || "Error desconocido"}` },
      { status: 400 },
    );
  } catch (error) {
    console.error("[refund] Error:", error);
    return NextResponse.json(
      { error: "Error al procesar el reembolso" },
      { status: 500 },
    );
  }
}
