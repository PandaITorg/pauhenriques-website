"use client";

import { useMemo } from "react";
import { FaPlus, FaTrash, FaCheckCircle, FaClock, FaHistory } from "react-icons/fa";
import TierUntilPicker from "./TierUntilPicker";

type TierStatus = "active" | "future" | "expired";

// ponytail: finalPrice es la fuente de verdad; percentOff/percentInput son para el badge y el round-trip del editor.
// ponytail: si el precio base cambia con un descuento activo, hay que re-guardar el tier (raro; no auto-recalculo).
export interface TierDraft {
  // UI-only id so React keys don't collide while editing.
  uid: string;
  finalPrice: string; // string to allow empty/editing in the input
  label: string;
  /** Datetime-local string (YYYY-MM-DDTHH:mm) in Ecuador time, or empty for permanente. */
  validUntilLocal: string;
  /** Which input mode the user is in. Not persisted — derived from percentOff on load. */
  inputMode: "pct" | "price";
  /** Raw string in the % input while the user types. UI only. */
  percentInput: string;
}

export interface RawTier {
  finalPrice: number;
  label: string;
  validUntil?: unknown;
  percentOff?: number;
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

function newUid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function rawTierToDraft(raw: RawTier): TierDraft {
  const vu = toDate(raw.validUntil);
  const hasPct =
    typeof raw.percentOff === "number" &&
    raw.percentOff >= 1 &&
    raw.percentOff <= 99;
  return {
    uid: newUid(),
    finalPrice: String(raw.finalPrice ?? ""),
    label: raw.label ?? "",
    validUntilLocal: vu ? toEcuadorLocalInput(vu) : "",
    inputMode: hasPct ? "pct" : "price",
    percentInput: hasPct ? String(raw.percentOff) : "",
  };
}

export function emptyTierDraft(): TierDraft {
  return {
    uid: newUid(),
    finalPrice: "",
    label: "",
    validUntilLocal: "",
    inputMode: "pct",
    percentInput: "",
  };
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

  function updatePctAt(index: number, pctStr: string) {
    const pct = parseFloat(pctStr);
    const finalPriceNum =
      !isNaN(pct) && pct > 0 && pct < 100 && basePriceWithVat > 0
        ? round2(basePriceWithVat * (1 - pct / 100))
        : 0;
    updateAt(index, {
      percentInput: pctStr,
      finalPrice: finalPriceNum > 0 ? String(finalPriceNum) : "",
    });
  }

  function switchMode(index: number, mode: "pct" | "price") {
    const d = value[index];
    if (mode === d.inputMode) return;
    if (mode === "pct") {
      // Pre-fill the % from current finalPrice when possible
      const fp = Number(d.finalPrice);
      if (fp > 0 && basePriceWithVat > 0) {
        const derivedPct = Math.round((1 - fp / basePriceWithVat) * 100);
        if (derivedPct >= 1 && derivedPct <= 99) {
          updateAt(index, { inputMode: "pct", percentInput: String(derivedPct) });
          return;
        }
      }
      updateAt(index, { inputMode: "pct", percentInput: "" });
    } else {
      updateAt(index, { inputMode: "price", percentInput: "" });
    }
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
          const { draft, finalPrice, status } = row;
          const amountOff =
            finalPrice > 0 && basePriceWithVat > 0
              ? Math.max(0, basePriceWithVat - finalPrice)
              : 0;
          const derivedPct =
            basePriceWithVat > 0
              ? Math.round((amountOff / basePriceWithVat) * 100)
              : 0;
          // Use stored % in pct mode (exact round-trip), otherwise derive.
          const pctNum = parseFloat(draft.percentInput);
          const displayPct =
            draft.inputMode === "pct" && !isNaN(pctNum) && pctNum > 0
              ? Math.round(pctNum)
              : derivedPct;

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
                {displayPct > 0 && (
                  <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    -{displayPct}% OFF
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

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div className="space-y-1.5">
                    {/* Mode toggle */}
                    <div className="flex text-xs font-medium border border-border-default rounded-md overflow-hidden w-fit">
                      <button
                        type="button"
                        onClick={() => switchMode(i, "pct")}
                        disabled={disabled}
                        className={`px-3 py-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed ${
                          draft.inputMode === "pct"
                            ? "bg-primary text-white"
                            : "text-text-main/60 hover:bg-surface-elevated"
                        }`}
                      >
                        % OFF
                      </button>
                      <button
                        type="button"
                        onClick={() => switchMode(i, "price")}
                        disabled={disabled}
                        className={`px-3 py-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed ${
                          draft.inputMode === "price"
                            ? "bg-primary text-white"
                            : "text-text-main/60 hover:bg-surface-elevated"
                        }`}
                      >
                        $ Precio final
                      </button>
                    </div>

                    {draft.inputMode === "pct" ? (
                      <div>
                        <label className={labelClass}>Porcentaje de descuento</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            min="1"
                            max="99"
                            value={draft.percentInput}
                            onChange={(e) => updatePctAt(i, e.target.value)}
                            disabled={disabled}
                            placeholder="35"
                            className={`${inputClass} pr-8`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-main/40 text-sm">
                            %
                          </span>
                        </div>
                        {Number(draft.finalPrice) > 0 && (
                          <p className="text-[11px] text-text-main/50 mt-1">
                            Precio resultante:{" "}
                            <strong className="text-text-main">
                              ${Number(draft.finalPrice).toFixed(2)}
                            </strong>
                          </p>
                        )}
                      </div>
                    ) : (
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
                            disabled={disabled}
                            placeholder="55.00"
                            className={`${inputClass} pl-6`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Vigencia</label>
                  <TierUntilPicker
                    value={draft.validUntilLocal}
                    onChange={(next) =>
                      updateAt(i, { validUntilLocal: next })
                    }
                    disabled={disabled}
                  />
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
