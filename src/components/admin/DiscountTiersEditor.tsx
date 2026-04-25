"use client";

import { useMemo } from "react";
import { FaPlus, FaTrash, FaCheckCircle, FaClock, FaHistory } from "react-icons/fa";

type TierStatus = "active" | "future" | "expired";

export interface TierDraft {
  // UI-only id so React keys don't collide while editing.
  uid: string;
  finalPrice: string; // string to allow empty/editing in the input
  label: string;
  /** Datetime-local string (YYYY-MM-DDTHH:mm) in Ecuador time, or empty for permanente. */
  validUntilLocal: string;
}

export interface RawTier {
  finalPrice: number;
  label: string;
  validUntil?: unknown;
}

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
export function toEcuadorLocalInput(date: Date): string {
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
export function fromEcuadorLocalInput(local: string): Date | null {
  if (!local) return null;
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

export function rawTierToDraft(raw: RawTier): TierDraft {
  const vu = toDate(raw.validUntil);
  return {
    uid: newUid(),
    finalPrice: String(raw.finalPrice ?? ""),
    label: raw.label ?? "",
    validUntilLocal: vu ? toEcuadorLocalInput(vu) : "",
  };
}

export function emptyTierDraft(): TierDraft {
  return { uid: newUid(), finalPrice: "", label: "", validUntilLocal: "" };
}

function statusOf(date: Date | null, now: Date): TierStatus {
  if (!date) return "active";
  if (date.getTime() < now.getTime()) return "expired";
  return "future";
}

interface DiscountTiersEditorProps {
  value: TierDraft[];
  onChange: (next: TierDraft[]) => void;
  /** Precio base CON IVA (lo que paga el cliente sin descuento). */
  basePriceWithVat: number;
  disabled?: boolean;
}

export default function DiscountTiersEditor({
  value,
  onChange,
  basePriceWithVat,
  disabled,
}: DiscountTiersEditorProps) {
  const now = useMemo(() => new Date(), []);

  // Para cada draft, calcula el estado (active/future/expired) considerando
  // orden cronológico — solo el primero con fecha futura es "active".
  const computed = useMemo(() => {
    const withMeta = value.map((d) => {
      const finalPrice = Number(d.finalPrice) || 0;
      const vu = fromEcuadorLocalInput(d.validUntilLocal);
      return { draft: d, finalPrice, validUntil: vu };
    });

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
      const status: TierStatus =
        i === activeIdx ? "active" : statusOf(m.validUntil, now);
      return { ...m, status };
    });
  }, [value, now]);

  function addEmpty() {
    onChange([...value, emptyTierDraft()]);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function updateAt(index: number, patch: Partial<TierDraft>) {
    onChange(value.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  const inputClass =
    "w-full p-2 bg-input-bg border border-border-default rounded-lg text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors";
  const labelClass =
    "block text-[11px] font-medium text-text-main/50 mb-1 uppercase tracking-wider";

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <div className="bg-surface-elevated/50 border border-dashed border-border-subtle rounded-lg p-6 text-center text-sm text-text-main/50">
          Sin descuentos programados. El cliente paga el precio base.
        </div>
      ) : (
        computed.map((row, i) => {
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
                  disabled={disabled}
                  className="ml-auto text-error/70 hover:text-error p-1.5 rounded-md hover:bg-error/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
                    disabled={disabled}
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
                      onChange={(e) => updateAt(i, { finalPrice: e.target.value })}
                      disabled={disabled}
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
                    disabled={disabled}
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
        })
      )}

      <button
        type="button"
        onClick={addEmpty}
        disabled={disabled}
        className="inline-flex items-center justify-center gap-2 border border-border-default text-text-main/70 hover:text-text-main hover:bg-surface-elevated font-medium py-2 px-3.5 rounded-lg transition-colors text-sm cursor-pointer disabled:opacity-50"
      >
        <FaPlus className="w-3 h-3" />
        Agregar descuento
      </button>
    </div>
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
