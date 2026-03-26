"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { FaSearch } from "react-icons/fa";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  paid: "Pagado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  processing: "bg-info/15 text-info",
  paid: "bg-success/15 text-success",
  shipped: "bg-primary/15 text-primary",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-error/15 text-error",
};

interface OrderRow {
  id: string;
  userId: string;
  total: number;
  status: string;
  createdAt: string | null;
  items: { name: string; quantity: number }[];
  shippingAddress?: { fullName: string };
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const url = statusFilter
          ? `/api/admin/orders?status=${statusFilter}`
          : "/api/admin/orders";
        const res = await fetch(url);
        if (res.ok) {
          setOrders(await res.json());
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    fetchOrders();
  }, [statusFilter]);

  const filtered = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.shippingAddress?.fullName?.toLowerCase().includes(q),
    );
  }, [orders, search]);

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const inputClass =
    "bg-input-bg border border-border-default rounded-xl text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200";

  return (
    <div>
      {/* ── Header with gradient ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/40 to-background" />
        <div className="relative px-5 lg:px-8 pt-6 pb-4 md:pt-8 md:pb-6">
          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-1">
            Gestion
          </span>
          <h1 className="text-2xl font-semibold text-text-main">Pedidos</h1>
        </div>
      </div>

      {/* ── Separator ── */}
      <div className="h-px bg-linear-to-r from-transparent via-border-default to-transparent" />

      {/* ── Content ── */}
      <div className="px-5 lg:px-8 py-6">

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-main/30" />
          <input
            type="text"
            placeholder="Buscar por orden o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} w-full pl-9 pr-3 py-2.5`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${inputClass} px-3 py-2.5 min-w-40`}
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="simple-spinner mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-text-main/50">
            No hay pedidos
            {statusFilter
              ? ` con estado "${STATUS_LABELS[statusFilter]}"`
              : ""}
            {search ? ` que coincidan con "${search}"` : ""}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-elevated">
                  <th className="text-left p-4 font-medium text-text-main/50">
                    Orden
                  </th>
                  <th className="text-left p-4 font-medium text-text-main/50">
                    Cliente
                  </th>
                  <th className="text-left p-4 font-medium text-text-main/50">
                    Items
                  </th>
                  <th className="text-right p-4 font-medium text-text-main/50">
                    Total
                  </th>
                  <th className="text-center p-4 font-medium text-text-main/50">
                    Estado
                  </th>
                  <th className="text-left p-4 font-medium text-text-main/50">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border-subtle hover:bg-surface-elevated transition-colors"
                  >
                    <td className="p-4">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="font-mono text-primary hover:text-primary-hover transition-colors"
                      >
                        {order.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="p-4 text-text-main/60">
                      {order.shippingAddress?.fullName ||
                        order.userId.slice(0, 8)}
                    </td>
                    <td className="p-4 text-text-main/60">
                      {order.items?.length || 0} productos
                    </td>
                    <td className="p-4 text-right font-medium text-text-main">
                      ${order.total?.toFixed(2) || "0.00"}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          STATUS_COLORS[order.status] ||
                          "bg-surface-elevated text-text-main/50"
                        }`}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="p-4 text-text-main/40 text-xs">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
