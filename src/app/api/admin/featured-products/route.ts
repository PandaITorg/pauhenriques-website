import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const snapshot = await dbAdmin
    .collection("featured_products")
    .orderBy("order")
    .get();

  const refs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
    updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() ?? null,
  }));

  return NextResponse.json(refs);
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const body = await request.json();
  if (!body.productId) {
    return NextResponse.json({ error: "productId requerido" }, { status: 400 });
  }
  const now = new Date();

  const data = {
    productId: String(body.productId),
    badge: body.badge ?? null,
    bentoSize: body.bentoSize ?? "normal",
    order: body.order ?? 0,
    active: body.active ?? true,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await dbAdmin.collection("featured_products").add(data);

  revalidatePath("/");

  return NextResponse.json({ id: docRef.id }, { status: 201 });
}
