import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { CreatePromotionSchema } from "@/lib/schemas/promotion.schema";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await requireSection(request, "promociones"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const snapshot = await dbAdmin
    .collection("promotions")
    .orderBy("createdAt", "desc")
    .get();

  const promotions = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return NextResponse.json(promotions);
}

export async function POST(request: NextRequest) {
  if (!(await requireSection(request, "promociones"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const body = await request.json();
  const parsed = CreatePromotionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Check code uniqueness
  const existing = await dbAdmin
    .collection("promotions")
    .where("code", "==", data.code)
    .limit(1)
    .get();

  if (!existing.empty) {
    return NextResponse.json(
      { error: "Ya existe una promocion con este codigo" },
      { status: 409 },
    );
  }

  const now = new Date();
  const promotionData = {
    name: data.name,
    description: data.description || null,
    code: data.code,
    type: data.type,
    value: data.type === "free_shipping" ? 0 : data.value,
    maxDiscountAmount: data.maxDiscountAmount ?? null,
    showAsBanner: data.showAsBanner,
    rules: {
      ...data.rules,
      validFrom: new Date(data.rules.validFrom),
      validUntil: new Date(data.rules.validUntil),
    },
    currentUses: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await dbAdmin.collection("promotions").add(promotionData);

  return NextResponse.json({ id: docRef.id }, { status: 201 });
}
