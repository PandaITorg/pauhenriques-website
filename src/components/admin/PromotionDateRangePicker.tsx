"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaCalendarAlt,
  FaInfinity,
  FaClock,
  FaMinus,
  FaPlus,
  FaSlidersH,
} from "react-icons/fa";

type Preset = {
  id: string;
  label: string;
  shortLabel: string;
  days: number | null; // null = far future ("sin fecha fin")
};

const PRESETS: Preset[] = [
  { id: "7d", label: "7 dias", shortLabel: "7 d", days: 7 },
  { id: "30d", label: "30 dias", shortLabel: "30 d", days: 30 },
  { id: "3m", label: "3 meses", shortLabel: "3 m", days: 90 },
  { id: "1y", label: "1 ano", shortLabel: "1 ano", days: 365 },
  { id: "open", label: "Sin fin", shortLabel: "Sin fin", days: null },
];

type UnitKey = "years" | "months" | "weeks" | "days";

type Units = Record<UnitKey, number>;

const UNIT_LABEL: Record<UnitKey, string> = {
  years: "Anos",
  months: "Meses",
  weeks: "Sem",
  days: "Dias",
};

const UNIT_CAPS: Units = {
  years: 5,
  months: 11,
  weeks: 4,
  days: 30,
};

const ZERO_UNITS: Units = { years: 0, months: 0, weeks: 0, days: 0 };

const FAR_FUTURE_YEARS = 10;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toLocalInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateOnlyInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseLocalDateTime(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 0, 0);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

// Apply a composite duration from years -> months -> weeks -> days.
function applyUnits(base: Date, u: Units): Date {
  const x = new Date(base);
  if (u.years) x.setFullYear(x.getFullYear() + u.years);
  if (u.months) x.setMonth(x.getMonth() + u.months);
  if (u.weeks) x.setDate(x.getDate() + u.weeks * 7);
  if (u.days) x.setDate(x.getDate() + u.days);
  return x;
}

function unitsAreEmpty(u: Units): boolean {
  return u.years === 0 && u.months === 0 && u.weeks === 0 && u.days === 0;
}

function formatHuman(d: Date): string {
  return d.toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isFarFuture(d: Date): boolean {
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() + FAR_FUTURE_YEARS - 1);
  return d > limit;
}

function pluralForKey(key: UnitKey, amount: number): string {
  const map: Record<UnitKey, [string, string]> = {
    years: ["ano", "anos"],
    months: ["mes", "meses"],
    weeks: ["semana", "semanas"],
    days: ["dia", "dias"],
  };
  const [s, p] = map[key];
  return amount === 1 ? s : p;
}

function humanDuration(u: Units): string {
  const parts: string[] = [];
  (Object.keys(u) as UnitKey[]).forEach((k) => {
    if (u[k] > 0) parts.push(`${u[k]} ${pluralForKey(k, u[k])}`);
  });
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} y ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`;
}

/**
 * Hold-to-repeat hook. Fires `callback` repeatedly while the user keeps the
 * pointer pressed. The first tick is delegated to `onClick` (so a normal tap
 * or keyboard activation still works); after `initialDelay` ms of holding the
 * callback fires every `interval` ms.
 */
function useHoldRepeat(
  callback: () => void,
  options?: { initialDelay?: number; interval?: number },
) {
  const cbRef = useRef(callback);
  cbRef.current = callback;
  const { initialDelay = 400, interval = 80 } = options ?? {};
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const stop = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const start = () => {
    stop();
    timeoutRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(() => cbRef.current(), interval);
    }, initialDelay);
  };

  useEffect(() => stop, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: stop,
  };
}

interface UnitStepperProps {
  unitKey: UnitKey;
  value: number;
  onChange: (next: number) => void;
}

function UnitStepper({ unitKey, value, onChange }: UnitStepperProps) {
  const max = UNIT_CAPS[unitKey];
  const clamp = (v: number) => Math.max(0, Math.min(max, v));

  // Keep latest value accessible from inside the long-press timer
  const valueRef = useRef(value);
  valueRef.current = value;

  const inc = () => onChange(clamp(valueRef.current + 1));
  const dec = () => onChange(clamp(valueRef.current - 1));

  const incHold = useHoldRepeat(inc);
  const decHold = useHoldRepeat(dec);

  const active = value > 0;
  const atMin = value <= 0;
  const atMax = value >= max;

  return (
    <div
      className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-colors ${
        active
          ? "border-primary/60 bg-primary/5"
          : "border-border-default bg-input-bg"
      }`}
    >
      <span
        className={`text-[10px] font-semibold tracking-wider uppercase ${
          active ? "text-primary" : "text-text-main/45"
        }`}
      >
        {UNIT_LABEL[unitKey]}
      </span>
      <div className="flex items-center gap-1 w-full">
        <button
          type="button"
          aria-label={`Disminuir ${UNIT_LABEL[unitKey]}`}
          disabled={atMin}
          onClick={dec}
          {...decHold}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-surface-elevated border border-border-default text-text-main/70 hover:border-primary/40 hover:text-text-main transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none touch-manipulation"
        >
          <FaMinus className="w-2.5 h-2.5" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min={0}
          max={max}
          value={value}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onChange(0);
              return;
            }
            const n = parseInt(raw, 10);
            if (Number.isNaN(n)) return;
            onChange(clamp(n));
          }}
          className={`flex-1 min-w-0 h-8 text-center text-base font-bold rounded-md bg-transparent outline-none transition-colors ${
            active ? "text-primary" : "text-text-main/50"
          }`}
        />
        <button
          type="button"
          aria-label={`Aumentar ${UNIT_LABEL[unitKey]}`}
          disabled={atMax}
          onClick={inc}
          {...incHold}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-surface-elevated border border-border-default text-text-main/70 hover:border-primary/40 hover:text-text-main transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none touch-manipulation"
        >
          <FaPlus className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}

