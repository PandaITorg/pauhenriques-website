import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await requireSection(request, "homepage"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const snapshot = await dbAdmin
    .collection("carico_categories")
    .orderBy("order")
    .get();

  const categories = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
    updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() ?? null,
  }));

  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  if (!(await requireSection(request, "homepage"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const body = await request.json();
  const now = new Date();

  const data = {
    name: body.name ?? "",
    description: body.description ?? "",
    imageUrl: body.imageUrl ?? "",
    bgColor: body.bgColor ?? "#634d32",
    ctaLink: body.ctaLink ?? "",
    order: body.order ?? 0,
    active: body.active ?? true,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await dbAdmin.collection("carico_categories").add(data);

  revalidatePath("/");

  return NextResponse.json({ id: docRef.id }, { status: 201 });
}
