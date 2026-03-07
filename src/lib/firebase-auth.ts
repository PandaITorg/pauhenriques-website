// Este archivo SOLO debe importarse en componentes "use client"
// Nunca en Server Components, Server Actions, o API Routes
//
// Las funciones son lazy para evitar inicialización durante SSR/prerendering

import type { Auth, UserCredential } from "firebase/auth";

let _auth: Auth | null = null;
let _firebaseAuthModule: typeof import("firebase/auth") | null = null;

function getFirebaseAuthModule() {
  if (!_firebaseAuthModule) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _firebaseAuthModule = require("firebase/auth");
  }
  return _firebaseAuthModule!;
}

export function getClientAuth(): Auth {
  if (!_auth) {
    const { getAuth } = getFirebaseAuthModule();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { firebaseApp } = require("@/lib/firebase");

    if (!firebaseApp) {
      throw new Error("Firebase app is not initialized");
    }

    _auth = getAuth(firebaseApp);
  }
  return _auth!;
}

export function signInWithGoogle(): Promise<UserCredential> {
  const mod = getFirebaseAuthModule();
  const auth = getClientAuth();
  const provider = new mod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return mod.signInWithPopup(auth, provider);
}
