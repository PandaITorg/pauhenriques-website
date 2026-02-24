# 🔐 Configuración de Secretos con Cloud Secret Manager

## 📋 Resumen

Para maximizar la seguridad, las variables sensibles (`FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY`) se almacenan en **Cloud Secret Manager** en lugar de en `apphosting.yaml` directamente.

### Ventajas

- ✅ `apphosting.yaml` puede subirse a Git (solo contiene referencias)
- ✅ Valores encriptados en Google Cloud
- ✅ Rotación de secretos sin cambiar código
- ✅ Acceso controlado con IAM

---

## 🗂️ Estructura Actual

### `apphosting.yaml` (seguro para Git)

```yaml
env:
  variables:
    FIREBASE_CLIENT_EMAIL:
      secret: "firebase-client-email"
    FIREBASE_PRIVATE_KEY:
      secret: "firebase-private-key"
```

### Valores reales (en Cloud Secret Manager)

- Secreto: `firebase-client-email` → valor: `firebase-adminsdk-...@...iam.gserviceaccount.com`
- Secreto: `firebase-private-key` → valor: `-----BEGIN PRIVATE KEY-----\n...`

---

## 🚀 Pasos para Configurar Secretos

### Paso 1: Instalar/Actualizar Firebase CLI

```bash
npm install -g firebase-tools
firebase --version  # Debe ser >= 15.0.0
```

### Paso 2: Autenticarse con Google Cloud

```bash
# Iniciar sesión en tu cuenta de Google
firebase login

# O si usas gcloud:
gcloud auth login
```

### Paso 3: Crear los Secretos

**Opción A: Usando Firebase CLI (recomendado)**

```bash
# Secreto 1: FIREBASE_CLIENT_EMAIL
firebase apphosting:secrets:set firebase-client-email \
  --project pau-henriques-web-v1

# Te pedirá:
# 1. El valor (pega el email completo)
# 2. Confirmar

# Secreto 2: FIREBASE_PRIVATE_KEY
firebase apphosting:secrets:set firebase-private-key \
  --project pau-henriques-web-v1

# Te pedirá:
# 1. El valor (pega la clave completa, incluyendo -----BEGIN PRIVATE KEY----- y -----END PRIVATE KEY-----)
# 2. Confirmar
```

**Opción B: Usando gcloud CLI**

```bash
# Secreto 1: Client Email
gcloud secrets create firebase-client-email \
  --replication-policy="automatic" \
  --project=pau-henriques-web-v1

# Añadir el valor
echo -n "firebase-adminsdk-...@pau-henriques-web-v1.iam.gserviceaccount.com" | \
  gcloud secrets versions add firebase-client-email \
  --data-file=- \
  --project=pau-henriques-web-v1

# Secreto 2: Private Key
gcloud secrets create firebase-private-key \
  --replication-policy="automatic" \
  --project=pau-henriques-web-v1

# Añadir el valor (la clave completa en una línea con \n)
echo -n "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADAN...\n-----END PRIVATE KEY-----" | \
  gcloud secrets versions add firebase-private-key \
  --data-file=- \
  --project=pau-henriques-web-v1
```

### Paso 4: Otorgar Acceso a App Hosting

Firebase App Hosting necesita permiso para leer los secretos. Usa:

```bash
firebase apphosting:secrets:grantaccess \
  --secret firebase-client-email \
  --project pau-henriques-web-v1

firebase apphosting:secrets:grantaccess \
  --secret firebase-private-key \
  --project pau-henriques-web-v1
```

Esto automáticamente concede el rol `roles/secretmanager.secretAccessor` al servicio de App Hosting.

**Nota**: Si usaste `gcloud secrets create`, también necesitas:

```bash
# Obtener el service account de App Hosting
# Generalmente es: service-<PROJECT_NUMBER>@appspot.gserviceaccount.com

# Conceder acceso
gcloud secrets add-iam-policy-binding firebase-client-email \
  --member="serviceAccount:service-$(gcloud projects describe pau-henriques-web-v1 --format='value(projectNumber)')@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=pau-henriques-web-v1

gcloud secrets add-iam-policy-binding firebase-private-key \
  --member="serviceAccount:service-$(gcloud projects describe pau-henriques-web-v1 --format='value(projectNumber)')@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=pau-henriques-web-v1
```

---

## 🧪 Verificar Configuración

### Listar secretos creados

```bash
gcloud secrets list --project=pau-henriques-web-v1
```

### Verificar acceso

```bash
gcloud secrets get-iam-policy firebase-client-email \
  --project=pau-henriques-web-v1
```

Debe mostrar el service account de App Hosting con rol `secretAccessor`.

---

## 🚀 Desplegar

Una vez configurados los secretos:

```bash
# 1. Build
npm run build

# 2. Deploy
firebase deploy --only hosting
```

Firebase App Hosting:

1. Lee `apphosting.yaml`
2. Detecta referencias a secretos (`secret: "firebase-client-email"`)
3. Obtiene los valores de Cloud Secret Manager
4. Inyecta las variables de entorno en el contenedor
5. Tu app lee `process.env.FIREBASE_CLIENT_EMAIL` normalmente

---

## 🔄 Actualizar un Secreto

Si necesitas rotar la clave privada:

```bash
# Añadir nueva versión
echo -n "NUEVA_CLAVE_PRIVADA" | \
  gcloud secrets versions add firebase-private-key \
  --data-file=- \
  --project=pau-henriques-web-v1

# App Hosting automáticamente usa la versión más reciente
# Si necesitas una versión específica, usa:
# secret: "firebase-private-key@5"  (para versión 5)
```

---

## 🐛 Troubleshooting

### Error: "Permission denied on resource"

- Solución: Ejecuta `firebase apphosting:secrets:grantaccess` para cada secreto

### Error: "Secret not found"

- Solución: Verifica que el nombre del secreto en `apphosting.yaml` coincida exactamente con el creado

### Variables no se cargan en producción

- Verifica logs: `firebase apphosting:logs`
- Busca errores de Secret Manager
- Asegúrate de que el build incluye las variables (`.env.local` debe estar presente durante `npm run build`)

---

## 📚 Referencias

- [Firebase App Hosting Secrets](https://firebase.google.com/docs/hosting/cloud-run/secrets)
- [Cloud Secret Manager](https://cloud.google.com/secret-manager/docs)
- [IAM Roles for Secret Manager](https://cloud.google.com/secret-manager/docs/access-control)

---

## ⚠️ Importante

- **Nunca** subas valores reales de secretos a Git
- `apphosting.yaml` con referencias **SÍ es seguro** subir a Git
- Los secretos se facturan por uso (mínimo $0.06/mes por secreto en 2024)
- Cada proyecto de Google Cloud tiene límite de 10,000 secretos
