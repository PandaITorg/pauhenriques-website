# CLAUDE.md - pauhenriques-website

## Sobre el Proyecto

Plataforma web de **Pau Henriques** — modelo comercial hibrido:

- **Productos Carico (Catalogo):** Solo escaparate digital. Sin carrito ni precios. CTA hacia WhatsApp/asesoria.
- **Productos Infrarrojo (E-commerce):** Flujo transaccional completo. Carrito -> Checkout -> Pago Nuvei.
- **Registro obligatorio** antes de pagar productos propios (Infrarrojo).

## Tech Stack

- **Framework:** Next.js 14 (App Router, Server Components)
- **Estilos:** Tailwind CSS v4
- **Base de Datos:** Cloud Firestore
- **Auth:** Firebase Authentication (Email/Password + Google Sign-In)
- **Backend:** Server Actions + API Routes (`src/app/api/`)
- **State:** Zustand (cart), React Context (auth)
- **Validacion:** Zod
- **Deploy:** Firebase App Hosting (push a `main`)
- **Pagos:** Nuvei Ecuador (solo Infrarrojo) — Zero-Redirect, tokenizacion frontend

## Estructura del Proyecto

```
src/
  app/
    layout.tsx              # Root layout con AuthProvider
    page.tsx                # Homepage
    tienda/                 # Tienda (catalogo + e-commerce)
    checkout/               # Flujo de pago (protegido por middleware)
    sobre-mi/               # Pagina About
    podcast/                # Seccion podcast
    links/                  # Link tree
    politica-privacidad/    # Legal
    terminos-servicio/      # Legal
    programa-afiliados/     # Programa de afiliados
    api/auth/               # Session cookie y logout routes
  components/
    layout/                 # Header, Footer, nav
    home/                   # Hero, SobreMi, Podcast, etc.
    auth/                   # GoogleSignInButton, PasswordStrength
    cart/                   # CartComponent, CartIcon
    checkout/               # NuveiPaymentForm
    schemas/                # JSON-LD structured data
  context/
    AuthContext.tsx          # Firebase Auth state
    CartContext.tsx          # Carrito (solo Infrarrojo)
  lib/
    firebase.ts             # Firebase client SDK config
    firebase-auth.ts        # Auth client (GoogleAuthProvider)
    firebase-admin.ts       # Firebase Admin SDK (server)
    firebase/server-config.ts
  assets/                   # Imagenes, SVGs, logos
middleware.ts               # Protege rutas (checkout)
firestore.rules             # Reglas de seguridad Firestore
```

## Personas / Modos de Trabajo

Cuando el usuario invoque un trigger, adopta el rol correspondiente:

### @DESIGN / !ui — Disenador UX/UI Senior
- Usa componentes nativos Next.js (`<Image>`, `<Link>`) + Tailwind moderno
- Anima solo `transform` y `opacity` (60fps)
- **Carico:** fotos grandes, boton "Consultar Asesoria" / "Pedir por WhatsApp". NUNCA "Agregar al Carrito"
- **Infrarrojo:** boton "Agregar al Carrito" y "Comprar Ahora"
- Formulario de pago Nuvei debe parecer nativo (mismos bordes/fuentes/sombras)

### @DEV / !code — Ingeniero Full Stack Senior
- Valida todo input con **Zod** (Server Actions, API). Confianza Cero
- Firebase: usa `batch()` o `runTransaction()` para operaciones atomicas
- Valida siempre `request.auth` en server
- Pago Nuvei: frontend tokeniza con SDK, backend recibe token + uid, ejecuta `/debit`
- NUNCA enviar PAN al backend
- Webhook `/api/webhooks/nuvei` valida `status: "success"` y `status_detail: 3`

### @SEO / !rank — Estratega SEO
- Metadata via `export const metadata` o `generateMetadata()`. Prohibido `<head>` manual
- JSON-LD con datos estructurados (`Product`, `Article`) via `<script type="application/ld+json">`
- Optimizar Core Web Vitals, imagenes, jerarquia semantica

### @LEGAL / !terms — Compliance Legal
- Terminos y Privacidad claros (Ecuador/Global)
- Carico = asesor externo, Infrarrojo = venta directa del sitio
- Clausulas de tokenizacion Nuvei y PCI Compliance
- Checkboxes de aceptacion NO marcados por defecto (GDPR/LOPD)

## Git Workflow y Commits

### Ramas
- `main` — produccion (deploy automatico via Firebase App Hosting)
- `develop` — rama de desarrollo activa
- `feature/*` — ramas de trabajo por feature

### Protocolo de Desarrollo Iterativo
1. **Blueprint:** Generar checklist en Markdown antes de codear. Pedir confirmacion
2. **Rama:** `git checkout -b feature/nombre-descriptivo`
3. **Micro-commits:** Un paso del blueprint = un commit atomico. Preguntar antes del siguiente paso
4. **Pre-flight:** `npm run build` antes de push
5. **Push + PR:** Push a origin, crear PR hacia `main` para review
6. **Merge:** Squash & Merge en GitHub -> Detona deploy

### Convencion de Commits
Seguir el estilo del repo (commits recientes como referencia):
```
feat(scope): descripcion corta
fix(scope): descripcion corta
chore: descripcion corta
```
Ejemplos reales del repo:
- `feat(auth): add AuthContext provider with onAuthStateChanged`
- `fix: apphosting.yaml reformateado`
- `chore: ordenar docs`

## Comandos

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de produccion (pre-flight obligatorio)
npm run start    # Servir build de produccion
npm run lint     # Linter
```

## Reglas Clave

- **NUNCA** generar todo el codigo de golpe para tareas complejas — seguir el protocolo iterativo
- **NUNCA** mezclar productos Carico e Infrarrojo en el mismo flujo de carrito
- **NUNCA** enviar datos de tarjeta (PAN) al backend — solo tokens
- Proteger `/checkout` con middleware (requiere autenticacion)
- Usar Server Components por defecto; Client Components solo cuando sea necesario
- Variables de entorno sensibles van en Cloud Secret Manager (ver `docs/setup-secrets.md`)
