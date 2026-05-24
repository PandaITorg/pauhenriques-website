// Pau-specific payment-link domain types.
//
// The @pandait.tech/payment-nuvei package exposes only generic payment-link
// PRIMITIVES (token generation, expiry helpers, price bounds) — the shape of a
// payment-link document is consumer-specific (here it points to a Taller), so
// it lives in Pau, not the package.

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
