"use client";

import { useState } from "react";
import { AppliedCoupon } from "@/components/checkout/CouponInput";
import { useToastStore } from "@/stores/toast.store";

interface UseCuponParams {
  subtotal: number;
  items: Array<{ productId: string; price: number; quantity: number }>;
}

export function useCupon({ subtotal, items }: UseCuponParams) {
  const [couponCode, setCouponCodeState] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addToast = useToastStore((s) => s.addToast);

  const setCouponCode = (code: string) => {
    setCouponCodeState(code);
    setError(null);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/promotions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), subtotal, items }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discount: data.discount,
          promotionId: data.promotionId,
          type: data.type,
          description: data.description,
        });
        addToast({
          message: `Cupon ${couponCode.trim().toUpperCase()} aplicado`,
          type: "success",
        });
        setCouponCodeState("");
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

  const removeCoupon = () => {
    setAppliedCoupon(null);
    addToast({ message: "Cupon removido", type: "info" });
  };

  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    discount: appliedCoupon?.discount ?? 0,
    loading,
    error,
    applyCoupon,
    removeCoupon,
  };
}
