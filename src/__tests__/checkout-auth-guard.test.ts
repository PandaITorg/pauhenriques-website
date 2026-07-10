import { describe, it, expect } from "vitest";

// Replica the guard condition from checkout/page.tsx.
// Cuando authLoading=true, el checkout debe mostrar spinner — nunca
// los pasos (que contienen el prompt "Debes iniciar sesión").
function checkoutShouldRenderContent(isClient: boolean, authLoading: boolean): boolean {
  return isClient && !authLoading;
}

describe("checkout auth guard", () => {
  it("no renderiza contenido mientras hydrating (isClient=false)", () => {
    expect(checkoutShouldRenderContent(false, false)).toBe(false);
    expect(checkoutShouldRenderContent(false, true)).toBe(false);
  });

  it("no renderiza contenido mientras auth carga (loading=true)", () => {
    // Cubre el caso: usuario AUTENTICADO pero Firebase aún no resolvió.
    // Sin este guard, user===null → los pasos muestran "Debes iniciar sesión".
    expect(checkoutShouldRenderContent(true, true)).toBe(false);
  });

  it("renderiza contenido cuando auth resolvió", () => {
    expect(checkoutShouldRenderContent(true, false)).toBe(true);
  });
});
