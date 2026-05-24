"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaTimes,
  FaBan,
  FaPowerOff,
  FaTrash,
  FaPencilAlt,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCheck,
} from "react-icons/fa";
import {
  PAYMENT_LINK_PRICE_CONFIRM_THRESHOLD,
  PAYMENT_LINK_PRICE_MAX,
  PAYMENT_LINK_PRICE_MIN,
} from "@pandait.tech/payment-nuvei/payment-links";
import type { PaymentLink } from "@/lib/pago-link/types";
import type { Taller } from "@/lib/talleres/types";
import CopyButton from "@/components/ui/CopyButton";
import StatusBadge from "@/components/admin/StatusBadge";
import PaymentLinkPayersDrawer from "@/components/admin/talleres/PaymentLinkPayersDrawer";
import { useConfirm } from "@/stores/confirm.store";
import { useToastStore } from "@/stores/toast.store";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { buildPaymentLinkUrl } from "@/lib/admin/publicUrls";

type LinkFilter = "all" | "active" | "expired" | "inactive" | "withPayments";
type LinkSortKey = "createdAt" | "price" | "timesPaid";
type SortDir = "asc" | "desc";

const FILTER_TABS: Array<{ key: LinkFilter; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Activos" },
  { key: "withPayments", label: "Con pagos" },
  { key: "expired", label: "Expirados" },
  { key: "inactive", label: "Desactivados" },
];

const inputClass =
  "bg-input-bg border border-border-default rounded-xl text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200";

