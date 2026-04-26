"use client";

import { useEffect } from "react";
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";
import { useConfirmStore } from "@/stores/confirm.store";

/**
 * Host global del AlertDialog. Se monta una vez en LayoutWrapper.
 * Render condicional: solo aparece cuando hay un dialog activo en el store.
 *
 * Uso desde cualquier componente:
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "Eliminar?", variant: "destructive" })) doDelete();
 */
export default function AlertDialogHost() {
  const active = useConfirmStore((s) => s.active);
  const resolve = useConfirmStore((s) => s.resolve);

  // ESC cancela
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") resolve(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, resolve]);

  if (!active) return null;

  const isDestructive = active.variant === "destructive";
  const confirmLabel = active.confirmLabel ?? (isDestructive ? "Eliminar" : "Confirmar");
  const cancelLabel = active.cancelLabel ?? "Cancelar";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => resolve(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
    >
      <div
        className="bg-surface-card border border-border-subtle rounded-xl w-full max-w-sm overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-border-subtle">
          <div className="flex items-start gap-3">
            {isDestructive && (
              <span className="w-9 h-9 rounded-full bg-error/15 text-error flex items-center justify-center shrink-0">
                <FaExclamationTriangle className="w-4 h-4" />
              </span>
            )}
            <h2
              id="alert-dialog-title"
              className="font-cormorant text-lg font-semibold text-text-main leading-tight pt-1"
            >
              {active.title}
            </h2>
          </div>
          <button
            onClick={() => resolve(false)}
            className="w-7 h-7 flex items-center justify-center text-text-main/40 hover:text-text-main hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
            aria-label="Cerrar"
          >
            <FaTimes className="w-3.5 h-3.5" />
          </button>
        </div>

        {active.description && (
          <div className="p-5 text-sm text-text-main/70 leading-relaxed whitespace-pre-line">
            {active.description}
          </div>
        )}

        <div className="flex gap-3 p-5 border-t border-border-subtle bg-surface-elevated/30">
          <button
            onClick={() => resolve(false)}
            className="flex-1 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated font-medium py-2.5 rounded-xl transition-colors cursor-pointer"
            autoFocus={!isDestructive}
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => resolve(true)}
            className={`flex-1 inline-flex items-center justify-center font-semibold py-2.5 rounded-xl transition-colors cursor-pointer ${
              isDestructive
                ? "bg-error hover:bg-error/90 text-white"
                : "bg-primary hover:bg-primary-hover text-white"
            }`}
            autoFocus={isDestructive}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
