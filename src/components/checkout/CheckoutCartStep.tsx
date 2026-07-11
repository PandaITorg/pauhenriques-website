"use client";

import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { CartItem } from "@/stores/cart.store";
import CouponInput, { AppliedCoupon } from "@/components/checkout/CouponInput";
import { CartItemRow } from "@/components/checkout/CartItemRow";

type Step = "cart" | "shipping" | "payment" | "confirm";

interface CuponState {
  couponCode: string;
  setCouponCode: (code: string) => void;
  appliedCoupon: AppliedCoupon | null;
  loading: boolean;
  error: string | null;
  applyCoupon: () => void;
  removeCoupon: () => void;
}

interface CheckoutCartStepProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
  setStep: (step: Step) => void;
  cupon: CuponState;
}

export function CheckoutCartStep({
  items,
  onRemove,
  onUpdateQty,
  setStep,
  cupon,
}: CheckoutCartStepProps) {
  return (
    <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-xl">
      <h2 className="text-lg font-semibold text-text-main mb-4">
        Tu Carrito ({items.length}{" "}
        {items.length === 1 ? "producto" : "productos"})
      </h2>
      {items.map((item) => (
        <CartItemRow
          key={item.id}
          item={item}
          onRemove={onRemove}
          onUpdateQty={onUpdateQty}
        />
      ))}

      {/* Código de descuento */}
      <div className="mt-4 pt-4 border-t border-border-subtle">
        <CouponInput
          couponCode={cupon.couponCode}
          onCodeChange={cupon.setCouponCode}
          appliedCoupon={cupon.appliedCoupon}
          loading={cupon.loading}
          error={cupon.error}
          onApply={cupon.applyCoupon}
          onRemove={cupon.removeCoupon}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Link
          href="/tienda"
          className="flex items-center justify-center gap-2 flex-1 border border-border-default text-text-main/60 font-medium py-3 rounded-xl hover:bg-surface-elevated transition-colors text-sm"
        >
          <FaArrowLeft className="w-3 h-3" />
          Seguir comprando
        </Link>
        <button
          onClick={() => setStep("shipping")}
          className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition-all duration-200"
        >
          Continuar con el envío
        </button>
      </div>
    </div>
  );
}
