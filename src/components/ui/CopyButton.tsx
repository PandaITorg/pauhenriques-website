"use client";

import { FaCopy, FaCheck } from "react-icons/fa";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

interface CopyButtonProps {
  text: string;
  /** Texto del label cuando variant="inline". Default: "Copiar". */
  label?: string;
  /** "icon" = solo el ícono (compacto). "inline" = ícono + label. Default: "icon". */
  variant?: "icon" | "inline";
  /** Mensaje custom del toast al copiar. */
  toastMessage?: string;
  /** Si true, no muestra toast (útil cuando hay feedback visual inline). */
  silent?: boolean;
  /** Callback opcional tras copiar. */
  onCopied?: () => void;
  /** Tooltip / aria-label. Default: "Copiar". */
  ariaLabel?: string;
  className?: string;
}

const ICON_BASE =
  "inline-flex items-center justify-center text-text-main/40 hover:text-primary transition-colors cursor-pointer disabled:opacity-50";
const INLINE_BASE =
  "inline-flex items-center gap-1.5 border border-border-default text-text-main/70 hover:text-text-main hover:bg-surface-elevated text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50";

export default function CopyButton({
  text,
  label = "Copiar",
  variant = "icon",
  toastMessage,
  silent,
  onCopied,
  ariaLabel = "Copiar",
  className = "",
}: CopyButtonProps) {
  const { copy, copied } = useCopyToClipboard({
    toast: !silent,
    ...(toastMessage ? { successMessage: toastMessage } : {}),
  });

  const handle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const ok = await copy(text);
    if (ok) onCopied?.();
  };

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handle}
        aria-label={ariaLabel}
        className={`${INLINE_BASE} ${className}`}
      >
        {copied ? (
          <FaCheck className="w-3 h-3 text-success" />
        ) : (
          <FaCopy className="w-3 h-3" />
        )}
        {copied ? "Copiado" : label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`${ICON_BASE} ${className}`}
    >
      {copied ? (
        <FaCheck className="w-3.5 h-3.5 text-success" />
      ) : (
        <FaCopy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
