import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

// Devuelve el count de courseEnrollments con paidAt > talleresInboxLastSeenAt
// del usuario actual. Si el usuario nunca visitó la tab, cuenta TODAS las
// inscripciones (lastSeen === null → todo es "nuevo").
export async function GET(request: NextRequest) {
  const session = await requireSection(request, "cursos");
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const userDoc = await dbAdmin.collection("users").doc(session.uid).get();
  const lastSeenRaw = userDoc.data()?.talleresInboxLastSeenAt;
  const lastSeen: Timestamp | null =
    lastSeenRaw instanceof Timestamp ? lastSeenRaw : null;

  let query: FirebaseFirestore.Query = dbAdmin.collection("courseEnrollments");
  if (lastSeen) {
    query = query.where("paidAt", ">", lastSeen);
  }
  // count() es agregación server-side eficiente (no descarga docs).
  const snapshot = await query.count().get();

  return NextResponse.json({ count: snapshot.data().count });
}
