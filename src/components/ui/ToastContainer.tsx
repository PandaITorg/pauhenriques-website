"use client";

import { useToastStore } from "@/stores/toast.store";
import Toast from "./Toast";

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notificaciones"
      className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-3"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}
