"use server";

import { dbAdmin } from "@/lib/firebase-admin";
import { CURSO_TOXICA_SIN_TOXICOS } from "@/lib/pago-link/course";

/**
 * Idempotent: creates the course product in Firestore if it does not exist.
 * Called from the payment-link page on mount so the order can reference a
 * real products/{productId} document (required by /api/payment/charge).
 */
export async function ensureCourseProduct(): Promise<{ ok: boolean; error?: string }> {
  if (!dbAdmin) {
    return { ok: false, error: "Firestore Admin no disponible" };
  }

  const ref = dbAdmin.collection("products").doc(CURSO_TOXICA_SIN_TOXICOS.productId);
  const snap = await ref.get();
  if (snap.exists) return { ok: true };

  const now = new Date();
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
    price: CURSO_TOXICA_SIN_TOXICOS.priceWithoutVat,
    stock: 0,
    createdAt: now,
    updatedAt: now,
  });

  return { ok: true };
}
