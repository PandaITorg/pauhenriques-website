# 🔐 Configuración de Google Sign-In

Este documento describe los pasos necesarios para habilitar el inicio de sesión con Google en el proyecto Pau Henriques.

## ✅ Estado del Código

El código para Google Sign-In **ya está completamente implementado**:

- ✅ Componente [`GoogleSignInButton`](src/components/auth/GoogleSignInButton.tsx)
- ✅ Provider de Google configurado en [`firebase-auth.ts`](src/lib/firebase-auth.ts)
- ✅ Soporte en backend: [`createUserProfile`](src/app/actions/auth.ts) acepta `provider: "google"`
- ✅ Integrado en páginas de [sign-in](src/app/sign-in/page.tsx) y [sign-up](src/app/sign-up/page.tsx)
- ✅ Session management con cookies httpOnly en [`/api/auth/session`](src/app/api/auth/session/route.ts)
- ✅ Middleware protege rutas sensibles como `/checkout`

## 📋 Pasos Requeridos (Tu Lado)

### 1. Firebase Console - Activar Google Auth

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `pau-henriques-web-v1`
3. Navega a **Authentication** → **Sign-in method**
4. Haz clic en **Google** y actívalo
5. En **Dominios autorizados**, añade:
   - `localhost` (para desarrollo)
   - Tu dominio de producción (ej: `pauhenriques.com`)
6. Guarda cambios

<!-- ### 2. Variables de Entornoçç/ -->

Verifica que tu archivo `.env.local` tenga todas estas variables configuradas:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pau-henriques-web-v1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pau-henriques-web-v1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pau-henriques-web-v1.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
FIREBASE_PROJECT_ID=pau-henriques-web-v1
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@pau-henriques-web-v1.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
```

> **Nota:** Las variables `FIREBASE_*` son para el Admin SDK (server-side). Las `NEXT_PUBLIC_FIREBASE_*` son para el cliente.

### 3. Firestore Security Rules

Hemos creado el archivo [`firestore.rules`](firestore.rules) con las reglas necesarias.

**Para desplegar las reglas:**

```bash
# Opción 1: Firebase CLI
firebase deploy --only firestore:rules

# Opción 2: En Firebase Console
# 1. Ve a Firestore Database → Rules
# 2. Copia y pega el contenido de firestore.rules
# 3. Haz clic en "Publish"
```

Las reglas garantizan que:

- Cada usuario solo pueda leer/escribir su propio documento en `/users/{userId}`
- Los productos son de lectura pública
- El carrito es privado por usuario
- Los pedidos solo pueden ser creados por el usuario autenticado

### 4. Probar Localmente

```bash
# 1. Instala las dependencias si no lo has hecho
npm install

# 2. Inicia el servidor de desarrollo
npm run dev

# 3. Abre http://localhost:3000/sign-in o /sign-up
# 4. Haz clic en "Continuar con Google"
# 5. Autoriza la aplicación
# 6. Verifica que:
#    - Se cree un documento en Firestore en la colección /users
#    - La sesión se establezca correctamente (cookie __session)
#    - Redirija a la página de tienda o al redirect_uri
```

### 5. Verificar en Firebase Console

Después de un login exitoso:

1. Ve a **Authentication** → **Users**
2. Deberías ver el usuario con `Provider: Google`
3. En **Firestore** → **users** colección, debería existir un documento con:
   - `uid` (Firebase UID)
   - `email`
   - `nombre` y `apellido` (extraídos del displayName de Google)
   - `photoURL` (avatar de Google)
   - `provider: "google"`
   - `role: "customer"`
   - `createdAt` y `updatedAt`

## 🐛 Troubleshooting

### Error: "The domain of this request is not whitelisted"

- Añade tu dominio actual a **Dominios autorizados** en Firebase Console → Authentication → Google

### Error: "Missing or insufficient permissions"

- Verifica que las Firestore Security Rules estén desplegadas correctamente
- Asegúrate de que el usuario esté autenticado (`request.auth != null`)

### El popup de Google no aparece

- Verifica que no estés usando un bloqueador de popups
- En desarrollo, `localhost` está permitido por defecto

### No se crea el perfil en Firestore

- Revisa los logs del servidor (Server Action `createUserProfile`)
- Verifica que el usuario tenga permisos de escritura en `/users/{uid}`

## 🔄 Flujo Completo

```
1. Usuario hace clic en "Continuar con Google"
   ↓
2. Firebase Auth popup → Usuario autoriza
   ↓
3. `signInWithPopup()` retorna `userCredential`
   ↓
4. Obtenemos `idToken` del usuario
   ↓
5. POST `/api/auth/session` con el `idToken`
   ↓
6. Server verifica token y crea `sessionCookie` (httpOnly)
   ↓
7. Server Action `createUserProfile` crea/actualiza documento en `/users`
   ↓
8. Redirección a `redirectUri` (o `/tienda`)
```

## 📚 Referencias

- [Firebase Auth with Google (Next.js)](https://firebase.google.com/docs/auth/web/google-signin)
- [Session Cookies](https://firebase.google.com/docs/auth/admin/manage-cookies)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
