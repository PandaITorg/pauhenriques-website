import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { UpdatePromotionSchema } from "@/lib/schemas/promotion.schema";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireSection(request, "promociones"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const { id } = await params;
  const doc = await dbAdmin.collection("promotions").doc(id).get();

  if (!doc.exists) {
    return NextResponse.json(
      { error: "Promocion no encontrada" },
      { status: 404 },
    );
  }

  // Get usage count
  const usagesSnap = await dbAdmin
    .collection("promotions")
    .doc(id)
    .collection("usages")
    .count()
    .get();

  return NextResponse.json({
    id: doc.id,
    ...doc.data(),
    usageCount: usagesSnap.data().count,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireSection(request, "promociones"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = UpdatePromotionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const doc = await dbAdmin.collection("promotions").doc(id).get();
  if (!doc.exists) {
    return NextResponse.json(
      { error: "Promocion no encontrada" },
      { status: 404 },
    );
  }

  const currentData = doc.data()!;
  const data = parsed.data;

  // Block code change if promotion has been used
  if (data.code && data.code !== currentData.code && currentData.currentUses > 0) {
    return NextResponse.json(
      { error: "No se puede cambiar el codigo de una promocion ya utilizada" },
      { status: 400 },
    );
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.code !== undefined) updateData.code = data.code;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.value !== undefined) updateData.value = data.value;
  if (data.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = data.maxDiscountAmount ?? null;
  if (data.showAsBanner !== undefined) updateData.showAsBanner = data.showAsBanner;
  if (data.rules !== undefined) {
    updateData.rules = {
      ...data.rules,
      validFrom: data.rules.validFrom ? new Date(data.rules.validFrom) : currentData.rules.validFrom,
      validUntil: data.rules.validUntil ? new Date(data.rules.validUntil) : currentData.rules.validUntil,
    };
  }

  await dbAdmin.collection("promotions").doc(id).update(updateData);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireSection(request, "promociones"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const { id } = await params;
  const doc = await dbAdmin.collection("promotions").doc(id).get();

  if (!doc.exists) {
    return NextResponse.json(
      { error: "Promocion no encontrada" },
      { status: 404 },
    );
  }

  const data = doc.data()!;

  // If promotion has been used, soft-disable instead of delete
  if (data.currentUses > 0) {
    await dbAdmin
      .collection("promotions")
      .doc(id)
      .update({ isActive: false, updatedAt: new Date() });
    return NextResponse.json({ success: true, softDisabled: true });
  }

  await dbAdmin.collection("promotions").doc(id).delete();
  return NextResponse.json({ success: true });
}
