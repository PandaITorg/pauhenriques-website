# Changelog

Todas las versiones notables del proyecto **pauhenriques-website** están documentadas aquí.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [1.0.0-rc.1] — 2026-03-25 _(versión actual)_

> **Estado: Release Candidate** — En producción con credenciales Nuvei reales. Pendiente validación completa de transacciones en vivo.

### Added
- **Credenciales Nuvei producción** (`PAUHENRIQUES-EC-CLIENT` / `PAUHENRIQUES-EC-SERVER`)
- **Cloud Function para callback 3DS** — resuelve 403 de Firebase App Hosting en POSTs externos del ACS
- **Polling fallback** para verificación 3DS cuando postMessage no llega
- **Input CVC para tarjetas guardadas** — requerido por bancos ecuatorianos en producción
- **Selector de diferidos** en checkout (corriente / con intereses 3-36 meses / sin intereses 3-6 meses)
- **Email de confirmación de pago** con template HTML branded (via Resend) — incluye transactionId y authorizationCode
- **Email de pago fallido** con motivo del rechazo y CTA de reintento
- **Manejo de tarjeta duplicada** — detecta "Card already added" de Nuvei, ofrece eliminar y reintentar
- **Detección de tarjetas en estado roto** con mensajes de error descriptivos
- **Campos `cardBrand` y `cardLast4`** guardados en orden — reemplazan token raw en "Mis Pedidos"
- **Validación de stock, precio y cupón** server-side antes de cobrar (previene cobros con datos desactualizados)
- **IVA 15%** y `taxable_amount` enviados a Nuvei en cada débito
- **Parámetro `CLOUD_FUNCTIONS_BASE_URL`** como variable de entorno (elimina URL hardcodeada)

### Changed
- **Iframe 3DS aumentado** de 450px a 600px de alto y max-w-md a max-w-lg
- **Email removido de verify API** — Nuvei pidió explícitamente quitarlo
- **Flujo 3DS endurecido** — polling no auto-aprueba sin postMessage/cres; valida `3ds-pending` antes de escribir
- **Fire-and-forget de emails** con tracking de `emailSent` para aviso sutil en confirmación
- **Orden marcada `failed`** en cobros rechazados (antes quedaba en `pending` indefinidamente)
- **`handleTokenSuccess` avanza a confirm inmediatamente** — fetch de tarjetas en background para evitar flicker
- **Tarjetas `pending` incluidas** en listado de tarjetas guardadas (tarjetas de débito recién tokenizadas)

### Fixed
- **Prevención de auto-aprobación 3DS** — polling sin cres en challenge retorna `pending` en vez de llamar verify
- **XSS en Cloud Function** — orderId y transStatus sanitizados con regex whitelist
- **postMessage sin target origin** — `"*"` reemplazado por sanitización de valores
- **TypeError en re-init SDK Nuvei** — limpieza de DOM container antes de re-renderizar formulario
- **"Nueva tarjeta agregada" genérico** — ahora muestra type/last4/expiry reales del SDK
- **"No autorizado" fantasma** — paymentError se limpia al volver al paso de pago
- **Dead code eliminado** — `baseUrl`/`host`/`protocol` no usados en charge route
- **Campos residuales limpiados** — `threeDSTransStatus`, `isDeviceFingerprint`, `threeDSCres` eliminados de Firestore en éxito
- **Ternario idéntico `functionsBase`** — reemplazado por `CLOUD_FUNCTIONS_BASE_URL` env var

### Security
- Sanitización XSS en HTML generado por Cloud Function
- Validación de `3ds-pending` en callback antes de escribir cres (previene tampering)
- CVC nunca se loguea ni se guarda en Firestore
- Session cookie verificada en todos los endpoints de pago

---

## [0.10.0-beta] — 2026-03-14

> **Estado: Beta** — Flujo 3DS2 completo probado en staging (Modirum).

