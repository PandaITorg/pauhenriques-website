import { dbAdmin } from "@/lib/firebase-admin";

/**
 * Simple Firestore-backed rate limiter. Sliding window by timestamp array.
 *
 * Usage:
 *   const allowed = await checkRateLimit(`charge:${ip}`, 5, 15 * 60 * 1000);
 *   if (!allowed) return 429;
 *
 * Returns true when the call is allowed (and records the hit), false when
 * the caller has exceeded maxHits in the windowMs window.
 *
 * Best-effort: if Admin SDK is unavailable (build-time or misconfig) we fail
 * open to avoid blocking real traffic.
 */
export async function checkRateLimit(
  key: string,
  maxHits: number,
  windowMs: number,
): Promise<boolean> {
  if (!dbAdmin) return true;

  const now = Date.now();
  const windowStart = now - windowMs;
  const ref = dbAdmin.collection("rateLimits").doc(encodeKey(key));

  try {
    const allowed = await dbAdmin.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const raw: number[] = snap.exists ? (snap.data()?.hits ?? []) : [];
      const recent = raw.filter((t) => t > windowStart);
      if (recent.length >= maxHits) return false;
      recent.push(now);
      tx.set(ref, { hits: recent, updatedAt: now });
      return true;
    });
    return allowed;
  } catch (err) {
    console.error("[rateLimit] transaction failed, failing open:", err);
    return true;
  }
}

function encodeKey(key: string): string {
  return key.replace(/[\/]/g, "_");
}
