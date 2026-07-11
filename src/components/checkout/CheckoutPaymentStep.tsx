"use client";

import Link from "next/link";
import {
  FaArrowLeft,
  FaShieldAlt,
  FaTruck,
  FaUndo,
} from "react-icons/fa";
import { NuveiPaymentForm, SavedCards } from "@pandait.tech/payment-nuvei/ui";
import type {
  TokenizedCardInfo,
} from "@pandait.tech/payment-nuvei/ui";
import { SavedCard } from "@/types/card";
import type { User } from "firebase/auth";

type Step = "cart" | "shipping" | "payment" | "confirm";

interface CheckoutPaymentStepProps {
  user: User | null;
  paymentMode: "saved" | "new";
  setPaymentMode: (mode: "saved" | "new") => void;
  selectedCardToken: string | null;
  isNewlyTokenized: boolean;
  savedCardCvc: string;
  setSelectedCardToken: (token: string | null) => void;
  setSelectedCardInfo: (card: SavedCard | null) => void;
  setSavedCardCvc: (cvc: string) => void;
  setIsNewlyTokenized: (val: boolean) => void;
  paymentError: string | null;
  setPaymentError: (error: string | null) => void;
  processingPayment: boolean;
  setStep: (step: Step) => void;
  onTokenSuccess: (
    token: string,
    cardInfo: TokenizedCardInfo,
    saveCard?: boolean,
  ) => Promise<void>;
  onTokenError: (error: string) => void;
}

export function CheckoutPaymentStep({
  user,
  paymentMode,
  setPaymentMode,
  selectedCardToken,
  isNewlyTokenized,
  savedCardCvc,
  setSelectedCardToken,
  setSelectedCardInfo,
  setSavedCardCvc,
  setIsNewlyTokenized,
  paymentError,
  setPaymentError,
  processingPayment,
  setStep,
  onTokenSuccess,
  onTokenError,
}: CheckoutPaymentStepProps) {
  return (
    <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-xl">
      <h2 className="text-lg font-semibold text-text-main mb-4">
        Método de Pago
      </h2>

      {!user && (
        <div className="bg-warning/10 text-warning p-4 rounded-lg mb-4 text-sm">
          Debes{" "}
          <Link
            href="/sign-in?redirect=/checkout"
            className="font-bold underline"
          >
            iniciar sesión
          </Link>{" "}
          para completar la compra.
        </div>
      )}

      {paymentError && (
        <div className="bg-error/10 text-error p-4 rounded-lg mb-4 text-sm">
          {paymentError}
        </div>
      )}

      {user && paymentMode === "saved" && (
        <div className="space-y-4">
          <SavedCards
            onSelectCard={(card, cvc) => {
              if (card.status === "review" || card.status === "pending") return;
              setSelectedCardToken(card.token);
              setSelectedCardInfo(card);
              setSavedCardCvc(cvc);
              setIsNewlyTokenized(false);
            }}
            selectedToken={selectedCardToken}
            onAddNewCard={() => {
              setPaymentMode("new");
              setPaymentError(null);
            }}
          />

          {selectedCardToken && (
            <button
              onClick={() => setStep("confirm")}
              disabled={!isNewlyTokenized && !savedCardCvc}
              className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:bg-surface-elevated disabled:text-text-main/30"
            >
              Revisar pedido →
            </button>
          )}
        </div>
      )}

      {user && paymentMode === "new" && (
        <div className="space-y-4">
          <button
            onClick={() => setPaymentMode("saved")}
            className="text-sm text-primary hover:text-primary-hover underline underline-offset-2 transition-colors"
          >
            ← Volver a tarjetas guardadas
          </button>
          <NuveiPaymentForm
            uid={user.uid}
            email={user.email || ""}
            onTokenSuccess={onTokenSuccess}
            onTokenError={onTokenError}
            disabled={processingPayment}
          />
        </div>
      )}

      {/* Trust badges */}
      <div className="flex items-center justify-between mt-6 pt-5 border-t border-border-subtle">
        <div className="flex items-center gap-2 text-text-main/40">
          <FaShieldAlt className="w-4 h-4" />
          <span className="text-xs">Pago 100% seguro</span>
        </div>
        <div className="flex items-center gap-2 text-text-main/40">
          <FaTruck className="w-4 h-4" />
          <span className="text-xs">Envío nacional</span>
        </div>
        <div className="flex items-center gap-2 text-text-main/40">
          <FaUndo className="w-4 h-4" />
          <span className="text-xs">Devoluciones</span>
        </div>
      </div>

      <button
        onClick={() => setStep("shipping")}
        className="mt-4 w-full flex items-center justify-center gap-2 border border-border-default text-text-main/60 font-medium py-3 rounded-xl hover:bg-surface-elevated transition-colors"
      >
        <FaArrowLeft className="w-3 h-3" />
        Volver
      </button>
    </div>
  );
}
