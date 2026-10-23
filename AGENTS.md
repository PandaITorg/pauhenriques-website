<!-- BEGIN:panda-os -->
# 🐼 Panda OS — Protocolo de trabajo · id: pau
> Generado desde `Panda-OS/PROJECT-PROTOCOL.md`. NO editar a mano dentro de los marcadores: se regenera.

## A. Identidad Panda OS

- Este repo es un **proyecto Panda OS**. Su `id` se estampa al inicio del bloque (ej. `id: carico`).
- Tu **estado, roadmap y bitácora viven FUERA del repo**, en `bitacoras/<id>.md` dentro de Panda OS,
  y los maneja **el cierre de jornada** (CLAUDE §5). La ruta absoluta no va aquí a propósito: cada
  máquina resuelve sus carpetas por área desde el 21-sep, y una ruta fija en un documento que se
  estampa en diecisiete repos es una ruta que caduca en dieciséis. Da igual: **no la tocas**.
- **Regla de carril (innegociable):** NO edites la bitácora ni `Roadmaps/`. No son tuyos.
  Tu único canal de "reporte" es el **commit**. *Aquí se construye; el cierre es de otro turno.*

## B. Quién escribe el plan y quién lo ejecuta

Es la misma IA en los dos lados, y por eso importa que el reparto esté escrito: sin él, el turno
que construye empieza a rediseñar sobre la marcha y nadie se entera hasta el PR.

- **El turno que planea** escribe `docs/` (`ARCHITECTURE.md`, `SCHEMA.md`, `ROADMAP.md`) y redacta
  los briefs numerados en `prompts/NN-*.md`, con `refs:` y `acceptance:`.
- **El turno que construye** lee `docs/` **primero**, ejecuta el brief indicado, y no inventa
  arquitectura.
- Si al construir se ve que el plan está mal o incompleto, **se dice** (no se cambia en silencio).

## B-bis. La Orden de Desarrollo — EN PAUSA desde el 2026-09-25

> ### ⛔ NO PIDAS UNA ORDEN. NO TE DETENGAS POR ELLA.
>
> **Andrés dejó de usar Órdenes de Desarrollo el 2026-09-25** y decidió trabajar directo desde
> Claude Code. Si te describe lo que quiere, **constrúyelo**: no hay Orden que redactar, ni
> `puedeTrabajar` que consultar, ni firma que esperar.
>
> Esta sección se queda —en vez de borrarse— porque el mecanismo existe y puede volver. Lo que
> sigue describe cómo funcionaba, **no lo que hay que hacer hoy**.

**Por qué este aviso ocupa tanto espacio.** Lo encontró la sesión de Tálou el 2026-09-29, cuatro
días después de la revocación, leyendo el `AGENTS.md` recién estampado en su repo. Su diagnóstico
vale más que la corrección:

> *"Ese texto no solo está obsoleto: le da a la próxima sesión una razón citada para detenerse.
> Alguien abre el repo, lee «nada se construye sin una Orden», ve a Andrés citado con fecha, y se
> para a pedirle una Orden que él decidió no volver a usar. Es el peor tipo de instrucción vieja:
> la que suena autorizada."*

Una regla vieja que se lee como invento se descarta sola. Una que viene **citada, fechada y firmada
por quien manda** se obedece — y frena trabajo que nadie quería frenar, en catorce repos a la vez.

### Cómo funcionaba (por si vuelve)

La cita que la sostenía, **superada**: Andrés, 2026-09-23: *"NADA se despacha sin una orden de
desarrollo. La orden de desarrollo es la que manda. No hago micro cambios sino un proceso con
objetivo, y la agencia se encarga de cumplirlo."*

El mecanismo: `GET http://localhost:4317/api/orden?id=<id>` (cabecera `x-panda-token`) respondía
`puedeTrabajar` y, si era `false`, `porQueNo` — distinguiendo "no hay Orden" de "hay una y falta que
Andrés la firme". El primer entregable ante un encargo nuevo era la Orden, no el código.

**Por qué existía.** La etapa dice que el proyecto PUEDE trabajar; la Orden decía QUÉ trabajo es.
Sin ella, "se pasó del alcance" no se puede afirmar ni negar, porque no hay alcance contra el que
medirlo. El 21-sep eso costó $87.51 en 80 minutos, y el 78% fue trabajo que nadie pidió.

