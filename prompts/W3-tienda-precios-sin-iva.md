---
status: ejecutado
prereqs: []
pr: 45
---
> **ROL — LEE ESTO PRIMERO.** Eres el **Coder** y este mensaje **ES el despacho**: **EJECUTA AHORA**
> (implementa, microcommits, abre el PR, cierra con `LISTO:`).

# Pau Henriques · La tienda muestra precios SIN IVA; el IVA se ve en el carrito

> **Pedido (Andrés, 2026-07-10):** en la **tienda** (catálogo, tarjetas de producto, quick view, detalle) los
> precios deben mostrarse **SIN IVA**. El **IVA (15%) se ve en el carrito/checkout**, donde ya hay desglose
> Subtotal + IVA + Total. Hoy la tienda muestra los precios **CON IVA**.

## Idioma
Español NEUTRAL. Sin argentinismos; usa "tú".

## Paso 0 — Guardia
`git fetch origin && git checkout main && git pull`. Rama `feat/pau-tienda-sin-iva` desde main.
Microcommits. PR a `main`. **NO mergees.**

## Contexto real del repo (ya verificado)
- `src/lib/pricing.ts` → `getPriceDisplay()` ya devuelve **ambas** cifras:
  `baseSubtotal`/`finalSubtotal` (SIN IVA) y `basePrice`/`finalPrice` (CON IVA), más `finalVat`, `percentOff`.
- `src/components/pricing/PriceDisplay.tsx` hoy muestra `finalPrice`/`basePrice` (CON IVA) — comentario propio:
  "Siempre muestra precios CON IVA".
- La tienda usa `PriceDisplay`: `ProductCard.tsx`, `CompraCard.tsx`, `QuickViewDrawer.tsx`, `WellMeDetail.tsx`.
- El **carrito ya está bien**: `CheckoutResumen.tsx` muestra `Subtotal` + `IVA (15%)` + Total. **No lo toques.**
- El link de pago directo (`src/app/pago/t/[token]/PagoLinkClient.tsx`) muestra el monto a cobrar CON IVA —
  **eso debe quedar igual** (es el cargo real).

## Qué construir
1. `PriceDisplay.tsx`: agrega una prop **`withVat?: boolean` (default `true`)** para no cambiar a nadie por
   defecto. Cuando `withVat={false}`, muestra `finalSubtotal`/`baseSubtotal` (SIN IVA) y una nota pequeña
   **"Precios sin IVA"** (o "+ IVA en el carrito"). El badge de % OFF se mantiene.
2. En los **componentes de tienda** (`ProductCard`, `CompraCard`, `QuickViewDrawer`, `WellMeDetail`) pasa
   `withVat={false}`. **No** cambies el link de pago ni el checkout.
   `// ponytail: withVat default true no toca a nadie; solo la tienda opta por sin-IVA.`

## Reglas duras
- Cero cambio en el dinero que se cobra: sigue siendo el `finalPrice`/subtotal que ya calcula pricing.ts y que
  el carrito desglosa. Esto es **solo display** en la tienda.
- `npm run build` (o `tsc --noEmit`) + lint verdes.
- **Test:** `PriceDisplay` con `withVat={false}` renderiza `finalSubtotal` (sin IVA) y la nota; con default
  renderiza `finalPrice` (con IVA) como hoy.

## Verifica de verdad (Code) + smoke de Andrés
- Smoke: abrir la tienda → los precios se ven **sin IVA** con la nota; agregar al carrito → el carrito muestra
  Subtotal + IVA (15%) + Total como hoy. El total a pagar no cambió.

## Cierre
Microcommits (`feat(tienda):`). PR a `main`.
Última línea:
`LISTO: tienda muestra precios sin IVA — PriceDisplay gana prop withVat (default true, sin regresión) y la tienda usa withVat=false con nota "sin IVA"; carrito y link de pago intactos (ya desglosan/cobran con IVA); solo display, dinero sin cambios; test + build verde; FALTA smoke de Andrés`
