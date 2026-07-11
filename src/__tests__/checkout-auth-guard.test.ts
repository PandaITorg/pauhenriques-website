import { describe, it, expect } from "vitest";
import { checkoutShouldBlock } from "@/lib/checkout-auth-guard";

// checkoutShouldBlock = true → spinner; false → renderiza pasos.
// Cuando true, los pasos (que tienen "Debes iniciar sesión") nunca se ven
// durante la inicialización de Firebase.
describe("checkout auth guard", () => {
  it("bloquea mientras hydrating (isClient=false)", () => {
    expect(checkoutShouldBlock(false, false)).toBe(true);
    expect(checkoutShouldBlock(false, true)).toBe(true);
  });

  it("bloquea mientras auth carga (loading=true)", () => {
    // Cubre el caso: usuario AUTENTICADO pero Firebase aún no resolvió.
    // Sin este guard, user===null → los pasos muestran "Debes iniciar sesión".
    expect(checkoutShouldBlock(true, true)).toBe(true);
  });

  it("no bloquea cuando auth resolvió", () => {
    expect(checkoutShouldBlock(true, false)).toBe(false);
  });
});
