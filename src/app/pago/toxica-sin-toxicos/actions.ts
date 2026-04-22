"use server";

import { Timestamp } from "firebase-admin/firestore";
import { dbAdmin } from "@/lib/firebase-admin";
import { CURSO_TOXICA_SIN_TOXICOS, DEFAULT_COURSE_DISCOUNTS } from "@/lib/pago-link/course";
import { getPriceDisplay, type PriceDisplay } from "@/lib/pricing";

/**
 * Idempotent: ensures the course product exists in Firestore with the
 * canonical flags + default pricing tiers from course.ts. Called from the
 * payment-link page on mount.
 *
 * Upserts pago-link invariants (isDigital, hiddenFromCatalog, price). The
 * discounts (autoDiscounts) are seeded ONLY on first creation so later
 * admin edits are respected.
 */
export async function ensureCourseProduct(): Promise<{ ok: boolean; error?: string }> {
  if (!dbAdmin) {
    return { ok: false, error: "Firestore Admin no disponible" };
  }

  const ref = dbAdmin.collection("products").doc(CURSO_TOXICA_SIN_TOXICOS.productId);
  const snap = await ref.get();
  const now = new Date();

  if (!snap.exists) {
    await ref.set({
      id: CURSO_TOXICA_SIN_TOXICOS.productId,
      name: CURSO_TOXICA_SIN_TOXICOS.name,
      description: CURSO_TOXICA_SIN_TOXICOS.longDescription,
      brand: CURSO_TOXICA_SIN_TOXICOS.brand,
      images: [CURSO_TOXICA_SIN_TOXICOS.image],
      category: CURSO_TOXICA_SIN_TOXICOS.category,
      productType: CURSO_TOXICA_SIN_TOXICOS.productType,
      isActive: true,
      isDigital: true,
      hiddenFromCatalog: true,
      price: CURSO_TOXICA_SIN_TOXICOS.priceWithoutVat,
      stock: 0,
      autoDiscounts: DEFAULT_COURSE_DISCOUNTS.map((d) => ({
        finalPrice: d.finalPrice,
        label: d.label,
        validUntil: d.validUntil ? Timestamp.fromDate(new Date(d.validUntil)) : null,
      })),
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true };
  }

  // Document already exists — patch only the pago-link invariants. Admin-
  // editable fields (name, description, images, category, autoDiscounts)
  // stay untouched so manual edits from /admin/productos persist.
  const data = snap.data() ?? {};
  const patch: Record<string, unknown> = {};
  if (data.isDigital !== true) patch.isDigital = true;
  if (data.hiddenFromCatalog !== true) patch.hiddenFromCatalog = true;
  if (data.price !== CURSO_TOXICA_SIN_TOXICOS.priceWithoutVat) {
    patch.price = CURSO_TOXICA_SIN_TOXICOS.priceWithoutVat;
  }
  // Si el producto existía antes del sistema de autoDiscounts, sembrar los
  // defaults para que el primer cambio (sábado) ocurra automáticamente.
  if (!Array.isArray(data.autoDiscounts) || data.autoDiscounts.length === 0) {
    patch.autoDiscounts = DEFAULT_COURSE_DISCOUNTS.map((d) => ({
      finalPrice: d.finalPrice,
      label: d.label,
      validUntil: d.validUntil ? Timestamp.fromDate(new Date(d.validUntil)) : null,
    }));
  }
  if (Object.keys(patch).length > 0) {
    patch.updatedAt = now;
    await ref.update(patch);
  }

  return { ok: true };
}

export interface CourseBootstrapResult {
  ok: true;
  pricing: SerializablePriceDisplay;
}

export interface CourseBootstrapError {
  ok: false;
  error: string;
}

// Server actions can't return Date or Firestore Timestamp directly to the
// client — serialize validUntil as ISO string.
export interface SerializablePriceDisplay
  extends Omit<PriceDisplay, "validUntil"> {
  validUntilIso: string | null;
}

/**
 * One-shot bootstrap for the payment-link page:
 *   1. Ensure the course product exists.
 *   2. Compute the current pricing (active discount or base).
 *
 * Runs server-side so the pricing is authoritative and the client doesn't
 * need to fetch the product separately.
 */
export async function getCourseBootstrap(): Promise<
  CourseBootstrapResult | CourseBootstrapError
> {
  const ensure = await ensureCourseProduct();
  if (!ensure.ok) return { ok: false, error: ensure.error || "bootstrap failed" };
  if (!dbAdmin) return { ok: false, error: "Firestore Admin no disponible" };

  const snap = await dbAdmin
    .collection("products")
    .doc(CURSO_TOXICA_SIN_TOXICOS.productId)
    .get();
  const data = snap.data();
  if (!data) return { ok: false, error: "Producto no encontrado" };

  const display = getPriceDisplay({
    price: data.price,
    autoDiscounts: data.autoDiscounts,
  });

  return {
    ok: true,
    pricing: {
      ...display,
      validUntilIso: display.validUntil ? display.validUntil.toISOString() : null,
    },
  };
}
