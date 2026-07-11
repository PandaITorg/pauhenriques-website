// ponytail: un solo punto de verdad para la condición del guard de checkout.
// Importado por checkout/page.tsx y el test unitario para que ambos
// prueben el mismo código (evita que el test pase con una copia desactualizada).
export function checkoutShouldBlock(isClient: boolean, authLoading: boolean): boolean {
  return !isClient || authLoading;
}
