"use client";

import { useMemo, useState } from "react";
import { FaPlus, FaTrash, FaCheckCircle, FaClock, FaHistory } from "react-icons/fa";

type TierStatus = "active" | "future" | "expired";

interface DiscountDraft {
  // UI-only id so React keys don't collide while editing.
  uid: string;
  finalPrice: string;        // kept as string to allow empty/editing
  label: string;
  /** Datetime-local string (YYYY-MM-DDTHH:mm) in Ecuador time, or empty for permanente. */
  validUntilLocal: string;
}

interface RawDiscount {
  finalPrice: number;
  label: string;
  validUntil?: unknown;
}

interface AutoDiscountsEditorProps {
  productId: string;
  /** Precio base SIN IVA del producto (product.price). */
  basePriceSubtotal: number;
  initialDiscounts?: RawDiscount[];
}

const IVA_RATE = 0.15;
const ECUADOR_TZ = "America/Guayaquil";

// Convierte cualquier representación de timestamp a Date o null.
function toDate(raw: unknown): Date | null {
  if (raw == null) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw === "string") {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof obj.toDate === "function") {
      try {
        return obj.toDate();
      } catch {
        return null;
      }
    }
    const seconds = obj.seconds ?? obj._seconds;
    if (typeof seconds === "number") {
      return new Date(seconds * 1000);
    }
  }
  return null;
}

