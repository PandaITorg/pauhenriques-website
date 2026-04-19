"use client";

import { useEffect, useState } from "react";
import { FaCreditCard } from "react-icons/fa";
import { getBinDatabase, lookupBinSync } from "@/lib/bin-database";
import {
  CARD_BRAND_NAMES,
  CARD_TYPE_NAMES,
  type BinDatabase,
  type BinInfo,
} from "@/types/bin";

interface CardVisualProps {
  bin?: string; // first 6+ digits (BIN)
  brand: string; // SDK type code: vi, mc, ax, di, dc
  last4: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  /** Compact for list rows; full for detailed views */
  variant?: "compact" | "full";
}

const BRAND_COLORS: Record<string, string> = {
  vi: "from-blue-900/30 to-blue-700/20",
  mc: "from-orange-700/30 to-red-700/20",
  ax: "from-blue-600/30 to-cyan-700/20",
  di: "from-slate-700/40 to-slate-600/20",
  dc: "from-orange-600/30 to-orange-500/20",
  default: "from-bosque-profundo-600 to-bosque-profundo-700",
};

function brandLogo(brand: string): string {
  return CARD_BRAND_NAMES[brand as keyof typeof CARD_BRAND_NAMES] || "Tarjeta";
}

export default function CardVisual({
  bin,
  brand,
  last4,
  holderName,
  expiryMonth,
  expiryYear,
  variant = "compact",
}: CardVisualProps) {
  const [binInfo, setBinInfo] = useState<BinInfo | null>(null);

  useEffect(() => {
    if (!bin) return;
    let cancelled = false;
    getBinDatabase().then((db: BinDatabase | null) => {
      if (cancelled || !db) return;
      const info = lookupBinSync(bin, db);
      if (info) setBinInfo(info);
    });
    return () => {
      cancelled = true;
    };
  }, [bin]);

  const gradient = BRAND_COLORS[brand] ?? BRAND_COLORS.default;
  const bankName = binInfo?.bank ?? "";
  const cardType = binInfo?.type
    ? CARD_TYPE_NAMES[binInfo.type] || ""
    : "";

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`shrink-0 w-10 h-7 rounded bg-gradient-to-br ${gradient} border border-border-subtle flex items-center justify-center`}
        >
          <FaCreditCard className="w-4 h-4 text-text-main/40" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm text-text-main">
              {brandLogo(brand)}
              {cardType ? <span className="font-normal text-text-main/55"> {cardType}</span> : null}
            </span>
            <span className="font-mono text-sm text-text-main/70">
              ****{last4}
            </span>
          </div>
          <p className="text-xs text-text-main/45 truncate">
            {bankName ? <span className="text-primary/70">{bankName}</span> : null}
            {bankName && holderName ? " · " : ""}
            {holderName} · Exp {expiryMonth}/{expiryYear}
          </p>
        </div>
      </div>
    );
  }

  // Full variant — like a real card
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} border border-border-subtle p-5 aspect-[1.6/1] max-w-sm`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-text-main/40">
            {cardType || "Tarjeta"}
          </p>
          {bankName && (
            <p className="text-xs text-text-main/70 mt-0.5">{bankName}</p>
          )}
        </div>
        <span className="text-xs font-bold text-text-main/80">
          {brandLogo(brand)}
        </span>
      </div>

      <div className="absolute bottom-12 left-5 right-5">
        <p className="font-mono text-lg tracking-wider text-text-main">
          ****  ****  ****  {last4}
        </p>
      </div>

      <div className="absolute bottom-3 left-5 right-5 flex justify-between items-end text-xs">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-text-main/40">Titular</p>
          <p className="text-text-main/80 font-medium">{holderName || "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-wider text-text-main/40">Expira</p>
          <p className="text-text-main/80 font-mono font-medium">
            {expiryMonth}/{String(expiryYear).slice(-2)}
          </p>
        </div>
      </div>
    </div>
  );
}
