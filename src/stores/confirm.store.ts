import { create } from "zustand";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

interface ConfirmState {
  active: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null;
  open: (options: ConfirmOptions) => Promise<boolean>;
  resolve: (ok: boolean) => void;
}

/**
 * Store global del AlertDialog. Permite el patrón imperativo:
 *   const ok = await confirm({ title: "Eliminar?", variant: "destructive" });
 *   if (ok) doDelete();
 *
 * El AlertDialogHost (en LayoutWrapper) renderiza cuando active != null.
 */
export const useConfirmStore = create<ConfirmState>()((set, get) => ({
  active: null,

  open: (options) =>
    new Promise<boolean>((resolve) => {
      set({ active: { ...options, resolve } });
    }),

  resolve: (ok) => {
    const current = get().active;
    if (!current) return;
    current.resolve(ok);
    set({ active: null });
  },
}));

/** Hook helper para uso en componentes. */
export function useConfirm() {
  return useConfirmStore((s) => s.open);
}
