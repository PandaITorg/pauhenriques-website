import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";
import {
  PAYMENT_LINK_PRICE_MAX,
  PAYMENT_LINK_PRICE_MIN,
} from "@/lib/pago-link/paymentLink";

export const dynamic = "force-dynamic";

const UpdateSchema = z
  .object({
    price: z
      .number()
      .finite()
      .min(PAYMENT_LINK_PRICE_MIN)
      .max(PAYMENT_LINK_PRICE_MAX)
      .optional(),
    label: z.string().trim().max(80).optional(),
    notes: z.string().trim().max(500).optional(),
    active: z.boolean().optional(),
    expiresAt: z.string().datetime({ offset: true }).optional(),
  })
  .refine(
    (d) =>
      d.price !== undefined ||
      d.label !== undefined ||
      d.notes !== undefined ||
      d.active !== undefined ||
      d.expiresAt !== undefined,
    { message: "Sin cambios" },
  );

export async function PATCH(
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
  const body = await request.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos invalidos" },
      { status: 400 },
    );
  }

  const { price, label, notes, active, expiresAt } = parsed.data;
  const update: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (price !== undefined) update.price = Math.round(price * 100) / 100;
  if (label !== undefined) update.label = label;
  if (notes !== undefined) update.notes = notes;
  if (active !== undefined) update.active = active;
  if (expiresAt !== undefined) {
    update.expiresAt = Timestamp.fromDate(new Date(expiresAt));
  }

  try {
    const ref = dbAdmin.collection("paymentLinks").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Link no encontrado" }, { status: 404 });
    }
    await ref.update(update);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error actualizando link";
    console.error("[payment-links][PATCH]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
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
  try {
    const ref = dbAdmin.collection("paymentLinks").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Link no encontrado" }, { status: 404 });
    }
    const data = snap.data() ?? {};
    if (typeof data.timesPaid === "number" && data.timesPaid > 0) {
      // No eliminar links con pagos; solo desactivar para preservar trazabilidad.
      return NextResponse.json(
        { error: "Este link ya tiene pagos. Desactivalo en vez de eliminarlo." },
        { status: 409 },
      );
    }
    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error eliminando link";
    console.error("[payment-links][DELETE]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
