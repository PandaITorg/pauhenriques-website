"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FaArrowLeft,
  FaCog,
  FaLink,
  FaClipboardList,
  FaCopy,
  FaCheck,
  FaExternalLinkAlt,
} from "react-icons/fa";
import type { Taller } from "@/lib/talleres/types";

type SubTab = "info" | "links" | "inscripciones";

const SUB_TABS: Array<{
  key: SubTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "info", label: "Información", icon: FaCog },
  { key: "links", label: "Links de pago", icon: FaLink },
  { key: "inscripciones", label: "Inscripciones", icon: FaClipboardList },
];

interface TallerDetailClientProps {
  taller: Taller;
}

function buildOfficialUrl(slug: string): string {
  if (typeof window === "undefined") return `/pago/${slug}`;
  return `${window.location.origin}/pago/${slug}`;
}

export default function TallerDetailClient({ taller }: TallerDetailClientProps) {
  const [tab, setTab] = useState<SubTab>("info");
  const [copied, setCopied] = useState(false);
  const officialUrl = buildOfficialUrl(taller.slug);

  const copyOfficial = async () => {
    try {
      await navigator.clipboard.writeText(officialUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/40 to-background" />
        <div className="relative px-5 lg:px-8 pt-6 pb-4 md:pt-8 md:pb-6">
          <Link
            href="/admin/talleres"
            className="inline-flex items-center gap-1.5 text-xs text-text-main/50 hover:text-text-main transition-colors mb-3"
          >
            <FaArrowLeft className="w-3 h-3" />
            Talleres
          </Link>
          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-1">
            Taller
          </span>
          <h1 className="text-2xl font-semibold text-text-main">{taller.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <code className="text-xs text-text-main/70 bg-surface-elevated px-2 py-1 rounded">
              {taller.slug}
            </code>
            {taller.active ? (
              <span className="bg-success/15 text-success text-[11px] font-semibold px-2 py-0.5 rounded-full">
                Activo
              </span>
            ) : (
              <span className="bg-text-main/10 text-text-main/60 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                Inactivo
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 max-w-3xl">
            <div className="flex-1 flex items-center gap-2 bg-surface-card border border-border-subtle rounded-xl px-3 py-2 min-w-0">
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-main/40 shrink-0">
                Link oficial
              </span>
              <code className="text-xs text-text-main/80 truncate">
                {officialUrl}
              </code>
            </div>
            <button
              onClick={copyOfficial}
              className="inline-flex items-center gap-1.5 border border-border-default text-text-main/70 hover:text-text-main hover:bg-surface-elevated text-xs font-medium px-3 py-2 rounded-xl transition-colors cursor-pointer"
              title="Copiar link oficial"
            >
              {copied ? (
                <FaCheck className="w-3 h-3 text-success" />
              ) : (
                <FaCopy className="w-3 h-3" />
              )}
              {copied ? "Copiado" : "Copiar"}
            </button>
            <a
              href={`/pago/${taller.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-border-default text-text-main/70 hover:text-text-main hover:bg-surface-elevated text-xs font-medium px-3 py-2 rounded-xl transition-colors cursor-pointer"
              title="Abrir link oficial"
            >
              <FaExternalLinkAlt className="w-3 h-3" />
              Ver
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-border-subtle bg-surface-card/40">
        <div className="px-4 md:px-8">
          <nav className="flex gap-1">
            {SUB_TABS.map((t) => {
              const active = tab === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
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
        {tab === "info" && <Placeholder text="Información del taller (próximo commit)" />}
        {tab === "links" && <Placeholder text="Links de pago de este taller (próximo commit)" />}
        {tab === "inscripciones" && (
          <Placeholder text="Inscripciones de este taller (próximo commit)" />
        )}
      </div>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="bg-surface-card border border-dashed border-border-subtle rounded-xl p-12 text-center text-sm text-text-main/40">
      {text}
    </div>
  );
}
