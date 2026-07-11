# Prompt M2d — Partir el render del checkout en subcomponentes (corte final, UI)

> Último corte de `checkout/page.tsx` (aún 1082 líneas: la lógica ya salió, pero el render JSX sigue enorme).
> Partimos el render en subcomponentes para dejar `page.tsx` bajo ~400 líneas. Es decomposición de UI, **sin
> tocar dinero ni lógica** (ya en hooks/funciones puras). Comportamiento visual idéntico → **Sonnet**.

## Idioma
Español NEUTRAL en comentarios, nombres y commits. Sin argentinismos; usa "tú".

## Paso 0 — Guardia anti-stacking (OBLIGATORIO antes de ramificar)
1. `git fetch origin && git checkout main && git pull`.
2. **VERIFICA que main ya tiene el trabajo anterior:** confirma que existen en main
   `src/hooks/useCheckoutPayment.ts`, `src/hooks/useCupon.ts` y `src/lib/checkout-totals.ts`
   (`git ls-tree -r --name-only origin/main | grep -E "useCheckoutPayment|useCupon|checkout-totals"`).
   - Si **faltan**, PARA y reporta: `BLOQUEADO: main no tiene M2a–M2c — no ramifico para no stackear`. No sigas.
3. Solo si están: `git checkout -b feat/pau-checkout-subcomponentes` **desde main**. Microcommits. **PR con base
   `main`** (verifícalo). NO mergees.

## Qué hacer
Partir el JSX de `checkout/page.tsx` en subcomponentes por sección (ajusta a lo que el render realmente tenga):
- `CheckoutForm` — el formulario de datos del cliente/envío (RHF + validación).
- `CheckoutResumen` — el resumen de orden (ítems, subtotal, descuento, IVA, total) — consume los valores que ya
  calcula `calcCheckoutTotals`.
- `ChallengeIframe` — el iframe del desafío 3DS.
- `OtpPanel` — el panel de OTP.
Cada uno en `src/components/checkout/`. `page.tsx` queda como orquestador: usa los hooks (`useCupon`,
`useCheckoutPayment`) y compone los subcomponentes pasándoles props. Objetivo: `page.tsx` < ~400 líneas.

## Reglas duras
- **Comportamiento e interfaz visual IDÉNTICOS:** mismos campos, textos, estados, validaciones y estilos. Es
  mover JSX a componentes y pasar props, no rediseñar.
- **NO toques** la lógica de pago/cupón/totales (ya está en hooks/funciones). No cambies `resolveChargeOutcome`.
- Incremental: extrae un subcomponente → `build` verde → commit. Repite.
- No degrades la config de producción.

## Verifica de verdad
- `vitest run` verde (los 68 tests siguen pasando; no tocaste lógica).
- `lint` + `typecheck` + `next build` verdes — `/checkout` prerenderiza igual.
- `page.tsx` quedó < ~400 líneas (reporta antes/después). Ningún subcomponente monolítico (>400) tampoco.
- `git diff`: `page.tsx` + los subcomponentes nuevos. Nada de lógica de dinero tocado.

## Nota de QA (anótala en el PR)
Smoke visual del checkout (cargar `/checkout`, ver form + resumen, simular cupón) antes de prod. Y el smoke de
pago en sandbox (cobro + 3DS + OTP) sigue pendiente del flujo de M2c.

## Cuándo PARAR
Bloqueo real (`BLOQUEADO:`/`NECESITO:`) — incluido el guardia del Paso 0.

## Cierre
Microcommits (`refactor: …`). PR a `main`. Última línea:
`LISTO: render del checkout partido en N subcomponentes, page.tsx <400 líneas, 68 tests verdes, UI idéntica`

---
status: ejecutado
pr: 42
prereqs:
  - main tiene M2a–M2c (#41 mergeado) — el Paso 0 lo verifica
---
