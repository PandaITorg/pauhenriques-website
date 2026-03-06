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
    const firebaseModule = require("@/lib/firebase");
    console.log("[firebase-auth] Required firebase module:", firebaseModule);
    console.log(
      "[firebase-auth] firebaseApp from module:",
      firebaseModule.firebaseApp,
    );
    const { firebaseApp } = firebaseModule;

    if (!firebaseApp) {
      console.error("[firebase-auth] firebaseApp is null or undefined!");
      throw new Error("Firebase app is not initialized");
    }

    _auth = getAuth(firebaseApp) as Auth;
    console.log("[firebase-auth] Auth created successfully:", _auth);
  } else {
    console.log("[firebase-auth] Reusing existing auth instance");
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
    console.log("[firebase-auth] GoogleProvider created with custom params");
  } else {
    console.log("[firebase-auth] GoogleProvider reused");
  }
  return _googleProvider!;
}
