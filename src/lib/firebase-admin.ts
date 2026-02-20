import admin from 'firebase-admin';

// Evitar la reinicialización en entornos de desarrollo con hot-reloading
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Asegura el formato correcto de la clave privada
      }),
    });
    console.log('Firebase Admin SDK inicializado correctamente.');
  } catch (error: any) {
    console.error('Error al inicializar Firebase Admin SDK:', error.message);
  }
}

export const auth = admin.auth();
export const dbAdmin = admin.firestore();
