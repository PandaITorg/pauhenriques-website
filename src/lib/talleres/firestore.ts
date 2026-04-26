import { Timestamp } from "firebase-admin/firestore";
import type { Taller, TallerDiscountTier } from "./types";

function toIso(v: unknown): string | null {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return null;
}

function parseDiscountTiers(v: unknown): TallerDiscountTier[] {
  if (!Array.isArray(v)) return [];
  const out: TallerDiscountTier[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== "object") continue;
    const t = raw as Record<string, unknown>;
    const finalPrice = typeof t.finalPrice === "number" ? t.finalPrice : null;
    const label = typeof t.label === "string" ? t.label : null;
    const validUntil = toIso(t.validUntil);
    if (finalPrice === null || !label || !validUntil) continue;
    out.push({ finalPrice, label, validUntil });
  }
  return out;
}

export function docToTaller(doc: FirebaseFirestore.DocumentSnapshot): Taller {
  const d = doc.data() ?? {};
  return {
    id: doc.id,
    slug: typeof d.slug === "string" ? d.slug : "",
    name: typeof d.name === "string" ? d.name : "",
    brand: typeof d.brand === "string" ? d.brand : "",
    shortDescription: typeof d.shortDescription === "string" ? d.shortDescription : "",
    longDescription: typeof d.longDescription === "string" ? d.longDescription : "",
    coverImage: typeof d.coverImage === "string" ? d.coverImage : "",
    coverImageThumb:
      typeof d.coverImageThumb === "string" ? d.coverImageThumb : "",
    basePrice: typeof d.basePrice === "number" ? d.basePrice : 0,
    discountTiers: parseDiscountTiers(d.discountTiers),
    postPurchaseNote: typeof d.postPurchaseNote === "string" ? d.postPurchaseNote : "",
    whatsappContact: typeof d.whatsappContact === "string" ? d.whatsappContact : null,
    active: d.active !== false,
    createdAt: toIso(d.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(d.updatedAt) ?? new Date().toISOString(),
  };
}
