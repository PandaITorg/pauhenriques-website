"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaCopy,
  FaCheck,
  FaTimes,
  FaBan,
  FaPowerOff,
  FaTrash,
} from "react-icons/fa";
import type { PaymentLink } from "@/lib/pago-link/paymentLink";
import {
  PAYMENT_LINK_PRICE_CONFIRM_THRESHOLD,
  PAYMENT_LINK_PRICE_MAX,
  PAYMENT_LINK_PRICE_MIN,
} from "@/lib/pago-link/paymentLink";

const inputClass =
  "bg-input-bg border border-border-default rounded-xl text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200";

function buildPublicLink(token: string): string {
  if (typeof window === "undefined") return `/pago/t/${token}`;
  return `${window.location.origin}/pago/t/${token}`;
}

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

export default function PaymentLinksSection() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payment-links");
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
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-text-main/50">
          Links de pago activos: <strong className="text-text-main">{links.filter((l) => l.active && !isExpiredIso(l.expiresAt)).length}</strong>
        </p>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Nuevo link
        </button>
      </div>

      {error && (
        <div className="bg-error/10 text-error p-3 rounded-lg text-sm mb-4">{error}</div>
      )}

      <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="simple-spinner mx-auto" />
          </div>
        ) : links.length === 0 ? (
          <div className="p-8 text-center text-text-main/50">
            Todavía no hay links de pago. Creá el primero.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-elevated">
                  <th className="text-left p-4 font-medium text-text-main/50">Link</th>
                  <th className="text-right p-4 font-medium text-text-main/50">Precio</th>
                  <th className="text-center p-4 font-medium text-text-main/50">Estado</th>
                  <th className="text-center p-4 font-medium text-text-main/50">Pagos</th>
                  <th className="text-left p-4 font-medium text-text-main/50">Expira</th>
                  <th className="text-right p-4 font-medium text-text-main/50">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {links.map((l) => (
                  <LinkRow key={l.id} link={l} onChange={fetchLinks} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {createOpen && (
        <CreateLinkModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            fetchLinks();
          }}
        />
      )}
    </>
  );
}

function LinkRow({ link, onChange }: { link: PaymentLink; onChange: () => void }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const expired = isExpiredIso(link.expiresAt);
  const url = buildPublicLink(link.token);
  const status = !link.active
    ? "inactive"
    : expired
      ? "expired"
      : "active";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const toggleActive = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/payment-links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !link.active }),
      });
      onChange();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (link.timesPaid > 0) {
      alert("Este link ya tiene pagos. Solo se puede desactivar.");
      return;
    }
    if (!confirm("¿Eliminar este link? No se puede deshacer.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/payment-links/${link.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Error al eliminar");
        return;
      }
      onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className="border-b border-border-subtle hover:bg-surface-elevated transition-colors last:border-b-0">
      <td className="p-4 min-w-80">
        <div className="flex items-center gap-2">
          <code className="text-xs text-text-main/70 bg-surface-elevated px-2 py-1 rounded truncate max-w-64">
            {url}
          </code>
          <button
            onClick={copy}
            className="text-text-main/40 hover:text-primary transition-colors cursor-pointer shrink-0"
            aria-label="Copiar link"
            title="Copiar"
          >
            {copied ? <FaCheck className="w-3.5 h-3.5 text-success" /> : <FaCopy className="w-3.5 h-3.5" />}
          </button>
        </div>
        {link.label && (
          <div className="text-xs text-text-main/50 mt-1.5">{link.label}</div>
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
        <StatusBadge status={status} />
      </td>
      <td className="p-4 text-center font-medium text-text-main">
        {link.timesPaid}
        {link.lastPaidAt && (
          <div className="text-[10px] text-text-main/40 mt-0.5">
            {formatDate(link.lastPaidAt)}
          </div>
        )}
      </td>
      <td className="p-4 text-text-main/60 text-xs whitespace-nowrap">
        {formatDateTime(link.expiresAt)}
      </td>
      <td className="p-4 text-right">
        <div className="inline-flex items-center gap-1.5">
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

function StatusBadge({ status }: { status: "active" | "inactive" | "expired" }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 bg-success/15 text-success text-xs font-medium px-2.5 py-1 rounded-full">
        <FaCheck className="w-2.5 h-2.5" />
        Activo
      </span>
    );
  }
  if (status === "expired") {
    return (
      <span className="bg-warning/15 text-warning text-xs font-medium px-2.5 py-1 rounded-full">
        Expirado
      </span>
    );
  }
  return (
    <span className="bg-text-main/10 text-text-main/60 text-xs font-medium px-2.5 py-1 rounded-full">
      Desactivado
    </span>
  );
}

function CreateLinkModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [price, setPrice] = useState<string>("");
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [expiresDate, setExpiresDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmHighPrice, setConfirmHighPrice] = useState(false);

  const priceNum = Number(price);
  const validPrice =
    Number.isFinite(priceNum) &&
    priceNum >= PAYMENT_LINK_PRICE_MIN &&
    priceNum <= PAYMENT_LINK_PRICE_MAX;
  const requiresConfirm = validPrice && priceNum >= PAYMENT_LINK_PRICE_CONFIRM_THRESHOLD;
  const canSubmit = validPrice && expiresDate.length > 0 && !submitting && (!requiresConfirm || confirmHighPrice);

  const handleSubmit = async () => {
    setError(null);
    if (!validPrice) {
      setError(`Precio invalido. Rango: $${PAYMENT_LINK_PRICE_MIN} – $${PAYMENT_LINK_PRICE_MAX}.`);
      return;
    }
    // Build expiry at end of day local time, convert to ISO.
    const [y, m, d] = expiresDate.split("-").map((n) => Number(n));
    const expiresAtDate = new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);
    if (expiresAtDate.getTime() <= Date.now()) {
      setError("La fecha de expiracion debe ser en el futuro.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: priceNum,
          label: label.trim() || undefined,
          notes: notes.trim() || undefined,
          expiresAt: expiresAtDate.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error creando link");
        return;
      }
      onCreated();
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
          <h2 className="font-cormorant text-xl font-semibold text-text-main">Nuevo link de pago</h2>
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
              Etiqueta (opcional)
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
              Para identificar el link en la lista. No visible al cliente.
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
            ) : (
              "Crear link"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
