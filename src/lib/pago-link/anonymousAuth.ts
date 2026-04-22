// Client-only helper: sign in anonymously and establish session cookie so the
// guest checkout flow can reuse the existing Nuvei pipeline (init-checkout,
// charge, 3DS, etc.) which requires a valid __session cookie.

import type { User } from "firebase/auth";

/**
 * Ensure an anonymous Firebase user exists and the server session cookie is set.
 * Idempotent: if a user is already signed in, just refreshes the session cookie.
 */
export async function ensureAnonymousSession(existingUser: User | null): Promise<User> {
  const { getClientAuth } = await import("@/lib/firebase-auth");
  const auth = getClientAuth();

  let user = existingUser ?? auth.currentUser;

  if (!user) {
    const { signInAnonymously } = await import("firebase/auth");
    const cred = await signInAnonymously(auth);
    user = cred.user;
  }

  const idToken = await user.getIdToken(/* forceRefresh */ true);
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    throw new Error(`No se pudo establecer la sesión (${res.status})`);
  }

  return user;
}
