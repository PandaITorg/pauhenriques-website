import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, auth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

async function verifyAdmin(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie || !auth) return null;
  try {
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    if (!decoded.admin) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!dbAdmin) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  const { id } = await params;

  const planDoc = await dbAdmin.collection("planNovios").doc(id).get();
  if (!planDoc.exists) {
    return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
  }

  // Get contributions
  const contribSnapshot = await dbAdmin
    .collection("planNovios")
    .doc(id)
    .collection("contributions")
    .orderBy("createdAt", "desc")
    .get();

  const contributions = contribSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Get redemptions
  const redemptionSnapshot = await dbAdmin
    .collection("planNovios")
    .doc(id)
    .collection("redemptions")
    .orderBy("createdAt", "desc")
    .get();

  const redemptions = redemptionSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return NextResponse.json({
    plan: { id: planDoc.id, ...planDoc.data() },
    contributions,
    redemptions,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!dbAdmin) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  const { id } = await params;
  const body = await request.json();

  const allowedFields = ["status", "isActive"];
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  await dbAdmin.collection("planNovios").doc(id).update(updates);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!dbAdmin) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  const { id } = await params;

  const planDoc = await dbAdmin.collection("planNovios").doc(id).get();
  if (!planDoc.exists) {
    return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
  }

  // Delete subcollections first (Firestore doesn't cascade deletes)
  const batch = dbAdmin.batch();

  const contribs = await dbAdmin
    .collection("planNovios").doc(id).collection("contributions").get();
  contribs.docs.forEach((doc) => batch.delete(doc.ref));

  const redemptions = await dbAdmin
    .collection("planNovios").doc(id).collection("redemptions").get();
  redemptions.docs.forEach((doc) => batch.delete(doc.ref));

  // Delete the plan document itself
  batch.delete(dbAdmin.collection("planNovios").doc(id));

  await batch.commit();

  console.log(`[admin] Plan Novios ${id} deleted by admin ${admin.uid}`);

  return NextResponse.json({ success: true });
}
