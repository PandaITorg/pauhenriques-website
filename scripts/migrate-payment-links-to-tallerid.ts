/**
 * Renombra el campo `productId` → `tallerId` en todos los docs de
 * `paymentLinks` que apuntan al curso legacy `curso-toxica-sin-toxicos`.
 *
 * El nuevo `tallerId` es el ID del doc en `talleres` con slug
 * "toxica-sin-toxicos" (creado por migrate-curso-toxica-to-taller.ts).
 *
 * Idempotente:
 *   - Skip docs que ya tienen `tallerId`.
 *   - Falla con error claro si no existe el taller destino.
 *
 * Uso: npx tsx scripts/migrate-payment-links-to-tallerid.ts
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
const NEW_TALLER_SLUG = "toxica-sin-toxicos";

async function migrate() {
  const tallerSnap = await db
    .collection("talleres")
    .where("slug", "==", NEW_TALLER_SLUG)
    .limit(1)
    .get();
  if (tallerSnap.empty) {
    throw new Error(
      `No existe taller con slug "${NEW_TALLER_SLUG}". Corré primero migrate-curso-toxica-to-taller.ts`,
    );
  }
  const tallerId = tallerSnap.docs[0].id;
  console.log(`[migrate] Target tallerId: ${tallerId}`);

  const links = await db.collection("paymentLinks").get();
  console.log(`[migrate] ${links.size} paymentLink(s) en total`);

  let updated = 0;
  let skipped = 0;
  for (const doc of links.docs) {
    const data = doc.data();
    if (typeof data.tallerId === "string" && data.tallerId.length > 0) {
      skipped++;
      continue;
    }
    await doc.ref.update({
      tallerId,
      productId: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    updated++;
    console.log(`  ✓ ${doc.id}: productId → tallerId=${tallerId}`);
  }

  console.log(
    `\n[migrate] Done — ${updated} actualizado(s), ${skipped} ya migrado(s).`,
  );
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[migrate] Falló:", err);
    process.exit(1);
  });