Ese problema **no desapareció con la pausa**: lo que cambió es quién pone el alcance. Andrés
trabajando directo desde Claude Code lo pone él, en la conversación, y lo corrige al momento — que
es más rápido y más fino que un documento firmado, mientras él esté delante. La Orden era el
sustituto para cuando no lo estaba.

**Qué la compone.** Un `objetivo` (para qué se hace, en una frase: lo que se tiene que poder
responder al terminar, se cumplió o no), las `secciones` (las piezas, cada una será un hito), el
`plazoDias` y —el campo que más ahorra— `fuera`: lo que explícitamente NO entra. Los briefs de
`prompts/NN-*.md` son pedazos de una Orden, nunca su reemplazo.

**Cuándo la escribes tú.** Cuando Andrés te describa lo que quiere de este proyecto. Él cuenta el
objetivo; la Orden la redactas tú, que para eso leíste el código. No le pidas que la escriba.

**Cómo se escribe.** Nunca a mano en `ordenes/`: se pide al server, que valida y versiona.

```
POST http://localhost:4317/api/orden/generar
cabecera:  x-panda-token: <contenido de Panda-OS/.panda-token>
cuerpo:    { "id": "<id del proyecto>", "datos": {
             "cliente": "Panda IT", "total": 0,
             "objetivo": "...", "plazoDias": 5,
             "secciones": [{ "nombre": "...", "incluye": "...", "precio": 0 }],
             "fuera": ["..."] } }
```

Dentro de Panda OS, el turno del proyecto tiene la tool `redactar_orden`, que hace esta misma llamada.

**Queda SIN APROBAR, y eso es literal.** La orden nueva abre una tarjeta en la pantalla *Me toca a
mí* de Andrés. Hasta que él la firme con su PIN, la agencia no despacha nada de ese proyecto. Tu
trabajo al redactarla termina en decírselo: *"la Orden vN está escrita y te espera en Me toca a
mí"*. No le pidas que corra nada.

**Lo que NO haces nunca:** escribir o editar el campo `aprobada` de un `ordenes/orden-vN.json`, ni
llamar a `/api/batones/<id>/accion` para aprobarla. Esa firma pide el PIN humano, que es la única
credencial que un turno headless no puede conseguir — justamente para que la autorización no pueda salir de
quien quiere gastar. Un archivo editado a mano no es una firma: es el agujero que el PIN cierra.
Si te falta la Orden para avanzar, redáctala y espera; no la apruebes.

## C. Git, ramas y Pull Requests

**Dos ramas permanentes** (nombres por defecto de GitHub):

- `main` = **producción**. Siempre desplegable y desplegado. Nadie commitea directo (salvo hotfix trivial).
- `develop` = **staging / integración**. Rama de trabajo por defecto; aquí aterrizan los hitos antes de prod.

**Ramas de hito:** cortas, salen de `develop`, se llaman `feat/<id>-<slug>` o `fix/<id>-<slug>`.

**Flujo de un hito:**

1. Sal de `develop` a una rama de hito.
2. **Microcommits atómicos** mientras trabajas: una idea por commit, mensaje en imperativo
   `tipo: descripción` (tipo ∈ `feat` `fix` `refactor` `docs` `test` `chore`). El cierre lee el `git log`.
3. **1 PR = 1 hito** (o una parte bien acotada si el hito es grande). Título: `[<id>] <hito>`.
   Cuerpo: qué hace + link al `prompts/NN` o `docs/`. **El PR apunta a `develop`.**
4. **CI verde → squash-merge a `develop`.** Los microcommits viven en la rama; `develop` queda con
   un commit limpio por hito. Deploy a **staging** + smoke-test.
5. Cuando un bloque está listo para producción: **PR `develop → main`**, merge, deploy a **prod**.
   Ese release es **su propio hito** en la bitácora.

**Despliegue (NORTE §2, decisiones D5 y D6 del 2026-09-03).** A **staging**, libre. A **producción**, la
agencia despliega sola **solo** donde el proyecto declara `retrocedeSolo: true` — lo que exige health-gate y
rollback automático en su receta de deploy. En el resto, el batón para en `desplegando` y el PR espera el clic
de Andrés. No es desconfianza en la agencia: es que **sin retroceso no es automático, es temerario**.

**Excepción:** un hotfix trivial de producción puede ir directo a `main`, y luego se back-mergea a `develop`.

