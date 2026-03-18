"use client";

import { useEffect, useState } from "react";
import { FaBox, FaClipboardList, FaClock, FaUsers } from "react-icons/fa";
import Link from "next/link";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  recentOrders: number;
}

const KPI_CARDS = [
  {
    key: "totalProducts",
    label: "Productos Activos",
    icon: FaBox,
    color: "bg-primary/15 text-primary",
    href: "/admin/productos",
  },
  {
    key: "totalOrders",
    label: "Pedidos Totales",
    icon: FaClipboardList,
    color: "bg-success/15 text-success",
    href: "/admin/pedidos",
  },
  {
    key: "recentOrders",
    label: "Pedidos Recientes",
    icon: FaClock,
    color: "bg-warning/15 text-warning",
    href: null,
  },
  {
    key: null,
    label: "Clientes",
    icon: FaUsers,
    color: "bg-info/15 text-info",
    href: null,
  },
] as const;

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  function getValue(key: string | null): string {
    if (!stats || !key) return "—";
    return String((stats as unknown as Record<string, number>)[key] ?? "—");
  }

  return (
    <div>
      {/* ── Header with gradient ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/40 to-background" />
        <div className="relative px-5 lg:px-8 pt-6 pb-4 md:pt-8 md:pb-6">
          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-1">
            Panel de control
          </span>
          <h1 className="text-2xl font-semibold text-text-main">Dashboard</h1>
        </div>
      </div>

      {/* ── Separator ── */}
      <div className="h-px bg-linear-to-r from-transparent via-border-default to-transparent" />

      {/* ── Content ── */}
      <div className="px-5 lg:px-8 py-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          {KPI_CARDS.map((card, i) => {
            const cardClass =
              "bg-surface-card border border-border-subtle rounded-xl p-4 md:p-5 hover:border-primary/30 hover:shadow-(--shadow-glow-primary) transition-all duration-200";

            const content = loading ? (
              <div className="animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-surface-elevated mb-3" />
                <div className="h-3 w-20 bg-surface-elevated rounded mb-2" />
                <div className="h-7 w-12 bg-surface-elevated rounded" />
              </div>
            ) : (
              <>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}
                >
                  <card.icon className="w-4.5 h-4.5" />
                </div>
                <p className="text-xs text-text-main/50 mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-text-main">
                  {getValue(card.key)}
                </p>
              </>
            );

            return card.href ? (
              <Link key={i} href={card.href} className={`${cardClass} cursor-pointer`}>
                {content}
              </Link>
            ) : (
              <div key={i} className={cardClass}>
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
