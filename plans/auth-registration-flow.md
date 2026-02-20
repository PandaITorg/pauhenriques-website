# Plan: Auth Registration Flow — Pau Henriques

## 🎯 Objetivo

Implementar el flujo completo de registro/login de usuarios para la tienda en línea, con Email+Password y Google Sign-In.

---

## 🎨 Diseño Visual (Mockup Description)

### Layout General — Ambas páginas (`/sign-in` y `/sign-up`)

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Logo | Podcast | Tienda | Sobre Mí | [Ingresar]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   FONDO: imagen pau-no-bg.webp con opacity 0.08 + blur(2px)     │
│   + radial-gradient overlay (bosque profundo)                    │
│                                                                  │
│              ┌──────────────────────────────┐                   │
│              │  [Logo: Pau Henriques]        │  ← Dancing Script │
│              │  "Vive sin tóxicos"           │  ← uppercase tiny │
│              │                              │                   │
│              │  Título de la página         │  ← 22px bold      │
│              │  Subtítulo descriptivo       │  ← 13px muted     │
│              │                              │                   │
│              │  [G] Continuar con Google    │  ← btn blanco     │
│              │                              │                   │
│              │  ─────── o con email ─────── │                   │
│              │                              │                   │
│              │  [Formulario]                │                   │
│              │                              │                   │
│              │  [Botón CTA primario]        │  ← color-primary  │
│              │                              │                   │
│              │  ¿No tienes cuenta? Regístr. │                   │
│              └──────────────────────────────┘                   │
│                                                                  │
│   Card: backdrop-blur(20px) + bg rgba(65,73,52,0.7)             │
│         border: 1px solid rgba(193,196,167,0.15)                │
│         border-radius: 20px                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

### Página `/sign-in` — Campos del formulario

```
[CORREO ELECTRÓNICO]
  Input: tipo email, placeholder "tu@email.com"

[CONTRASEÑA]
  Input: tipo password, con ícono 👁 toggle
  Link: "¿Olvidaste tu contraseña?" (alineado a la derecha)

[Ingresar a mi cuenta]  ← btn-primary con spinner durante carga

¿No tienes cuenta? Regístrate aquí
```

**Orden UX:** Google primero (menor fricción) → Divider → Email/Password

---

### Página `/sign-up` — Campos del formulario

```
[NOMBRE]          [APELLIDO]
  Input text        Input text

[CORREO ELECTRÓNICO]
  Input: tipo email
  Error inline: "⚠ Ingresa un correo electrónico válido"

[TELÉFONO (opcional)]
  [+593] [99 123 4567]
  Prefijo de país + número

[CONTRASEÑA]
  Input: tipo password, con ícono 👁 toggle
  ████████░░ Contraseña fuerte  ← indicador de fortaleza (4 barras)

[CONFIRMAR CONTRASEÑA]
  Input: tipo password, con ícono 👁 toggle

[ ] Acepto los Términos de Servicio y la Política de Privacidad
    (checkbox NO marcado por defecto — GDPR compliance)

[Crear mi cuenta]  ← btn-primary

¿Ya tienes cuenta? Inicia sesión aquí
```

---

### Header — Estados

```
NO AUTENTICADO:
┌─────────────────────────────────────────────────────────────────┐
│ [Logo]    Podcast  Tienda  Sobre Mí  Afiliados  [Ingresar]      │
└─────────────────────────────────────────────────────────────────┘
                                                  ↑ outline btn
                                                  color-primary

AUTENTICADO:
┌─────────────────────────────────────────────────────────────────┐
│ [Logo]    Podcast  Tienda  Sobre Mí  Afiliados  [M]▼            │
└─────────────────────────────────────────────────────────────────┘
                                                  ↑ avatar circular
                                                  inicial del nombre
                                                  + dropdown:
                                                  ┌──────────────┐
                                                  │ María García │
                                                  │ maria@...    │
                                                  │ ─────────── │
                                                  │ 👤 Mi cuenta │
                                                  │ 📦 Pedidos   │
                                                  │ ─────────── │
                                                  │ 🚪 Salir     │
                                                  └──────────────┘
```

---

### Post-Registro — Estado de éxito

```
              ┌──────────────────────────────┐
              │           ✓                  │  ← ícono verde
              │  ¡Cuenta creada con éxito!   │
              │  Bienvenida, María.          │
              │  Ahora puedes explorar...    │
              │                              │
              │  [Ir a la Tienda →]          │
              │  Volver al inicio            │
              └──────────────────────────────┘
```

---

## 🎨 Tokens de Diseño Aplicados

| Elemento          | Color/Valor                                             |
| ----------------- | ------------------------------------------------------- |
| Fondo página      | `--color-background: #343d2a`                           |
| Card formulario   | `rgba(65, 73, 52, 0.7)` + `backdrop-filter: blur(20px)` |
| Inputs            | `rgba(52, 61, 42, 0.8)` border `rgba(193,196,167,0.2)`  |
| Input focus       | border `--color-primary: #a68a63` + glow                |
| Input error       | border `#e57373` + glow rojo                            |
| Botón primario    | `--color-primary: #a68a63`                              |
| Botón Google      | `white` con borde `#dadce0`                             |
| Labels            | `--color-tertiary: #a4ac85` uppercase 12px              |
| Texto principal   | `--color-text-main: #c1c4a7`                            |
| Texto muted       | `rgba(193, 196, 167, 0.55)`                             |
| Logo texto        | `font-family: Dancing Script`                           |
| Animación entrada | `fadeInUp` (ya definida en globals.css)                 |

---

## 🏗️ Arquitectura Técnica

### Flujo de Autenticación

