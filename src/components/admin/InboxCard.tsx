"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { FaArrowRight } from "react-icons/fa";

interface InboxCardProps {
  icon: ComponentType<{ className?: string }>;
  /** Tono de color del ícono y borde sutil. */
  tone: "warning" | "info" | "error" | "primary";
  title: string;
  count: number;
  href: string;
  ctaLabel?: string;
}

const TONE_STYLES: Record<
  InboxCardProps["tone"],
  { iconBg: string; iconText: string; ring: string }
> = {
  warning: {
    iconBg: "bg-warning/15",
    iconText: "text-warning",
    ring: "hover:border-warning/30 hover:shadow-(--shadow-glow-warning)",
  },
  info: {
    iconBg: "bg-info/15",
    iconText: "text-info",
    ring: "hover:border-info/30",
  },
  error: {
    iconBg: "bg-error/15",
    iconText: "text-error",
    ring: "hover:border-error/30",
  },
  primary: {
    iconBg: "bg-primary/15",
    iconText: "text-primary",
    ring: "hover:border-primary/30 hover:shadow-(--shadow-glow-primary)",
  },
};

/**
 * Card del inbox del dashboard. Solo se muestra si count > 0 (lo decide
 * el padre — la card asume que vale la pena mostrarse).
 */
export default function InboxCard({
  icon: Icon,
  tone,
  title,
  count,
  href,
  ctaLabel = "Ver",
}: InboxCardProps) {
  const style = TONE_STYLES[tone];
  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 bg-surface-card border border-border-subtle rounded-xl p-4 md:p-5 transition-all duration-200 cursor-pointer ${style.ring}`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg} ${style.iconText}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-main truncate">{title}</p>
        <p className="text-2xl font-bold text-text-main mt-0.5">
          {count}
        </p>
      </div>
      <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-text-main/50 group-hover:text-primary transition-colors shrink-0">
        {ctaLabel}
        <FaArrowRight className="w-3 h-3" />
      </span>
    </Link>
  );
}
