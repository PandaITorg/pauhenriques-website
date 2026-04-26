// Dominio "Talleres" — separado de products. Cada Taller representa un evento
// en vivo (curso/workshop) que se vende exclusivamente vía paymentLinks.
// Lifecycle, persistencia y rules son propias (firestore.rules → /talleres).

export interface TallerDiscountTier {
  // Precio final CON IVA que paga el cliente en este tier.
  finalPrice: number;
  label: string;
  // ISO string. El tier deja de aplicar después de esta fecha.
  validUntil: string;
}

export interface Taller {
  id: string;
  // Slug humano usado en logs y CSVs. Debe ser único, solo
  // [a-z0-9-]. Ejemplo: "toxica-sin-toxicos".
  slug: string;
  name: string;
  brand: string;
  shortDescription: string;
  longDescription: string;
  // URL pública (Firebase Storage o /assets local).
  coverImage: string;
  // Precio base CON IVA (lo que paga el cliente sin ningún descuento aplicado).
  basePrice: number;
  // Tiers programados (opcional). Solo se usan en flujos sin paymentLink fijo.
  // Cuando un paymentLink define `price`, ese precio gana sobre cualquier tier.
  discountTiers: TallerDiscountTier[];
  // Mensaje que se muestra en la pantalla de éxito y email post-compra.
  postPurchaseNote: string;
  // WhatsApp del organizador/instructor (formato wa.me, sin '+').
  // Único lugar autorizado para usar números distintos al general del sitio
  // (ver CLAUDE.md → "Regla para organizadores externos").
  whatsappContact: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Input para crear/actualizar un Taller desde el admin.
// `id` y timestamps los maneja el server.
export interface TallerInput {
  slug: string;
  name: string;
  brand: string;
  shortDescription: string;
  longDescription: string;
  coverImage: string;
  basePrice: number;
  discountTiers: TallerDiscountTier[];
  postPurchaseNote: string;
  whatsappContact: string | null;
  active: boolean;
}

export const TALLER_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const TALLER_PRICE_MIN = 1;
export const TALLER_PRICE_MAX = 5000;

// Imagen por defecto cuando el admin crea un taller sin subir imagen
// propia. Misma imagen que usa la sección Podcast en la home (Tóxica
// sin Tóxicos) — sirve como placeholder hasta que Pau suba la real.
export const DEFAULT_TALLER_COVER_IMAGE = "/assets/de-toxica-a-sin-toxicos.jpg";

export function isValidTallerSlug(slug: string): boolean {
  return (
    typeof slug === "string" &&
    slug.length >= 3 &&
    slug.length <= 60 &&
    TALLER_SLUG_REGEX.test(slug)
  );
}
