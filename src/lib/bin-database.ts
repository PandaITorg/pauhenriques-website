/**
 * Client-side BIN lookup with localStorage cache.
 * The database lives in Firestore at config/bins and is served via /api/bins.
 *
 * Strategy:
 *  - On first call, fetch /api/bins (cached at the CDN level via Cache-Control headers)
 *  - Cache result in localStorage with the version key
 *  - Subsequent calls read from memory; if version mismatches, re-fetch
 */

import type { BinDatabase, BinInfo } from "@/types/bin";

const STORAGE_KEY = "binDatabase_v1";
let memoryCache: BinDatabase | null = null;
let inflight: Promise<BinDatabase | null> | null = null;

function readFromStorage(): BinDatabase | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BinDatabase;
    if (parsed && parsed.data && typeof parsed.data === "object") return parsed;
  } catch {
    /* corrupted cache, ignore */
  }
  return null;
}

function writeToStorage(db: BinDatabase) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* storage full or disabled, ignore */
  }
}

async function fetchDatabase(): Promise<BinDatabase | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/bins", { cache: "default" });
    if (!res.ok) return null;
    return (await res.json()) as BinDatabase;
  } catch {
    return null;
  }
}

/**
 * Loads the BIN database. Uses memory cache → localStorage cache → network.
 * Returns null if no database is available (lookup will return null silently).
 */
export async function getBinDatabase(): Promise<BinDatabase | null> {
  if (memoryCache) return memoryCache;

  // Use cached version while we revalidate in background
  const cached = readFromStorage();
  if (cached) {
    memoryCache = cached;
    // Background revalidate (don't await)
    if (!inflight) {
      inflight = fetchDatabase().then((fresh) => {
        if (fresh && fresh.version !== cached.version) {
          memoryCache = fresh;
          writeToStorage(fresh);
        }
        inflight = null;
        return fresh;
      });
    }
    return cached;
  }

  // No cache — fetch and wait
  if (!inflight) {
    inflight = fetchDatabase().then((fresh) => {
      if (fresh) {
        memoryCache = fresh;
        writeToStorage(fresh);
      }
      inflight = null;
      return fresh;
    });
  }
  return inflight;
}

/**
 * Looks up a BIN for a given card number string. Tries 8, 7, 6 digit prefixes.
 * Returns null if no match or database not loaded yet.
 */
export function lookupBinSync(cardNumber: string, db: BinDatabase | null): BinInfo | null {
  if (!db || !cardNumber) return null;
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 6) return null;
  // Try most specific (8) → least specific (6)
  for (const len of [8, 7, 6]) {
    const prefix = digits.slice(0, len);
    const hit = db.data[prefix];
    if (hit) return hit;
  }
  return null;
}

/**
 * Async helper that loads the DB if needed and looks up the BIN.
 */
export async function lookupBin(cardNumber: string): Promise<BinInfo | null> {
  const db = await getBinDatabase();
  return lookupBinSync(cardNumber, db);
}
