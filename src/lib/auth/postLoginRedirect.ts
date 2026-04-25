import type { Role } from "./roles";

// Sesiones HOST-ONLY: cada subdominio tiene su propia sesión. NO hay
// redirects cross-domain — el cookie no se comparte y mandar al user
// a otro subdomain lo dejaría sin sesión.

const ADMIN_HOST = "admin.pauhenriques.com";
const DEFAULT_PUBLIC_REDIRECT = "/tienda";
const ADMIN_HOME = "/admin";

export interface PostLoginRedirectInput {
  /** Role del user (admin/staff/cursos) o null si no es admin. */
  role: Role | null;
  /** Query param ?redirect_uri= (si vino de un guard). */
  requestedRedirect: string | null;
  /** window.location.hostname al momento de hacer login. */
  currentHostname: string;
}

export interface PostLoginRedirectAction {
  /**
   * Path destino. Si es null → NO auto-redirect (caller debe mostrar
   * UI especial: el user no tiene permiso para estar en este host).
   */
  path: string | null;
  /**
   * Si true → el user logueó en admin host pero no tiene rol válido.
   * El caller debe mostrar UI con botón de signOut + mensaje "esta
   * cuenta no tiene acceso al panel".
   */
  blockedNoRole?: boolean;
}

/**
 * Decide a dónde mandar al usuario después de un login exitoso.
 * Sesiones separadas por subdomain — no hay cross-domain.
 */
export function computePostLoginRedirect(
  input: PostLoginRedirectInput,
): PostLoginRedirectAction {
  const { role, requestedRedirect, currentHostname } = input;
  const isOnAdminHost = currentHostname === ADMIN_HOST;
  const isAdmin = role !== null;
  const safeRequested =
    requestedRedirect && requestedRedirect.startsWith("/")
      ? requestedRedirect
      : null;

  // Caso 1: Admin (cualquier rol) en admin host → al panel
  if (isOnAdminHost && isAdmin) {
    return { path: safeRequested || ADMIN_HOME };
  }

  // Caso 2: Cliente corriente en admin host → BLOQUEAR.
  // No tiene sentido tener cliente con sesión en este subdomain. El
  // caller debe mostrar UI con signOut.
  if (isOnAdminHost && !isAdmin) {
    return { path: null, blockedNoRole: true };
  }

  // Caso 3: Cualquier user en host público.
  // Si pidió /admin (vino de un link viejo), ignorar y mandar a tienda
  // — la cookie no se comparte cross-domain, no podemos llevarlo allá.
  const reqStartsWithAdmin = safeRequested?.startsWith("/admin") === true;
  if (reqStartsWithAdmin) {
    return { path: DEFAULT_PUBLIC_REDIRECT };
  }
  return { path: safeRequested || DEFAULT_PUBLIC_REDIRECT };
}
