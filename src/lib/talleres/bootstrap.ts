// Bootstrap del link oficial del taller (/pago/[slug]).
// Server-only utility (no "use server" — se invoca desde server components y
// generateMetadata, no es una mutation triggered from client).
// Diferente al bootstrap de paymentLinks (linkBootstrap.ts):
//   - No depende de un token random; el slug del taller es la clave.
//   - El precio sale de los discountTiers programados por fecha (tier activo
//     o basePrice si no hay tier vigente).
//   - Cualquier visitante público puede llegar acá vía marca / homepage / link-tree.

import { dbAdmin } from "@/lib/firebase-admin";
import { docToTaller } from "./firestore";
import { getTallerPriceDisplay } from "./pricing";
import type { TallerSummary } from "@/lib/pago-link/linkBootstrap";

export interface TallerBootstrapOk {
  ok: true;
  taller: TallerSummary;
  pricing: SerializableTallerPricing;
}

export interface TallerBootstrapError {
  ok: false;
  error: string;
  code: "not-found" | "inactive" | "db-error";
}

// Idéntico al SerializablePriceDisplay de linkBootstrap pero documentado
// acá porque incluye el % off computado vs basePrice (en paymentLinks fijos
// el % off se calcula distinto — se hace en Fase D.2).
export interface SerializableTallerPricing {
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

export async function getTallerBootstrapBySlug(
  slug: string,
): Promise<TallerBootstrapOk | TallerBootstrapError> {
  if (!dbAdmin) {
    return { ok: false, error: "Backend no disponible", code: "db-error" };
  }
  if (!slug || typeof slug !== "string" || slug.length < 2) {
    return { ok: false, error: "Slug invalido", code: "not-found" };
  }

  const snap = await dbAdmin
    .collection("talleres")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snap.empty) {
    return { ok: false, error: "Taller no encontrado", code: "not-found" };
  }

  const taller = docToTaller(snap.docs[0]);
  if (!taller.active) {
    return { ok: false, error: "Este taller no está disponible", code: "inactive" };
  }

  const display = getTallerPriceDisplay(taller);

  return {
    ok: true,
    taller: {
      id: taller.id,
      slug: taller.slug,
      name: taller.name,
      brand: taller.brand,
      shortDescription: taller.shortDescription,
      longDescription: taller.longDescription,
      coverImage: taller.coverImage,
      postPurchaseNote: taller.postPurchaseNote,
      whatsappContact: taller.whatsappContact,
    },
    pricing: {
      basePrice: display.basePrice,
      baseSubtotal: display.baseSubtotal,
      finalPrice: display.finalPrice,
      finalSubtotal: display.finalSubtotal,
      finalVat: display.finalVat,
      percentOff: display.percentOff,
      amountOff: display.amountOff,
      label: display.label,
      hasActiveDiscount: display.hasActiveDiscount,
      validUntilIso: display.validUntil ? display.validUntil.toISOString() : null,
    },
  };
}
