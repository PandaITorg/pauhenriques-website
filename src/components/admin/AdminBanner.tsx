"use client";

import { useAuth } from "@/context/AuthContext";
import { FaCog } from "react-icons/fa";

// Banner que se muestra cuando un user con rol admin/staff/cursos está
// logueado en el sitio público. El link va al subdomain admin
// (pauhenriques.com/admin no existe — el panel solo vive en
// admin.pauhenriques.com). Es <a> normal en lugar de <Link> porque es
// cross-origin.
//
// NO se muestra cuando el user ya está navegando admin.pauhenriques.com
// (banner sería redundante).
export default function AdminBanner() {
  const { user, isAdmin } = useAuth();

  if (!isAdmin || !user) return null;

  // Esconder en el subdomain admin — el sidebar ya tiene el contexto.
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "admin.pauhenriques.com"
  ) {
    return null;
  }

  return (
    <div className="bg-surface-elevated text-text-main text-xs py-1.5 px-4 flex items-center justify-between z-50 border-b border-border-subtle">
      <div className="flex items-center gap-2">
        <span className="bg-warning text-background font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
          Admin
        </span>
        <span className="text-text-main/50">
          {user.displayName || user.email}
        </span>
      </div>
      <a
        href="https://admin.pauhenriques.com/admin"
        className="flex items-center gap-1.5 text-text-main/50 hover:text-primary transition-colors"
      >
        <FaCog className="w-3 h-3" />
        Panel de Admin
      </a>
    </div>
  );
}
