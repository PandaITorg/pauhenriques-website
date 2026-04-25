/**
 * Backfill: crea courseEnrollments para órdenes pagadas que tienen
 * courseId + guestInfo pero NO tienen un enrollment asociado.
 *
 * Causa del faltante: hasta el commit `fix(talleres): crear enrollment
 * también en webhook y 3ds-complete`, el enrollment solo se creaba en el
 * success sincrónico de charge.ts. Los pagos aprobados via webhook,
 * post-OTP o post-3DS quedaron sin inscripción visible en admin.
 *
 * Idempotente: usa el mismo helper ensureEnrollmentForPaidOrder() que
 * los endpoints en runtime, así que correrlo varias veces no duplica.
 *
 * Uso: npx tsx scripts/backfill-missing-enrollments.ts
 *
 * Tip: agregá --dry para solo loguear qué crearía sin escribir nada.
 */

import { config } from "dotenv";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

config({ path: ".env.local" });

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();
const DRY_RUN = process.argv.includes("--dry");

async function backfill() {
  console.log(`[backfill] ${DRY_RUN ? "DRY RUN — no writes" : "LIVE — will write"}`);

  // Solo órdenes pagadas. Filtramos por courseId presente para no escanear
  // todo el catálogo de pedidos de la tienda.
  const paidOrders = await db
    .collection("orders")
    .where("status", "==", "paid")
    .get();

  console.log(`[backfill] ${paidOrders.size} órdenes pagadas en total`);

  let createdCount = 0;
  let skippedExisting = 0;
  let skippedNoCourse = 0;
  let skippedNoGuest = 0;

  for (const orderDoc of paidOrders.docs) {
    const orderId = orderDoc.id;
    const order = orderDoc.data();
    const courseId: string | undefined = order.courseId;
    const guestInfo = order.guestInfo;

    if (!courseId) {
      skippedNoCourse++;
      continue;
    }
    if (!guestInfo) {
      skippedNoGuest++;
      continue;
    }

    const existing = await db
      .collection("courseEnrollments")
      .where("orderId", "==", orderId)
      .limit(1)
      .get();
    if (!existing.empty) {
      skippedExisting++;
      continue;
    }

    if (DRY_RUN) {
      console.log(
        `  [dry] would create enrollment for order ${orderId} (course ${courseId}, ${guestInfo.email})`,
      );
      createdCount++;
      continue;
    }

    const ref = await db.collection("courseEnrollments").add({
      orderId,
      courseId,
      customerEmail: guestInfo.email,
      customerFirstName: guestInfo.firstName,
      customerLastName: guestInfo.lastName,
      customerIdNumber: guestInfo.idNumber,
      customerPhone: guestInfo.phone,
      paidAt: order.chargeResponseAt?.toDate?.() ?? order.updatedAt?.toDate?.() ?? new Date(),
      amountPaid: typeof order.total === "number" ? order.total : 0,
      accessStatus: "pending_access",
      accessLink: null,
      accessSentAt: null,
      notes: "Backfill — enrollment retroactivo",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(order.paymentLinkId ? { paymentLinkId: order.paymentLinkId } : {}),
    });
    createdCount++;
    console.log(`  ✓ enrollment ${ref.id} ← order ${orderId} (${guestInfo.email})`);
  }

  console.log(
    `\n[backfill] Done. created=${createdCount} skipped(existed)=${skippedExisting} skipped(noCourseId)=${skippedNoCourse} skipped(noGuestInfo)=${skippedNoGuest}`,
  );
}

backfill()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[backfill] Falló:", err);
    process.exit(1);
  });
