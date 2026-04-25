/**
 * Script para asignar o revocar el rol de un usuario en Firebase Auth.
 *
 * Uso:
 *   npx tsx scripts/set-admin.ts <email>              → asigna rol "admin" (default)
 *   npx tsx scripts/set-admin.ts <email> <role>       → asigna rol: admin | staff | cursos
 *   npx tsx scripts/set-admin.ts <email> none         → revoca todos los roles
 *
 * Requiere .env.local con FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.
 */

import { config } from "dotenv";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

config({ path: ".env.local" });

const VALID_ROLES = ["admin", "staff", "cursos"] as const;
type Role = (typeof VALID_ROLES)[number];

const email = process.argv[2];
const roleArg = process.argv[3] ?? "admin";

if (!email) {
  console.error("Uso: npx tsx scripts/set-admin.ts <email> [admin|staff|cursos|none]");
  process.exit(1);
}

const isRevoke = roleArg === "none" || roleArg === "clear";
if (!isRevoke && !VALID_ROLES.includes(roleArg as Role)) {
  console.error(
    `Rol invalido: "${roleArg}". Validos: ${VALID_ROLES.join(", ")} | none`,
  );
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

async function run() {
  try {
    const user = await auth.getUserByEmail(email);

    if (isRevoke) {
      await auth.setCustomUserClaims(user.uid, null);
      await auth.revokeRefreshTokens(user.uid);
      console.log(`Roles revocados para ${email} (uid: ${user.uid})`);
    } else {
      await auth.setCustomUserClaims(user.uid, { role: roleArg });
      await auth.revokeRefreshTokens(user.uid);
      console.log(
        `Rol "${roleArg}" asignado a ${email} (uid: ${user.uid})`,
      );
    }

    console.log(
      "Sus tokens fueron revocados — debera volver a iniciar sesion para que el cambio tenga efecto.",
    );
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

run();
