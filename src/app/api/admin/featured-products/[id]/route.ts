import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireSection(request, "homepage"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const { id } = await params;
  const body = await request.json();

  const updateData = { ...body, updatedAt: new Date() };
  delete updateData.id;
  delete updateData.createdAt;

  await dbAdmin.collection("featured_products").doc(id).update(updateData);

  revalidatePath("/");

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireSection(request, "homepage"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const { id } = await params;
  await dbAdmin.collection("featured_products").doc(id).delete();

  revalidatePath("/");

  return NextResponse.json({ success: true });
}
