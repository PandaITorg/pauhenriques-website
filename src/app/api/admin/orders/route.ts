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

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = dbAdmin
    .collection("orders")
    .orderBy("createdAt", "desc")
    .limit(100);

  if (status) {
    query = dbAdmin
      .collection("orders")
      .where("status", "==", status)
      .orderBy("createdAt", "desc")
      .limit(100);
  }

  const snapshot = await query.get();
  const orders = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    };
  });

  return NextResponse.json(orders);
}
