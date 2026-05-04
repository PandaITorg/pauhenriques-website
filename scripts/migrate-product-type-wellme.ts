/**
 * Renombra el discriminador `productType: "Infrarrojo"` → `"WellMe"`
 * en la colección `products`.
 *
 * Idempotente: ignora docs que ya tienen `productType: "WellMe"` o
 * cualquier otro valor distinto de "Infrarrojo".
 *
 * Uso: npx tsx scripts/migrate-product-type-wellme.ts
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
const BATCH_SIZE = 400;

async function migrate() {
  const snap = await db
    .collection("products")
    .where("productType", "==", "Infrarrojo")
    .get();

  console.log(`[migrate] ${snap.size} producto(s) con productType="Infrarrojo"`);

  if (snap.empty) {
    console.log("[migrate] Nada que hacer. Salida.");
    return;
  }

  let updated = 0;
  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const chunk = snap.docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    chunk.forEach((doc) => {
      batch.update(doc.ref, {
        productType: "WellMe",
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
    updated += chunk.length;
    console.log(
      `[migrate] Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} actualizados (acum ${updated}/${snap.size})`,
    );
  }

  console.log(`[migrate] ✓ Migración completa. ${updated} doc(s) actualizados.`);
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[migrate] Error:", err);
    process.exit(1);
  });
