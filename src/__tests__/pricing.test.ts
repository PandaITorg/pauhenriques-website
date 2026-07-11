import { describe, it, expect } from "vitest";
import { getPriceDisplay } from "@/lib/pricing";
import { getTallerPriceDisplay } from "@/lib/talleres/pricing";

// ── P1: totales del checkout — lógica de precios pura ────────────────────────
// Prueba getPriceDisplay (src/lib/pricing.ts) que es la fuente de verdad de
// precios para el checkout, PagoLink y talleres.

describe("getPriceDisplay — sin descuento", () => {
  it("calcula IVA 15 % y precio final correctamente", () => {
    const r = getPriceDisplay({ price: 100 });
    expect(r.baseSubtotal).toBe(100);
    expect(r.finalVat).toBe(15);
    expect(r.basePrice).toBe(115);
    expect(r.finalPrice).toBe(115);
    expect(r.hasActiveDiscount).toBe(false);
    expect(r.percentOff).toBe(0);
    expect(r.amountOff).toBe(0);
    expect(r.label).toBeNull();
  });

  it("redondea a 2 decimales (precio con centavos)", () => {
    const r = getPriceDisplay({ price: 33.33 });
    expect(r.baseSubtotal).toBe(33.33);
    // IVA: 33.33 * 0.15 = 4.9995 → 5.00
    expect(r.finalVat).toBe(5);
    expect(r.basePrice).toBe(38.33);
  });

  it("precio cero: todos los valores son cero", () => {
    const r = getPriceDisplay({ price: 0 });
    expect(r.baseSubtotal).toBe(0);
    expect(r.finalVat).toBe(0);
    expect(r.finalPrice).toBe(0);
    expect(r.hasActiveDiscount).toBe(false);
  });

  it("cantidades grandes sin desbordamiento", () => {
    const r = getPriceDisplay({ price: 9999.99 });
    expect(r.baseSubtotal).toBe(9999.99);
    expect(r.finalPrice).toBe(Math.round(9999.99 * 1.15 * 100) / 100);
    expect(r.hasActiveDiscount).toBe(false);
  });
});

describe("getPriceDisplay — con descuento activo", () => {
  it("aplica descuento permanente (validUntil null)", () => {
    const r = getPriceDisplay({
      price: 100,
      autoDiscounts: [{ finalPrice: 92, label: "Lanzamiento", validUntil: null }],
    });
    expect(r.hasActiveDiscount).toBe(true);
    expect(r.finalPrice).toBe(92);
    expect(r.amountOff).toBe(23); // 115 − 92
    expect(r.percentOff).toBe(20); // round(23/115*100)
    expect(r.label).toBe("Lanzamiento");
    expect(r.validUntil).toBeNull();
  });

  it("ignora descuento vencido y usa precio base", () => {
    const ayer = new Date(Date.now() - 86_400_000);
    const r = getPriceDisplay({
      price: 100,
      autoDiscounts: [{ finalPrice: 80, label: "Viejo", validUntil: ayer }],
    });
    expect(r.hasActiveDiscount).toBe(false);
    expect(r.finalPrice).toBe(115);
  });

  it("elige el descuento que expira primero cuando hay varios", () => {
    const pronto = new Date(Date.now() + 86_400_000);
    const despues = new Date(Date.now() + 7 * 86_400_000);
    const r = getPriceDisplay({
      price: 100,
      autoDiscounts: [
        { finalPrice: 70, label: "Tarde", validUntil: despues },
        { finalPrice: 90, label: "Pronto", validUntil: pronto },
      ],
    });
    expect(r.label).toBe("Pronto");
    expect(r.finalPrice).toBe(90);
  });

  it("descuento permanente actúa como último recurso vs uno con fecha", () => {
    const pronto = new Date(Date.now() + 3_600_000);
    const r = getPriceDisplay({
      price: 100,
      autoDiscounts: [
        { finalPrice: 80, label: "Permanente", validUntil: null },
        { finalPrice: 95, label: "FlashSale", validUntil: pronto },
      ],
    });
    expect(r.label).toBe("FlashSale");
    expect(r.finalPrice).toBe(95);
  });

  it("descarta descuentos con precio cero o no finito", () => {
    const r = getPriceDisplay({
      price: 100,
      autoDiscounts: [
        { finalPrice: 0, label: "cero", validUntil: null },
        { finalPrice: Number.NaN, label: "nan", validUntil: null },
      ],
    });
    expect(r.hasActiveDiscount).toBe(false);
  });
});

