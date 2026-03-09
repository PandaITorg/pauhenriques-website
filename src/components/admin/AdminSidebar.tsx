"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaBox,
  FaClipboardList,
  FaTachometerAlt,
  FaBars,
  FaTimes,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: FaTachometerAlt },
  { href: "/admin/productos", label: "Productos", icon: FaBox },
  { href: "/admin/pedidos", label: "Pedidos", icon: FaClipboardList },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const nav = (
    <nav className="flex flex-col h-full p-4">
      <div className="text-xs font-bold text-text-main/40 uppercase tracking-wider mb-4 px-3">
        Admin Panel
      </div>
      <div className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-primary text-white"
                : "text-text-main/60 hover:bg-surface-elevated hover:text-text-main"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </div>

      {/* Divider + Ver sitio */}
      <div className="mt-auto pt-4 border-t border-border-subtle">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-main/40 hover:text-text-main/60 transition-colors"
        >
          <FaExternalLinkAlt className="w-3.5 h-3.5" />
          Ver sitio
        </Link>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-surface-card border border-border-subtle rounded-lg p-2.5 text-text-main/60"
      >
        {open ? (
          <FaTimes className="w-5 h-5" />
        ) : (
          <FaBars className="w-5 h-5" />
        )}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full w-60 bg-surface-card border-r border-border-subtle z-40 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {nav}
      </aside>
    </>
  );
}
