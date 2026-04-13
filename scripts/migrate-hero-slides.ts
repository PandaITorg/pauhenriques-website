/**
 * Migrates existing hero_slides docs to the new granular customization schema.
 *
 * Idempotent: only writes a field if it is undefined on the document.
 * Applies premium curated defaults to each legacy slide so they no longer
 * render as a basic glass box with white text.
 *
 * Usage: npx tsx scripts/migrate-hero-slides.ts
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

const DEFAULTS = {
  kicker: "AHORA DISPONIBLE",
  titleFont: "cormorant",
  titleSize: "xl",
  titleColor: "#ffffff",
  accentWord: "tienda en línea",
  textPosition: "center-left",
  textBackground: "gradient-left",
  overlayDirection: "left",
  imageEffect: "ken-burns",
} as const;

async function migrate() {
  const snapshot = await db.collection("hero_slides").get();
  console.log(`Found ${snapshot.size} slide(s) in hero_slides`);

  let touched = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const patch: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(DEFAULTS)) {
      if (data[key] === undefined) {
        patch[key] = value;
      }
    }

    if (Object.keys(patch).length === 0) {
      console.log(`  - ${doc.id}: already migrated, skipping`);
      continue;
    }

    patch.updatedAt = new Date();
    await doc.ref.update(patch);
    touched++;
    console.log(`  ✓ ${doc.id}: applied`, Object.keys(patch).filter((k) => k !== "updatedAt"));
  }

  console.log(`\nDone. ${touched} slide(s) updated.`);
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
