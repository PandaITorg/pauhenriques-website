import type { ComponentType } from "react";

export type BadgeTone = "success" | "warning" | "error" | "info" | "primary" | "neutral";

interface StatusBadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  icon?: ComponentType<{ className?: string }>;
  /** "solid" = colored bg sin border. "soft" = colored/15 + text colored (default). */
  variant?: "soft" | "solid";
  /** Tamaño. Default: "sm". */
  size?: "xs" | "sm";
  className?: string;
}

const TONE_SOFT: Record<BadgeTone, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  error: "bg-error/15 text-error",
  info: "bg-info/15 text-info",
  primary: "bg-primary/15 text-primary",
  neutral: "bg-text-main/10 text-text-main/60",
};

const TONE_SOLID: Record<BadgeTone, string> = {
  success: "bg-success text-white",
  warning: "bg-warning text-background",
  error: "bg-error text-white",
  info: "bg-info text-white",
  primary: "bg-primary text-white",
  neutral: "bg-text-main/30 text-background",
};

const SIZES = {
  xs: "text-[10px] px-2 py-0.5 gap-1",
  sm: "text-xs px-2.5 py-1 gap-1.5",
} as const;

const ICON_SIZES = {
  xs: "w-2.5 h-2.5",
  sm: "w-3 h-3",
} as const;

/**
 * Badge centralizado para todos los estados del admin (orders, products,
 * promotions, enrollments, payment links, talleres, usuarios, etc.).
 * Reemplaza ~20 variantes scattered.
 */
export default function StatusBadge({
  tone = "neutral",
  children,
  icon: Icon,
  variant = "soft",
  size = "sm",
  className = "",
}: StatusBadgeProps) {
  const toneClass = variant === "solid" ? TONE_SOLID[tone] : TONE_SOFT[tone];
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full whitespace-nowrap ${SIZES[size]} ${toneClass} ${className}`}
    >
      {Icon && <Icon className={ICON_SIZES[size]} />}
      {children}
    </span>
  );
}
