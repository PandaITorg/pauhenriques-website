"use server";

import { Timestamp } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase-admin";
import { docToTaller } from "@/lib/talleres/firestore";
import type { Taller } from "@/lib/talleres/types";

// Subset del Taller que el cliente necesita para renderizar /pago/t/[token].
// Excluye campos solo de admin (active, timestamps, discountTiers — los
// tiers no aplican a un paymentLink fijo).
export interface TallerSummary {
  id: string;
  slug: string;
  name: string;
  brand: string;
  shortDescription: string;
  longDescription: string;
  coverImage: string;
  postPurchaseNote: string;
  whatsappContact: string | null;
}

export interface PaymentLinkBootstrapOk {
  ok: true;
  linkId: string;
  token: string;
  taller: TallerSummary;
  label: string | null;
  pricing: SerializablePriceDisplay;
}

export interface PaymentLinkBootstrapError {
  ok: false;
  error: string;
  code: "not-found" | "inactive" | "expired" | "db-error";
}

// Mismo shape que el SerializablePriceDisplay del flujo legacy de
// toxica-sin-toxicos, para mantener compat con NuveiPaymentForm consumers.
export interface SerializablePriceDisplay {
  basePrice: number;
  baseSubtotal: number;
  finalPrice: number;
  finalSubtotal: number;
  finalVat: number;
  percentOff: number;
  amountOff: number;
  label: string | null;
  hasActiveDiscount: boolean;
  validUntilIso: string | null;
}

const IVA_RATE = 0.15;
// Slug del taller migrado desde products/curso-toxica-sin-toxicos. Se usa
// como fallback cuando el paymentLink legacy no tiene tallerId aún.
const LEGACY_FALLBACK_SLUG = "toxica-sin-toxicos";

function priceFromTotal(totalWithVat: number) {
  const subtotal = Math.round((totalWithVat / (1 + IVA_RATE)) * 100) / 100;
  const vat = Math.round((totalWithVat - subtotal) * 100) / 100;
  return { subtotal, vat, total: totalWithVat };
}

function tallerSummary(t: Taller): TallerSummary {
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    brand: t.brand,
    shortDescription: t.shortDescription,
    longDescription: t.longDescription,
    coverImage: t.coverImage,
    postPurchaseNote: t.postPurchaseNote,
    whatsappContact: t.whatsappContact,
  };
}

async function resolveTaller(data: FirebaseFirestore.DocumentData): Promise<Taller | null> {
  if (!dbAdmin) return null;
  // Preferred: nuevo campo tallerId apuntando a un doc en talleres/.
  if (typeof data.tallerId === "string" && data.tallerId.length > 0) {
    const snap = await dbAdmin.collection("talleres").doc(data.tallerId).get();
    if (snap.exists) return docToTaller(snap);
  }
  // Compat 1: paymentLink viejo con productId — buscar el taller migrado por slug.
  // Compat 2: paymentLink sin tallerId (sin productId tampoco) — usar el fallback.
  const slugQuery = await dbAdmin
    .collection("talleres")
    .where("slug", "==", LEGACY_FALLBACK_SLUG)
    .limit(1)
    .get();
  if (!slugQuery.empty) return docToTaller(slugQuery.docs[0]);
  return null;
}

/**
 * Server action: dado un token, resuelve el paymentLink + taller asociado
 * y calcula pricing. El precio es FIJO (el del link) — ignora discountTiers
 * del taller.
 */
export async function getPaymentLinkBootstrap(
  token: string,
): Promise<PaymentLinkBootstrapOk | PaymentLinkBootstrapError> {
  if (!dbAdmin) {
    return { ok: false, error: "Backend no disponible", code: "db-error" };
  }
  if (!token || typeof token !== "string" || token.length < 8) {
    return { ok: false, error: "Link invalido", code: "not-found" };
  }

  const snap = await dbAdmin
    .collection("paymentLinks")
    .where("token", "==", token)
    .limit(1)
    .get();

  if (snap.empty) {
    return { ok: false, error: "Link no encontrado", code: "not-found" };
  }

  const doc = snap.docs[0];
  const data = doc.data();

  if (data.active === false) {
    return { ok: false, error: "Este link fue desactivado", code: "inactive" };
  }

  const expiresAtRaw = data.expiresAt;
  let expiresAt: Date | null = null;
  if (expiresAtRaw instanceof Timestamp) expiresAt = expiresAtRaw.toDate();
  else if (expiresAtRaw instanceof Date) expiresAt = expiresAtRaw;
  else if (typeof expiresAtRaw === "string") expiresAt = new Date(expiresAtRaw);

  if (!expiresAt || expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "Este link expiró", code: "expired" };
  }

  const price = typeof data.price === "number" ? data.price : 0;
  if (price <= 0) {
    return { ok: false, error: "Precio invalido", code: "db-error" };
  }

  const taller = await resolveTaller(data);
  if (!taller) {
    return { ok: false, error: "Taller asociado no encontrado", code: "db-error" };
  }
  if (!taller.active) {
    return { ok: false, error: "El taller está inactivo", code: "inactive" };
  }

  const p = priceFromTotal(price);

  return {
    ok: true,
    linkId: doc.id,
    token,
    taller: tallerSummary(taller),
    label: typeof data.label === "string" ? data.label : null,
    pricing: {
      basePrice: p.total,
      baseSubtotal: p.subtotal,
      finalPrice: p.total,
      finalSubtotal: p.subtotal,
      finalVat: p.vat,
      percentOff: 0,
      amountOff: 0,
      label: typeof data.label === "string" ? data.label : null,
      hasActiveDiscount: false,
      validUntilIso: null,
    },
  };
}
