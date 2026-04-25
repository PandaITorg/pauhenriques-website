import { randomBytes } from "crypto";

export interface PaymentLinkInput {
  price: number;
  label?: string;
  publicLabel?: string;
  expiresAt: Date;
  tallerId: string;
  notes?: string;
}

export interface PaymentLink {
  id: string;
  token: string;
  tallerId: string;
  price: number;
  // Nombre interno (solo admin) — referencia para identificar el link en la
  // tabla y en el dashboard. NUNCA se muestra al cliente.
  label: string | null;
  // Etiqueta promocional visible al cliente en /pago/t/[token] junto al
  // emoji 🔥 (ej. "Promo amigas", "Última semana"). Opcional.
  publicLabel: string | null;
  notes: string | null;
  active: boolean;
  expiresAt: string;
  createdByUid: string;
  createdByEmail: string | null;
  createdByName: string | null;
  timesPaid: number;
  lastPaidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PAYMENT_LINK_PRICE_MIN = 1;
export const PAYMENT_LINK_PRICE_MAX = 2000;
export const PAYMENT_LINK_PRICE_CONFIRM_THRESHOLD = 200;
export const PAYMENT_LINK_DEFAULT_EXPIRY_DAYS = 30;

export function generatePaymentLinkToken(): string {
  // 12 bytes → 16 chars base64url, suficientemente largo para evitar adivinanza
  // (2^96 combinaciones) y lo bastante corto para un URL amigable.
  return randomBytes(12)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function defaultExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + PAYMENT_LINK_DEFAULT_EXPIRY_DAYS);
  return d;
}

export function isExpired(expiresAt: Date | string): boolean {
  const iso = typeof expiresAt === "string" ? expiresAt : expiresAt.toISOString();
  return new Date(iso).getTime() < Date.now();
}
