/**
 * One-shot script: uploads the BIN database to Firestore at config/bins.
 *
 * Usage: npx tsx scripts/upload-bins-to-firestore.ts
 *
 * Requires .env.local with FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

interface BinsFile {
  data: Record<string, {
    bank: string;
    brand: string;
    type: string;
    carrier: string;
    requiresOtp: boolean;
  }>;
  version: string;
  count: number;
}

async function main() {
  const jsonPath = join(__dirname, "bins-data.json");
  const file: BinsFile = JSON.parse(readFileSync(jsonPath, "utf-8"));

  console.log(`Uploading ${file.count} BINs (version ${file.version}) to Firestore...`);

  await db.collection("config").doc("bins").set({
    data: file.data,
    version: file.version,
    count: file.count,
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`Upload complete. Document at config/bins.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
