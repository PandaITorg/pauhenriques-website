"use server";

import { dbAdmin } from "@/lib/firebase-admin";
import { CURSO_TOXICA_SIN_TOXICOS } from "@/lib/pago-link/course";

/**
 * Idempotent: ensures the course product exists in Firestore with the
 * canonical flags from course.ts. Called from the payment-link page on
 * mount so the order can reference a real products/{productId} document
 * (required by /api/payment/charge).
 *
 * Upserts canonical fields (isDigital, hiddenFromCatalog, price) so the
 * document can't drift from the pago-link invariants — running once after
 * the new flag was introduced will migrate the existing product.
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
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true };
  }

  // Document already exists — patch only the pago-link invariants. Admin-
  // editable fields (name, description, images, category) stay untouched.
  const data = snap.data() ?? {};
  const patch: Record<string, unknown> = {};
  if (data.isDigital !== true) patch.isDigital = true;
  if (data.hiddenFromCatalog !== true) patch.hiddenFromCatalog = true;
  if (data.price !== CURSO_TOXICA_SIN_TOXICOS.priceWithoutVat) {
    patch.price = CURSO_TOXICA_SIN_TOXICOS.priceWithoutVat;
  }
  if (Object.keys(patch).length > 0) {
    patch.updatedAt = now;
    await ref.update(patch);
  }

  return { ok: true };
}
