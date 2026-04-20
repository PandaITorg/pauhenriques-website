"use client";

import { useEffect, useState } from "react";
import { getBinDatabase, lookupBinSync } from "@/lib/bin-database";
import { lookupBankPalette } from "@/lib/bank-colors";
import {
  CARD_BRAND_NAMES,
  CARD_TYPE_NAMES,
  type BinDatabase,
  type BinInfo,
} from "@/types/bin";

interface CardVisualProps {
  bin?: string;
  brand: string;
  last4: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  /** Compact = mini real-card thumbnail (Rappi/PayPal style). Full = larger card. */
  variant?: "compact" | "full";
}

// Brand gradients — fallback when bank color is unknown.
// Universally recognizable colors per network.
const BRAND_GRADIENT: Record<string, { from: string; to: string }> = {
  vi: { from: "#1a1f71", to: "#0d1240" },
  mc: { from: "#cc4d2e", to: "#561a0e" },
  ax: { from: "#016fcf", to: "#003f7a" },
  di: { from: "#2c3e50", to: "#11161e" },
  dc: { from: "#ff6f00", to: "#a83a00" },
  default: { from: "#3a4632", to: "#1a2014" },
};

// Small SVG-ish brand mark using styled text — no external asset needed.
function BrandMark({ brand }: { brand: string }) {
  const text = CARD_BRAND_NAMES[brand as keyof typeof CARD_BRAND_NAMES] || "CARD";
  if (brand === "mc") {
    // Mastercard interlocking circles
    return (
      <div className="flex items-center -space-x-2">
        <span className="w-4 h-4 rounded-full bg-[#eb001b]" />
        <span className="w-4 h-4 rounded-full bg-[#f79e1b]/90 mix-blend-screen" />
      </div>
    );
  }
  return (
    <span className="text-white text-[11px] font-bold tracking-wider uppercase italic">
      {text}
    </span>
  );
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

  const bankName = binInfo?.bank ?? "";
  const bankPalette = lookupBankPalette(bankName, binInfo?.type);
  // Bank color takes priority; fallback to network brand color.
  const brandFallback = BRAND_GRADIENT[brand] ?? BRAND_GRADIENT.default;
  const gradientFrom = bankPalette?.primary ?? brandFallback.from;
  const gradientTo = bankPalette?.secondary ?? brandFallback.to;
  const gradientStyle = {
    background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
  };
  const cardType = binInfo?.type ? CARD_TYPE_NAMES[binInfo.type] || "" : "";
  const expiryShort = `${expiryMonth.padStart(2, "0")}/${String(expiryYear).slice(-2)}`;

  if (variant === "compact") {
    // Mini real-card thumbnail (≈ 80x52, aspect 1.6:1) + meta on the right.
    return (
      <div className="flex items-center gap-3 min-w-0">
        <div
          style={gradientStyle}
          className="shrink-0 relative w-22 h-14 rounded-md shadow-md overflow-hidden"
        >
          {/* Subtle holographic shine */}
          <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/20 pointer-events-none" />
          {/* Chip */}
          <div className="absolute top-2 left-2 w-3.5 h-2.5 rounded-sm bg-linear-to-br from-yellow-200/80 to-yellow-600/80 border border-yellow-700/40" />
          {/* Brand mark */}
          <div className="absolute top-1.5 right-2">
            <BrandMark brand={brand} />
          </div>
          {/* Last 4 */}
          <div className="absolute bottom-1.5 left-2 right-2 flex justify-between items-end">
            <span className="text-white/95 text-[11px] font-mono tracking-[0.05em] font-semibold drop-shadow">
              ····{last4}
            </span>
            <span className="text-white/75 text-[8px] font-mono">{expiryShort}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-main truncate">
            {bankName || CARD_BRAND_NAMES[brand as keyof typeof CARD_BRAND_NAMES] || "Tarjeta"}
          </p>
          <p className="text-xs text-text-main/50 truncate">
            {cardType ? `${cardType} · ` : ""}{holderName || "—"}
          </p>
        </div>
      </div>
    );
  }

  // Full variant — full real-card look (for confirm step / detailed views)
  return (
    <div
      style={gradientStyle}
      className="relative overflow-hidden rounded-2xl shadow-xl p-5 aspect-[1.586/1] w-full max-w-sm"
    >
      <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/30 pointer-events-none" />
      {/* Top row: type label + brand */}
      <div className="relative flex justify-between items-start">
        <div>
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/50">
            {cardType || "Tarjeta"}
          </p>
          {bankName && (
            <p className="text-xs text-white/85 mt-0.5 font-medium">{bankName}</p>
          )}
        </div>
        <BrandMark brand={brand} />
      </div>

      {/* Chip */}
      <div className="relative mt-6 w-9 h-7 rounded-md bg-linear-to-br from-yellow-200 to-yellow-600 border border-yellow-700/40 shadow-inner" />

      {/* Card number */}
      <div className="relative mt-4">
        <p className="font-mono text-lg tracking-wider text-white drop-shadow">
          ····  ····  ····  {last4}
        </p>
      </div>

      {/* Bottom row: holder + expiry */}
      <div className="relative mt-3 flex justify-between items-end">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-wider text-white/50">Titular</p>
          <p className="text-white text-sm font-medium truncate uppercase">
            {holderName || "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-wider text-white/50">Expira</p>
          <p className="text-white text-sm font-mono font-medium">{expiryShort}</p>
        </div>
      </div>
    </div>
  );
}
