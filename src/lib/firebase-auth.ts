// Este archivo SOLO debe importarse en componentes "use client"
// Nunca en Server Components, Server Actions, o API Routes
//
// Las funciones son lazy para evitar inicialización durante SSR/prerendering

import type { Auth, GoogleAuthProvider as GoogleAuthProviderType } from "firebase/auth";

let _auth: Auth | null = null;
let _googleProvider: GoogleAuthProviderType | null = null;

export function getClientAuth(): Auth {
  if (!_auth) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAuth } = require("firebase/auth");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { firebaseApp } = require("@/lib/firebase");

    if (!firebaseApp) {
      throw new Error("Firebase app is not initialized");
    }

    _auth = getAuth(firebaseApp) as Auth;
  }
  return _auth!;
}

export function getClientGoogleProvider(): GoogleAuthProviderType {
  if (!_googleProvider) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleAuthProvider } = require("firebase/auth");
    _googleProvider = new GoogleAuthProvider() as GoogleAuthProviderType;
    _googleProvider!.setCustomParameters({ prompt: "select_account" });
  }
  return _googleProvider!;
}
