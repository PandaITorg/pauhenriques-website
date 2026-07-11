// Shared pricing helper — used by the payment-link page, /api/payment/charge
// validation, and (in Fase C) the tienda catalog.
//
// The source of truth for a product's pricing is:
//   - product.price       → base subtotal WITHOUT IVA (as stored in Firestore)
//   - product.autoDiscounts → optional array of scheduled discounts
//
// getPriceDisplay() picks the active discount (if any) and returns ALL the
// figures consumers need (base vs final, subtotal vs IVA vs total, % off).

const IVA_RATE = 0.15;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface PriceDisplay {
  /** Precio regular CON IVA (lo que se muestra tachado cuando hay descuento). */
  basePrice: number;
  /** Subtotal regular SIN IVA (product.price). */
  baseSubtotal: number;
  /** Precio final CON IVA (lo que paga el cliente). */
  finalPrice: number;
  /** Subtotal final SIN IVA (para enviar a Nuvei como base imponible). */
  finalSubtotal: number;
  /** IVA del precio final. */
  finalVat: number;
  /** Porcentaje de descuento, entero (43 para 43% OFF). 0 si no hay descuento. */
  percentOff: number;
  /** Cuánto se ahorra el cliente, con IVA. 0 si no hay descuento. */
  amountOff: number;
  /** Etiqueta del descuento activo. null cuando no hay. */
  label: string | null;
  /** Cuándo expira el descuento activo. null = permanente o sin descuento. */
  validUntil: Date | null;
  hasActiveDiscount: boolean;
}

type RawTimestamp =
  | Date
  | string
  | null
  | undefined
  | { toDate?: () => Date }
  | { seconds: number; nanoseconds?: number };

interface AutoDiscountLike {
  finalPrice: number;
  label: string;
  validUntil: RawTimestamp;
  /** Porcentaje entero guardado para badge exacto. Si está presente, se usa en lugar del derivado. */
  percentOff?: number;
}

interface ProductLike {
  price: number;
  autoDiscounts?: AutoDiscountLike[];
}

/**
 * Normalize the various timestamp shapes we might receive (Firestore client
 * Timestamp, Firestore Admin Timestamp, ISO string, Date, plain object) into
 * a Date or null for comparison.
 */
function toDate(raw: RawTimestamp): Date | null {
  if (raw == null) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw === "string") {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof raw === "object") {
    if ("toDate" in raw && typeof raw.toDate === "function") {
      try {
        return raw.toDate();
      } catch {
        return null;
      }
    }
    if ("seconds" in raw && typeof raw.seconds === "number") {
      return new Date(raw.seconds * 1000 + (raw.nanoseconds ?? 0) / 1e6);
    }
  }
  return null;
}

/**
 * Returns the full pricing display for a product at the given moment.
 *
 * Discount selection rule:
 *   1. Normalize validUntil to Date (permanent -> Date at +Infinity for sort).
 *   2. Sort ascending by validUntil (permanent last).
 *   3. Pick the first discount still active (validUntil >= now), i.e. the
 *      earliest-expiring discount with some time left. This gives "cheapest
 *      now, moves up to next tier as each window closes".
 *   4. If none is active, fall back to base price.
 */
export function getPriceDisplay(
  product: ProductLike,
  now: Date = new Date(),
): PriceDisplay {
  const baseSubtotal = round2(product.price);
  const baseVat = round2(baseSubtotal * IVA_RATE);
  const basePrice = round2(baseSubtotal + baseVat);

  const noDiscount: PriceDisplay = {
    basePrice,
    baseSubtotal,
    finalPrice: basePrice,
    finalSubtotal: baseSubtotal,
    finalVat: baseVat,
    percentOff: 0,
    amountOff: 0,
    label: null,
    validUntil: null,
    hasActiveDiscount: false,
  };

  const discounts = (product.autoDiscounts ?? [])
    .map((d) => ({
      finalPrice: Number(d.finalPrice),
      label: String(d.label ?? ""),
      validUntil: toDate(d.validUntil),
      percentOff: typeof d.percentOff === "number" ? d.percentOff : undefined,
    }))
    .filter((d) => Number.isFinite(d.finalPrice) && d.finalPrice > 0);

  if (discounts.length === 0) return noDiscount;

  const FAR_FUTURE = Number.MAX_SAFE_INTEGER;
  const sorted = [...discounts].sort((a, b) => {
    const aT = a.validUntil ? a.validUntil.getTime() : FAR_FUTURE;
    const bT = b.validUntil ? b.validUntil.getTime() : FAR_FUTURE;
    return aT - bT;
  });

  const active = sorted.find(
    (d) => d.validUntil === null || d.validUntil.getTime() >= now.getTime(),
  );

  if (!active) return noDiscount;

  const finalPrice = round2(active.finalPrice);
  const finalSubtotal = round2(finalPrice / (1 + IVA_RATE));
  const finalVat = round2(finalPrice - finalSubtotal);
  const amountOff = round2(basePrice - finalPrice);
  // Use stored percentOff for exact badge (avoids re-derivation drift from rounding).
  const percentOff =
    active.percentOff != null && active.percentOff > 0
      ? active.percentOff
      : basePrice > 0
        ? Math.round((amountOff / basePrice) * 100)
        : 0;

  return {
    basePrice,
    baseSubtotal,
    finalPrice,
    finalSubtotal,
    finalVat,
    percentOff,
    amountOff,
    label: active.label || null,
    validUntil: active.validUntil,
    hasActiveDiscount: true,
  };
}

/**
 * Formats a Date for Ecuador time zone (UTC-5, no DST) like:
 *   "sábado 25 de abril, 23:59 (hora Ecuador)"
 */
export function formatDeadlineInEcuador(date: Date): string {
  const fmt = new Intl.DateTimeFormat("es-EC", {
    timeZone: "America/Guayaquil",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${fmt.format(date)} (hora Ecuador)`;
}
