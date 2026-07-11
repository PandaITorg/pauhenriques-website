import { describe, it, expect } from "vitest";

// Replica la lógica de sort de page_client.tsx para probarla de forma aislada.
function sortProducts(products: Array<{ name: string; sortOrder?: number }>) {
  return [...products].sort((a, b) => {
    const orderA = a.sortOrder ?? 0;
    const orderB = b.sortOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });
}

describe("tienda — orden de productos", () => {
  it("ordena por sortOrder ascendente", () => {
    const input = [
      { name: "Panel Large", sortOrder: 60 },
      { name: "Mat Mini", sortOrder: 10 },
      { name: "Panel Mini", sortOrder: 50 },
      { name: "Mat Pro", sortOrder: 40 },
      { name: "Mat Pillow", sortOrder: 20 },
      { name: "Mat Large", sortOrder: 30 },
    ];
    const result = sortProducts(input).map((p) => p.name);
    expect(result).toEqual([
      "Mat Mini",
      "Mat Pillow",
      "Mat Large",
      "Mat Pro",
      "Panel Mini",
      "Panel Large",
    ]);
  });

  it("desempata por nombre cuando sortOrder es igual", () => {
    const input = [
      { name: "Zebra", sortOrder: 10 },
      { name: "Alfa", sortOrder: 10 },
    ];
    const result = sortProducts(input).map((p) => p.name);
    expect(result).toEqual(["Alfa", "Zebra"]);
  });

  it("productos sin sortOrder caen a 0 (additive)", () => {
    const input = [
      { name: "Nuevo" },
      { name: "Mat Mini", sortOrder: 10 },
    ];
    const result = sortProducts(input).map((p) => p.name);
    // "Nuevo" sin sortOrder = 0, precede a Mat Mini (10)
    expect(result[0]).toBe("Nuevo");
    expect(result[1]).toBe("Mat Mini");
  });
});
