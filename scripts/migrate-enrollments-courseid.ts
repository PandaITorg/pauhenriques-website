/**
 * Migra el campo `courseId` legacy ("curso-toxica-sin-toxicos") al doc id
 * del nuevo taller (talleres/<id> con slug "toxica-sin-toxicos") en:
 *   - courseEnrollments
 *   - orders (para que futuras lecturas también queden alineadas)
 *
 * Causa del faltante: las inscripciones creadas vía /pago/toxica-sin-toxicos
 * legacy (y las backfilleadas a partir de esas órdenes) tienen el productId
 * legacy en courseId, así que no aparecen al filtrar por tallerId del nuevo
 * detalle del taller.
 *
 * Idempotente: solo afecta docs con el courseId legacy exacto.
 *
 * Uso: npx tsx scripts/migrate-enrollments-courseid.ts [--dry]
 */

import { config } from "dotenv";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

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
const LEGACY_COURSE_ID = "curso-toxica-sin-toxicos";
const NEW_TALLER_SLUG = "toxica-sin-toxicos";

async function migrate() {
  console.log(`[migrate] ${DRY_RUN ? "DRY RUN — no writes" : "LIVE — will write"}`);

  // 1) Resolver el id del taller destino
  const tallerSnap = await db
    .collection("talleres")
    .where("slug", "==", NEW_TALLER_SLUG)
    .limit(1)
    .get();
  if (tallerSnap.empty) {
    throw new Error(
      `No existe taller con slug "${NEW_TALLER_SLUG}". Corré antes migrate-curso-toxica-to-taller.ts`,
    );
  }
  const newTallerId = tallerSnap.docs[0].id;
  console.log(`[migrate] target tallerId = ${newTallerId}`);

  // 2) courseEnrollments con courseId legacy
  const enrollmentsSnap = await db
    .collection("courseEnrollments")
    .where("courseId", "==", LEGACY_COURSE_ID)
    .get();
  console.log(
    `[migrate] courseEnrollments con courseId="${LEGACY_COURSE_ID}": ${enrollmentsSnap.size}`,
  );

  let enrollmentsUpdated = 0;
  for (const doc of enrollmentsSnap.docs) {
    if (DRY_RUN) {
      console.log(`  [dry] would update enrollment ${doc.id} → courseId=${newTallerId}`);
      enrollmentsUpdated++;
      continue;
    }
    await doc.ref.update({
      courseId: newTallerId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    enrollmentsUpdated++;
    console.log(`  ✓ enrollment ${doc.id}: courseId → ${newTallerId}`);
  }

  // 3) orders con courseId legacy
  const ordersSnap = await db
    .collection("orders")
    .where("courseId", "==", LEGACY_COURSE_ID)
    .get();
  console.log(
    `[migrate] orders con courseId="${LEGACY_COURSE_ID}": ${ordersSnap.size}`,
  );

  let ordersUpdated = 0;
  for (const doc of ordersSnap.docs) {
    if (DRY_RUN) {
      console.log(`  [dry] would update order ${doc.id} → courseId=${newTallerId}`);
      ordersUpdated++;
      continue;
    }
    await doc.ref.update({
      courseId: newTallerId,
      // tallerId también — útil para el branch en charge.ts (validación
      // por tier del taller en órdenes legacy si alguna vez se reintenta).
      tallerId: newTallerId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    ordersUpdated++;
    console.log(`  ✓ order ${doc.id}: courseId → ${newTallerId} (+ tallerId)`);
  }

  console.log(
    `\n[migrate] Done. enrollments=${enrollmentsUpdated} orders=${ordersUpdated}`,
  );
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[migrate] Falló:", err);
    process.exit(1);
  });
