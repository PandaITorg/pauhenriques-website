// Enrollment helper: crea un doc en `courseEnrollments` cuando una orden
// de paymentLink se confirma como pagada. Idempotente — si ya existe un
// enrollment para ese orderId, no escribe nada.
//
// Llamado desde TODOS los puntos donde una orden transiciona a "paid":
//   - /api/payment/charge        (success sincrónico)
//   - /api/webhooks/nuvei        (aprobación asincrónica)
//   - /api/nuvei/verify          (post-OTP)
//   - /api/payment/3ds-complete  (post-3DS challenge)

import type { Firestore } from "firebase-admin/firestore";

interface EnsureEnrollmentResult {
  created: boolean;
  reason?: "already-exists" | "no-course-id" | "no-guest-info" | "order-not-found";
  enrollmentId?: string;
}

export async function ensureEnrollmentForPaidOrder(
  db: Firestore,
  orderId: string,
): Promise<EnsureEnrollmentResult> {
  const orderRef = db.collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) return { created: false, reason: "order-not-found" };

  const order = orderSnap.data() ?? {};
  const courseId: string | undefined = order.courseId;
  const guestInfo = order.guestInfo;

  if (!courseId) return { created: false, reason: "no-course-id" };
  if (!guestInfo) return { created: false, reason: "no-guest-info" };

  // Idempotencia: si ya existe un enrollment para esta orden, no duplicar.
  const existing = await db
    .collection("courseEnrollments")
    .where("orderId", "==", orderId)
    .limit(1)
    .get();
  if (!existing.empty) {
    return { created: false, reason: "already-exists", enrollmentId: existing.docs[0].id };
  }

  const ref = await db.collection("courseEnrollments").add({
    orderId,
    courseId,
    customerEmail: guestInfo.email,
    customerFirstName: guestInfo.firstName,
    customerLastName: guestInfo.lastName,
    customerIdNumber: guestInfo.idNumber,
    customerPhone: guestInfo.phone,
    paidAt: new Date(),
    amountPaid: typeof order.total === "number" ? order.total : 0,
    accessStatus: "pending_access",
    accessLink: null,
    accessSentAt: null,
    notes: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...(order.paymentLinkId ? { paymentLinkId: order.paymentLinkId } : {}),
  });

  return { created: true, enrollmentId: ref.id };
}
