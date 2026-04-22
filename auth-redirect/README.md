# auth-redirect

Sitio Firebase Hosting clasico dedicado a `auth.pauhenriques.com`.

## Proposito

- Servir el handler OAuth de Firebase Auth en `/__/auth/*` (Firebase lo inyecta automaticamente).
- Redirigir cualquier otra ruta a `https://pauhenriques.com` con 301.
- Aislar el dominio de Auth del sitio principal (App Hosting) para que el flujo de login no dependa del deploy de la Next.js.

## Estructura

- `firebase.json` — config de Hosting clasico (site: `pau-henriques-web-v1`).
- `.firebaserc` — projectId default.
- `public/index.html` — fallback (el redirect real lo sirve Firebase).

## Deploy

IMPORTANTE: ejecutar desde esta carpeta, NO desde la raiz del repo.

```bash
cd auth-redirect
firebase deploy --only hosting
```

## Por que carpeta aislada

El `firebase.json` de la raiz usa `"source": "apphosting"` (App Hosting) para la Next.js. Esta carpeta tiene su propio `firebase.json` apuntando a Hosting clasico, asi los dos deploys son independientes.

## Rollback

Firebase Console -> Hosting -> sitio `pau-henriques-web-v1` -> Release history -> Rollback.
