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
  const courseId = searchParams.get("courseId");

  // Encadenamos filtros opcionales. Firestore exige composite indexes para
  // queries con varios `where` + `orderBy`; los del console se crean
  // automáticamente al primer error de query si llegan a faltar.
  let query: FirebaseFirestore.Query = dbAdmin.collection("courseEnrollments");
  if (accessStatus) query = query.where("accessStatus", "==", accessStatus);
  if (courseId) query = query.where("courseId", "==", courseId);
  query = query.orderBy("paidAt", "desc").limit(200);

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
