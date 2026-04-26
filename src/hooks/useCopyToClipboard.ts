"use client";

import { useCallback, useState } from "react";
import { useToastStore } from "@/stores/toast.store";

interface UseCopyToClipboardOptions {
  /** Toast feedback. Default: true. Pasar false para silenciar (ej. cuando hay UI inline). */
  toast?: boolean;
  /** Mensaje del toast cuando copia OK. Default: "Copiado al portapapeles". */
  successMessage?: string;
  /** Tiempo en ms que el state `copied` se mantiene true. Default: 1500. */
  resetMs?: number;
}

interface UseCopyToClipboardReturn {
  copy: (text: string) => Promise<boolean>;
  copied: boolean;
}

/**
 * Hook compartido para copiar texto al portapapeles.
 * Reemplaza 5+ implementaciones duplicadas en admin + mi-plan.
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {},
): UseCopyToClipboardReturn {
  const {
    toast = true,
    successMessage = "Copiado al portapapeles",
    resetMs = 1500,
  } = options;
  const [copied, setCopied] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (toast) {
          addToast({ type: "success", message: successMessage, duration: 2000 });
        }
        setTimeout(() => setCopied(false), resetMs);
        return true;
      } catch {
        if (toast) {
          addToast({ type: "error", message: "No se pudo copiar" });
        }
        return false;
      }
    },
    [toast, successMessage, resetMs, addToast],
  );

  return { copy, copied };
}
