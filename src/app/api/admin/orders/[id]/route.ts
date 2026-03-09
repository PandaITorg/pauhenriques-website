import { NextRequest, NextResponse } from "next/server";
import { auth, dbAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

async function verifyAdmin(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie || !auth) return false;
  try {
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    return decoded.admin === true;
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const { id } = await params;
  const doc = await dbAdmin.collection("orders").doc(id).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const data = doc.data()!;
  return NextResponse.json({
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const { id } = await params;
  const { status } = await request.json();

  const validStatuses = [
    "pending",
    "processing",
    "paid",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Estado invalido" }, { status: 400 });
  }

  await dbAdmin.collection("orders").doc(id).update({
    status,
    updatedAt: new Date(),
  });

  return NextResponse.json({ success: true });
}
