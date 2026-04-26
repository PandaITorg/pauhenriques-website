import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { requireSection } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const HARD_LIMIT = 500;

interface EnrichedEnrollment {
  id: string;
  orderId?: string;
  courseId?: string;
  customerEmail?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerIdNumber?: string;
  customerPhone?: string;
  paidAt: string | null;
  amountPaid?: number;
  accessStatus?: string;
  accessLink?: string | null;
  accessSentAt: string | null;
  accessMessage?: string;
  notes?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  paymentLinkId?: string;
  // Datos del banco joineados desde el order asociado.
  paymentTransactionId?: string | null;
  authorizationCode?: string | null;
  refundedAt?: string | null;
  refundedManually?: boolean;
}

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
  const paymentLinkId = searchParams.get("paymentLinkId");

  // Cuando hay algún filter, ordenamos en memoria para evitar exigir
  // composite indexes (accessStatus + paidAt, courseId + paidAt, ambos +
  // paidAt). Volumen por taller / por estado es pequeño.
  const hasFilter = !!accessStatus || !!courseId || !!paymentLinkId;
  let query: FirebaseFirestore.Query = dbAdmin.collection("courseEnrollments");
  if (accessStatus) query = query.where("accessStatus", "==", accessStatus);
  if (courseId) query = query.where("courseId", "==", courseId);
  if (paymentLinkId) query = query.where("paymentLinkId", "==", paymentLinkId);
  if (!hasFilter) query = query.orderBy("paidAt", "desc");
  query = query.limit(HARD_LIMIT);

  const snapshot = await query.get();
  const enrollments: EnrichedEnrollment[] = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      paidAt: data.paidAt?.toDate?.()?.toISOString() || null,
      accessSentAt: data.accessSentAt?.toDate?.()?.toISOString() || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      refundedAt: data.refundedAt?.toDate?.()?.toISOString() || null,
    } as EnrichedEnrollment;
  });

  // Joinear datos del banco (transactionId + authCode) leyendo los orders
  // asociados. Una sola tanda de Promise.all para no serializar.
  const orderIds = enrollments
    .map((e) => e.orderId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  const uniqueOrderIds = Array.from(new Set(orderIds));
  if (uniqueOrderIds.length > 0) {
    const orderDocs = await Promise.all(
      uniqueOrderIds.map((oid) =>
        dbAdmin!.collection("orders").doc(oid).get(),
      ),
    );
    const orderMap = new Map<
      string,
      {
        paymentTransactionId: string | null;
        authorizationCode: string | null;
      }
    >();
    for (const doc of orderDocs) {
      if (!doc.exists) continue;
      const d = doc.data() ?? {};
      orderMap.set(doc.id, {
        paymentTransactionId:
          typeof d.paymentTransactionId === "string"
            ? d.paymentTransactionId
            : null,
        authorizationCode:
          typeof d.authorizationCode === "string" ? d.authorizationCode : null,
      });
    }
    for (const e of enrollments) {
      if (!e.orderId) continue;
      const o = orderMap.get(e.orderId);
      if (o) {
        e.paymentTransactionId = o.paymentTransactionId;
        e.authorizationCode = o.authorizationCode;
      }
    }
  }

  if (hasFilter) {
    enrollments.sort((a, b) => {
      const aT = a.paidAt ? new Date(a.paidAt).getTime() : 0;
      const bT = b.paidAt ? new Date(b.paidAt).getTime() : 0;
      return bT - aT;
    });
  }

  return NextResponse.json(enrollments);
}