interface Props {
  validFrom: string; // datetime-local string
  validUntil: string;
  onChange: (next: { validFrom: string; validUntil: string }) => void;
}

export default function PromotionDateRangePicker({
  validFrom,
  validUntil,
  onChange,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customUnits, setCustomUnits] = useState<Units>({
    ...ZERO_UNITS,
    months: 1,
  });

  const fromDate = parseLocalDateTime(validFrom);
  const untilDate = parseLocalDateTime(validUntil);
  const untilOpen = untilDate ? isFarFuture(untilDate) : false;

  const detectedPreset = useMemo<string | null>(() => {
    if (!fromDate || !untilDate) return null;
    if (untilOpen) return "open";
    const diffDays = Math.round(
      (untilDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const match = PRESETS.find((p) => p.days !== null && p.days === diffDays);
    return match?.id ?? null;
  }, [fromDate, untilDate, untilOpen]);

  const applyPreset = (preset: Preset) => {
    const start = fromDate ? startOfDay(fromDate) : startOfDay(new Date());
    if (preset.days === null) {
      const far = new Date(start);
      far.setFullYear(far.getFullYear() + FAR_FUTURE_YEARS);
      onChange({
        validFrom: toLocalInput(start),
        validUntil: toLocalInput(far),
      });
      setShowCustom(false);
      return;
    }
    const end = endOfDay(addDays(start, preset.days));
    onChange({
      validFrom: toLocalInput(start),
      validUntil: toLocalInput(end),
    });
    setShowCustom(false);
  };

  const applyCustom = (units: Units) => {
    if (unitsAreEmpty(units)) return;
    const start = fromDate ? startOfDay(fromDate) : startOfDay(new Date());
    const end = endOfDay(addDays(applyUnits(start, units), -1));
    onChange({
      validFrom: toLocalInput(start),
      validUntil: toLocalInput(end),
    });
  };

  // Reapply when user changes any unit while custom is open
  useEffect(() => {
    if (!showCustom) return;
    applyCustom(customUnits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCustom, customUnits]);

  const setStartFromDateInput = (value: string) => {
    if (!value) {
      onChange({ validFrom: "", validUntil });
      return;
    }
    const [y, m, d] = value.split("-").map(Number);
    const next = new Date(y, m - 1, d, 0, 0, 0, 0);
    onChange({ validFrom: toLocalInput(next), validUntil });
  };

  const setEndFromDateInput = (value: string) => {
    if (!value) {
      onChange({ validFrom, validUntil: "" });
      return;
    }
    const [y, m, d] = value.split("-").map(Number);
    const next = new Date(y, m - 1, d, 23, 59, 0, 0);
    onChange({ validFrom, validUntil: toLocalInput(next) });
  };

  const setNoEndDate = () => {
    const start = fromDate ?? startOfDay(new Date());
    const far = new Date(start);
    far.setFullYear(far.getFullYear() + FAR_FUTURE_YEARS);
    onChange({
      validFrom: toLocalInput(start),
      validUntil: toLocalInput(far),
    });
  };

  const summary = (() => {
    if (!fromDate || !untilDate) {
      return "Selecciona un rango de fechas";
    }
    if (untilOpen) {
      return `Activa desde el ${formatHuman(fromDate)} (sin fecha de fin)`;
    }
    return `Activa del ${formatHuman(fromDate)} al ${formatHuman(untilDate)}`;
  })();

  const customDurationText = humanDuration(customUnits);
  const customIsEmpty = unitsAreEmpty(customUnits);

  const labelClass = "block text-sm font-medium text-text-main/60 mb-1";
  const dateInputClass =
    "w-full p-2.5 bg-input-bg border border-border-default rounded-lg text-sm text-text-main focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-text-main/60">
        <FaCalendarAlt className="w-3.5 h-3.5" />
        <span>Vigencia *</span>
      </div>

      {/* Presets — primary mobile-friendly UX */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {PRESETS.map((preset) => {
          const active = !showCustom && detectedPreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                active
                  ? "bg-primary/15 border-primary text-primary"
                  : "bg-surface-elevated border-border-default text-text-main/60 hover:border-primary/40"
              }`}
            >
              {preset.id === "open" ? (
                <FaInfinity className="w-3 h-3 shrink-0" />
              ) : (
                <FaClock className="w-3 h-3 shrink-0" />
              )}
              <span className="truncate">
                <span className="hidden sm:inline">{preset.label}</span>
                <span className="sm:hidden">{preset.shortLabel}</span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setShowCustom(true);
            applyCustom(customUnits);
          }}
          className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
            showCustom
              ? "bg-primary/15 border-primary text-primary"
              : "bg-surface-elevated border-border-default text-text-main/60 hover:border-primary/40"
          }`}
        >
          <FaSlidersH className="w-3 h-3 shrink-0" />
          <span className="truncate">Personalizar</span>
        </button>
      </div>

      {/* Custom builder: 4 mini steppers (years / months / weeks / days) */}
      {showCustom && (
        <div className="bg-surface-elevated/60 border border-border-subtle rounded-lg p-3 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["years", "months", "weeks", "days"] as UnitKey[]).map((k) => (
              <UnitStepper
                key={k}
                unitKey={k}
                value={customUnits[k]}
                onChange={(next) =>
                  setCustomUnits((prev) => ({ ...prev, [k]: next }))
                }
              />
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p
              className={`text-xs ${
                customIsEmpty ? "text-warning" : "text-text-main/60"
              }`}
            >
              {customIsEmpty
                ? "Selecciona al menos una unidad"
                : `${customDurationText} desde el dia de inicio`}
            </p>
            {!customIsEmpty && (
              <button
                type="button"
                onClick={() => setCustomUnits({ ...ZERO_UNITS })}
                className="text-[11px] text-text-main/40 hover:text-text-main/70 underline-offset-2 hover:underline cursor-pointer"
              >
                Reiniciar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary card */}
      <div className="bg-surface-elevated rounded-lg p-3 border border-border-subtle">
        <p className="text-xs text-text-main/70">{summary}</p>
      </div>

      {/* Advanced — date pickers (no time) */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="text-xs text-primary/80 hover:text-primary underline-offset-2 hover:underline cursor-pointer"
      >
        {showAdvanced ? "Ocultar fechas exactas" : "Personalizar fechas"}
      </button>

      {showAdvanced && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Desde</label>
              <input
                type="date"
                required
                value={fromDate ? toDateOnlyInput(fromDate) : ""}
                onChange={(e) => setStartFromDateInput(e.target.value)}
                className={dateInputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Hasta</label>
              <input
                type="date"
                required
                value={
                  untilDate && !untilOpen ? toDateOnlyInput(untilDate) : ""
                }
                disabled={untilOpen}
                onChange={(e) => setEndFromDateInput(e.target.value)}
                className={`${dateInputClass} ${untilOpen ? "opacity-50 cursor-not-allowed" : ""}`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="noEndDate"
              checked={untilOpen}
              onChange={(e) => {
                if (e.target.checked) {
                  setNoEndDate();
                } else {
                  const start = fromDate ?? startOfDay(new Date());
                  const end = endOfDay(addDays(start, 30));
                  onChange({
                    validFrom: toLocalInput(start),
                    validUntil: toLocalInput(end),
                  });
                }
              }}
              className="w-4 h-4 accent-primary rounded"
            />
            <label htmlFor="noEndDate" className="text-xs text-text-main/60">
              Sin fecha de fin (cupon permanente)
            </label>
          </div>
          <p className="text-xs text-text-main/40">
            La promocion arranca a las 00:00 del dia "Desde" y termina a las
            23:59 del dia "Hasta".
          </p>
        </div>
      )}
    </div>
  );
}
