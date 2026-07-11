---
status: ejecutado
prereqs: []
pr: 43
---
> **ROL — LEE ESTO PRIMERO.** Eres el **Coder** y este mensaje **ES el despacho**: **EJECUTA AHORA**
> (implementa, microcommits, abre el PR, cierra con `LISTO:`). Tu entrega es código + PR.

# Pau Henriques · Descuentos por PORCENTAJE en el admin

> **Problema (Andrés, 2026-07-10):** hoy el admin solo deja fijar el **precio final absoluto** de un
> descuento (`autoDiscounts[].finalPrice`). Andrés necesita ingresar el **porcentaje** (ej. "35% OFF
> hasta agotar stock", "15% OFF") y que el sistema calcule el precio. Es el habilitador para aplicar
> los descuentos de la línea Well Me que hoy se venden en el sitio de Pau.

## Idioma
Español NEUTRAL. Sin argentinismos; usa "tú".

## Paso 0 — Guardia
`git fetch origin && git checkout main && git pull`. Rama `feat/pau-descuentos-porcentaje` desde main.
Microcommits. PR a `main`. **NO mergees.**

## Contexto real del repo (ya verificado)
- Modelo: `product.autoDiscounts: Array<{ finalPrice, label, validUntil }>` — `finalPrice` es CON IVA.
- `src/lib/pricing.ts` → `getPriceDisplay()` calcula `percentOff` **derivado** de `finalPrice` vs `product.price`.
- Editor UI: `src/components/admin/AutoDiscountsEditor.tsx` + `DiscountTiersEditor.tsx` — el input hoy es
  `finalPrice`; ya **muestra** el `percentOff` calculado (badge "-NN% OFF").
- API: `PUT /api/admin/products/[id]/discounts` valida `finalPrice > 0`.

## Qué construir (additive, sin romper lo existente)
La idea lazy y correcta: **dejar que el admin escriba el %**, y que eso **derive y guarde `finalPrice`**
como hoy (así `pricing.ts`, Nuvei, el carrito y todo lo downstream siguen intactos — cero migración).

1. **Editor (`DiscountTiersEditor.tsx`)**: cada tier ofrece un **toggle "por %" / "por precio final"**.
   - Modo "por %": input de porcentaje (0–100). Calcula en vivo `finalPrice = round2(basePriceConIVA * (1 - pct/100))`
     y muestra el precio resultante. Es el modo por defecto para tiers nuevos.
   - Modo "por precio final": el input actual (retrocompatible con los tiers ya guardados).
2. **Persistencia**: guarda `finalPrice` (fuente de verdad, no cambia el contrato del API/pricing) **y** además
   el `percentOff` entero en el tier, para que el editor haga round-trip exacto y el badge muestre el % pedido
   (no uno re-derivado con centavos). Extiende `IncomingDiscount` y el `PUT` para aceptar `percentOff?` opcional
   (valida 1–99 si viene; ignóralo si no). `pricing.ts`: si el tier trae `percentOff`, úsalo para el badge;
   si no, deriva como hoy. **No cambies** el cálculo de dinero: sigue mandando en `finalPrice`.
   `// ponytail: finalPrice es la fuente de verdad; percentOff es para el badge y el round-trip del editor.`
   `// ponytail: si el precio base cambia con un descuento activo, hay que re-guardar el tier (raro; no auto-recalculo).`

## Reglas duras
- Additive. Los descuentos ya guardados (solo `finalPrice`) siguen funcionando idénticos.
- `npm run build` (o `tsc --noEmit`) + lint verdes. `node scripts/ci-check.mjs` si existe.
- **Tests:** helper de conversión %↔finalPrice — (a) 35% sobre base 100 con IVA → finalPrice correcto;
  (b) round-trip guarda y relee el mismo %; (c) un tier legacy sin `percentOff` sigue mostrando el % derivado.

## Verifica de verdad (Code) + smoke de Andrés
- Smoke: en el admin, editar un producto Well Me → agregar descuento "por %", poner 35, guardar → la tienda y el
  carrito muestran el precio con 35% OFF y el badge dice "-35%".

## Cierre
Microcommits (`feat(admin):`). PR a `main`.
Última línea:
`LISTO: descuentos por porcentaje en el admin — toggle %/precio en DiscountTiersEditor, deriva y guarda finalPrice (fuente de verdad intacta) + percentOff para badge/round-trip, PUT acepta percentOff opcional, pricing.ts usa el % guardado si existe; additive, retrocompatible; tests + build verde; FALTA smoke de Andrés`
