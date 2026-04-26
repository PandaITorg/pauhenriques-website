// Helpers para construir URLs públicas DESDE el panel admin.
// Importante: el admin se sirve en admin.pauhenriques.com pero los
// links que se copian para enviar a clientes deben apuntar SIEMPRE al
// sitio público (pauhenriques.com). Si usamos window.location.origin
// directo, los URLs salen con el subdomain admin y los clientes no
// pueden abrirlos (admin requiere sesión).

const PUBLIC_ORIGIN = "https://pauhenriques.com";

/**
 * Devuelve el origin del sitio público:
 * - localhost/127.0.0.1 → window.location.origin (dev local)
 * - cualquier otro host → siempre https://pauhenriques.com
 */
export function getPublicOrigin(): string {
  if (typeof window === "undefined") return PUBLIC_ORIGIN;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return window.location.origin;
  }
  return PUBLIC_ORIGIN;
}

/** URL pública del paymentLink (privado) por token. */
export function buildPaymentLinkUrl(token: string): string {
  return `${getPublicOrigin()}/pago/t/${token}`;
}

/** URL pública oficial del taller por slug. */
export function buildTallerOfficialUrl(slug: string): string {
  return `${getPublicOrigin()}/pago/${slug}`;
}
