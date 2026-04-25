import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await requireSection(request, "productos"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const snapshot = await dbAdmin
    .collection("products")
    .orderBy("name")
    .get();

  const products = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  if (!(await requireSection(request, "productos"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const body = await request.json();

  const now = new Date();
  const productData = {
    ...body,
    images: body.images || [],
    isActive: body.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await dbAdmin.collection("products").add(productData);

  return NextResponse.json({ id: docRef.id }, { status: 201 });
}
