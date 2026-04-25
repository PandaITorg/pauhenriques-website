// Pricing del Taller (link oficial /pago/[slug]).
//
// El Taller tiene `basePrice` CON IVA y `discountTiers` con fechas. Esta lib
// envuelve getPriceDisplay() (que espera precio SIN IVA y tiers como
// autoDiscounts) para reusar la misma lógica de "tier activo" sin duplicar.

import { getPriceDisplay, type PriceDisplay } from "@/lib/pricing";
import type { Taller, TallerDiscountTier } from "./types";

const IVA_RATE = 0.15;

interface TallerPricingInput {
  basePrice: number;
  discountTiers: TallerDiscountTier[];
}

export function getTallerPriceDisplay(
  taller: TallerPricingInput,
  now: Date = new Date(),
): PriceDisplay {
  // Convertir basePrice (CON IVA) a subtotal (sin IVA) para el helper.
  const basePriceSubtotal = Math.round((taller.basePrice / (1 + IVA_RATE)) * 100) / 100;

  return getPriceDisplay(
    {
      price: basePriceSubtotal,
      autoDiscounts: taller.discountTiers.map((t) => ({
        finalPrice: t.finalPrice,
        label: t.label,
        validUntil: t.validUntil,
      })),
    },
    now,
  );
}

export function tallerToPricingInput(taller: Taller): TallerPricingInput {
  return {
    basePrice: taller.basePrice,
    discountTiers: taller.discountTiers,
  };
}