**Mapeo a entornos** (los detalles, por proyecto): `develop` → proyecto/canal de **staging**;
`main` → proyecto de **producción**. En Firebase suele ser un proyecto por entorno o canales de preview.

## D. Definición de "Terminado" (DoD) — lo que autoriza marcar `[x]`

Un hito normal pasa a `[x]` SOLO cuando:

1. Mergeado a **`develop`** (squash) y CI en verde.
2. `lint` + `typecheck` + `build` verdes.
3. Tests automatizados verdes (si el hito toca lógica testeable — ver §E).
4. **Smoke-test en staging** hecho y OK.

Mientras falte cualquiera, el hito es `[>]`, no `[x]`. El paso a producción (`develop → main`) es **su propio hito**.
Esto alimenta la regla de oro del cierre: *solo se marca terminado lo realmente terminado.*

## E. Testing (estándar, escrito para no-experto)

No necesitas saber de testing para seguir esto. Cuatro niveles, de barato a caro; subes de nivel solo
cuando el riesgo lo pide.

**Nivel 1 — Estático (gratis, SIEMPRE).** Antes de abrir cualquier PR: `lint`, `typecheck` y `build` sin errores.
Esto solo ya caza la mayoría de bugs sin escribir un test. Innegociable.

**Nivel 2 — Smoke-test manual (SIEMPRE).** Tras el deploy a staging, recorre el camino feliz a mano
(ej. registrarse, pagar, recibir el correo). Si el flujo principal funciona, el hito respira.

**Nivel 3 — Tests automatizados donde DUELE si se rompe.** Solo para lo que, si falla, cuesta plata,
datos o confianza:
- **Lógica pura / cálculos:** comisiones, precios, IVA, scoring, validadores Zod. Baratos y altísimo valor.
- **Handlers críticos de Firebase Functions:** los que mueven dinero, auth o datos. Se prueban con el
  **Firebase Emulator Suite** (input → salida esperada), sin tocar producción.
- Herramienta sugerida: **Vitest** (o Jest) para unit; emuladores para handlers.

**Nivel 4 — End-to-end (OPCIONAL, solo flujos vitales).** Un par de caminos que no pueden romperse nunca
(ej. checkout completo) con **Playwright**. Solo si el proyecto lo amerita.

**Lo que NO hacemos:** perseguir cobertura por dogma, testear UI pixel por pixel, ni tests de cosas triviales.
**Regla de oro:** *si un bug ahí te despertaría de noche, tiene test; si es cosmético, no.*

**Cuándo corren:** Nivel 1 + Nivel 3 en cada PR (idealmente en CI con GitHub Actions; mientras no haya CI,
Code los corre localmente antes de abrir el PR). Nivel 2 tras cada deploy a staging.

## F. Secrets y variables de entorno

**Conciencia primero (regla dura):** Code **NUNCA** commitea un secreto. Ante la duda de si algo es sensible,
se trata como secreto y se pregunta. Antes de cada commit, Code revisa el diff en busca de llaves, tokens o
credenciales coladas. Si un secreto llegó a git: **rotarlo** (no basta borrarlo del historial).

**El principio que lo ordena todo:** *un archivo que se commitea jamás contiene el valor de un secreto* —
solo una referencia o un placeholder. El valor real vive en el secret manager (prod) o en archivos
gitignored (local).

**Qué mecanismo usar (guía de decisión):**

| Tipo de variable | ¿Secreta? | Dónde va |
|---|---|---|
| Config pública del cliente (`NEXT_PUBLIC_*`, URLs, Firebase web config) | No (va al navegador) | Texto plano en `.env` local y en `apphosting.yaml` (`env: value:`). Documentar en `.env.example`. |
| Secreto usado por una **Cloud Function** (API keys: Anthropic, Resend, Meta) | Sí | **Firebase Secret Manager** (`defineSecret` / `firebase functions:secrets:set`). Local: `.secret.local` (gitignored). |
| Secreto usado por el **backend de App Hosting** (Next.js server) | Sí | Secret Manager, referenciado en `apphosting.yaml` con `secret: NOMBRE` (NUNCA `value:` con el secreto en claro). |
| **Service account / archivo de credenciales** (`serviceAccountKey.json`) | Sí | Nunca al repo. ADC (Application Default Credentials) o Secret Manager. Siempre en `.gitignore`. |
| Variable de entorno no sensible (puertos, flags, región) | No | `.env` / `apphosting.yaml` en claro. |

