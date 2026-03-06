import admin from "firebase-admin";

// Evitar la reinicialización en entornos de desarrollo con hot-reloading
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // Asegura el formato correcto de la clave privada
      }),
    });
    console.log("Firebase Admin SDK inicializado correctamente.");
  } catch (error: unknown) {
    // En build time las variables de entorno no están disponibles — es esperado
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes("project_id")) {
      console.error("Error al inicializar Firebase Admin SDK:", errorMessage);
    }
  }
}

// Exportar con fallback seguro para build time
export const auth = admin.apps.length
  ? admin.auth()
  : (null as unknown as admin.auth.Auth);
export const dbAdmin = admin.apps.length
  ? admin.firestore()
  : (null as unknown as admin.firestore.Firestore);
