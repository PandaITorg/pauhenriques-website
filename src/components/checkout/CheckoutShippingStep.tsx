"use client";

import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import SavedAddresses from "@/components/checkout/SavedAddresses";
import { ShippingAddress } from "@/types/order";
import type { User } from "firebase/auth";

type Step = "cart" | "shipping" | "payment" | "confirm";

interface CheckoutShippingStepProps {
  user: User | null;
  shipping: ShippingAddress | null;
  setShipping: (addr: ShippingAddress | null) => void;
  setStep: (step: Step) => void;
}

export function CheckoutShippingStep({
  user,
  shipping,
  setShipping,
  setStep,
}: CheckoutShippingStepProps) {
  return (
    <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-xl">
      <h2 className="text-lg font-semibold text-text-main mb-4">
        Dirección de Envío
      </h2>

      {user ? (
        <SavedAddresses
          onSelect={(addr) => setShipping(addr)}
          selectedAddress={shipping}
        />
      ) : (
        <div className="bg-warning/10 text-warning p-4 rounded-lg text-sm">
          Debes{" "}
          <Link
            href="/sign-in?redirect=/checkout"
            className="font-bold underline"
          >
            iniciar sesión
          </Link>{" "}
          para continuar.
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setStep("cart")}
          className="flex items-center justify-center gap-2 flex-1 border border-border-default text-text-main/60 font-medium py-3 rounded-xl hover:bg-surface-elevated transition-colors"
        >
          <FaArrowLeft className="w-3 h-3" />
          Volver
        </button>
        <button
          onClick={() => setStep("payment")}
          disabled={!shipping}
          className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:bg-surface-elevated disabled:text-text-main/30"
        >
          Continuar al Pago
        </button>
      </div>
    </div>
  );
}