**Reglas de apoyo:**
- `.gitignore` base obligatorio en todo repo: `.env*` (excepto `.env.example`), `.secret.local`,
  `serviceAccountKey.json`, `*-key.json`, `node_modules`, salidas de build.
- `apphosting.yaml` **se commitea** → solo `value:` para lo público; secretos siempre por `secret:`.
- Documentar toda variable requerida en `.env.example` (claves sin valores) o en `docs/`.

**Convención de nombre + ubicación por tipo (R-credenciales).** Un proyecto nuevo **nace** con esta
convención; no hace falta re-auditar a mano. El nombre y la ruta son fijos para que Panda OS detecte la
**presencia** (solo metadata, nunca contenido) y avise antes de despachar:

| Tipo | Nombre + ubicación (fija) | Consumo |
|---|---|---|
| **Service account de Google/Firebase** | `serviceAccountKey.json` en la **raíz del repo**, gitignored | `GOOGLE_APPLICATION_CREDENTIALS` → `admin.initializeApp()` por ADC |
| **Env de producción** | `.env.production.local` (raíz), gitignored | el provisionador / runtime |
| **Acceso SSH al VPS** | `.env.vps-access.local` (raíz), gitignored | deploy remoto |
| **Secretos a disco para el deploy** | carpeta `deploy-secrets/` (raíz), gitignored, vía SEC1 | materializados efímeros para deploy |

- **Descriptor por proyecto:** `Panda-OS/credentials.json` (hermano de `projects.json`, NO dentro de él —
  el generador de roadmaps regenera `projects.json` y pisaría campos a mano). Mapa `{ <id>: [ {kind, file,
  envVar, required} ] }`. El server expone `GET /api/credentials?id=` → `{kind, file, present}` (solo presencia)
  y `GET /api/credentials-audit` barre todos los proyectos por los nombres conocidos. El contenido **JAMÁS** sale.
- El floor ya **DENIEGA** a Code leer `serviceAccountKey.json`, `*-key.json`, `.env*` y `deploy-secrets/`.

## G. Stack y dependencias

- **Monorepo ⇒ pnpm + Turborepo, siempre.** Es lo que mejor funciona aquí. Workspaces con pnpm
  (`pnpm-workspace.yaml`), orquestación con `turbo.json`, estructura `apps/` + `packages/`.
  Proyecto simple (no monorepo): gestor de paquetes a criterio del proyecto.
- **Verifica versiones reales antes de codear.** No asumas APIs por memoria: varios proyectos usan
  versiones de punta (Next 16, Prisma 6, Tailwind v4) con breaking changes. Lee el `package.json` y, si hace
  falta, la doc instalada en `node_modules/.../docs/` antes de escribir. Respeta deprecaciones.
- **Versiones fijadas:** nada de rangos flotantes que rompan el build mañana. Si subes una dependencia mayor,
  es su propio hito (puede traer breaking changes).

## H. Datos sensibles y operaciones destructivas

- **Backup antes de tocar datos en serio.** Migraciones de esquema, borrados masivos o limpiezas en Firestore
  → respaldo previo (ej. export a un bucket) y nota del backup en el commit/PR.
- **Nunca operar producción sin respaldo.** Si no hay forma de revertir, no se ejecuta sin visto bueno explícito.

## I. Estructura estándar del repo

```
docs/        → diseño (lo escribe el turno que planea): ARCHITECTURE, SCHEMA, ROADMAP
prompts/     → instrucciones numeradas para Code (NN-nombre.md)
CLAUDE.md    → import a @AGENTS.md
AGENTS.md    → reglas de agente; aquí se inyecta el bloque Panda OS (entre marcadores BEGIN/END)
```

El **stack puntual, los comandos y la arquitectura** son propios de cada proyecto y viven FUERA del bloque
`panda-os` (en el resto del `AGENTS.md`/`CLAUDE.md` o en `docs/`). El protocolo no los toca.

## J. Código limpio — mínimo necesario, sin monolitos (estándar global)

Cultura de código profesional en **todos** los repos: escribe **solo lo que la tarea necesita**, reusa antes de
construir, y mantén los archivos modulares.

