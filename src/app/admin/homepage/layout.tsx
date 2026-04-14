"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaImage, FaLayerGroup, FaStar } from "react-icons/fa";

const TABS = [
  { href: "/admin/homepage", label: "Hero Slides", icon: FaImage, match: "exact" as const },
  { href: "/admin/homepage/carico", label: "Categorías Carico", icon: FaLayerGroup, match: "prefix" as const },
  { href: "/admin/homepage/wellme", label: "Productos destacados", icon: FaStar, match: "prefix" as const },
];

export default function AdminHomepageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <div className="border-b border-border-subtle bg-surface-card/40">
        <div className="px-4 md:px-8 pt-4">
          <h1 className="text-lg font-semibold text-text-main mb-3">Homepage</h1>
          <nav className="flex gap-1">
            {TABS.map((tab) => {
              const active =
                tab.match === "exact"
                  ? pathname === tab.href
                  : pathname.startsWith(tab.href);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    active
                      ? "text-primary border-primary"
                      : "text-text-main/50 hover:text-text-main border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
