import type { Role } from "./roles";

// Hostnames duros para post-login routing. Si un día se agrega otro
// subdominio, este es el lugar centralizar la lógica.
const ADMIN_HOST = "admin.pauhenriques.com";
const PUBLIC_ORIGIN = "https://pauhenriques.com";
const ADMIN_ORIGIN = `https://${ADMIN_HOST}`;

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
   * Si está set → cambio de origin requerido. Usar window.location.href.
   * Si null → mismo origin, usar router.push(path).
   */
  externalUrl: string | null;
  /** Path interno (siempre disponible para el caso same-origin). */
  path: string;
}

/**
 * Decide a dónde mandar al usuario después de un login exitoso.
 * Implementa los 4 casos según el host actual y el rol del usuario.
 */
export function computePostLoginRedirect(
  input: PostLoginRedirectInput,
): PostLoginRedirectAction {
  const { role, requestedRedirect, currentHostname } = input;
  const isOnAdminHost = currentHostname === ADMIN_HOST;
  const isAdmin = role !== null;
  const reqStartsWithAdmin = requestedRedirect?.startsWith("/admin") === true;
  const safeRequested =
    requestedRedirect && requestedRedirect.startsWith("/")
      ? requestedRedirect
      : null;

  // Caso 1: Admin en admin host → al admin panel (respetar redirect_uri si es de admin)
  if (isOnAdminHost && isAdmin) {
    return {
      externalUrl: null,
      path: safeRequested || ADMIN_HOME,
    };
  }

  // Caso 2: User corriente en admin host → redirigir cross-domain al sitio público.
  // Ignoramos cualquier redirect_uri /admin (no tiene sentido).
  if (isOnAdminHost && !isAdmin) {
    const target =
      safeRequested && !reqStartsWithAdmin
        ? safeRequested
        : DEFAULT_PUBLIC_REDIRECT;
    return {
      externalUrl: `${PUBLIC_ORIGIN}${target}`,
      path: target,
    };
  }

  // Caso 3: Admin en host público pidiendo explícitamente /admin →
  // redirigir cross-domain al subdominio admin.
  if (!isOnAdminHost && isAdmin && reqStartsWithAdmin) {
    return {
      externalUrl: `${ADMIN_ORIGIN}${safeRequested}`,
      path: safeRequested!,
    };
  }

  // Caso 4: Cualquier user en host público → respetar redirect_uri o default.
  return {
    externalUrl: null,
    path: safeRequested || DEFAULT_PUBLIC_REDIRECT,
  };
}
