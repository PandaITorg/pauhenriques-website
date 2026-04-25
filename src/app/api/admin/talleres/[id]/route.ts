import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";
import { docToTaller } from "@/lib/talleres/firestore";
import {
  TALLER_PRICE_MAX,
  TALLER_PRICE_MIN,
  TALLER_SLUG_REGEX,
} from "@/lib/talleres/types";

export const dynamic = "force-dynamic";

const DiscountTierSchema = z.object({
  finalPrice: z.number().finite().positive().max(TALLER_PRICE_MAX),
  label: z.string().trim().min(1).max(80),
  validUntil: z.string().datetime({ offset: true }),
});

const UpdateSchema = z
  .object({
    slug: z.string().trim().min(3).max(60).regex(TALLER_SLUG_REGEX).optional(),
    name: z.string().trim().min(1).max(120).optional(),
    brand: z.string().trim().min(1).max(80).optional(),
    shortDescription: z.string().trim().min(1).max(280).optional(),
    longDescription: z.string().trim().min(1).max(4000).optional(),
    coverImage: z.string().trim().min(1).max(500).optional(),
    basePrice: z.number().finite().min(TALLER_PRICE_MIN).max(TALLER_PRICE_MAX).optional(),
    discountTiers: z.array(DiscountTierSchema).max(10).optional(),
    postPurchaseNote: z.string().trim().min(1).max(1000).optional(),
    whatsappContact: z
      .string()
      .trim()
      .regex(/^[0-9]{8,15}$/)
      .nullable()
      .optional(),
    active: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Sin cambios" });

export async function GET(
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
  const snap = await dbAdmin.collection("talleres").doc(id).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Taller no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ taller: docToTaller(snap) });
}

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
  const data = parsed.data;

  try {
    const ref = dbAdmin.collection("talleres").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Taller no encontrado" }, { status: 404 });
    }

    if (data.slug && data.slug !== snap.data()?.slug) {
      const dupe = await dbAdmin
        .collection("talleres")
        .where("slug", "==", data.slug)
        .limit(1)
        .get();
      if (!dupe.empty && dupe.docs[0].id !== id) {
        return NextResponse.json(
          { error: `Ya existe un taller con slug "${data.slug}"` },
          { status: 409 },
        );
      }
    }

    const update: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue;
      if (k === "basePrice" && typeof v === "number") {
        update.basePrice = Math.round(v * 100) / 100;
      } else if (k === "discountTiers" && Array.isArray(v)) {
        update.discountTiers = v.map((t) => ({
          ...t,
          finalPrice: Math.round(t.finalPrice * 100) / 100,
        }));
      } else {
        update[k] = v;
      }
    }

    await ref.update(update);
    const fresh = await ref.get();
    return NextResponse.json({ taller: docToTaller(fresh) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error actualizando taller";
    console.error("[talleres][PATCH]", err);
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
    const ref = dbAdmin.collection("talleres").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Taller no encontrado" }, { status: 404 });
    }
    if (snap.data()?.active === true) {
      return NextResponse.json(
        { error: "Desactivá el taller antes de eliminarlo" },
        { status: 409 },
      );
    }
    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error eliminando taller";
    console.error("[talleres][DELETE]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
