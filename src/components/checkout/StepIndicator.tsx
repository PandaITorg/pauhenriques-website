"use client";

import { FaCheck, FaShoppingCart, FaTruck, FaCreditCard, FaClipboardCheck } from "react-icons/fa";

type Step = "cart" | "shipping" | "payment" | "confirm";

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "cart", label: "Carrito", icon: <FaShoppingCart className="w-3.5 h-3.5" /> },
  { key: "shipping", label: "Envío", icon: <FaTruck className="w-3.5 h-3.5" /> },
  { key: "payment", label: "Pago", icon: <FaCreditCard className="w-3.5 h-3.5" /> },
  { key: "confirm", label: "Confirmar", icon: <FaClipboardCheck className="w-3.5 h-3.5" /> },
];

interface StepIndicatorProps {
  currentStep: Step;
  onStepClick: (step: Step) => void;
  canGoToStep: (step: Step) => boolean;
}

export default function StepIndicator({
  currentStep,
  onStepClick,
  canGoToStep,
}: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const isCompleted = i < currentIndex;
        const isActive = s.key === currentStep;
        const isFuture = i > currentIndex;
        const clickable = canGoToStep(s.key);

        return (
          <div key={s.key} className="flex items-center">
            {/* Step circle + label */}
            <button
              onClick={() => clickable && onStepClick(s.key)}
              className={`flex flex-col items-center gap-1.5 ${clickable ? "cursor-pointer" : "cursor-default"}`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isCompleted
                    ? "bg-success text-white"
                    : isActive
                      ? "bg-primary text-white shadow-[--shadow-glow-primary]"
                      : "bg-surface-card border border-border-default text-text-main/40"
                }`}
              >
                {isCompleted ? (
                  <FaCheck className="w-3.5 h-3.5" />
                ) : (
                  s.icon
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  isActive
                    ? "text-primary"
                    : isCompleted
                      ? "text-success"
                      : "text-text-main/40"
                }`}
              >
                {s.label}
              </span>
            </button>

            {/* Connecting line */}
            {i < STEPS.length - 1 && (
              <div className="w-8 sm:w-16 h-0.5 mx-2 sm:mx-3 rounded-full overflow-hidden bg-surface-card">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    i < currentIndex ? "bg-success w-full" : "bg-transparent w-0"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
