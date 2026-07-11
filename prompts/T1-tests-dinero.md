# Prompt T1 — Red de seguridad: tests de DINERO (Pau · P1–P4)

> Tercera y última red del plan `PLAN-tests-dinero.md` (wellme y carico ya están). **Solo AÑADES tests.** Un test
> afirma el comportamiento, no lo cambia; si queda mal, falla — no rompe la app. Seguro sin supervisión. Guiado
> por el plan → **Sonnet**. Corre hasta terminar.

## Idioma
Español NEUTRAL en nombres de tests, descripciones y commits. Sin argentinismos; usa "tú".

## Rama (hazlo tú, Code — Andrés no usa terminal)
1. `git fetch origin`. Sincroniza base: `git checkout develop && git pull` (si no existe `develop`, usa `main`).
2. `git checkout -b feat/pau-tests-dinero`. Microcommits ahí. Al terminar, abre PR a la base. **NO mergees.**

## Reglas duras (lo que mantiene esto seguro)
- **Solo creas/editás archivos de TEST.** NO modifiques lógica de producción.
- **NO degrades la config de build de producción.** (Lección de wellme/carico:) si el runner choca con la
  resolución de `tsconfig`/módulos, arréglalo del lado del tooling — un `tsconfig.test.json` aparte que extienda
  al de producción, o un flag del transformer — **nunca repuntando el `extends` de los `tsconfig.json` de los
  paquetes de producción**. Si no logras montar el harness sin tocar producción, reporta `NECESITO:` y para.
- Si una pieza **no es testeable sin refactorizar**, **NO la refactorices**: anótala en el `LISTO:` y sáltala.
- Antes de escribir, **lee los tests que ya existen** (kit/expocatapass como modelo) y copia su convención.

## Qué testear (P1–P4 del plan)
Localiza los archivos reales; los nombres son guía:
- **P1 — Totales del checkout (lógica pura, Estilo A):** suma de ítems, cantidades, envío, descuentos, redondeo;
  bordes (carrito vacío, cero, cantidades grandes). Pago de invitado vs con balance si el cálculo difiere.
- **P2 — `getNuveiUserMessage` (puro, mapea `status_detail` → mensaje):** **cubre las 7 ramas** de status_detail
  más el default. (Nota para el reporte: esta tabla está triplicada con checkout y PagoLink — candidata a
  unificar en `@pandait.tech/payment-nuvei`; pero AQUÍ solo la testeas, no la refactorices.)
- **P3 — Route `contribute` (7 ramas, invitado + balance):** es la pieza más enredada (reimplementa inline la
  lógica del paquete). **Testéala TAL CUAL está** para **fijar su comportamiento actual** — eso es justo lo que
  hace seguro el refactor futuro. Casos: cada rama de resultado de pago, pago de invitado, pago con balance,
  monto/estado inválido. Si exige montar demasiado entorno, cubre lo que puedas y anota el resto en `LISTO:`.
- **P4 — `handleConfirmPayment`:** confirmación exitosa, fallida, estado inesperado, idempotencia si aplica.

## Verifica de verdad antes de cerrar
- Instala deps si hace falta. **Corre los tests y que PASEN** (pega el conteo, N passed).
- `git diff --stat <base>...HEAD` → **solo archivos de test + config de test**; ningún `tsconfig.json` de paquete
  de producción modificado (confírmalo explícitamente).
- `lint`/`typecheck`: no agregues errores nuevos (reporta si había preexistentes).

## Cuándo PARAR
Solo por bloqueo real (`BLOQUEADO:`/`NECESITO:`). Nunca por pedir permiso de un comando ni por cosmética.

## Cierre
Microcommits (`test: …`). PR a la base con resumen de cobertura. Última línea:
`LISTO: <N> tests añadidos (P1–P4), todos en verde; <piezas saltadas/parciales si las hubo>`

---
status: ejecutado
pr: 38
prereqs:
  - PLAN-tests-dinero.md (hecho) define P1–P4
---