describe("getPriceDisplay — normalización de fechas", () => {
  const futuro = Date.now() + 86_400_000;

  it("acepta string ISO", () => {
    const r = getPriceDisplay({
      price: 100,
      autoDiscounts: [
        { finalPrice: 90, label: "s", validUntil: new Date(futuro).toISOString() },
      ],
    });
    expect(r.hasActiveDiscount).toBe(true);
  });

  it("acepta objeto { seconds } tipo Firestore", () => {
    const r = getPriceDisplay({
      price: 100,
      autoDiscounts: [
        { finalPrice: 90, label: "s", validUntil: { seconds: futuro / 1000 } },
      ],
    });
    expect(r.hasActiveDiscount).toBe(true);
  });

  it("acepta objeto { toDate() } tipo Firestore client", () => {
    const r = getPriceDisplay({
      price: 100,
      autoDiscounts: [
        { finalPrice: 90, label: "s", validUntil: { toDate: () => new Date(futuro) } },
      ],
    });
    expect(r.hasActiveDiscount).toBe(true);
  });
});


// ── percentOff almacenado ─────────────────────────────────────────────────────

describe("getPriceDisplay — percentOff almacenado", () => {
  it("35% sobre base 100 subtotal → finalPrice 74.75", () => {
    // basePrice = 100 * 1.15 = 115; 35% OFF → 115 * 0.65 = 74.75
    const r = getPriceDisplay({
      price: 100,
      autoDiscounts: [{ finalPrice: 74.75, label: "35% OFF", validUntil: null, percentOff: 35 }],
    });
    expect(r.hasActiveDiscount).toBe(true);
    expect(r.finalPrice).toBe(74.75);
    expect(r.percentOff).toBe(35); // usa el guardado exacto
  });

  it("round-trip: percentOff guardado prevalece aunque la base tenga centavos", () => {
    const r = getPriceDisplay({
      price: 100.01,
      autoDiscounts: [{ finalPrice: 74.75, label: "35% OFF", validUntil: null, percentOff: 35 }],
    });
    expect(r.percentOff).toBe(35);
  });

  it("tier legacy sin percentOff sigue derivando el %", () => {
    const r = getPriceDisplay({
      price: 100,
      autoDiscounts: [{ finalPrice: 92, label: "Lanzamiento", validUntil: null }],
    });
    expect(r.percentOff).toBe(20); // round(23/115*100) ≈ 20
    expect(r.hasActiveDiscount).toBe(true);
  });
});


// ── P1 también: getTallerPriceDisplay ────────────────────────────────────────
// Envuelve getPriceDisplay convirtiendo basePrice (CON IVA) a subtotal.

describe("getTallerPriceDisplay", () => {
  it("convierte basePrice (con IVA) a subtotal correcto", () => {
    // basePrice 115 (CON IVA) → subtotal 100 → finalPrice 115
    const r = getTallerPriceDisplay({ basePrice: 115, discountTiers: [] });
    expect(r.finalPrice).toBe(115);
    expect(r.hasActiveDiscount).toBe(false);
  });

  it("aplica un tier de descuento activo", () => {
    const futuro = new Date(Date.now() + 86_400_000);
    const r = getTallerPriceDisplay({
      basePrice: 115,
      discountTiers: [{ finalPrice: 92, label: "Early", validUntil: futuro }],
    });
    expect(r.hasActiveDiscount).toBe(true);
    expect(r.finalPrice).toBe(92);
  });

  it("sin tiers de descuento devuelve precio base completo", () => {
    const r = getTallerPriceDisplay({ basePrice: 69, discountTiers: [] });
    expect(r.finalPrice).toBe(69);
    expect(r.percentOff).toBe(0);
  });
});

// ── PriceDisplay prop withVat — lógica de selección de cifras ─────────────────

describe("PriceDisplay — selección de cifras según withVat", () => {
  it("sin descuento: finalSubtotal < finalPrice (IVA excluido)", () => {
    const r = getPriceDisplay({ price: 100 });
    expect(r.finalPrice).toBe(115);
    expect(r.finalSubtotal).toBe(100);
    expect(r.finalSubtotal).toBeLessThan(r.finalPrice);
  });

  it("con descuento: baseSubtotal/finalSubtotal son las cifras sin IVA", () => {
    const r = getPriceDisplay({
      price: 100,
      autoDiscounts: [{ finalPrice: 92, label: "Oferta", validUntil: null }],
    });
    expect(r.baseSubtotal).toBe(100);
    expect(r.finalSubtotal).toBeLessThan(r.finalPrice);
    expect(Math.round((r.finalSubtotal + r.finalVat) * 100) / 100).toBe(r.finalPrice);
  });
});
