"use client";

import { useState } from "react";
import { FaClipboardList, FaLink } from "react-icons/fa";
import EnrollmentsSection from "@/components/admin/talleres/EnrollmentsSection";
import PaymentLinksSection from "@/components/admin/talleres/PaymentLinksSection";

type TopTab = "inscripciones" | "links";

const TOP_TABS: Array<{ key: TopTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "inscripciones", label: "Inscripciones", icon: FaClipboardList },
  { key: "links", label: "Links de pago", icon: FaLink },
];

export default function AdminTalleresPage() {
  const [topTab, setTopTab] = useState<TopTab>("inscripciones");

  return (
    <div>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/40 to-background" />
        <div className="relative px-5 lg:px-8 pt-6 pb-4 md:pt-8 md:pb-6">
          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-1">
            Gestión
          </span>
          <h1 className="text-2xl font-semibold text-text-main">Talleres</h1>
          <p className="text-sm text-text-main/50 mt-1">
            Inscripciones al taller Tóxica sin Tóxicos y links de pago personalizados.
          </p>
        </div>
      </div>

      <div className="border-b border-border-subtle bg-surface-card/40">
        <div className="px-4 md:px-8">
          <nav className="flex gap-1">
            {TOP_TABS.map((t) => {
              const active = topTab === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTopTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                    active
                      ? "text-primary border-primary"
                      : "text-text-main/50 hover:text-text-main border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="px-5 lg:px-8 py-6">
        {topTab === "inscripciones" ? <EnrollmentsSection /> : <PaymentLinksSection />}
      </div>
    </div>
  );
}
