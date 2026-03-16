"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaPercent,
  FaDollarSign,
  FaTruck,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";

interface PromotionRow {
  id: string;
  name: string;
  description?: string;
  code: string;
  type: "percentage" | "fixed_amount" | "free_shipping";
  value: number;
  currentUses: number;
  isActive: boolean;
  showAsBanner: boolean;
  rules: {
    maxTotalUses?: number;
    validFrom: { _seconds: number };
    validUntil: { _seconds: number };
  };
}

type StatusFilter = "all" | "active" | "scheduled" | "expired" | "disabled";

function getStatus(p: PromotionRow): string {
  if (!p.isActive) return "disabled";
  const now = Date.now() / 1000;
  const from = p.rules.validFrom._seconds;
  const until = p.rules.validUntil._seconds;
  if (now < from) return "scheduled";
  if (now > until || (p.rules.maxTotalUses && p.currentUses >= p.rules.maxTotalUses))
    return "expired";
  return "active";
}

const statusBadge: Record<string, { label: string; classes: string }> = {
  active: { label: "Activa", classes: "bg-success/15 text-success" },
  scheduled: { label: "Programada", classes: "bg-warning/15 text-warning" },
  expired: { label: "Expirada", classes: "bg-error/15 text-error" },
  disabled: { label: "Desactivada", classes: "bg-text-main/10 text-text-main/40" },
};

const typeIcons = {
  percentage: FaPercent,
  fixed_amount: FaDollarSign,
  free_shipping: FaTruck,
};

const typeLabels = {
  percentage: "Porcentaje",
  fixed_amount: "Monto fijo",
  free_shipping: "Envio gratis",
};

function formatDate(ts: { _seconds: number }) {
  return new Date(ts._seconds * 1000).toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatValue(type: string, value: number) {
  if (type === "percentage") return `${value}%`;
  if (type === "fixed_amount") return `$${value.toFixed(2)}`;
  return "—";
}

export default function AdminPromocionesPage() {
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchPromotions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/promotions");
      if (res.ok) setPromotions(await res.json());
    } catch (err) {
      console.error("Error fetching promotions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const filtered = useMemo(() => {
    return promotions.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" || getStatus(p) === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [promotions, search, statusFilter]);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        setPromotions((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, isActive: !currentActive } : p,
          ),
        );
      }
    } catch (err) {
      console.error("Error toggling promotion:", err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Si ya fue usada, se desactivara en su lugar.`))
      return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.softDisabled) {
          setPromotions((prev) =>
            prev.map((p) => (p.id === id ? { ...p, isActive: false } : p)),
          );
        } else {
          setPromotions((prev) => prev.filter((p) => p.id !== id));
        }
      }
    } catch (err) {
      console.error("Error deleting promotion:", err);
    } finally {
      setDeleting(null);
    }
  };

  const inputClass =
    "bg-input-bg border border-border-default rounded-lg text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors";

  const tabs: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "active", label: "Activas" },
    { value: "scheduled", label: "Programadas" },
    { value: "expired", label: "Expiradas" },
    { value: "disabled", label: "Desactivadas" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-text-main">Promociones</h1>
        <Link
          href="/admin/promociones/nuevo"
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium px-4 py-2.5 rounded-lg transition-colors text-sm"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Nueva Promocion
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === tab.value
                ? "bg-primary text-white"
                : "bg-surface-elevated text-text-main/50 hover:text-text-main"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-main/30" />
        <input
          type="text"
          placeholder="Buscar por nombre o codigo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} w-full pl-9 pr-3 py-2.5`}
        />
      </div>

      <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="simple-spinner mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-text-main/50">
            {promotions.length === 0
              ? "No hay promociones. Crea tu primera promocion."
              : "No se encontraron promociones con ese filtro."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-elevated">
                  <th className="text-left p-4 font-medium text-text-main/50">
                    Codigo
                  </th>
                  <th className="text-left p-4 font-medium text-text-main/50">
                    Nombre
                  </th>
                  <th className="text-left p-4 font-medium text-text-main/50">
                    Tipo
                  </th>
                  <th className="text-right p-4 font-medium text-text-main/50">
                    Valor
                  </th>
                  <th className="text-center p-4 font-medium text-text-main/50">
                    Estado
                  </th>
                  <th className="text-center p-4 font-medium text-text-main/50">
                    Usos
                  </th>
                  <th className="text-left p-4 font-medium text-text-main/50">
                    Vigencia
                  </th>
                  <th className="text-right p-4 font-medium text-text-main/50">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const status = getStatus(p);
                  const badge = statusBadge[status];
                  const TypeIcon = typeIcons[p.type];

                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border-subtle hover:bg-surface-elevated transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-mono text-xs bg-surface-elevated px-2 py-1 rounded">
                          {p.code}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-text-main">
                          {p.name}
                        </div>
                        {p.description && (
                          <div className="text-xs text-text-main/40 truncate max-w-48">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-text-main/60">
                          <TypeIcon className="w-3 h-3" />
                          <span className="text-xs">{typeLabels[p.type]}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right text-text-main/60">
                        {formatValue(p.type, p.value)}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-4 text-center text-text-main/60">
                        {p.currentUses}
                        {p.rules.maxTotalUses
                          ? ` / ${p.rules.maxTotalUses}`
                          : ""}
                      </td>
                      <td className="p-4 text-text-main/50 text-xs whitespace-nowrap">
                        {formatDate(p.rules.validFrom)} —{" "}
                        {formatDate(p.rules.validUntil)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              handleToggleActive(p.id, p.isActive)
                            }
                            className={`p-2 transition-colors cursor-pointer ${
                              p.isActive
                                ? "text-success hover:text-success/70"
                                : "text-text-main/30 hover:text-text-main/50"
                            }`}
                            title={
                              p.isActive ? "Desactivar" : "Activar"
                            }
                          >
                            {p.isActive ? (
                              <FaToggleOn className="w-5 h-5" />
                            ) : (
                              <FaToggleOff className="w-5 h-5" />
                            )}
                          </button>
                          <Link
                            href={`/admin/promociones/${p.id}/editar`}
                            className="p-2 text-text-main/30 hover:text-primary transition-colors"
                          >
                            <FaEdit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            disabled={deleting === p.id}
                            className="p-2 text-text-main/30 hover:text-error transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <FaTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
