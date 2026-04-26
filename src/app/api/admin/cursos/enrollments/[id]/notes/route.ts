import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const NotesSchema = z.object({
  notes: z.string().max(2000).nullable(),
});

// Endpoint dedicado para editar/borrar las notas internas de una
// inscripción. Independiente del envío de acceso para que el admin
// pueda gestionar notas sin re-enviar el email.
//
// notes: string → setea ese valor (string vacío "" = borrar contenido).
// notes: null → borra el campo del doc.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireSection(request, "cursos"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = NotesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "notes inválido" },
      { status: 400 },
    );
  }

  const ref = dbAdmin.collection("courseEnrollments").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json(
      { error: "Inscripción no encontrada" },
      { status: 404 },
    );
  }

  const trimmed = parsed.data.notes?.trim();
  // null o string vacío → guardamos null para limpiar la nota.
  const finalValue = !trimmed ? null : trimmed;

  await ref.update({
    notes: finalValue,
    updatedAt: new Date(),
  });

  return NextResponse.json({ ok: true, notes: finalValue });
}