### Added
- **Flujo 3DS2 completo** para pagos Nuvei/Paymentez:
  - **Frictionless (status 35):** iframe oculto + timer 5s + verify `AUTHENTICATION_CONTINUE`
  - **Challenge (status 36/37):** iframe visible con ACS del banco + verify `BY_CRES`
  - Escalación automática 35 → 36 si el banco lo requiere
- **API `/api/payment/3ds-callback`:** captura `cres` del ACS POST y lo almacena en Firestore
- **API `/api/payment/3ds-complete`:** llama a Nuvei Verify (`/v2/transaction/verify/`)
- **Función `verifyThreeDS()`** en `lib/nuvei.ts`
- Guard de idempotencia para prevenir llamadas dobles a 3ds-complete
- Mensajes de error en español para cada escenario de fallo 3DS (`N`, `R`, `U`)
- Órdenes marcadas como `failed` en Firestore cuando el banco rechaza la autenticación
- Inyección de `ip_address` del cliente en `browser_info` para 3DS2

### Changed
- `3ds-complete` usa Verify API en lugar de un segundo `debitWithToken()`
- Normalización de respuesta Verify API (maneja formato flat y nested de Nuvei)
- `postMessage` en `ThreeDSReturn` usa `targetOrigin` específico en lugar de `"*"`
- Default de `transStatus` cambiado de `"Y"` a `"U"` cuando no se puede leer el body del ACS

### Fixed
- Campos `browser_info` corregidos para cumplir con spec Paymentez 3DS2 (`java_enabled`, field names)
- Race condition de doble llamada a `3ds-complete` eliminada con `threeDSCompleteCalledRef`
- Tarjetas de prueba 3DS Modirum (4016360000000002, 4016360000000010) funcionan correctamente

---

## [0.9.0-beta] — 2026-03-10

### Added
- **Integración Nuvei completa:** tokenización frontend, `/debit`, webhook, refund, verify, IVA
- **Página de test Nuvei** para validar cobros en sandbox
- **Overlays UX de pago:** estados de carga, éxito y error durante el checkout
- **Variable `NUVEI_ENV`** para separar entorno de pagos del entorno de app

### Fixed
- Guard de endpoint `test-charge` usando `NUVEI_ENV` en vez de `NODE_ENV`
- Detección de entorno Nuvei corregida para staging

### Changed
- Credenciales Nuvei configuradas en `apphosting.yaml` para staging

---

## [0.8.0-beta] — 2026-03-09

### Added
- **Rediseño completo** con dark design system premium (forest-health aesthetic)
  - Homepage, tienda, detalle de producto
  - Checkout flow
  - Mi cuenta y mis pedidos
  - Header y footer
  - Podcast, loading, páginas legales
  - Sign-in y sign-up
  - Admin panel
- **Documentos legales oficiales** (términos y privacidad actualizados)

### Fixed
- Clases Tailwind canónicas en auth y podcast (`max-w-70`)

---

## [0.7.0-beta] — 2026-03-08

### Added
- **Checkout 4 pasos:** dirección guardada, tarjetas guardadas, resumen y confirmación
- **API de tarjetas y direcciones guardadas**
- **Nuvei helper** para integración server-side
- Migración del SDK Nuvei a `PaymentGateway generate_tokenize` API

---

## [0.6.0-beta] — 2026-03-07

### Added
- **Panel de administración** con soporte de subdominio
  - CRUD de productos (listar, crear, editar)
  - Subida de imágenes con Firebase Storage + drag & drop
  - Gestión de pedidos (lista, detalle, actualización de estado)
- **Páginas de cuenta:** mi-cuenta, mis-pedidos, admin banner

### Fixed
- Google sign-in: redirect, error handling, unificación de contexto de módulo
- Dominios de imagen en `next.config` (Google, Firebase Storage)
- Formato de config: `.cjs` → `.mjs` para compatibilidad ESM

---

## [0.5.0-beta] — 2026-03-06

### Added
- **Rediseño mobile-first responsive** en todas las páginas
- **E-commerce revamp:** tienda, checkout y integración de pagos Nuvei

---

## [0.4.0-alpha] — 2026-02-23

