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
      <h1 className="text-2xl font-semibold text-text-main mb-6">Dashboard</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {KPI_CARDS.map((card, i) => {
          const cardClass =
            "bg-surface-card border border-border-subtle rounded-xl p-5 hover:border-border-strong transition-colors";

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
            <Link key={i} href={card.href} className={cardClass}>
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
  );
}
