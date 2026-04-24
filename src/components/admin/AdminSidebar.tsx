"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaBox,
  FaClipboardList,
  FaTachometerAlt,
  FaTag,
  FaBars,
  FaTimes,
  FaExternalLinkAlt,
  FaGift,
  FaHome,
  FaExclamationTriangle,
  FaGraduationCap,
  FaUsers,
} from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AdminSection, hasAccess } from "@/lib/auth/roles";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: AdminSection;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: FaTachometerAlt, section: "dashboard" },
  { href: "/admin/homepage", label: "Homepage", icon: FaHome, section: "homepage" },
  { href: "/admin/productos", label: "Productos", icon: FaBox, section: "productos" },
  { href: "/admin/pedidos", label: "Pedidos", icon: FaClipboardList, section: "pedidos" },
  { href: "/admin/cursos", label: "Cursos", icon: FaGraduationCap, section: "cursos" },
  { href: "/admin/promociones", label: "Promociones", icon: FaTag, section: "promociones" },
  { href: "/admin/plan-novios", label: "Plan Novios", icon: FaGift, section: "planNovios" },
  { href: "/admin/auditoria", label: "Auditoría", icon: FaExclamationTriangle, section: "auditoria" },
  { href: "/admin/usuarios", label: "Usuarios", icon: FaUsers, section: "usuarios" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const [auditCount, setAuditCount] = useState<number>(0);
  const [cursosPendingCount, setCursosPendingCount] = useState<number>(0);

  const navItems = useMemo(
    () => ALL_NAV_ITEMS.filter((item) => hasAccess(role, item.section)),
    [role],
  );

  const canSeeAudit = hasAccess(role, "auditoria");
  const canSeeCursos = hasAccess(role, "cursos");

  useEffect(() => {
    if (canSeeAudit) {
      fetch("/api/admin/auditoria")
        .then((r) => (r.ok ? r.json() : { orders: [] }))
        .then((d) => setAuditCount((d.orders || []).length))
        .catch(() => {});
    } else {
      setAuditCount(0);
    }

    if (canSeeCursos) {
      fetch("/api/admin/cursos/enrollments?accessStatus=pending_access")
        .then((r) => (r.ok ? r.json() : []))
        .then((list) => setCursosPendingCount(Array.isArray(list) ? list.length : 0))
        .catch(() => {});
    } else {
      setCursosPendingCount(0);
    }
  }, [pathname, canSeeAudit, canSeeCursos]);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const nav = (
    <nav className="flex flex-col h-full p-4">
      <div className="px-3 mb-6">
        <p className="font-cormorant text-lg font-semibold text-text-main">
          Pau Henriques
        </p>
        <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-primary/60">
          Admin Panel
        </p>
      </div>

      <div className="flex flex-col gap-1">
        {navItems.map((item) => {
          let badgeCount = 0;
          if (item.href === "/admin/auditoria") badgeCount = auditCount;
          if (item.href === "/admin/cursos") badgeCount = cursosPendingCount;
          const showBadge = badgeCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-primary text-white shadow-(--shadow-glow-primary)"
                  : "text-text-main/60 hover:bg-surface-elevated hover:text-text-main"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="bg-warning text-bg-main text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center">
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-border-subtle">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-text-main/40 hover:text-text-main/60 hover:bg-surface-elevated transition-colors"
        >
          <FaExternalLinkAlt className="w-3.5 h-3.5" />
          Ver sitio
        </Link>
      </div>
    </nav>
  );

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-3 left-3 z-50 w-11 h-11 bg-surface-card border border-border-subtle rounded-xl flex items-center justify-center text-text-main/60 hover:text-text-main transition-colors cursor-pointer"
        aria-label={open ? "Cerrar menu" : "Abrir menu"}
      >
        {open ? (
          <FaTimes className="w-4.5 h-4.5" />
        ) : (
          <FaBars className="w-4.5 h-4.5" />
        )}
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 h-full w-64 bg-surface-card border-r border-border-subtle z-40 transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {nav}
      </aside>
    </>
  );
}
