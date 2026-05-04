"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaInfinity,
  FaClock,
  FaMinus,
  FaPlus,
  FaSlidersH,
  FaCalendarAlt,
} from "react-icons/fa";

const ECUADOR_TZ = "America/Guayaquil";

type Unit = "days" | "weeks" | "months" | "years";

const UNIT_OPTIONS: { id: Unit; shortLabel: string }[] = [
  { id: "days", shortLabel: "Dias" },
  { id: "weeks", shortLabel: "Sem" },
  { id: "months", shortLabel: "Meses" },
  { id: "years", shortLabel: "Anos" },
];

const UNIT_MAX: Record<Unit, number> = {
  days: 365,
  weeks: 52,
  months: 60,
  years: 5,
};

type Preset = {
  id: string;
  shortLabel: string;
  longLabel: string;
  amount: number;
  unit: Unit | "permanent";
};

const PRESETS: Preset[] = [
  { id: "7d", shortLabel: "7 d", longLabel: "7 dias", amount: 7, unit: "days" },
  {
    id: "2w",
    shortLabel: "2 sem",
    longLabel: "2 semanas",
    amount: 2,
    unit: "weeks",
  },
  {
    id: "1m",
    shortLabel: "1 mes",
    longLabel: "1 mes",
    amount: 1,
    unit: "months",
  },
  {
    id: "3m",
    shortLabel: "3 m",
    longLabel: "3 meses",
    amount: 3,
    unit: "months",
  },
  {
    id: "permanent",
    shortLabel: "Sin fin",
    longLabel: "Permanente",
    amount: 0,
    unit: "permanent",
  },
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

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

function fromEcuadorLocalInput(local: string): Date | null {
  if (!local) return null;
  const iso = `${local}:00-05:00`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function formatEcuadorHuman(d: Date): string {
  return new Intl.DateTimeFormat("es-EC", {
    timeZone: ECUADOR_TZ,
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function ecuadorDateOnly(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ECUADOR_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function endOfDayEcuadorLocal(yyyymmdd: string): string {
  return `${yyyymmdd}T23:59`;
}

function addUnits(amount: number, unit: Unit, base: Date): Date {
  const x = new Date(base);
  switch (unit) {
    case "days":
      x.setDate(x.getDate() + amount);
      return x;
    case "weeks":
      x.setDate(x.getDate() + amount * 7);
      return x;
    case "months":
      x.setMonth(x.getMonth() + amount);
      return x;
    case "years":
      x.setFullYear(x.getFullYear() + amount);
      return x;
  }
}

function pluralUnit(unit: Unit, amount: number): string {
  const map: Record<Unit, [string, string]> = {
    days: ["dia", "dias"],
    weeks: ["semana", "semanas"],
    months: ["mes", "meses"],
    years: ["ano", "anos"],
  };
  const [s, p] = map[unit];
  return amount === 1 ? s : p;
}

interface Props {
  /** Datetime-local string in Ecuador time (YYYY-MM-DDTHH:mm), or "" for permanent. */
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

export default function TierUntilPicker({ value, onChange, disabled }: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customUnit, setCustomUnit] = useState<Unit>("weeks");
  const [customAmount, setCustomAmount] = useState<number>(2);

  const valueDate = useMemo(() => fromEcuadorLocalInput(value), [value]);

  const isPermanent = !value;

  const apply = (preset: Preset) => {
    if (preset.unit === "permanent") {
      onChange("");
      setShowCustom(false);
      return;
    }
    const target = addUnits(preset.amount, preset.unit, new Date());
    const dateOnly = ecuadorDateOnly(target);
    onChange(endOfDayEcuadorLocal(dateOnly));
    setShowCustom(false);
  };

  const applyCustom = (unit: Unit, amount: number) => {
    const safe = Math.max(1, Math.min(UNIT_MAX[unit], amount));
    const target = addUnits(safe, unit, new Date());
    const dateOnly = ecuadorDateOnly(target);
    onChange(endOfDayEcuadorLocal(dateOnly));
  };

  useEffect(() => {
    if (!showCustom) return;
    applyCustom(customUnit, customAmount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCustom, customUnit, customAmount]);

  const setExactDate = (yyyymmdd: string) => {
    if (!yyyymmdd) {
      onChange("");
      return;
    }
    onChange(endOfDayEcuadorLocal(yyyymmdd));
  };

  const summary = (() => {
    if (isPermanent) return "Permanente (sin fecha de fin)";
    if (valueDate) return `Vence el ${formatEcuadorHuman(valueDate)}`;
    return "Selecciona una vigencia";
  })();

  const presetButtonClass = (active: boolean) =>
    `flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
      active
        ? "bg-primary/15 border-primary text-primary"
        : "bg-input-bg border-border-default text-text-main/60 hover:border-primary/40"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;

  const dateInputClass =
    "w-full p-2 bg-input-bg border border-border-default rounded-lg text-sm text-text-main focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors";

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={disabled}
            onClick={() => apply(p)}
            className={presetButtonClass(false)}
          >
            {p.unit === "permanent" ? (
              <FaInfinity className="w-2.5 h-2.5 shrink-0" />
            ) : (
              <FaClock className="w-2.5 h-2.5 shrink-0" />
            )}
            <span className="truncate">
              <span className="hidden sm:inline">{p.longLabel}</span>
              <span className="sm:hidden">{p.shortLabel}</span>
            </span>
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setShowCustom(true);
            applyCustom(customUnit, customAmount);
          }}
          className={presetButtonClass(showCustom)}
        >
          <FaSlidersH className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">Custom</span>
        </button>
      </div>

      {showCustom && (
        <div className="bg-surface-elevated/60 border border-border-subtle rounded-lg p-2.5 space-y-2">
          <div className="grid grid-cols-4 gap-1.5">
            {UNIT_OPTIONS.map((u) => {
              const active = customUnit === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setCustomUnit(u.id)}
                  className={`px-1.5 py-1.5 rounded-md border text-[11px] font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-primary/15 border-primary text-primary"
                      : "bg-input-bg border-border-default text-text-main/60 hover:border-primary/40"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {u.shortLabel}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={disabled || customAmount <= 1}
              onClick={() => setCustomAmount((v) => Math.max(1, v - 1))}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-md bg-input-bg border border-border-default text-text-main/70 hover:border-primary/40 hover:text-text-main transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Disminuir"
            >
              <FaMinus className="w-2.5 h-2.5" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={UNIT_MAX[customUnit]}
              value={customAmount}
              disabled={disabled}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (Number.isNaN(v)) return;
                setCustomAmount(
                  Math.max(1, Math.min(UNIT_MAX[customUnit], v)),
                );
              }}
              className="flex-1 h-9 text-center text-sm font-semibold bg-input-bg border border-border-default rounded-md text-text-main focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors"
            />
            <button
              type="button"
              disabled={disabled || customAmount >= UNIT_MAX[customUnit]}
              onClick={() =>
                setCustomAmount((v) => Math.min(UNIT_MAX[customUnit], v + 1))
              }
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-md bg-input-bg border border-border-default text-text-main/70 hover:border-primary/40 hover:text-text-main transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Aumentar"
            >
              <FaPlus className="w-2.5 h-2.5" />
            </button>
          </div>
          <p className="text-[10px] text-text-main/50">
            {customAmount} {pluralUnit(customUnit, customAmount)} desde hoy
          </p>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[10px] text-text-main/50">
        <FaCalendarAlt className="w-2.5 h-2.5 shrink-0" />
        <span className="truncate">{summary}</span>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setShowAdvanced((v) => !v)}
        className="text-[10px] text-primary/80 hover:text-primary underline-offset-2 hover:underline cursor-pointer disabled:opacity-50"
      >
        {showAdvanced ? "Ocultar fecha exacta" : "Elegir fecha exacta"}
      </button>

      {showAdvanced && (
        <input
          type="date"
          value={valueDate ? ecuadorDateOnly(valueDate) : ""}
          disabled={disabled}
          onChange={(e) => setExactDate(e.target.value)}
          className={dateInputClass}
        />
      )}
    </div>
  );
}
