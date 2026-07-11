---
status: ejecutado
prereqs: []
pr: 44
---
> **ROL — LEE ESTO PRIMERO.** Eres el **Coder** y este mensaje **ES el despacho**: **EJECUTA AHORA**
> (reproduce, encuentra la causa raíz, arregla, microcommits, abre el PR, cierra con `LISTO:`).

# Pau Henriques · Bug: tras iniciar sesión, el carrito vuelve a pedir login

> **Síntoma (Andrés, 2026-07-10):** al ir al carrito sin sesión, te manda a iniciar sesión. Después de
> iniciar sesión, al volver al carrito **muestra otra vez el login en vez del carrito** — hay que hacer
> **Ctrl+F5 varias veces** para que aparezca. El flujo esperado: inicio sesión → vuelvo al carrito → veo el
> carrito, NO el login de nuevo.

## Idioma
Español NEUTRAL. Sin argentinismos; usa "tú".

## Paso 0 — Guardia
`git fetch origin && git checkout main && git pull`. Rama `fix/pau-login-carrito` desde main.
Microcommits. PR a `main`. **NO mergees.**

## Hipótesis de causa raíz (verifícala, no la asumas)
El auth es client-side: `src/context/AuthContext.tsx` pone `user`/`loading` vía `onAuthStateChanged`.
El sign-in (`src/app/sign-in/page.tsx`) crea la session cookie (`POST /api/auth/session`) y luego
`performPostLoginRedirect(...)` te devuelve al `redirect` (el carrito/checkout).

**Sospecha:** hay una **carrera** — al aterrizar de vuelta en el carrito, el guard lee el `user` del cliente
que **todavía no se propagó** (o no espera a `loading===false`) y renderiza el prompt de login en lugar del
carrito. El Ctrl+F5 "lo arregla" porque re-hidrata con la cookie/estado ya asentados. Confirma leyendo cómo
el carrito/checkout decide mostrar login vs contenido (revisa `src/components/checkout/*` y quién consume
`useAuth()` — hay componentes que leen `loading`/`user`).

## Qué arreglar (causa raíz, no el síntoma)
1. **Reproduce** el flujo completo en local: carrito sin sesión → sign-in → regreso al carrito. Documenta en
   el PR qué viste exactamente (qué componente re-pidió login y por qué).
2. **Arregla la carrera** en la raíz — el guard del carrito/checkout **no debe decidir "no autenticado"
   mientras `loading===true`**; debe esperar a que el auth resuelva (o revalidar contra la session cookie del
   servidor, que es la fuente de verdad post-login) antes de mostrar el login. Un solo punto de guardia, no un
   parche por componente. Si el redirect ocurre antes de que la cookie/estado estén listos, sincroniza ahí.
   `// ponytail: un guard que respeta loading en la raíz del carrito, no un flag por componente.`
3. **No** metas un `setTimeout`/reload como cura. Nada de "reintenta con F5 programático".

## Reglas duras
- No rompas el login del admin ni el flujo normal de checkout con sesión ya activa.
- `npm run build` (o `tsc --noEmit`) + lint verdes.
- **Test:** el guard del carrito no renderiza el estado "inicia sesión" cuando `loading===true`
  (unit sobre el componente/hook de guardia, con auth en estados loading / autenticado / anónimo).

## Verifica de verdad (Code) + smoke de Andrés
- Smoke: carrito sin sesión → sign-in → **vuelve directo al carrito, sin pedir login otra vez ni Ctrl+F5**.

## Cierre
Microcommits (`fix(auth):`). PR a `main`. En el PR, describe la causa raíz encontrada.
Última línea:
`LISTO: fix del bug login→carrito — [causa raíz encontrada]; el guard del carrito espera a que el auth resuelva (loading) / revalida la session cookie antes de mostrar login; sin setTimeout/reload; test del guard + build verde; FALTA smoke de Andrés`
