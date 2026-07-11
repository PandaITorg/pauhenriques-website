---
status: ejecutado
prereqs: []
pr: 46
---
> **ROL — LEE ESTO PRIMERO.** Eres el **Coder** y este mensaje **ES el despacho**: **EJECUTA AHORA**
> (implementa, microcommits, abre el PR, cierra con `LISTO:`).

# Pau Henriques · Orden fijo de los productos en la tienda

> **Pedido (Andrés, 2026-07-10):** los productos Well Me deben salir en un orden concreto en la tienda:
> **primero los mats** (mini, pillow, large, pro) y **luego los paneles** (mini, large). Hoy la tienda los
> muestra en el orden en que llegan de Firestore (sin orden explícito).

## Idioma
Español NEUTRAL. Sin argentinismos; usa "tú".

## Paso 0 — Guardia
`git fetch origin && git checkout main && git pull`. Rama `feat/pau-orden-productos` desde main.
Microcommits. PR a `main`. **NO mergees.**

## Contexto real del repo (ya verificado)
- La tienda trae `productService.getAllProducts()` y renderiza `filteredProducts` **sin ordenar**
  (`src/app/tienda/page_client.tsx`). El producto **no** tiene campo de posición.
- Ya existe el patrón: la colección `featured_products` usa un campo `order` con `.orderBy("order")`
  (`src/app/api/admin/featured-products/route.ts`) — **reúsalo**, no inventes otro.

## Qué construir
1. **Campo `sortOrder: number`** en el producto (default 0). Editable en el admin
   (`src/app/admin/productos/[id]/editar/page.tsx`) — un input numérico simple; menor = primero.
   `// ponytail: un número editable reusa el patrón de featured_products; un drag-and-drop es de más.`
2. **Ordena la tienda** por `sortOrder` ascendente (desempate: nombre) en `page_client.tsx` antes de renderizar
   (o en `productService.getAllProducts()` si es más limpio). Aplica a Well Me y catálogo por igual.
3. **Semilla del orden pedido** (para que Andrés no tenga que teclear todo): en el PR, deja los `sortOrder` de los
   productos Well Me existentes puestos según: mats mini(10) · mats pillow(20) · mats large(30) · mats pro(40) ·
   panel mini(50) · panel large(60). Si no puedes identificar los productos por slug/nombre con certeza, **no
   adivines**: deja el campo y el sort funcionando, y anota en el PR que Andrés setea los números desde el admin.

## Reglas duras
- Additive. Un producto sin `sortOrder` (los viejos) cae a 0 y no rompe nada.
- `npm run build` (o `tsc --noEmit`) + lint verdes.
- **Test:** dado un set de productos con `sortOrder` mezclado, la lista sale ordenada asc y desempata por nombre.

## Verifica de verdad (Code) + smoke de Andrés
- Smoke: en la tienda, los mats salen antes que los paneles en el orden pedido; cambiar un `sortOrder` en el
  admin reordena la grilla.

## Cierre
Microcommits (`feat(tienda):`). PR a `main`.
Última línea:
`LISTO: orden fijo en la tienda — campo sortOrder editable en el admin (reusa el patrón order de featured_products), tienda ordena asc con desempate por nombre, semilla mats→paneles; additive (viejos caen a 0); test + build verde; FALTA smoke de Andrés`
