/**
 * Script to set admin custom claim on a Firebase user.
 * Usage: npx tsx scripts/set-admin.ts <user-email>
 *
 * Requires .env.local with FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */

import { config } from "dotenv";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

config({ path: ".env.local" });

const email = process.argv[2];

if (!email) {
  console.error("Usage: npx tsx scripts/set-admin.ts <user-email>");
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

async function setAdmin() {
  try {
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, { admin: true });
    console.log(`Admin claim set for ${email} (uid: ${user.uid})`);
    console.log(
      "The user must sign out and sign back in for the claim to take effect.",
    );
  } catch (error) {
    console.error("Error setting admin claim:", error);
    process.exit(1);
  }
}

setAdmin();