```
Usuario → /checkout
    ↓
Middleware verifica __session cookie
    ↓ (sin sesión)
Redirige → /sign-in?redirect_uri=/checkout
    ↓
Usuario elige método:
    ├── Email + Password
    │   └── Firebase signInWithEmailAndPassword()
    └── Google OAuth
        └── Firebase signInWithPopup(GoogleAuthProvider)
    ↓
Obtener ID Token: user.getIdToken()
    ↓
POST /api/auth/session { idToken }
    ↓
Firebase Admin: verifyIdToken() → createSessionCookie() (5 días)
    ↓
Set-Cookie: __session (httpOnly, secure, sameSite=lax)
    ↓
Redirect → redirect_uri || /tienda
```

### Flujo de Registro

```
/sign-up → Validación Zod (client-side)
    ↓
Firebase createUserWithEmailAndPassword()
    ↓
Firebase updateProfile({ displayName: "Nombre Apellido" })
    ↓
Server Action: createUserProfile()
    └── Firestore: /users/{uid} {
          nombre, apellido, email, telefono,
          createdAt, updatedAt, role: "customer"
        }
    ↓
Obtener ID Token → POST /api/auth/session
    ↓
Redirect → /tienda (o redirect_uri si viene del checkout)
```

---

## 📁 Archivos a Crear/Modificar

### Nuevos archivos

| Archivo                                             | Descripción                                 |
| --------------------------------------------------- | ------------------------------------------- |
| `src/lib/firebase.ts`                               | Agregar `getAuth`, `GoogleAuthProvider`     |
| `src/context/AuthContext.tsx`                       | Provider global con `onAuthStateChanged`    |
| `src/app/api/auth/session/route.ts`                 | API Route: crear session cookie httpOnly    |
| `src/app/api/auth/logout/route.ts`                  | API Route: eliminar cookie + revocar sesión |
| `src/app/actions/auth.ts`                           | Server Action: crear perfil en Firestore    |
| `src/components/auth/AuthForm.tsx`                  | Componente base reutilizable del formulario |
| `src/components/auth/GoogleSignInButton.tsx`        | Botón Google con lógica OAuth               |
| `src/components/auth/PasswordStrengthIndicator.tsx` | Indicador visual de fortaleza               |
| `src/app/sign-in/page.tsx`                          | Página de inicio de sesión                  |
| `src/app/sign-up/page.tsx`                          | Página de registro                          |

### Archivos modificados

| Archivo                            | Cambio                             |
| ---------------------------------- | ---------------------------------- |
| `src/components/layout/Header.tsx` | Agregar estado auth + botón/avatar |
| `src/app/layout.tsx`               | Envolver con `AuthProvider`        |
| `middleware.ts`                    | Ya correcto — sin cambios          |

---

## ✅ Validaciones Zod

### Sign-Up Schema

```typescript
z.object({
  nombre: z.string().min(2).max(50),
  apellido: z.string().min(2).max(50),
  email: z.string().email("Correo electrónico inválido"),
  telefono: z.string().optional(),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar los términos" }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});
```

### Sign-In Schema

```typescript
z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});
```

---

## 📦 Dependencias a Instalar

```bash
npm install zod
```

> `zod` no está en `package.json` actualmente. Es la única dependencia nueva necesaria.

---

## 🔄 Git Workflow

```bash
# Fase 1: Crear rama
git checkout -b feature/auth-registration-flow

# Fase 2: Micro-commits por paso
git commit -m "feat(auth): configure Firebase Auth client SDK"
git commit -m "feat(auth): add AuthContext provider"
git commit -m "feat(auth): add session cookie API routes"
git commit -m "feat(auth): add createUserProfile server action"
git commit -m "feat(auth): add GoogleSignInButton component"
git commit -m "feat(auth): add PasswordStrengthIndicator component"
git commit -m "feat(auth): add sign-in page with email+google"
git commit -m "feat(auth): add sign-up page with phone field"
git commit -m "feat(auth): update Header with auth state"
git commit -m "feat(auth): wrap layout with AuthProvider"

# Fase 3: Pre-flight
npm run build
git push origin feature/auth-registration-flow
# → Crear PR en GitHub → Squash & Merge → Deploy automático
```

---

## 🗂️ Estructura de Firestore — Colección `/users`

```
/users/{uid}
  ├── uid: string
  ├── nombre: string
  ├── apellido: string
  ├── email: string
  ├── telefono: string | null
  ├── photoURL: string | null
  ├── provider: "email" | "google"
  ├── role: "customer"
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp
```

---

## 📋 Checklist de Implementación

- [ ] FASE 1: Crear rama `feature/auth-registration-flow`
- [ ] PASO 1: Instalar `zod`
- [ ] PASO 2: Actualizar `src/lib/firebase.ts` con Auth + GoogleAuthProvider
- [ ] PASO 3: Crear `src/context/AuthContext.tsx`
- [ ] PASO 4: Crear `src/app/api/auth/session/route.ts`
- [ ] PASO 5: Crear `src/app/api/auth/logout/route.ts`
- [ ] PASO 6: Crear `src/app/actions/auth.ts`
- [ ] PASO 7: Crear `src/components/auth/GoogleSignInButton.tsx`
- [ ] PASO 8: Crear `src/components/auth/PasswordStrengthIndicator.tsx`
- [ ] PASO 9: Crear `src/app/sign-in/page.tsx`
- [ ] PASO 10: Crear `src/app/sign-up/page.tsx`
- [ ] PASO 11: Actualizar `src/components/layout/Header.tsx`
- [ ] PASO 12: Actualizar `src/app/layout.tsx`
- [ ] FASE 3: `npm run build` + Push + PR
