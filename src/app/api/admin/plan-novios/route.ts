import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await requireSection(request, "planNovios");
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!dbAdmin) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  const snapshot = await dbAdmin
    .collection("planNovios")
    .orderBy("createdAt", "desc")
    .get();

  const plans = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return NextResponse.json({ plans });
}
