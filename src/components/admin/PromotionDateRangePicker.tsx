"use client";

import { useMemo, useState } from "react";
import { FaCalendarAlt, FaInfinity, FaClock } from "react-icons/fa";

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
  { id: "open", label: "Sin fecha fin", shortLabel: "Sin fin", days: null },
];

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
      return;
    }
    const end = endOfDay(addDays(start, preset.days));
    onChange({
      validFrom: toLocalInput(start),
      validUntil: toLocalInput(end),
    });
  };

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
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {PRESETS.map((preset) => {
          const active = detectedPreset === preset.id;
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
      </div>

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
