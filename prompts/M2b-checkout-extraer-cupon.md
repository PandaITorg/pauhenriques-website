# Prompt M2b — Extraer `useCupon` del checkout (corte seguro, sin tocar el flujo de pago)

> Segundo corte del monolito `checkout/page.tsx`. Sacamos la lógica de **cupón** (estado, aplicar/quitar,
> validación, mensajes) a un hook `useCupon`. Es el corte de menor riesgo: el descuento que produce el hook
> alimenta `calcCheckoutTotals` (ya testeado en M2a), así que la red de totales lo cubre. **NO tocamos el flujo
> de pago** (`procesarPago`/3DS) — eso es el corte siguiente. Cambio acotado → **Sonnet**.

## Idioma
Español NEUTRAL en comentarios, nombres y commits. Sin argentinismos; usa "tú".

## Rama (hazlo tú, Code — Andrés no uses terminal)
1. `git fetch origin`. `git checkout main && git pull` (incluye M2a/#39 ya mergeado; no existe `develop`, usa `main`).
2. `git checkout -b feat/pau-checkout-extraer-cupon`. Microcommits. PR a `main`. **NO mergees.**

## Qué hacer (acotado a propósito)
1. **Identifica** en `checkout/page.tsx` todo lo relacionado a cupón: el estado (código ingresado, cupón aplicado,
   descuento, cargando, error), la función que valida/aplica el cupón (incluida la llamada al backend si la hay)
   y la de quitarlo.
2. **Extrae** a un hook `useCupon` (ej. `src/hooks/useCupon.ts`) que exponga lo que el componente necesita
   (`couponCode`, `setCouponCode`, `appliedCoupon`, `discount`, `applyCoupon`, `removeCoupon`, `loading`, `error`).
   El hook encapsula el estado y la lógica; el componente solo lo consume.
3. **Usa el hook en `checkout/page.tsx`:** reemplaza el estado/funciones inline por `useCupon()`. El `discount`
   que devuelve sigue entrando a `calcCheckoutTotals` igual que antes. Comportamiento **idéntico** en pantalla.

## Reglas duras
- **Comportamiento IDÉNTICO** del cupón: misma validación, mismos mensajes, mismo descuento, mismas llamadas al
  backend. Es mover a un hook, no rediseñar.
- **NO toques** `procesarPago`, la máquina 3DS/OTP, ni `handleConfirmPayment`. Alcance: solo cupón.
- No degrades la config de producción (tsconfig de paquetes).

## Red (ligera, si es viable)
- El efecto del cupón en los totales ya está cubierto por `calcCheckoutTotals` (M2a). Si la validación del cupón
  es mockeable (llamada a backend), añade un **test unitario chico de `useCupon`**: cupón válido aplica descuento,
  inválido muestra error, quitar resetea. Si requiere montar demasiado (React Testing Library no instalado, etc.),
  NO lo fuerces: deja el hook sin test propio y anótalo — la red de totales ya cubre el impacto en dinero.

## Verifica de verdad
- `vitest run` verde (los tests existentes siguen pasando; el de totales no se rompe).
- `lint` + `typecheck` + `build` verdes — el checkout compila y se comporta igual.
- `git diff`: `checkout/page.tsx` (consume el hook) + `useCupon.ts` nuevo (+ su test si lo añadiste). Nada del
  flujo de pago tocado.

## Cuándo PARAR
Bloqueo real (`BLOQUEADO:`/`NECESITO:`).

## Cierre
Microcommits (`refactor: …`). PR a `main`. Última línea:
`LISTO: useCupon extraído del checkout, comportamiento idéntico, totales verdes; <test del hook si se añadió>`

---
status: ejecutado
pr: 40
prereqs:
  - M2a (#39) mergeado
---
