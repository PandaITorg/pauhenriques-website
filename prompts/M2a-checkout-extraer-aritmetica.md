# Prompt M2a — Extraer la aritmética del checkout a módulo puro + convertir el test-espejo en red real

> Primer corte del monolito `checkout/page.tsx` (1227 líneas, el #1 del audit). Net-first: extraemos la
> aritmética de totales (hoy inline en el componente) a una función pura exportada, y **repuntamos el test que
> hoy ESPEJA esa lógica para que importe la función REAL**. Así el espejo (que no protegía nada) se vuelve red
> de verdad, y arranca la descomposición. Cambio acotado y auto-verificable → **Sonnet**.

## Idioma
Español NEUTRAL en comentarios, nombres y commits. Sin argentinismos; usa "tú".

## Rama (hazlo tú, Code — Andrés no usa terminal)
1. `git fetch origin`. Sincroniza base: `git checkout develop && git pull` (si no existe, usa `main`).
2. `git checkout -b feat/pau-checkout-extraer-totales`. Microcommits. PR a la base. **NO mergees.**

## Contexto
`src/__tests__/checkout-totals.test.ts` hoy **espeja** la aritmética de `checkout/page.tsx:178-187` en una copia
local (`calcCheckoutTotals`) y prueba la copia — no el código real. Por eso ese test NO protege la página. Lo
arreglamos extrayendo la lógica real y apuntando el test a ella.

## Qué hacer (acotado a propósito)
1. **Extrae** la aritmética de totales de `checkout/page.tsx` (subtotal, descuento, `discountedSubtotal`, IVA al
   15%, total — las líneas ~178-187) a una **función pura exportada** en un módulo nuevo, ej.
   `src/lib/checkout-totals.ts` (`export function calcCheckoutTotals(items, couponDiscount)` con la MISMA firma y
   tipos que el espejo del test).
2. **Usa la función en `checkout/page.tsx`:** reemplaza el cálculo inline por una llamada a `calcCheckoutTotals`.
   El componente debe comportarse **exactamente igual** (mismos valores en pantalla, mismo payload de cobro).
3. **Repunta el test:** en `checkout-totals.test.ts`, borra la copia local `calcCheckoutTotals` y en su lugar
   **importa la función real** del módulo nuevo. Los mismos casos/valores deben pasar — eso prueba que la
   extracción no cambió el cálculo. Quita el comentario de "espejo".

## Reglas duras
- **Comportamiento IDÉNTICO** en el checkout. Solo mueves la aritmética a una función; no cambias la lógica, ni
  el IVA, ni el redondeo, ni nada del flujo de pago.
- Si al extraer aparece una diferencia (la inline hacía algo que el espejo no), **gana la inline** (es el
  comportamiento real); ajusta el test a los valores reales y anótalo.
- No toques el resto del componente todavía (hooks/subcomponentes = cortes siguientes). Alcance: solo la
  aritmética + su test.
- No degrades la config de producción (tsconfig de paquetes).

## Verifica de verdad
- **`vitest run` verde**, con `checkout-totals.test.ts` ahora **importando la función real** (no el espejo).
- `lint` + `typecheck` + `build` verdes (el componente sigue compilando y funcionando igual).
- `git diff`: `checkout/page.tsx` (sustitución del cálculo inline por la llamada), el módulo nuevo, y el test
  repuntado. Nada más.

## Cuándo PARAR
Bloqueo real (`BLOQUEADO:`/`NECESITO:`).

## Cierre
Microcommits (`refactor: …`, `test: …`). PR a la base. Última línea:
`LISTO: aritmética de checkout extraída a calcCheckoutTotals, test importa la función real (red real), comportamiento idéntico`

---
status: ejecutado
pr: 39
prereqs:
  - Ninguna (primer corte de checkout/page.tsx)
---
