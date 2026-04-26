import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { refundTransaction } from "@/lib/nuvei";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireSection(request, "pedidos"))) {
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
      const now = new Date();
      await dbAdmin.collection("orders").doc(id).update({
        status: "refunded",
        refundedAt: now,
        refundedManually: false,
        updatedAt: now,
      });

      // Cascade al enrollment asociado (si existe). Una orden de taller
      // tiene un courseEnrollment con orderId === id. Marcamos refunded
      // para que desaparezca del pipeline de Inscripciones.
      try {
        const enrollSnap = await dbAdmin
          .collection("courseEnrollments")
          .where("orderId", "==", id)
          .limit(1)
          .get();
        if (!enrollSnap.empty) {
          await enrollSnap.docs[0].ref.update({
            accessStatus: "refunded",
            refundedAt: now,
            refundedManually: false,
            updatedAt: now,
          });
        }
      } catch (err) {
        // Best-effort: si falla el cascade, el refund automático ya
        // pasó; el admin puede marcar manualmente la inscripción.
        console.error("[refund] cascade enrollment falló:", err);
      }

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
