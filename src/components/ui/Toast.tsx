"use client";

import { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";
import type { Toast as ToastType } from "@/stores/toast.store";

const variantStyles = {
  success: {
    bg: "bg-success/15",
    border: "border-success/30",
    icon: FaCheckCircle,
    iconColor: "text-success",
  },
  error: {
    bg: "bg-error/15",
    border: "border-error/30",
    icon: FaTimesCircle,
    iconColor: "text-error",
  },
  warning: {
    bg: "bg-warning/15",
    border: "border-warning/30",
    icon: FaExclamationTriangle,
    iconColor: "text-warning",
  },
  info: {
    bg: "bg-info/15",
    border: "border-info/30",
    icon: FaInfoCircle,
    iconColor: "text-info",
  },
};

const progressColors = {
  success: "bg-success",
  error: "bg-error",
  warning: "bg-warning",
  info: "bg-info",
};

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

export default function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const variant = variantStyles[toast.type];
  const Icon = variant.icon;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 150);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        relative overflow-hidden rounded-xl border backdrop-blur-sm
        ${variant.bg} ${variant.border}
        w-80 max-w-[calc(100vw-3rem)] shadow-lg
        transition-all duration-200
        ${visible && !exiting ? "translate-y-0 opacity-100" : ""}
        ${exiting ? "translate-x-full opacity-0 ease-in duration-150" : ""}
        ${!visible && !exiting ? "translate-y-4 opacity-0 ease-out" : ""}
      `}
      style={{
        transitionTimingFunction: exiting ? "ease-in" : "ease-out",
      }}
    >
      <div className="flex items-start gap-3 p-4 pr-10">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${variant.iconColor}`} />
        <p className="text-sm text-text-main leading-snug">{toast.message}</p>
      </div>

      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-2 rounded-lg text-text-main/40 hover:text-text-main/70 transition-colors cursor-pointer"
        aria-label="Cerrar notificacion"
      >
        <FaTimes className="w-3.5 h-3.5" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <div
          className={`h-full ${progressColors[toast.type]} opacity-40`}
          style={{
            animation: visible
              ? `toast-progress ${toast.duration}ms linear forwards`
              : "none",
          }}
        />
      </div>
    </div>
  );
}
