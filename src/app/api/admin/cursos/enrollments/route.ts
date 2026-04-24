import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await requireSection(request, "cursos"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const accessStatus = searchParams.get("accessStatus");

  let query = dbAdmin
    .collection("courseEnrollments")
    .orderBy("paidAt", "desc")
    .limit(200);

  if (accessStatus) {
    query = dbAdmin
      .collection("courseEnrollments")
      .where("accessStatus", "==", accessStatus)
      .orderBy("paidAt", "desc")
      .limit(200);
  }

  const snapshot = await query.get();
  const enrollments = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      paidAt: data.paidAt?.toDate?.()?.toISOString() || null,
      accessSentAt: data.accessSentAt?.toDate?.()?.toISOString() || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    };
  });

  return NextResponse.json(enrollments);
}
