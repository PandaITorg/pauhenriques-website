import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

interface IncomingDiscount {
  finalPrice: number;
  label: string;
  /** ISO string (del datetime-local del form) o null para permanente. */
  validUntil: string | null;
}

/**
 * Reemplaza el arreglo completo de autoDiscounts de un producto.
 * PUT /api/admin/products/<id>/discounts
 * Body: { autoDiscounts: IncomingDiscount[] }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireSection(request, "productos"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const { id } = await params;
  const body = await request.json();
  const raw: unknown = body?.autoDiscounts;

  if (!Array.isArray(raw)) {
    return NextResponse.json(
      { error: "autoDiscounts debe ser un arreglo" },
      { status: 400 },
    );
  }

  const parsed: Array<{
    finalPrice: number;
    label: string;
    validUntil: Timestamp | null;
  }> = [];

  for (let i = 0; i < raw.length; i++) {
    const d = raw[i] as Partial<IncomingDiscount>;
    const finalPrice = Number(d?.finalPrice);
    const label = typeof d?.label === "string" ? d.label.trim() : "";
    const validUntilStr =
      typeof d?.validUntil === "string" && d.validUntil.length > 0
        ? d.validUntil
        : null;

    if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
      return NextResponse.json(
        { error: `Tier ${i + 1}: precio final inválido` },
        { status: 400 },
      );
    }
    if (finalPrice > 10000) {
      return NextResponse.json(
        { error: `Tier ${i + 1}: precio excede el máximo razonable` },
        { status: 400 },
      );
    }
    if (!label) {
      return NextResponse.json(
        { error: `Tier ${i + 1}: falta la etiqueta` },
        { status: 400 },
      );
    }
    if (label.length > 80) {
      return NextResponse.json(
        { error: `Tier ${i + 1}: etiqueta demasiado larga (máx 80 caracteres)` },
        { status: 400 },
      );
    }

    let validUntil: Timestamp | null = null;
    if (validUntilStr !== null) {
      const date = new Date(validUntilStr);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: `Tier ${i + 1}: fecha inválida` },
          { status: 400 },
        );
      }
      validUntil = Timestamp.fromDate(date);
    }

    parsed.push({ finalPrice, label, validUntil });
  }

  const ref = dbAdmin.collection("products").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  await ref.update({
    autoDiscounts: parsed,
    updatedAt: new Date(),
  });

  return NextResponse.json({ ok: true, count: parsed.length });
}