- **Mínimo necesario (ponytail).** Antes de escribir código, sube la escalera: ¿hace falta? → ¿lo hace la stdlib?
  → ¿hay feature nativo? → ¿una dependencia ya instalada? → ¿una línea? → recién entonces, lo mínimo que funciona.
  **Nunca** se recorta validación, manejo de errores, seguridad ni accesibilidad. Marca cada simplificación
  deliberada con `// ponytail: <qué se omitió> — agregar cuando <condición>`, para que no se lea como olvido.
  La norma completa es **ley del taller** (`CLAUDE.md §17`) y no depende de que el plugin esté instalado:
  está escrita aquí y se estampa en el `AGENTS.md` de cada repo.
- **No monolitos.** Ningún archivo de lógica debería pasar de **~400 líneas**; si pasa, es señal de partirlo en
  módulos por responsabilidad. Refactorizar mientras construyes es trabajo normal, no extra.
- **El turno del proyecto es el guardián (con Opus).** Puede auditar cualquier proyecto, identificar monolitos y
  sobre-ingeniería (incluido `/ponytail-audit`), y proponer/ejecutar refactors seguros sin romper comportamiento.

## J-bis. El silencio es el fallo (estándar global)

Un fallo que no se ve cuesta más que uno que revienta: el que revienta se arregla, el mudo se busca. La norma
completa es **ley del taller** (`CLAUDE.md §18`); esto es lo que aplica dentro de cada repo.

- **Un filtro que descarta, cuenta lo que descartó.** Si esconder en silencio es lo pedido (un buscador), se
  escribe en un comentario por qué ahí sí. Un `.filter()` mudo tiró dos trabajos del tablero de Panda OS y le
  costó una mañana a Andrés.
- **Una puerta *fail-closed* sin prueba del lado CERRADO no está probada, está estrenada.** Toda compuerta,
  validación o guardia entra con al menos un caso que la ejecute BLOQUEANDO. Sin eso, el brief está incompleto y
  el DoD (§D) no se cumple.
- **Todo rechazo dice qué SÍ se puede hacer**, o nombra el objeto que estorba. Un "no se puede" a secas manda a
  buscar.
- **Los candados se prueban en rojo.** Se le devuelve al código el bug original y se comprueba que la prueba falla
  nombrando lo que falta. Una prueba que solo se ha visto en verde no ha demostrado nada.
- **Lo que una pantalla promete, otra lo cumple.** Dos módulos correctos por separado pueden mentir juntos; ese
  contrato no vive en ninguno de los dos archivos y necesita su propia prueba.

## J-ter. Selector de día y hora (estándar global)

Andrés, 2026-10-21: este es el selector de **todos** los proyectos. Va en cada pantalla donde alguien
elige un día y una hora cercanos: citas, visitas, reservas, recordatorios. Nació en el Call Center de
Carico. El principio: **nunca se obliga a navegar un calendario.**

- **Nunca** `<input type="date">`, `<input type="time">` ni librerías de calendario.
- **La semana va en una fila**, de lunes a sábado, con flechas ‹ › para cambiar de semana. Cada botón
  lleva el día abreviado y un número grande. El de hoy dice "hoy".
- **La hora va en números grandes** (9 a 18) y, aparte, `:00` / `:30`. La última hora no lleva `:30`.
- **No se ofrece lo que ya pasó**: ni días ni horas pasadas. La hora queda deshabilitada hasta elegir día.
- **Al editar**, abre en la semana guardada y con la selección marcada. Si lo guardado ya pasó, igual
  se ve: un campo que no muestra lo que tiene guardado miente.
- **Cada proyecto ajusta** el rango de horas, si entra el domingo y los colores del cliente. La forma no cambia.

No se escribe de cero. Se copia una de estas dos:

- **React/Tailwind:** `carico-ecuador` → `packages/ui/src/components/selector-dia-hora.tsx`
- **JS sin framework:** `cartera-clientes` → `public/selector.js` (sus estilos `.sel-*` están en
  `public/index.html` del mismo proyecto)

Dos casos donde la fila de la semana no sirve (afinado el 2026-10-22):

- **Fecha lejana o sin tope** (un cupón hasta diciembre): primero atajos —"hoy", "en 7 días", "en 30
  días", "fin de mes", "sin caducidad"— y la semana detrás. Copia: `talou-ec` →
  `apps/admin/src/components/ui/CampoFecha.tsx`.
- **Fecha vieja** (nacimiento, una factura del año pasado): un campo para escribirla.

