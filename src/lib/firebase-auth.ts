// Este archivo SOLO debe importarse en componentes "use client"
// Nunca en Server Components, Server Actions, o API Routes
//
// Las funciones son lazy para evitar inicialización durante SSR/prerendering

import type { Auth } from "firebase/auth";
import type { GoogleAuthProvider } from "firebase/auth";

let _auth: Auth | null = null;
let _googleProvider: GoogleAuthProvider | null = null;

export function getClientAuth(): Auth {
  if (!_auth) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAuth } = require("firebase/auth");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { firebaseApp } = require("@/lib/firebase");
    _auth = getAuth(firebaseApp) as Auth;
  }
  return _auth!;
}

export function getClientGoogleProvider(): GoogleAuthProvider {
  if (!_googleProvider) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleAuthProvider } = require("firebase/auth");
    _googleProvider = new GoogleAuthProvider() as GoogleAuthProvider;
    (_googleProvider as GoogleAuthProvider).setCustomParameters({
      prompt: "select_account",
    });
  }
  return _googleProvider!;
}
