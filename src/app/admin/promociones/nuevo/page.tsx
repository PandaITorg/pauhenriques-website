"use client";

import PromotionForm from "@/components/admin/PromotionForm";

export default function NuevaPromocionPage() {
  return (
    <div>
      {/* ── Header ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/40 to-background" />
        <div className="relative px-5 lg:px-8 pt-6 pb-4 md:pt-8 md:pb-6">
          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-1">
            Promociones
          </span>
          <h1 className="text-2xl font-semibold text-text-main">
            Nueva Promocion
          </h1>
        </div>
      </div>
      <div className="h-px bg-linear-to-r from-transparent via-border-default to-transparent" />

      <div className="px-5 lg:px-8 py-6 max-w-4xl">
        <PromotionForm />
      </div>
    </div>
  );
}