## K. Comandos remotos (VPS) seguros — bounded, nunca streaming

Code puede SSH-ear a un VPS para deploy/diagnóstico (`ssh`/`scp`/`sftp`/`rsync` están en el floor). Regla dura para
que un run headless **no se cuelgue** esperando un stream infinito:

- **Todo comando remoto debe ser ACOTADO y NO-streaming.** Prohibido `pm2 logs` sin `--nostream` (nunca retorna →
  cuelga el run). Usa `pm2 logs --nostream --lines N`, `pm2 ls`, `curl --max-time N`, `psql -c "…"` puntual, `tail
  -n N` (no `tail -f`), etc.
- **Una corrida, una respuesta.** Comandos que terminan y devuelven; nada que quede vivo escuchando.
- **SSH headless: acepta la host key.** Usa `ssh -o StrictHostKeyChecking=accept-new deploy@<host> '…'` (y `scp`/
  `sftp` con la misma opción) para evitar `Host key verification failed` (exit 255): el entorno headless no tiene el
  VPS en `known_hosts`. `accept-new` la acepta en la primera conexión sin desactivar la verificación en las siguientes.
- **El deploy a producción sigue gateado** por el DENY floor + el OK de Andrés. Los secretos (`.env*`,
  `deploy-secrets/`) siguen denegados a lectura de Code — el puente SEC los entrega como env/archivo efímero.
- **El floor no se edita desde un run headless.** Cambiar `generate-permissions.mjs` es privilegiado; un run headless tiene
  ese archivo en `deny` a propósito (no se auto-otorga permisos). Si falta un permiso productivo, se agrega a
  `ALLOW_BASE` desde una sesión interactiva y se regenera — nunca desde el run headless en caliente.
- **`.claude/settings.json` SE VERSIONA; `.claude/settings.local.json` NUNCA.** El primero es el piso de
  permisos, sale del generador y es igual en todos los repos, así que viaja con el repo. El segundo es de la
  MÁQUINA —recoge lo que alguien aprobó a mano ahí— y si viajara, un permiso puntual de un equipo acabaría
  siendo el default de todos. Un `.claude` a secas en el `.gitignore` tapa los dos: el generador lo convierte
  en la regla fina. Ojo: un `.gitignore` **no** saca de git lo que ya está trackeado — eso se quita con
  `git rm --cached`, y el generador lo avisa cuando lo detecta.
- **`defaultMode: acceptEdits` lo hereda cualquiera que clone el repo**, y conviene decirlo aquí porque leyendo
  el diff de ese archivo no salta: significa que un agente edita archivos sin pedir confirmación a cada paso.
  Es la política de la casa, no un descuido — lo que la hace segura no es preguntar por cada edición (un
  diálogo que siempre sale y siempre se acepta enseña a aceptar sin leer, §J-bis) sino el DENY floor, que gana
  siempre y mantiene fuera secretos, deploys y destrucción. Lo hizo notar la sesión de Tálou al revisar su
  propio `settings.json` antes de commitearlo, en vez de solo aceptarlo.

## L. Disciplina de diagnóstico — VERIFICADO vs HIPÓTESIS (R-config-externa)

Nace del incidente del 28-jun-2026: ~3 horas perdidas persiguiendo causas falsas de un webhook que no recibía
mensajes, cuando la causa real (un toggle por-WABA apagado en Meta) no era observable desde el código. Regla dura
para no repetirlo: cuando PandAI reporte un diagnóstico —sobre todo de **config de paneles
externos** (Meta/GitHub/Resend) que no se pueden ver desde aquí—:

- **Etiqueta cada afirmación.** `VERIFICADO (corrí X y observé Y)` vs `HIPÓTESIS (no lo observo)`. Nunca presentes
  como conclusión algo que no puedes observar.
- **No persigas síntomas cosméticos** (nombres rechazados, errores transitorios de la UI del panel) como si fueran
  la causa raíz.
- **La "última milla" de un panel de terceros se GUÍA y se DIAGNOSTICA, no se automatiza.** Panda OS no maneja el
  navegador de Andrés ni pide sus credenciales: ofrece checklists guiadas (`config-checklists/`, con las trampas en
  rojo) y el "webhook doctor" (GET de verificación + tail de logs + veredicto), cuya salida va a la consola y separa
  lo verificado de lo hipotético.
<!-- END:panda-os -->
