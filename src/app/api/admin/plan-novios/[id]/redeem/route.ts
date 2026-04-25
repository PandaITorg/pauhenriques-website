import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const RedeemSchema = z.object({
  amount: z.number().min(0.01).max(100000),
  description: z.string().min(1).max(500),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireSection(request, "planNovios");
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!dbAdmin) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  const { id: planId } = await params;
  const rawBody = await request.json();
  const parsed = RedeemSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const { amount, description } = parsed.data;

  // Validate plan exists and has sufficient balance
  const planDoc = await dbAdmin.collection("planNovios").doc(planId).get();
  if (!planDoc.exists) {
    return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
  }

  const planData = planDoc.data()!;
  if (planData.balance < amount) {
    return NextResponse.json(
      { error: `Balance insuficiente. Disponible: $${planData.balance.toFixed(2)}` },
      { status: 409 },
    );
  }

  // Create redemption and update balance atomically
  const batch = dbAdmin.batch();

  const redemptionRef = dbAdmin
    .collection("planNovios")
    .doc(planId)
    .collection("redemptions")
    .doc();

  batch.set(redemptionRef, {
    planId,
    amount,
    description,
    redeemedBy: admin.uid,
    createdAt: new Date(),
  });

  const planRef = dbAdmin.collection("planNovios").doc(planId);
  batch.update(planRef, {
    totalRedeemed: FieldValue.increment(amount),
    balance: FieldValue.increment(-amount),
    updatedAt: new Date(),
  });

  await batch.commit();

  return NextResponse.json({ success: true, redemptionId: redemptionRef.id });
}
