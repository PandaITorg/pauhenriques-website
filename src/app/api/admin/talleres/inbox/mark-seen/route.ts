import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

// Marca la timestamp "última vez que el admin vio la tab Inscripciones".
// Se llama desde EnrollmentsSection apenas el componente monta. El badge
// del sidebar cuenta enrollments con paidAt > este timestamp para mostrar
// "inscripciones nuevas desde tu última visita".
export async function POST(request: NextRequest) {
  const session = await requireSection(request, "cursos");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  await dbAdmin
    .collection("users")
    .doc(session.uid)
    .set(
      { talleresInboxLastSeenAt: FieldValue.serverTimestamp() },
      { merge: true },
    );

  return NextResponse.json({ ok: true });
}
