import { describe, it, expect } from "vitest";
import { calcCheckoutTotals } from "@/lib/checkout-totals";

describe("calcCheckoutTotals — carrito vacío", () => {
  it("devuelve ceros cuando no hay ítems", () => {
    const r = calcCheckoutTotals([]);
    expect(r.subtotal).toBe(0);
    expect(r.vat).toBe(0);
    expect(r.total).toBe(0);
  });
});

describe("calcCheckoutTotals — suma de ítems", () => {
  it("un ítem con qty 1", () => {
    const r = calcCheckoutTotals([{ price: 10, quantity: 1 }]);
    expect(r.subtotal).toBe(10);
    expect(r.vat).toBe(1.5);
    expect(r.total).toBe(11.5);
  });

  it("un ítem con qty mayor a 1", () => {
    const r = calcCheckoutTotals([{ price: 10, quantity: 3 }]);
    expect(r.subtotal).toBe(30);
    expect(r.vat).toBe(4.5);
    expect(r.total).toBe(34.5);
  });

  it("múltiples ítems distintos", () => {
    const r = calcCheckoutTotals([
      { price: 20, quantity: 2 },
      { price: 5, quantity: 4 },
    ]);
    expect(r.subtotal).toBe(60); // 40 + 20
    expect(r.vat).toBe(9);
    expect(r.total).toBe(69);
  });

  it("ítems con precio cero no rompen el cálculo", () => {
    const r = calcCheckoutTotals([
      { price: 0, quantity: 5 },
      { price: 10, quantity: 1 },
    ]);
    expect(r.subtotal).toBe(10);
    expect(r.total).toBe(11.5);
  });

  it("cantidades grandes sin desbordamiento", () => {
    const r = calcCheckoutTotals([{ price: 99.99, quantity: 1000 }]);
    expect(r.subtotal).toBe(99990);
    expect(r.total).toBe(Math.round(99990 * 1.15 * 100) / 100);
  });
});

describe("calcCheckoutTotals — con descuento de cupón", () => {
  it("aplica el descuento al subtotal antes de calcular IVA", () => {
    const r = calcCheckoutTotals([{ price: 100, quantity: 1 }], 10);
    expect(r.subtotal).toBe(100);
    expect(r.discount).toBe(10);
    expect(r.discountedSubtotal).toBe(90);
    expect(r.vat).toBe(13.5); // 90 * 0.15
    expect(r.total).toBe(103.5);
  });

  it("descuento mayor que el subtotal no produce total negativo", () => {
    const r = calcCheckoutTotals([{ price: 5, quantity: 1 }], 999);
    expect(r.discountedSubtotal).toBe(0);
    expect(r.vat).toBe(0);
    expect(r.total).toBe(0);
  });

  it("sin cupón el descuento es cero", () => {
    const r = calcCheckoutTotals([{ price: 50, quantity: 2 }]);
    expect(r.discount).toBe(0);
    expect(r.discountedSubtotal).toBe(r.subtotal);
  });
});

describe("calcCheckoutTotals — redondeo", () => {
  it("redondea IVA y total a 2 decimales", () => {
    // 33.33 * 0.15 = 4.9995 → 5.00; total = 33.33 + 5 = 38.33
    const r = calcCheckoutTotals([{ price: 33.33, quantity: 1 }]);
    expect(r.vat).toBe(5);
    expect(r.total).toBe(38.33);
  });

  it("precio con centavos y cantidad > 1 redondea correctamente", () => {
    // 9.99 * 3 = 29.97; vat = 4.50; total = 34.47
    const r = calcCheckoutTotals([{ price: 9.99, quantity: 3 }]);
    expect(r.subtotal).toBe(29.97);
    expect(r.vat).toBe(4.5);
    expect(r.total).toBe(34.47);
  });
});