### Added
- **Firebase App Hosting** con Cloud Secret Manager
- Configuración de deploy automático en push a `main`

### Fixed
- Conflicto de dependencias `@types/react-dom` (18.x) con React 18
- `apphosting.yaml` reformateado

---

## [0.3.0-alpha] — 2026-02-20

### Added
- **Sistema de autenticación completo:**
  - Firebase Auth con Email/Password + Google Sign-In
  - AuthContext provider con `onAuthStateChanged`
  - Session cookie y logout API routes
  - `createUserProfile` server action con validación Zod
  - GoogleSignInButton y PasswordStrengthIndicator
  - Páginas de sign-in y sign-up
  - Header/MobileMenu con estado de auth (avatar, dropdown, login)
  - AuthProvider en root layout
- **Validación Zod** instalada para formularios
- **Carrito de compras mejorado** y rediseño de colección de productos

### Fixed
- SSR prerendering con lazy Firebase Auth initialization
- Problemas con CartIcon
- Exports fallidos de product service
- Bug en formulario de pago Nuvei
- Convenciones de nombres CSS

---

## [0.2.0-alpha] — 2026-01-29

### Added
- **Migración de Vite+React a Next.js 15 App Router**
- Configuración de entorno Next.js para Firebase Studio
- **SEO mejorado:**
  - Rich snippets (JSON-LD) para todas las páginas
  - OpenGraph image
  - Person schema y Organization schema
  - Auditoría de metadata en todas las páginas
- Upgrade de Next.js a 15.5.11

### Fixed
- Referencias incorrectas a Shopify en política de privacidad
- Links duplicados de episodios de podcast
- Downgrade de Next.js por incompatibilidad de deploy
- Hydration: schema mismatch e image warnings
- Build error con `next.config.cjs`

---

## [0.1.0-alpha] — 2025-09-04 → 2025-09-23 _(era Vite+React)_

> Versión original del sitio como SPA con Vite + React. Posteriormente migrada a Next.js.

### Added
- **Landing page:** Hero section con animaciones
- **Navegación:** menú responsive con mobile support
- **Página Sobre Mí** con contenido biográfico
- **Sección Podcast** con datos de episodios
- **Catálogo de productos** con videos
- **Testimonios** con carrusel
- **Footer** completo
- **Páginas legales:** Términos de servicio y Política de privacidad
- **Tienda** (bajo construcción inicialmente, luego con productos)
- **Página Links in Bio** para Instagram
- **Programa de Afiliados** con formulario
- **SEO:** metadatos, datos estructurados, Open Graph
- **Performance:** lazy loading, skeletons, splash screen
- **Responsive design** con hero 100vh
- `.htaccess` para routing SPA en Apache

### Versiones internas (Vite)
- `1.0.1` — SEO inicial
- `1.1.4` — Skeletons y splash screen
- `1.1.5` — Sobre Mí actualizado
- `1.1.6` — Footer en todas las páginas, fix testimonios
- `1.1.7` — Links in Bio
- `1.2.0` — Productos en tienda
- `1.2.1` — Ajustes menores
- `1.2.2` — Mejoras de animaciones y UX

---

## Roadmap hacia 1.0.0 (Release)

- [x] Flujo 3DS2 completo (frictionless + challenge) probado en staging
- [x] Certificación staging con Nuvei
- [x] Migrar a credenciales de producción Nuvei
- [x] Eliminar página de test Nuvei
- [x] Emails transaccionales (confirmación + fallo)
- [x] Diferidos (con/sin intereses)
- [x] CVC para tarjetas guardadas
- [x] Auditoría de seguridad (XSS, validación server-side, session cookies)
- [ ] Pagos Nuvei validados en producción con transacciones reales
- [ ] Resolver tarjeta de débito atrapada con soporte Nuvei
- [ ] Testing E2E del flujo completo (registro → carrito → checkout → pago → email)
- [ ] Reembolsos via API integrados en admin panel
- [ ] Performance audit (Core Web Vitals en verde)
- [ ] Monitoreo y alertas en producción
