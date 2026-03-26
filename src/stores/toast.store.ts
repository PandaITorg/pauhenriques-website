import { create } from "zustand";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id" | "duration"> & { duration?: number }) => void;
  removeToast: (id: string) => void;
}

const MAX_TOASTS = 3;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID();
    const duration = toast.duration ?? 4000;
    const newToast: Toast = { ...toast, id, duration };

    set((state) => {
      const updated = [...state.toasts, newToast];
      if (updated.length > MAX_TOASTS) {
        return { toasts: updated.slice(-MAX_TOASTS) };
      }
      return { toasts: updated };
    });

    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
