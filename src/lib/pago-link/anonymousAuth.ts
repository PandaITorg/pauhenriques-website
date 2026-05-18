// Client-only adapter: instantiates the package's anonymous-auth helper with
// Pau's Firebase client Auth instance and the session-cookie endpoint Pau
// already exposes. Lazy so we don't initialize Firebase Auth during SSR.
//
// The original implementation lived here pre-Phase-1.5; the package now owns
// the helper logic and this file just wires it to Pau's environment.

import type { User } from "firebase/auth";
import { createAnonymousAuthHelper } from "@pandait.tech/payment-nuvei/payment-links";
import { getClientAuth } from "@/lib/firebase-auth";

let _ensureAnonymousSession:
  | ((existingUser: User | null) => Promise<User>)
  | null = null;

export async function ensureAnonymousSession(
  existingUser: User | null,
): Promise<User> {
  if (!_ensureAnonymousSession) {
    _ensureAnonymousSession = createAnonymousAuthHelper({
      auth: getClientAuth(),
      sessionEndpoint: "/api/auth/session",
    });
  }
  return _ensureAnonymousSession(existingUser);
}
