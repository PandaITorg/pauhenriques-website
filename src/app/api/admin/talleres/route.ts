import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";
import { docToTaller } from "@/lib/talleres/firestore";
import {
  DEFAULT_TALLER_COVER_IMAGE,
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

const CreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(60)
    .regex(TALLER_SLUG_REGEX, "Solo minúsculas, números y guiones"),
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().min(1).max(80),
  shortDescription: z.string().trim().min(1).max(280),
  longDescription: z.string().trim().min(1).max(4000),
  // Imagen opcional. Si viene vacío o no viene, se aplica el default
  // (DEFAULT_TALLER_COVER_IMAGE) en el handler.
  coverImage: z.string().trim().max(500).optional(),
  basePrice: z.number().finite().min(TALLER_PRICE_MIN).max(TALLER_PRICE_MAX),
  discountTiers: z.array(DiscountTierSchema).max(10).default([]),
  postPurchaseNote: z.string().trim().min(1).max(1000),
  whatsappContact: z
    .string()
    .trim()
    .regex(/^[0-9]{8,15}$/, "Solo dígitos (formato wa.me, sin '+')")
    .nullable(),
  active: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  const session = await requireSection(request, "cursos");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const snap = await dbAdmin
    .collection("talleres")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();

  const talleres = snap.docs.map(docToTaller);
  return NextResponse.json({ talleres });
}

export async function POST(request: NextRequest) {
  const session = await requireSection(request, "cursos");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos invalidos" },
      { status: 400 },
    );
  }
  const data = parsed.data;

  try {
    const dupe = await dbAdmin
      .collection("talleres")
      .where("slug", "==", data.slug)
      .limit(1)
      .get();
    if (!dupe.empty) {
      return NextResponse.json(
        { error: `Ya existe un taller con slug "${data.slug}"` },
        { status: 409 },
      );
    }

    const ref = await dbAdmin.collection("talleres").add({
      ...data,
      coverImage: data.coverImage?.trim() || DEFAULT_TALLER_COVER_IMAGE,
      basePrice: Math.round(data.basePrice * 100) / 100,
      discountTiers: data.discountTiers.map((t) => ({
        ...t,
        finalPrice: Math.round(t.finalPrice * 100) / 100,
      })),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const snap = await ref.get();
    return NextResponse.json({ taller: docToTaller(snap) }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creando taller";
    console.error("[talleres][POST]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
