"use client";

import { useState } from "react";
import { FaTag, FaTimes, FaSpinner } from "react-icons/fa";
import { useToastStore } from "@/stores/toast.store";

export interface AppliedCoupon {
  code: string;
  discount: number;
  promotionId: string;
  type: "percentage" | "fixed_amount" | "free_shipping";
  description: string;
}

interface CouponInputProps {
  subtotal: number;
  items: Array<{ productId: string; price: number; quantity: number }>;
  appliedCoupon: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
}

export default function CouponInput({
  subtotal,
  items,
  appliedCoupon,
  onApply,
  onRemove,
}: CouponInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addToast = useToastStore((s) => s.addToast);

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/promotions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          subtotal,
          items,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        onApply({
          code: code.trim().toUpperCase(),
          discount: data.discount,
          promotionId: data.promotionId,
          type: data.type,
          description: data.description,
        });
        addToast({
          message: `Cupon ${code.trim().toUpperCase()} aplicado`,
          type: "success",
        });
        setCode("");
        setError(null);
      } else {
        setError(data.reason || "Cupon invalido");
      }
    } catch {
      setError("Error al validar el cupon");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    onRemove();
    addToast({ message: "Cupon removido", type: "info" });
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between gap-3 bg-success/10 border border-success/20 rounded-lg p-3">
        <div className="flex items-center gap-2 min-w-0">
          <FaTag className="w-3.5 h-3.5 text-success shrink-0" />
          <span className="font-mono text-sm font-medium text-success">
            {appliedCoupon.code}
          </span>
          <span className="text-sm text-text-main/50">
            {appliedCoupon.type === "free_shipping"
              ? "Envio gratis"
              : `-$${appliedCoupon.discount.toFixed(2)}`}
          </span>
        </div>
        <button
          onClick={handleRemove}
          className="p-1.5 text-text-main/40 hover:text-error transition-colors cursor-pointer shrink-0"
          aria-label="Quitar cupon"
        >
          <FaTimes className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-main/30" />
          <input
            type="text"
            placeholder="Codigo de cupon"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApply();
              }
            }}
            className="w-full pl-9 pr-3 py-2.5 bg-surface-elevated border border-border-default rounded-lg text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors font-mono uppercase"
            disabled={loading}
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors disabled:bg-surface-elevated disabled:text-text-main/30 cursor-pointer shrink-0"
        >
          {loading ? (
            <FaSpinner className="w-4 h-4 animate-spin" />
          ) : (
            "Aplicar"
          )}
        </button>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
