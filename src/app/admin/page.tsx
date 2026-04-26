"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaBox,
  FaClipboardList,
  FaClock,
  FaGraduationCap,
  FaPaperPlane,
  FaExclamationTriangle,
  FaHourglassHalf,
  FaCheckCircle,
  FaUserClock,
  FaShoppingBag,
} from "react-icons/fa";
import InboxCard from "@/components/admin/InboxCard";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  recentOrders: number;
  activeTalleres: number | null;
  monthEnrollments: number | null;
  recentPayments: RecentPayment[];
}

interface RecentPayment {
  orderId: string;
  total: number;
  customerName: string;
  customerEmail: string;
  paidAt: string | null;
  hasCourseId: boolean;
}

interface Inbox {
  pendingAccess: number | null;
  expiringLinks: number | null;
  missingAuthCode: number | null;
  pendingOrders: number | null;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-EC", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [statsRes, inboxRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/inbox"),
        ]);
        if (cancelled) return;
        if (statsRes.ok) setStats(await statsRes.json());
        if (inboxRes.ok) setInbox(await inboxRes.json());
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Items del inbox que tienen count > 0 (se filtran null y 0).
  const inboxItems = [
    inbox?.pendingAccess && inbox.pendingAccess > 0
      ? {
          icon: FaPaperPlane,
          tone: "warning" as const,
          title: `${inbox.pendingAccess} inscripcion${inbox.pendingAccess === 1 ? "" : "es"} esperando acceso`,
          count: inbox.pendingAccess,
          href: "/admin/talleres",
        }
      : null,
    inbox?.expiringLinks && inbox.expiringLinks > 0
      ? {
          icon: FaHourglassHalf,
          tone: "info" as const,
          title: `${inbox.expiringLinks} link${inbox.expiringLinks === 1 ? "" : "s"} de pago expira${inbox.expiringLinks === 1 ? "" : "n"} en ≤7 días`,
          count: inbox.expiringLinks,
          href: "/admin/talleres",
        }
      : null,
    inbox?.missingAuthCode && inbox.missingAuthCode > 0
      ? {
          icon: FaExclamationTriangle,
          tone: "error" as const,
          title: `${inbox.missingAuthCode} orden${inbox.missingAuthCode === 1 ? "" : "es"} sin auth_code para auditar`,
          count: inbox.missingAuthCode,
          href: "/admin/auditoria",
        }
      : null,
    inbox?.pendingOrders && inbox.pendingOrders > 0
      ? {
          icon: FaUserClock,
          tone: "primary" as const,
          title: `${inbox.pendingOrders} orden${inbox.pendingOrders === 1 ? "" : "es"} en estado "pending"`,
          count: inbox.pendingOrders,
          href: "/admin/pedidos",
        }
      : null,
  ].filter((x): x is NonNullable<typeof x> => x !== null);

  // KPIs talleres-focused: si hay datos de talleres, los priorizamos.
  // Mantenemos pedidos también por valor histórico mientras conviven.
  const kpiCards = [
    stats?.activeTalleres !== null && stats?.activeTalleres !== undefined
      ? {
          label: "Talleres activos",
          value: stats.activeTalleres,
          icon: FaGraduationCap,
          color: "bg-primary/15 text-primary",
          href: "/admin/talleres",
        }
      : null,
    stats?.monthEnrollments !== null && stats?.monthEnrollments !== undefined
      ? {
          label: "Inscripciones del mes",
          value: stats.monthEnrollments,
          icon: FaClipboardList,
          color: "bg-success/15 text-success",
          href: "/admin/talleres",
        }
      : null,
    {
      label: "Pedidos del mes",
      value: stats?.recentOrders ?? 0,
      icon: FaClock,
      color: "bg-warning/15 text-warning",
      href: "/admin/pedidos",
    },
    {
      label: "Productos en catálogo",
      value: stats?.totalProducts ?? 0,
      icon: FaBox,
      color: "bg-info/15 text-info",
      href: "/admin/productos",
    },
  ].filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/40 to-background" />
        <div className="relative px-5 lg:px-8 pt-6 pb-4 md:pt-8 md:pb-6">
          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-1">
            Panel de control
          </span>
          <h1 className="text-2xl font-semibold text-text-main">Dashboard</h1>
        </div>
      </div>
      <div className="h-px bg-linear-to-r from-transparent via-border-default to-transparent" />

      <div className="px-5 lg:px-8 py-6 space-y-8">
        {/* ── Atención requerida ── */}
        <section>
          <h2 className="text-sm font-semibold text-text-main/70 uppercase tracking-wider mb-3">
            Atención requerida
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="bg-surface-card border border-border-subtle rounded-xl p-5 animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-surface-elevated" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-48 bg-surface-elevated rounded" />
                      <div className="h-7 w-12 bg-surface-elevated rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : inboxItems.length === 0 ? (
            <div className="bg-surface-card border border-success/20 rounded-xl p-6 flex items-center gap-4">
              <span className="w-11 h-11 rounded-xl bg-success/15 text-success flex items-center justify-center">
                <FaCheckCircle className="w-5 h-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-text-main">
                  Sin pendientes
                </p>
                <p className="text-xs text-text-main/50 mt-0.5">
                  Todo al día. Cuando haya algo que atender va a aparecer acá.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {inboxItems.map((item, i) => (
                <InboxCard key={i} {...item} />
              ))}
            </div>
          )}
        </section>

        {/* ── KPIs ── */}
        <section>
          <h2 className="text-sm font-semibold text-text-main/70 uppercase tracking-wider mb-3">
            Resumen
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {(loading ? Array(4).fill(null) : kpiCards).map((card, i) => {
              const cardClass =
                "bg-surface-card border border-border-subtle rounded-xl p-4 md:p-5 hover:border-primary/30 hover:shadow-(--shadow-glow-primary) transition-all duration-200";

              if (!card) {
                return (
                  <div key={i} className={cardClass}>
                    <div className="animate-pulse">
                      <div className="w-10 h-10 rounded-lg bg-surface-elevated mb-3" />
                      <div className="h-3 w-20 bg-surface-elevated rounded mb-2" />
                      <div className="h-7 w-12 bg-surface-elevated rounded" />
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={i}
                  href={card.href}
                  className={`${cardClass} cursor-pointer`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}
                  >
                    <card.icon className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-xs text-text-main/50 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-text-main">
                    {card.value}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Últimos pagos ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-main/70 uppercase tracking-wider">
              Últimos pagos
            </h2>
            <Link
              href="/admin/pedidos"
              className="text-xs text-primary hover:text-primary-hover font-medium"
            >
              Ver todos →
            </Link>
          </div>
          {loading ? (
            <div className="bg-surface-card border border-border-subtle rounded-xl p-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 animate-pulse"
                >
                  <div className="w-8 h-8 rounded-lg bg-surface-elevated" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 bg-surface-elevated rounded" />
                    <div className="h-2.5 w-48 bg-surface-elevated rounded" />
                  </div>
                  <div className="h-4 w-16 bg-surface-elevated rounded" />
                </div>
              ))}
            </div>
          ) : !stats?.recentPayments || stats.recentPayments.length === 0 ? (
            <div className="bg-surface-card border border-border-subtle rounded-xl p-8 text-center text-sm text-text-main/50">
              Aún no hay pagos confirmados.
            </div>
          ) : (
            <div className="bg-surface-card border border-border-subtle rounded-xl divide-y divide-border-subtle overflow-hidden">
              {stats.recentPayments.map((p) => (
                <Link
                  key={p.orderId}
                  href={`/admin/pedidos/${p.orderId}`}
                  className="flex items-center gap-3 p-4 hover:bg-surface-elevated transition-colors"
                >
                  <span
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      p.hasCourseId
                        ? "bg-primary/10 text-primary"
                        : "bg-info/10 text-info"
                    }`}
                  >
                    {p.hasCourseId ? (
                      <FaGraduationCap className="w-4 h-4" />
                    ) : (
                      <FaShoppingBag className="w-4 h-4" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-main truncate">
                      {p.customerName}
                    </p>
                    <p className="text-xs text-text-main/50 truncate">
                      {p.customerEmail} · {formatDateTime(p.paidAt)}
                    </p>
                  </div>
                  <span className="font-semibold text-text-main text-sm whitespace-nowrap">
                    ${p.total.toFixed(2)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
