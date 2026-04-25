/**
 * Migra el curso legacy "curso-toxica-sin-toxicos" desde la colección
 * `products` (donde vivía con hiddenFromCatalog: true) hacia la nueva
 * colección `talleres`.
 *
 * Idempotente: si ya existe un taller con slug "toxica-sin-toxicos", no
 * sobreescribe — solo loguea y termina.
 *
 * NO elimina el doc legacy en `products`. La limpieza ocurre en un commit
 * posterior una vez que toda la app lee desde `talleres`.
 *
 * Mapeo:
 *   products/curso-toxica-sin-toxicos
 *     name, shortDescription, longDescription, image (→ coverImage),
 *     priceWithoutVat (→ basePrice con IVA), autoDiscounts (→ discountTiers),
 *     postPurchaseNote, brand
 *   talleres/<auto-id>
 *     slug: "toxica-sin-toxicos"
 *     whatsappContact: "593982839650" (per CLAUDE.md, organizador externo)
 *     active: true
 *
 * Uso: npx tsx scripts/migrate-curso-toxica-to-taller.ts
 */

import { config } from "dotenv";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";

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

const LEGACY_PRODUCT_ID = "curso-toxica-sin-toxicos";
const NEW_TALLER_SLUG = "toxica-sin-toxicos";
const IVA_RATE = 0.15;
const WHATSAPP_ORGANIZADOR = "593982839650";

const FALLBACK_POST_PURCHASE_NOTE =
  "Recibirás el acceso al taller por correo en un máximo de 24 horas. Si no lo ves en tu bandeja de entrada, revisá spam o escríbenos por WhatsApp.";

interface RawDiscount {
  finalPrice: unknown;
  label: unknown;
  validUntil: unknown;
}

function tierValidUntilToIso(raw: unknown): string | null {
  if (raw == null) return null;
  if (raw instanceof Timestamp) return raw.toDate().toISOString();
  if (raw instanceof Date) return raw.toISOString();
  if (typeof raw === "string") {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof raw === "object") {
    const obj = raw as { seconds?: number; _seconds?: number };
    const seconds = obj.seconds ?? obj._seconds;
    if (typeof seconds === "number") {
      return new Date(seconds * 1000).toISOString();
    }
  }
  return null;
}

function mapDiscountTiers(raw: unknown): Array<{
  finalPrice: number;
  label: string;
  validUntil: string;
}> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ finalPrice: number; label: string; validUntil: string }> = [];
  for (const t of raw as RawDiscount[]) {
    const finalPrice =
      typeof t.finalPrice === "number" && t.finalPrice > 0 ? t.finalPrice : null;
    const label = typeof t.label === "string" ? t.label.trim() : null;
    const validUntil = tierValidUntilToIso(t.validUntil);
    if (finalPrice === null || !label || !validUntil) continue;
    out.push({ finalPrice, label, validUntil });
  }
  return out;
}

async function migrate() {
  const dupe = await db
    .collection("talleres")
    .where("slug", "==", NEW_TALLER_SLUG)
    .limit(1)
    .get();
  if (!dupe.empty) {
    console.log(
      `[migrate] Ya existe un taller con slug "${NEW_TALLER_SLUG}" (id=${dupe.docs[0].id}). Skip.`,
    );
    return;
  }

  const productSnap = await db
    .collection("products")
    .doc(LEGACY_PRODUCT_ID)
    .get();
  if (!productSnap.exists) {
    console.warn(
      `[migrate] No existe products/${LEGACY_PRODUCT_ID} en Firestore. Nada que migrar.`,
    );
    return;
  }

  const p = productSnap.data() ?? {};

  const priceWithoutVat =
    typeof p.priceWithoutVat === "number" ? p.priceWithoutVat : 0;
  const basePrice = Math.round(priceWithoutVat * (1 + IVA_RATE) * 100) / 100;

  const taller = {
    slug: NEW_TALLER_SLUG,
    name: typeof p.name === "string" ? p.name : "Tóxica sin Tóxicos — Taller Online",
    brand: typeof p.brand === "string" ? p.brand : "Pau Henriques",
    shortDescription:
      typeof p.shortDescription === "string"
        ? p.shortDescription
        : "Taller en vivo para transformar tu hogar, tu mesa y tu rutina eliminando tóxicos sin complicaciones.",
    longDescription:
      typeof p.longDescription === "string"
        ? p.longDescription
        : "Un taller en vivo, práctico y paso a paso, para identificar los tóxicos ocultos en tu día a día y reemplazarlos por alternativas limpias, accesibles y sostenibles.",
    coverImage:
      typeof p.image === "string" ? p.image : "/assets/de-toxica-a-sin-toxicos.webp",
    basePrice: basePrice > 0 ? basePrice : 97.0,
    discountTiers: mapDiscountTiers(p.autoDiscounts),
    postPurchaseNote:
      typeof p.postPurchaseNote === "string" && p.postPurchaseNote.trim().length > 0
        ? p.postPurchaseNote
        : FALLBACK_POST_PURCHASE_NOTE,
    whatsappContact: WHATSAPP_ORGANIZADOR,
    active: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    // Trazabilidad para auditoría: de dónde vino este taller.
    migratedFromProductId: LEGACY_PRODUCT_ID,
  };

  const ref = await db.collection("talleres").add(taller);
  console.log(`[migrate] OK — talleres/${ref.id} creado desde products/${LEGACY_PRODUCT_ID}`);
  console.log(`  slug: ${taller.slug}`);
  console.log(`  basePrice: $${taller.basePrice.toFixed(2)}`);
  console.log(`  discountTiers: ${taller.discountTiers.length}`);
  console.log(`  whatsappContact: ${taller.whatsappContact}`);
  console.log(
    "\nNOTA: el doc legacy en products/ NO fue eliminado. Cleanup en commit posterior.",
  );
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[migrate] Falló:", err);
    process.exit(1);
  });
