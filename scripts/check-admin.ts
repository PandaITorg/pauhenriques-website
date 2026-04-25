/**
 * Script to inspect custom claims for a Firebase user.
 * Usage: npx tsx scripts/check-admin.ts <user-email>
 */

import { config } from "dotenv";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

config({ path: ".env.local" });

const email = process.argv[2];

if (!email) {
  console.error("Usage: npx tsx scripts/check-admin.ts <user-email>");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const auth = getAuth();

async function checkClaims() {
  try {
    const user = await auth.getUserByEmail(email);
    console.log(`uid: ${user.uid}`);
    console.log(`email: ${user.email}`);
    console.log(`displayName: ${user.displayName ?? "(none)"}`);
    console.log(`customClaims:`, user.customClaims ?? "(none)");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkClaims();
