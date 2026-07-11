# Prompt M2c — Extraer `useCheckoutPayment` (la máquina 3DS) net-first

> Tercer corte de `checkout/page.tsx`, el más delicado: la lógica de pago (`procesarPago`, máquina 3DS
> challenge/OTP). Estrategia (lección de charge.ts): **primero separar la DECISIÓN pura de la respuesta de Nuvei
> en una función testeable, cubrirla con tests**, y solo después envolver el cableado React en el hook. Así el
> routing de dinero queda con red sin necesitar React Testing Library. Razonamiento de refactor sobre dinero en
> producción → **Opus**. Incremental: una extracción por commit, build/tests verdes tras cada una.

## Idioma
Español NEUTRAL en comentarios, nombres y commits. Sin argentinismos; usa "tú".

## Rama (hazlo tú, Code — Andrés no usa terminal)
1. `git fetch origin`. `git checkout main && git pull` (incluye M2a/#39 y M2b/#40). No existe `develop`.
2. `git checkout -b feat/pau-checkout-hook-pago`. Microcommits. PR a `main`. **NO mergees.**

## Paso 0 — Mapea antes de tocar
Lee `procesarPago` y todo el manejo de la respuesta de charge en `checkout/page.tsx`: qué ramas hay
(success / review / requiere challenge 3DS / requiere OTP / error + 409 stock), qué hace cada una (mostrar
iframe, pedir OTP, confirmar, mostrar error), y qué estado de React maneja (challenge data, OTP, loading, error).
Lista las ramas — es el contrato a preservar.

## Paso 1 — Extraer la DECISIÓN pura (con su red de tests)
Extrae a una función **pura** (ej. `src/lib/checkout/resolve-charge-outcome.ts`) la lógica que, **dada la
respuesta de charge**, decide el siguiente paso SIN tocar React/DOM:
`resolveChargeOutcome(response) → { kind: "success" | "review" | "challenge" | "otp" | "error", message?, ... }`
(usa los mismos campos de Nuvei que hoy decide el inline). **Cubre con tests unitarios (node) todas las ramas** —
este es el net real del routing de dinero. Mismos inputs → mismos `kind`/mensajes que el comportamiento actual.

## Paso 2 — Envolver el cableado en `useCheckoutPayment`
Extrae el resto (estado 3DS/OTP, las llamadas a crear orden + charge + confirm, los efectos de UI) a un hook
`useCheckoutPayment` que **use `resolveChargeOutcome`** para decidir y solo haga el cableado React (setState,
mostrar iframe/OTP). El componente consume el hook. **Comportamiento idéntico**: mismas llamadas, mismo orden,
misma UI.

## Reglas duras
- **Comportamiento IDÉNTICO** del pago: ni una rama, mensaje, llamada o estado cambia. Es reorganizar, no rediseñar.
- **Incremental:** Paso 1 (función pura + tests) → verde → commit. Paso 2 (hook) → verde → commit.
- Si al mapear aparece una diferencia entre lo que creías y el inline real, **gana el inline** (es producción).
- No toques `useCupon`/`calcCheckoutTotals` (ya hechos). No degrades la config de producción.

## Verifica de verdad
- `vitest run` verde, **incluidos los tests nuevos de `resolveChargeOutcome` (todas las ramas)**. Conteo.
- `lint` + `typecheck` + `build` verdes — el checkout compila y se comporta igual.
- `git diff`: `page.tsx` (consume el hook), `resolve-charge-outcome.ts` + su test, `useCheckoutPayment.ts`. Nada
  fuera del flujo de pago del checkout.

## Nota de QA real (anótala en el PR)
Como es la máquina de pago, antes de confiar esto en producción hace falta un **smoke en sandbox**: un cobro
aprobado + un caso 3DS challenge + un OTP. No lo puedes correr tú headless; déjalo recomendado en el PR.

## Cuándo PARAR
Bloqueo real (`BLOQUEADO:`/`NECESITO:`) o un test que exija cambiar lógica para pasar (señal de cambio de
comportamiento → para y reporta).

## Cierre
Microcommits (`refactor: …`, `test: …`). PR a `main`. Última línea:
`LISTO: resolveChargeOutcome extraído y testeado (N ramas), useCheckoutPayment envuelve el cableado, comportamiento idéntico, build verde`

---
status: ejecutado
pr: 41
prereqs:
  - M2b (#40) mergeado
---
