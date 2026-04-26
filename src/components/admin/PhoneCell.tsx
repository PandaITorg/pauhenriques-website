"use client";

import { FaWhatsapp } from "react-icons/fa";
import CopyButton from "@/components/ui/CopyButton";

interface PhoneCellProps {
  phone: string;
  /** Tamaño del ícono. Default: "sm". */
  size?: "xs" | "sm";
  className?: string;
}

/**
 * Limpia el teléfono para uso en wa.me: solo dígitos. wa.me acepta
 * formato E.164 sin "+" (ej. 593991712532).
 */
export function sanitizePhoneForWhatsApp(raw: string): string {
  if (!raw) return "";
  const digits = raw.replace(/[^\d]/g, "");
  return digits;
}

const SIZES = {
  xs: "text-[11px]",
  sm: "text-xs",
} as const;

export default function PhoneCell({
  phone,
  size = "sm",
  className = "",
}: PhoneCellProps) {
  if (!phone) return <span className="text-text-main/40 text-xs">—</span>;

  const sanitized = sanitizePhoneForWhatsApp(phone);
  const waUrl = sanitized ? `https://wa.me/${sanitized}` : null;

  return (
    <div className={`inline-flex items-center gap-1.5 ${SIZES[size]} ${className}`}>
      {waUrl ? (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-text-main/70 hover:text-success transition-colors"
          title="Abrir en WhatsApp"
        >
          <FaWhatsapp className="w-3 h-3 text-success/80" />
          <span>{phone}</span>
        </a>
      ) : (
        <span className="text-text-main/70">{phone}</span>
      )}
      <CopyButton text={phone} ariaLabel="Copiar teléfono" />
    </div>
  );
}
