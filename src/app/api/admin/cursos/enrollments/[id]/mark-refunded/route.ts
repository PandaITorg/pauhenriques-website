import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

// "Marcar como devuelta manualmente" — para refunds ejecutados FUERA
// del sistema (ej. el banco directamente, después de las 24h donde
// Nuvei ya no permite refund por API). Solo cambia status; NO ejecuta
// ningún cobro/devolución real.
//
// Cascade: si el enrollment tiene orderId, también marca el order como
// refunded para mantener consistencia entre Inscripciones y Pedidos.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSection(request, "cursos");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const { id } = await params;
  const ref = dbAdmin.collection("courseEnrollments").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json(
      { error: "Inscripción no encontrada" },
      { status: 404 },
    );
  }

  const data = snap.data() ?? {};
  if (data.accessStatus === "refunded") {
    return NextResponse.json(
      { error: "Esta inscripción ya está marcada como devuelta" },
      { status: 409 },
    );
  }

  const now = new Date();
  await ref.update({
    accessStatus: "refunded",
    refundedAt: now,
    refundedManually: true,
    refundedBy: session.uid,
    updatedAt: now,
  });

  // Cascade al order asociado (si existe).
  if (typeof data.orderId === "string" && data.orderId.length > 0) {
    try {
      await dbAdmin
        .collection("orders")
        .doc(data.orderId)
        .update({
          status: "refunded",
          refundedAt: now,
          refundedManually: true,
          updatedAt: now,
        });
    } catch (err) {
      console.error("[mark-refunded] cascade order falló:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
