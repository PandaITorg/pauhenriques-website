"use client";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  /** Tamaño del switch. Default: "md". */
  size?: "sm" | "md";
  /** Label opcional a la izquierda del track (clickeable). */
  label?: React.ReactNode;
  /** Texto auxiliar bajo el label. */
  description?: React.ReactNode;
  /** Aria-label si no hay `label` visible. */
  ariaLabel?: string;
  className?: string;
}

const SIZES = {
  sm: { track: "w-8 h-4.5", thumb: "w-3.5 h-3.5", translate: "translate-x-3.5" },
  md: { track: "w-11 h-6", thumb: "w-5 h-5", translate: "translate-x-5" },
} as const;

/**
 * Toggle visual estándar. Reemplaza FaToggleOn/FaToggleOff y checkboxes
 * usados como estado on/off en formularios admin.
 */
export default function Switch({
  checked,
  onCheckedChange,
  disabled,
  size = "md",
  label,
  description,
  ariaLabel,
  className = "",
}: SwitchProps) {
  const dim = SIZES[size];

  const trigger = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onCheckedChange(!checked);
      }}
      disabled={disabled}
      className={`relative inline-flex shrink-0 ${dim.track} cursor-pointer rounded-full transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-surface-elevated border border-border-default"
      }`}
    >
      <span
        className={`pointer-events-none inline-block ${dim.thumb} transform rounded-full bg-white shadow-sm transition-transform duration-150 ${
          checked ? dim.translate : "translate-x-0.5"
        } ${size === "sm" ? "mt-0.5" : "mt-0.5"}`}
      />
    </button>
  );

  if (!label && !description) {
    return <span className={className}>{trigger}</span>;
  }

  return (
    <label
      className={`flex items-start gap-3 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${className}`}
    >
      {trigger}
      <span className="flex flex-col">
        {label && (
          <span className="text-sm font-medium text-text-main leading-tight">
            {label}
          </span>
        )}
        {description && (
          <span className="text-[11px] text-text-main/50 mt-0.5 leading-snug">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
