/**
 * QA Flow: carrito sin sesión → login → checkout sin re-pedir sesión
 *
 * Qué verifica:
 *   T1. /checkout sin auth → middleware devuelve 307 a /sign-in?redirect_uri=/checkout
 *   T2. Login via Firebase REST + session cookie → /checkout responde sin redirigir
 *
 * El fix de Router Cache (router.refresh en sign-in/page.tsx) es client-side puro
 * y no se puede verificar con fetch; ese comportamiento requiere smoke manual en browser.
 *
 * Cómo correr:
 *   QA_BASE_URL=http://localhost:3000 \
 *   QA_USER_EMAIL=test@example.com \
 *   QA_USER_PASSWORD=contraseña \
 *   node qa/flows/login-checkout.mjs
 *
 * Variables de entorno (leer de .env.local automáticamente):
 *   QA_BASE_URL              — URL del servidor (default: http://localhost:3000)
 *   QA_USER_EMAIL            — email del usuario de prueba (cliente, sin rol admin)
 *   QA_USER_PASSWORD         — contraseña
 *   NEXT_PUBLIC_FIREBASE_API_KEY — Firebase Web API key
 */

import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Cargar .env.local si existe (dotenv ya está en devDependencies)
try {
  const dotenv = require("dotenv");
  dotenv.config({ path: resolve(__dir, "../../.env.local") });
} catch {
  // dotenv opcional; si no carga, las vars deben venir del entorno
}

const users = JSON.parse(
  require("node:fs").readFileSync(resolve(__dir, "../test-users.json"), "utf8")
);

const BASE_URL = process.env.QA_BASE_URL ?? "http://localhost:3000";
const email = process.env.QA_USER_EMAIL ?? users.customer?.email;
const password = process.env.QA_USER_PASSWORD ?? users.customer?.password;
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!email || !password) {
  console.error("FALTA: QA_USER_EMAIL y QA_USER_PASSWORD en .env.local o como variables de entorno.");
  process.exit(1);
}
if (!FIREBASE_API_KEY) {
  console.error("FALTA: NEXT_PUBLIC_FIREBASE_API_KEY en .env.local.");
  process.exit(1);
}

let passed = 0;
let failed = 0;

function ok(name) {
  console.log(`✅ ${name}`);
  passed++;
}

function fail(name, reason) {
  console.error(`❌ ${name}: ${reason}`);
  failed++;
}

// T1: /checkout sin sesión → 307 a /sign-in
async function testUnauthRedirect() {
  const res = await fetch(`${BASE_URL}/checkout`, { redirect: "manual" });
  const loc = res.headers.get("location") ?? "";
  if ((res.status === 307 || res.status === 302) && loc.includes("/sign-in")) {
    ok("T1: /checkout sin auth → redirect a /sign-in");
  } else {
    fail("T1: /checkout sin auth → redirect a /sign-in", `status=${res.status} location=${loc}`);
  }
}

// T2: login → session cookie → /checkout sin re-redirect
async function testAuthenticatedCheckout() {
  // 2a. Firebase REST sign-in
  const signInRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  if (!signInRes.ok) {
    const body = await signInRes.text().catch(() => "");
    fail("T2a: Firebase sign-in", `status=${signInRes.status} ${body.slice(0, 100)}`);
    return;
  }
  const { idToken } = await signInRes.json();
  ok("T2a: Firebase sign-in OK");

  // 2b. Crear session cookie vía /api/auth/session
  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!sessionRes.ok) {
    fail("T2b: /api/auth/session", `status=${sessionRes.status}`);
    return;
  }
  const rawCookie = sessionRes.headers.get("set-cookie") ?? "";
  // Extraer solo la parte name=value (sin atributos HttpOnly, Path, etc.)
  const sessionCookieVal = rawCookie
    .split(",")
    .map((c) => c.split(";")[0].trim())
    .join("; ");
  if (!sessionCookieVal) {
    fail("T2b: /api/auth/session", "No set-cookie en respuesta");
    return;
  }
  ok("T2b: session cookie emitida");

  // 2c. /checkout CON cookie → no debe redirigir a /sign-in
  const checkoutRes = await fetch(`${BASE_URL}/checkout`, {
    redirect: "manual",
    headers: { cookie: sessionCookieVal },
  });
  if (checkoutRes.status === 200) {
    ok("T2c: /checkout con sesión → 200 (sin re-login)");
  } else if (checkoutRes.status === 307 || checkoutRes.status === 302) {
    const loc = checkoutRes.headers.get("location") ?? "";
    fail("T2c: /checkout con sesión → re-redirect inesperado", `location=${loc}`);
  } else {
    // Otros 2xx o 3xx no a /sign-in son aceptables (ej. 308, redirect a /tienda por carrito vacío)
    ok(`T2c: /checkout con sesión → ${checkoutRes.status} (no loop de auth)`);
  }
}

async function main() {
  console.log(`\nQA: login → checkout [${BASE_URL}]\n`);
  await testUnauthRedirect();
  await testAuthenticatedCheckout();
  console.log(`\n${passed} pasaron, ${failed} fallaron`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
