# 🔧 Variables de Entorno en Firebase App Hosting

## 📋 Resumen

Este proyecto usa **Firebase App Hosting** para desplegar una aplicación Next.js 14 con autenticación Firebase. Las variables de entorno se gestionan de forma diferente en desarrollo local vs. producción/staging.

**IMPORTANTE**: Variables sensibles usan **Cloud Secret Manager** para máxima seguridad.

---

## 🗂️ Archivos de Configuración

### 1. `apphosting.yaml`

Archivo de configuración para Firebase App Hosting. **Puede subirse a Git** porque solo contiene referencias a secretos, no valores reales.

```yaml
runtime: "nodejs18"

env:
  variables:
    # Firebase Client SDK (NEXT_PUBLIC_*) - Públicas
    NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSy..."
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "pau-henriques-web-v1.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "pau-henriques-web-v1"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "pau-henriques-web-v1.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456789"
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:123456789:web:abcdef"

    # Firebase Admin SDK - SENSIBLES → Cloud Secret Manager
    FIREBASE_PROJECT_ID: "pau-henriques-web-v1" # No sensible
    FIREBASE_CLIENT_EMAIL:
      secret: "firebase-client-email" # ← Referencia al secreto
    FIREBASE_PRIVATE_KEY:
      secret: "firebase-private-key" # ← Referencia al secreto
```

### 2. `.env.example`

Archivo de referencia con nombres de variables. Se sube a Git.

### 3. `.env.local`

Archivo local (ignorado por Git) para desarrollo.

### 4. Cloud Secret Manager

Donde se almacenan los valores reales de `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY`.

---

## 🔄 Cómo se Cargan las Variables

### En Desarrollo Local

1. Copia `.env.example` a `.env.local`
2. Reemplaza valores dummy con reales
3. Next.js lee `process.env.*`

### En Staging/Producción (Firebase App Hosting)

1. **Crear secretos** en Cloud Secret Manager (ver `setup-secrets.md`)
2. **Otorgar acceso** a App Hosting
3. Hacer `firebase deploy --only hosting`
4. Firebase lee `apphosting.yaml`
5. Detecta referencias `secret: "nombre"`
6. Obtiene valores de Cloud Secret Manager
7. Inyecta como variables de entorno
8. Tu app lee `process.env.*` normalmente

---

## 📦 Variables Requeridas

### Cliente-side (NEXT*PUBLIC*\*)

Disponibles en el navegador. Usadas en [`src/lib/firebase.ts`](src/lib/firebase.ts:7).

| Variable                                   | Descripción              | ¿Pública? |
| ------------------------------------------ | ------------------------ | --------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Clave de API de Firebase | ✅ Sí     |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Dominio de autenticación | ✅ Sí     |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | ID del proyecto          | ✅ Sí     |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Bucket de almacenamiento | ✅ Sí     |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ID para Cloud Messaging  | ✅ Sí     |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | ID de la app Firebase    | ✅ Sí     |

### Server-side (FIREBASE\_\*)

Solo servidor. Usadas en [`src/lib/firebase-admin.ts`](src/lib/firebase-admin.ts:7).

| Variable                | Descripción              | Almacenamiento               |
| ----------------------- | ------------------------ | ---------------------------- |
| `FIREBASE_PROJECT_ID`   | ID del proyecto          | Directo en `apphosting.yaml` |
| `FIREBASE_CLIENT_EMAIL` | Email cuenta de servicio | Cloud Secret Manager         |
| `FIREBASE_PRIVATE_KEY`  | Clave privada RSA        | Cloud Secret Manager         |

---

## 🧪 Verificación

### Método 1: Logs

Firebase Console → App Hosting → Logs:

- Busca `"Firebase Admin SDK inicializado correctamente."`
- Errores como `"Missing or insufficient permissions"` indican problemas con secretos

### Método 2: Endpoint Debug (temporal)

```typescript
// src/app/api/debug-env/route.ts (eliminar después)
export async function GET() {
  return Response.json({
    hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
  });
}
```

### Método 3: Probar Google Sign-In

Si el login funciona → variables cargadas correctamente.

---

## 🔄 Actualizar Secretos

Para rotar la clave privada:

```bash
# Añadir nueva versión
echo -n "NUEVA_CLAVE" | \
  gcloud secrets versions add firebase-private-key \
  --data-file=- --project=pau-henriques-web-v1

# App Hosting usa automáticamente la versión más reciente
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué Cloud Secret Manager?

- Máxima seguridad (encriptación en reposo)
- No expones valores en Git
- Rotación sin desplegar
- Control de acceso con IAM

### ¿Puedo subir `apphosting.yaml` a Git?

**SÍ.** Ahora solo contiene referencias (`secret: "firebase-client-email"`), no valores reales. Es 100% seguro.

### ¿Qué pasa si olvido crear un secreto?

El deploy falla con error:

```
Error: Secret [firebase-client-email] not found
```

### ¿Cuánto cuesta Cloud Secret Manager?

- Primeros 6 secretos: gratis
- Secretos activos adicionales: ~$0.06/mes cada uno
- Operaciones de acceso: ~$0.03 por 10,000

---

## 📚 Referencias

- [Firebase App Hosting Secrets](https://firebase.google.com/docs/hosting/cloud-run/secrets)
- [Cloud Secret Manager](https://cloud.google.com/secret-manager/docs)
- [setup-secrets.md](setup-secrets.md) - Guía paso a paso

---

## ✅ Checklist de Despliegue

- [ ] `apphosting.yaml` configurado con referencias a secretos
- [ ] Secretos creados en Cloud Secret Manager
- [ ] Acceso concedido a App Hosting (`firebase apphosting:secrets:grantaccess`)
- [ ] `.env.local` configurado para desarrollo local
- [ ] Build exitoso: `npm run build`
- [ ] Deploy: `firebase deploy --only hosting`
- [ ] Verificación: Google Sign-In funciona en staging
