import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/auditoria
 * Returns orders flagged with missingAuthCodeFlagged = true.
 */
export async function GET(request: NextRequest) {
  if (!(await requireSection(request, "auditoria"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const snapshot = await dbAdmin
    .collection("orders")
    .where("missingAuthCodeFlagged", "==", true)
    .limit(200)
    .get();

  const orders = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      status: data.status,
      total: data.total,
      userEmail: data.userEmail,
      paymentTransactionId: data.paymentTransactionId,
      authorizationCode: data.authorizationCode,
      missingAuthCodeLoggedAt: data.missingAuthCodeLoggedAt?.toDate?.()?.toISOString() || null,
      emailPending: data.emailPending ?? false,
      emailSentAt: data.emailSentAt?.toDate?.()?.toISOString() || null,
      webhookStatus: data.webhookStatus ?? null,
      webhookStatusDetail: data.webhookStatusDetail ?? null,
      webhookReceivedAt: data.webhookReceivedAt?.toDate?.()?.toISOString() || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    };
  });

  // Sort by flagged time, most recent first
  orders.sort((a, b) => {
    const ta = a.missingAuthCodeLoggedAt ? Date.parse(a.missingAuthCodeLoggedAt) : 0;
    const tb = b.missingAuthCodeLoggedAt ? Date.parse(b.missingAuthCodeLoggedAt) : 0;
    return tb - ta;
  });

  return NextResponse.json({ orders });
}

/**
 * POST /api/admin/auditoria/resolve
 * Body: { orderId: string }
 * Marks the flag as reviewed — removes missingAuthCodeFlagged.
 */
export async function POST(request: NextRequest) {
  if (!(await requireSection(request, "auditoria"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!dbAdmin) {
    return NextResponse.json({ error: "DB not available" }, { status: 500 });
  }

  const { orderId } = await request.json();
  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  await dbAdmin.collection("orders").doc(orderId).update({
    missingAuthCodeFlagged: FieldValue.delete(),
    missingAuthCodeResolvedAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ resolved: true });
}
