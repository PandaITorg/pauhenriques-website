export type Role = "admin" | "staff" | "cursos";

export const ROLES: readonly Role[] = ["admin", "staff", "cursos"] as const;

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  staff: "Staff / Ventas",
  cursos: "Talleres",
};

export type AdminSection =
  | "dashboard"
  | "pedidos"
  | "productos"
  | "promociones"
  | "planNovios"
  | "cursos"
  | "homepage"
  | "auditoria"
  | "usuarios";

export const ROLE_ACCESS: Record<AdminSection, readonly Role[]> = {
  dashboard: ["admin", "staff", "cursos"],
  pedidos: ["admin", "staff"],
  productos: ["admin", "staff"],
  promociones: ["admin", "staff"],
  planNovios: ["admin", "staff"],
  cursos: ["admin", "cursos"],
  homepage: ["admin"],
  auditoria: ["admin", "staff"],
  usuarios: ["admin"],
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function getRoleFromClaims(
  claims: Record<string, unknown> | undefined | null,
): Role | null {
  if (!claims) return null;
  if (isRole(claims.role)) return claims.role;
  if (claims.admin === true) return "admin";
  return null;
}

export function hasAccess(role: Role | null, section: AdminSection): boolean {
  if (!role) return false;
  return (ROLE_ACCESS[section] as readonly Role[]).includes(role);
}

export function canAccessAnyAdminRoute(role: Role | null): boolean {
  return role !== null;
}