const buildPublicLink = buildPaymentLinkUrl;

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isExpiredIso(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

interface PaymentLinksSectionProps {
  /**
   * Si está presente, filtra links a este taller y pre-selecciona el
   * taller en el modal de creación (sin dropdown). Si no, muestra todos
   * los links cross-taller (vista global del listado /admin/talleres).
   */
  tallerId?: string;
}

export default function PaymentLinksSection({ tallerId }: PaymentLinksSectionProps = {}) {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PaymentLink | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LinkFilter>("all");
  const [sortKey, setSortKey] = useState<LinkSortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = tallerId
        ? `/api/admin/payment-links?tallerId=${encodeURIComponent(tallerId)}`
        : "/api/admin/payment-links";
      const res = await fetch(url);
      if (!res.ok) {
        setError("No se pudo cargar la lista");
        return;
      }
      const data = (await res.json()) as { links: PaymentLink[] };
      setLinks(data.links ?? []);
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  }, [tallerId]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const filtered = useMemo(() => {
    const now = Date.now();
    let out = links;
    if (filter !== "all") {
      out = out.filter((l) => {
        const expired = new Date(l.expiresAt).getTime() < now;
        if (filter === "active") return l.active && !expired;
        if (filter === "expired") return l.active && expired;
        if (filter === "inactive") return !l.active;
        if (filter === "withPayments") return l.timesPaid > 0;
        return true;
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((l) =>
        [l.token, l.label, l.publicLabel, l.notes]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(q)),
      );
    }
    return out;
  }, [links, filter, search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "createdAt") {
        cmp =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortKey === "price") {
        cmp = a.price - b.price;
      } else if (sortKey === "timesPaid") {
        cmp = a.timesPaid - b.timesPaid;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const counts = useMemo(() => {
    const now = Date.now();
    return {
      all: links.length,
      active: links.filter(
        (l) => l.active && new Date(l.expiresAt).getTime() >= now,
      ).length,
      expired: links.filter(
        (l) => l.active && new Date(l.expiresAt).getTime() < now,
      ).length,
      inactive: links.filter((l) => !l.active).length,
      withPayments: links.filter((l) => l.timesPaid > 0).length,
    };
  }, [links]);

  const toggleSort = (key: LinkSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortHeader = ({
    label,
    column,
    align = "left",
  }: {
    label: string;
    column: LinkSortKey;
    align?: "left" | "right" | "center";
  }) => {
    const active = sortKey === column;
    const Icon = !active ? FaSort : sortDir === "asc" ? FaSortUp : FaSortDown;
    return (
      <th className={`text-${align} p-4 font-medium text-text-main/50`}>
        <button
          type="button"
          onClick={() => toggleSort(column)}
          className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-text-main transition-colors ${
            active ? "text-primary" : ""
          }`}
        >
          {label}
          <Icon className="w-3 h-3 opacity-70" />
        </button>
      </th>
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex flex-wrap gap-2 flex-1">
          {FILTER_TABS.map((t) => {
            const active = filter === t.key;
            const badge = counts[t.key];
            return (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-primary text-white"
                    : "bg-surface-card border border-border-subtle text-text-main/60 hover:text-text-main hover:border-border-default"
                }`}
              >
                {t.label}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full min-w-4.5 text-center ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-surface-elevated text-text-main/50"
                  }`}
                >
                  {loading ? "—" : badge}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Nuevo link
        </button>
      </div>

      <div className="relative mb-4">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-main/30" />
        <input
          type="text"
          placeholder="Buscar por token, nombre, etiqueta promo o notas…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} w-full pl-9 pr-3 py-2.5`}
        />
      </div>

      {error && (
        <div className="bg-error/10 text-error p-3 rounded-lg text-sm mb-4">{error}</div>
      )}

      <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden">
        {loading ? (
          <TableSkeleton
            rows={5}
            showLeading
            columnWidths={["28%", "10%", "12%", "10%", "12%", "12%", "16%"]}
          />
        ) : sorted.length === 0 ? (
          <div className="p-8 text-center text-text-main/50">
            {links.length === 0
              ? "Todavía no hay links de pago. Creá el primero."
              : "Ningún link coincide con la búsqueda o filtro."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-elevated">
                  <th className="text-left p-4 font-medium text-text-main/50">Link</th>
                  <SortHeader label="Precio" column="price" align="right" />
                  <th className="text-center p-4 font-medium text-text-main/50">Estado</th>
                  <SortHeader label="Pagos" column="timesPaid" align="center" />
                  <SortHeader label="Creado" column="createdAt" />
                  <th className="text-left p-4 font-medium text-text-main/50">Expira</th>
                  <th className="text-right p-4 font-medium text-text-main/50">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((l) => (
                  <LinkRow
                    key={l.id}
                    link={l}
                    onEdit={() => setEditing(l)}
                    onChange={fetchLinks}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <LinkFormModal
          link={editing === "new" ? null : editing}
          fixedTallerId={tallerId}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchLinks();
          }}
        />
      )}
    </>
  );
}

function LinkRow({
  link,
  onEdit,
  onChange,
}: {
  link: PaymentLink;
  onEdit: () => void;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [showPayers, setShowPayers] = useState(false);
  const confirm = useConfirm();
  const addToast = useToastStore((s) => s.addToast);

  const expired = isExpiredIso(link.expiresAt);
  const url = buildPublicLink(link.token);
  const status = !link.active
    ? "inactive"
    : expired
      ? "expired"
      : "active";

  const toggleActive = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/payment-links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !link.active }),
      });
      if (res.ok) {
        addToast({
          type: "success",
          message: link.active ? "Link desactivado" : "Link reactivado",
        });
        onChange();
      } else {
        addToast({ type: "error", message: "No se pudo cambiar el estado" });
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (link.timesPaid > 0) {
      addToast({
        type: "warning",
        message: "Este link ya tiene pagos. Solo se puede desactivar.",
      });
      return;
    }
    const ok = await confirm({
      title: "¿Eliminar este link?",
      description:
        "Esta acción no se puede deshacer. El link dejará de existir y la URL pública dará 404.",
      confirmLabel: "Eliminar",
      variant: "destructive",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/payment-links/${link.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        addToast({
          type: "error",
          message: data?.error || "Error al eliminar",
        });
        return;
      }
      addToast({ type: "success", message: "Link eliminado" });
      onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className="border-b border-border-subtle hover:bg-surface-elevated transition-colors last:border-b-0 align-top">
      <td className="p-4 min-w-80">
        <div className="flex items-center gap-2">
          <code className="text-xs text-text-main/70 bg-surface-elevated px-2 py-1 rounded truncate max-w-64">
            {url}
          </code>
          <CopyButton text={url} ariaLabel="Copiar link" />
        </div>
        {link.label && (
          <div className="text-xs text-text-main/70 font-medium mt-1.5">
            {link.label}
          </div>
        )}
        {link.publicLabel && (
          <div className="text-[11px] text-primary/80 mt-0.5">
            🔥 {link.publicLabel}
          </div>
        )}
        {link.notes && (
          <div className="text-[11px] text-text-main/40 mt-0.5 italic truncate max-w-80">
            {link.notes}
          </div>
        )}
      </td>
      <td className="p-4 text-right font-semibold text-text-main whitespace-nowrap">
        ${link.price.toFixed(2)}
      </td>
      <td className="p-4 text-center">
        <LinkStatusBadge status={status} />
      </td>
      <td className="p-4 text-center font-medium text-text-main">
        {link.timesPaid > 0 ? (
          <button
            onClick={() => setShowPayers(true)}
            className="inline-flex flex-col items-center text-text-main hover:text-primary transition-colors cursor-pointer underline-offset-2 hover:underline"
            title="Ver quiénes pagaron"
          >
            <span>{link.timesPaid}</span>
            {link.lastPaidAt && (
              <span className="text-[10px] text-text-main/40 mt-0.5 no-underline">
                {formatDate(link.lastPaidAt)}
              </span>
            )}
          </button>
        ) : (
          <span className="text-text-main/30">0</span>
        )}
        {showPayers && (
          <PaymentLinkPayersDrawer
            isOpen={showPayers}
            onClose={() => setShowPayers(false)}
            paymentLinkId={link.id}
            linkLabel={link.label || link.token}
            expectedCount={link.timesPaid}
          />
        )}
      </td>
      <td className="p-4 text-text-main/60 text-xs whitespace-nowrap">
        {formatDate(link.createdAt)}
      </td>
      <td className="p-4 text-text-main/60 text-xs whitespace-nowrap">
        {formatDateTime(link.expiresAt)}
      </td>
      <td className="p-4 text-right">
        <div className="inline-flex items-center gap-1.5">
          <button
            onClick={onEdit}
            disabled={busy}
            className="inline-flex items-center gap-1.5 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            title="Editar"
          >
            <FaPencilAlt className="w-3 h-3" />
          </button>
          <button
            onClick={toggleActive}
            disabled={busy}
            className="inline-flex items-center gap-1.5 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            title={link.active ? "Desactivar" : "Reactivar"}
          >
            {link.active ? <FaBan className="w-3 h-3" /> : <FaPowerOff className="w-3 h-3" />}
          </button>
          <button
            onClick={remove}
            disabled={busy || link.timesPaid > 0}
            className="inline-flex items-center gap-1.5 border border-error/30 text-error hover:bg-error/10 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title={link.timesPaid > 0 ? "No se puede eliminar (tiene pagos)" : "Eliminar"}
          >
            <FaTrash className="w-3 h-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function LinkStatusBadge({ status }: { status: "active" | "inactive" | "expired" }) {
  if (status === "active") {
    return <StatusBadge tone="success" icon={FaCheck}>Activo</StatusBadge>;
  }
  if (status === "expired") {
    return <StatusBadge tone="warning">Expirado</StatusBadge>;
  }
  return <StatusBadge tone="neutral">Desactivado</StatusBadge>;
}

function isoToDateInput(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function defaultExpiryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function LinkFormModal({
  link,
  fixedTallerId,
  onClose,
  onSaved,
}: {
  /** Si está, modo EDIT del link existente. Si es null, modo CREATE. */
  link: PaymentLink | null;
  /** Si está, en modo CREATE pre-llena tallerId y esconde el dropdown. */
  fixedTallerId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = link !== null;
  // En modo edit el tallerId del link es inmutable (el cliente ya lo recibió).
  // En modo create se elige (o viene fijo).
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [tallerId, setTallerId] = useState<string>(
    link?.tallerId ?? fixedTallerId ?? "",
  );
  const [loadingTalleres, setLoadingTalleres] = useState(
    !isEdit && !fixedTallerId,
  );
  const [price, setPrice] = useState<string>(
    link ? String(link.price) : "",
  );
  const [label, setLabel] = useState(link?.label ?? "");
  const [publicLabel, setPublicLabel] = useState(link?.publicLabel ?? "");
  const [notes, setNotes] = useState(link?.notes ?? "");
  const [expiresDate, setExpiresDate] = useState<string>(
    link ? isoToDateInput(link.expiresAt) : defaultExpiryDate(),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmHighPrice, setConfirmHighPrice] = useState(false);

  // Cargar talleres activos solo en modo CREATE sin fixedTallerId.
  useEffect(() => {
    if (isEdit || fixedTallerId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/talleres");
        if (!res.ok) return;
        const data = (await res.json()) as { talleres: Taller[] };
        if (cancelled) return;
        const active = (data.talleres ?? []).filter((t) => t.active);
        setTalleres(active);
        if (active.length === 1) setTallerId(active[0].id);
      } finally {
        if (!cancelled) setLoadingTalleres(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, fixedTallerId]);

  const priceNum = Number(price);
  const validPrice =
    Number.isFinite(priceNum) &&
    priceNum >= PAYMENT_LINK_PRICE_MIN &&
    priceNum <= PAYMENT_LINK_PRICE_MAX;
  // En edit, solo pedir confirmación si el precio CAMBIÓ a un valor alto.
  const priceChangedHigh =
    !isEdit ||
    (link !== null && Math.abs(priceNum - link.price) > 0.01);
  const requiresConfirm =
    validPrice &&
    priceNum >= PAYMENT_LINK_PRICE_CONFIRM_THRESHOLD &&
    priceChangedHigh;
  const canSubmit =
    !!tallerId &&
    validPrice &&
    label.trim().length > 0 &&
    expiresDate.length > 0 &&
    !submitting &&
    (!requiresConfirm || confirmHighPrice);

  const handleSubmit = async () => {
    setError(null);
    if (!tallerId) {
      setError("Seleccioná un taller.");
      return;
    }
    if (!label.trim()) {
      setError("El nombre interno es requerido.");
      return;
    }
    if (!validPrice) {
      setError(`Precio invalido. Rango: $${PAYMENT_LINK_PRICE_MIN} – $${PAYMENT_LINK_PRICE_MAX}.`);
      return;
    }
    const [y, m, d] = expiresDate.split("-").map((n) => Number(n));
    const expiresAtDate = new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);
    if (expiresAtDate.getTime() <= Date.now()) {
      setError("La fecha de expiracion debe ser en el futuro.");
      return;
    }

    setSubmitting(true);
    try {
      // En edit, el tallerId NO se envía (es inmutable). En create, sí.
      const body: Record<string, unknown> = {
        price: priceNum,
        label: label.trim(),
        publicLabel: publicLabel.trim() || undefined,
        notes: notes.trim() || undefined,
        expiresAt: expiresAtDate.toISOString(),
      };
      if (!isEdit) body.tallerId = tallerId;

      const url = isEdit
        ? `/api/admin/payment-links/${link!.id}`
        : "/api/admin/payment-links";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Error ${isEdit ? "actualizando" : "creando"} link`);
        return;
      }
      onSaved();
    } catch {
      setError("Error de conexion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-card border border-border-subtle rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-5 border-b border-border-subtle">
          <h2 className="font-cormorant text-xl font-semibold text-text-main">
            {isEdit ? "Editar link de pago" : "Nuevo link de pago"}
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 flex items-center justify-center text-text-main/40 hover:text-text-main hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Cerrar"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {!isEdit && !fixedTallerId && (
            <div>
              <label className="block text-xs font-medium text-text-main/60 mb-1.5">
                Taller <span className="text-error">*</span>
              </label>
              {loadingTalleres ? (
                <div className="h-10.5 flex items-center text-xs text-text-main/40">
                  Cargando talleres…
                </div>
              ) : talleres.length === 0 ? (
                <div className="bg-warning/10 border border-warning/30 text-warning text-xs p-3 rounded-lg">
                  No hay talleres activos. Creá un taller primero en la tab
                  "Talleres".
                </div>
              ) : (
                <select
                  value={tallerId}
                  onChange={(e) => setTallerId(e.target.value)}
                  disabled={submitting}
                  className={`${inputClass} w-full px-3 py-2.5 cursor-pointer`}
                >
                  <option value="">Seleccioná un taller…</option>
                  {talleres.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.slug})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-main/60 mb-1.5">
              Precio USD <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-main/40 text-sm">$</span>
              <input
                type="number"
                min={PAYMENT_LINK_PRICE_MIN}
                max={PAYMENT_LINK_PRICE_MAX}
                step="0.01"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setConfirmHighPrice(false);
                }}
                disabled={submitting}
                autoFocus
                className={`${inputClass} w-full pl-7 pr-3 py-2.5`}
                placeholder="80.00"
              />
            </div>
            <p className="text-[11px] text-text-main/40 mt-1">
              Entre ${PAYMENT_LINK_PRICE_MIN} y ${PAYMENT_LINK_PRICE_MAX}. Incluye IVA.
            </p>
          </div>

          {requiresConfirm && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmHighPrice}
                  onChange={(e) => setConfirmHighPrice(e.target.checked)}
                  disabled={submitting}
                  className="mt-0.5 shrink-0"
                />
                <span className="text-sm text-text-main/80">
                  Confirmo que el precio es <strong>${priceNum.toFixed(2)}</strong>
                </span>
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-main/60 mb-1.5">
              Nombre (interno) <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={submitting}
              maxLength={80}
              className={`${inputClass} w-full px-3 py-2.5`}
              placeholder="Ej: Promo amigas abril"
            />
            <p className="text-[11px] text-text-main/40 mt-1">
              Solo para vos. Te ayuda a identificar el link en la tabla del
              admin. <strong>No lo ve el cliente.</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-main/60 mb-1.5">
              Etiqueta promo (opcional)
            </label>
            <input
              type="text"
              value={publicLabel}
              onChange={(e) => setPublicLabel(e.target.value)}
              disabled={submitting}
              maxLength={60}
              className={`${inputClass} w-full px-3 py-2.5`}
              placeholder="Ej: Última oportunidad"
            />
            <p className="text-[11px] text-text-main/40 mt-1">
              Texto promocional que <strong>verá el cliente</strong> con un 🔥
              en la página de pago. Dejá vacío para no mostrar nada.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-main/60 mb-1.5">
              Expira <span className="text-error">*</span>
            </label>
            <input
              type="date"
              value={expiresDate}
              onChange={(e) => setExpiresDate(e.target.value)}
              disabled={submitting}
              min={new Date().toISOString().slice(0, 10)}
              className={`${inputClass} w-full px-3 py-2.5`}
            />
            <p className="text-[11px] text-text-main/40 mt-1">
              Despues de esta fecha el link deja de aceptar pagos.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-main/60 mb-1.5">
              Notas internas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              rows={2}
              maxLength={500}
              className={`${inputClass} w-full px-3 py-2.5 resize-none`}
              placeholder="Para quien es, acuerdo previo, etc."
            />
          </div>

          {error && <div className="bg-error/10 text-error p-3 rounded-lg text-sm">{error}</div>}
        </div>

        <div className="flex gap-3 p-5 border-t border-border-subtle bg-surface-elevated/30">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated font-medium py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer disabled:bg-surface-elevated disabled:text-text-main/30"
          >
            {submitting ? (
              <div className="simple-spinner w-4! h-4! border-2! border-white! border-b-transparent!" />
            ) : isEdit ? (
              "Guardar cambios"
            ) : (
              "Crear link"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
