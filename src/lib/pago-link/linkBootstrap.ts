"use server";

import { Timestamp } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase-admin";
import { CURSO_TOXICA_SIN_TOXICOS } from "@/lib/pago-link/course";
import { ensureCourseProduct, type SerializablePriceDisplay } from "@/app/pago/toxica-sin-toxicos/actions";

export interface PaymentLinkBootstrapOk {
  ok: true;
  linkId: string;
  token: string;
  productId: string;
  label: string | null;
  pricing: SerializablePriceDisplay;
}

export interface PaymentLinkBootstrapError {
  ok: false;
  error: string;
  code: "not-found" | "inactive" | "expired" | "db-error";
}

const IVA_RATE = 0.15;

function priceFromTotal(totalWithVat: number) {
  const subtotal = Math.round((totalWithVat / (1 + IVA_RATE)) * 100) / 100;
  const vat = Math.round((totalWithVat - subtotal) * 100) / 100;
  return { subtotal, vat, total: totalWithVat };
}

/**
 * Server action: given a token, resolve the paymentLink and compute pricing.
 * Pricing is FIXED at the link's price (ignores autoDiscounts).
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

  const productId =
    typeof data.productId === "string"
      ? data.productId
      : CURSO_TOXICA_SIN_TOXICOS.productId;
  const price = typeof data.price === "number" ? data.price : 0;
  if (price <= 0) {
    return { ok: false, error: "Precio invalido", code: "db-error" };
  }

  const ensure = await ensureCourseProduct();
  if (!ensure.ok) {
    return { ok: false, error: ensure.error || "Bootstrap falló", code: "db-error" };
  }

  const p = priceFromTotal(price);

  return {
    ok: true,
    linkId: doc.id,
    token,
    productId,
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