// Date → "YYYY-MM-DDTHH:mm" en hora Ecuador (para <input type="datetime-local">).
function toEcuadorLocalInput(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ECUADOR_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

// "YYYY-MM-DDTHH:mm" (hora Ecuador) → Date UTC correcto.
// Ecuador es UTC-5 sin DST, así que sumamos 5 h al parse.
function fromEcuadorLocalInput(local: string): Date | null {
  if (!local) return null;
  // Interpretar el string como hora Ecuador: concatenamos offset -05:00.
  const iso = `${local}:00-05:00`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function formatEcuadorLabel(date: Date): string {
  return new Intl.DateTimeFormat("es-EC", {
    timeZone: ECUADOR_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function newUid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function toDraft(raw: RawDiscount): DiscountDraft {
  const vu = toDate(raw.validUntil);
  return {
    uid: newUid(),
    finalPrice: String(raw.finalPrice ?? ""),
    label: raw.label ?? "",
    validUntilLocal: vu ? toEcuadorLocalInput(vu) : "",
  };
}

function statusOf(date: Date | null, now: Date): TierStatus {
  if (!date) return "active"; // permanente siempre activo (fallback del árbol)
  if (date.getTime() < now.getTime()) return "expired";
  return "future";
}

export default function AutoDiscountsEditor({
  productId,
  basePriceSubtotal,
  initialDiscounts = [],
}: AutoDiscountsEditorProps) {
  const [drafts, setDrafts] = useState<DiscountDraft[]>(() =>
    initialDiscounts.map(toDraft),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);

  const basePriceWithVat = useMemo(
    () => Math.round(basePriceSubtotal * (1 + IVA_RATE) * 100) / 100,
    [basePriceSubtotal],
  );

  const now = useMemo(() => new Date(), []);

  // Para cada draft, calcula el estado (active/future/expired) considerando
  // orden cronológico — solo el primero con fecha futura es "active".
  const computed = useMemo(() => {
    const withMeta = drafts.map((d) => {
      const finalPrice = Number(d.finalPrice) || 0;
      const vu = fromEcuadorLocalInput(d.validUntilLocal);
      return {
        draft: d,
        finalPrice,
        validUntil: vu,
      };
    });

    // Replica selección de getPriceDisplay para marcar el activo.
    const FAR = Number.MAX_SAFE_INTEGER;
    const sortedIdx = withMeta
      .map((m, i) => ({ i, t: m.validUntil ? m.validUntil.getTime() : FAR }))
      .sort((a, b) => a.t - b.t)
      .map((x) => x.i);

    let activeIdx = -1;
    for (const idx of sortedIdx) {
      const m = withMeta[idx];
      if (m.validUntil === null || m.validUntil.getTime() >= now.getTime()) {
        activeIdx = idx;
        break;
      }
    }

    return withMeta.map((m, i) => {
      let status: TierStatus;
      if (i === activeIdx) status = "active";
      else status = statusOf(m.validUntil, now);
      return { ...m, status };
    });
  }, [drafts, now]);

  function addEmpty() {
    setDrafts((prev) => [
      ...prev,
      { uid: newUid(), finalPrice: "", label: "", validUntilLocal: "" },
    ]);
  }

  function removeAt(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  function updateAt(index: number, patch: Partial<DiscountDraft>) {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );
  }

  async function save() {
    setSaving(true);
    setMessage(null);

    try {
      const payload = drafts.map((d) => {
        const finalPrice = Number(d.finalPrice);
        const vu = fromEcuadorLocalInput(d.validUntilLocal);
        return {
          finalPrice,
          label: d.label.trim(),
          validUntil: vu ? vu.toISOString() : null,
        };
      });

      const res = await fetch(
        `/api/admin/products/${productId}/discounts`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ autoDiscounts: payload }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          kind: "error",
          text: data.error || "Error al guardar los descuentos",
        });
      } else {
        setMessage({
          kind: "ok",
          text: `Guardados ${data.count ?? payload.length} descuentos.`,
        });
      }
    } catch {
      setMessage({ kind: "error", text: "Error de conexión" });
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full p-2 bg-input-bg border border-border-default rounded-lg text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors";
  const labelClass = "block text-[11px] font-medium text-text-main/50 mb-1 uppercase tracking-wider";

  return (
    <section className="bg-surface-card border border-border-subtle rounded-xl p-6 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-main">
            Descuentos programados
          </h2>
          <p className="text-xs text-text-main/50 mt-1 leading-relaxed max-w-xl">
            Tiers de precio que se aplican automáticamente por fecha, sin
            necesidad de código de cupón. El primero vigente (fecha límite más
            cercana) es el que paga el cliente. Al vencer, pasa al siguiente
            automáticamente. Precio base regular: <strong className="text-text-main">
              ${basePriceWithVat.toFixed(2)}
            </strong> (IVA incluido).
          </p>
        </div>
      </header>

      {drafts.length === 0 ? (
        <div className="bg-surface-elevated/50 border border-dashed border-border-subtle rounded-lg p-6 text-center text-sm text-text-main/50">
          Sin descuentos programados. El cliente paga el precio base.
        </div>
      ) : (
        <div className="space-y-3">
          {computed.map((row, i) => {
            const { draft, finalPrice, validUntil, status } = row;
            const amountOff =
              finalPrice > 0 && basePriceWithVat > 0
                ? Math.max(0, basePriceWithVat - finalPrice)
                : 0;
            const percentOff =
              basePriceWithVat > 0
                ? Math.round((amountOff / basePriceWithVat) * 100)
                : 0;

            return (
              <div
                key={draft.uid}
                className={`rounded-lg border p-4 transition-colors ${
                  status === "active"
                    ? "border-success/40 bg-success/5"
                    : status === "future"
                      ? "border-border-default bg-background"
                      : "border-border-subtle bg-surface-elevated/30 opacity-70"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <StatusBadge status={status} />
                  {percentOff > 0 && (
                    <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      -{percentOff}% OFF
                    </span>
                  )}
                  {amountOff > 0 && (
                    <span className="text-[11px] text-text-main/50">
                      (ahorra ${amountOff.toFixed(2)})
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="ml-auto text-error/70 hover:text-error p-1.5 rounded-md hover:bg-error/10 transition-colors cursor-pointer"
                    aria-label="Eliminar descuento"
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Etiqueta</label>
                    <input
                      type="text"
                      value={draft.label}
                      onChange={(e) => updateAt(i, { label: e.target.value })}
                      placeholder="Ej: Compra anticipada"
                      maxLength={80}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Precio final (con IVA)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-main/40 text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={draft.finalPrice}
                        onChange={(e) =>
                          updateAt(i, { finalPrice: e.target.value })
                        }
                        placeholder="55.00"
                        className={`${inputClass} pl-6`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>
                      Válido hasta (hora Ecuador)
                    </label>
                    <input
                      type="datetime-local"
                      value={draft.validUntilLocal}
                      onChange={(e) =>
                        updateAt(i, { validUntilLocal: e.target.value })
                      }
                      className={inputClass}
                    />
                    <p className="text-[10px] text-text-main/40 mt-1">
                      {validUntil
                        ? `${formatEcuadorLabel(validUntil)} ECT`
                        : "Vacío = permanente"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={addEmpty}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 border border-border-default text-text-main/70 hover:text-text-main hover:bg-surface-elevated font-medium py-2.5 px-4 rounded-lg transition-colors text-sm cursor-pointer disabled:opacity-50"
        >
          <FaPlus className="w-3 h-3" />
          Agregar descuento
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm cursor-pointer disabled:bg-surface-elevated disabled:text-text-main/30"
        >
          {saving ? (
            <>
              <div className="simple-spinner w-4! h-4! border-2! border-white! border-b-transparent!" />
              Guardando…
            </>
          ) : (
            "Guardar descuentos"
          )}
        </button>
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.kind === "ok" ? "text-success" : "text-error"
          }`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: TierStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 bg-success/15 text-success text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full">
        <FaCheckCircle className="w-2.5 h-2.5" />
        Vigente
      </span>
    );
  }
  if (status === "future") {
    return (
      <span className="inline-flex items-center gap-1 bg-info/15 text-info text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full">
        <FaClock className="w-2.5 h-2.5" />
        Próximo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-surface-elevated text-text-main/40 text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full">
      <FaHistory className="w-2.5 h-2.5" />
      Vencido
    </span>
  );
}
