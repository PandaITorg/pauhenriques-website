"use client";

import {
  FaArrowLeft,
  FaLock,
  FaCreditCard,
  FaShieldAlt,
} from "react-icons/fa";
import type { BinInfo } from "@pandait.tech/payment-nuvei/ui";
import { CartItem } from "@/stores/cart.store";
import { ShippingAddress } from "@/types/order";
import { SavedCard, getCardBrandName } from "@/types/card";
import TurnstileWidget from "@/components/pricing/TurnstileWidget";

type Step = "cart" | "shipping" | "payment" | "confirm";

const INSTALLMENTS_WITH_INTEREST = [3, 6, 9, 12, 18, 24, 36];
const INSTALLMENTS_WITHOUT_INTEREST = [3, 6];

interface CheckoutConfirmStepProps {
  shipping: ShippingAddress | null;
  selectedCardInfo: SavedCard | null;
  installmentsType: number;
  setInstallmentsType: (n: number) => void;
  installmentsCount: number;
  setInstallmentsCount: (n: number) => void;
  supportsDeferred: boolean;
  isDebitOrPrepaid: boolean;
  selectedCardBin: BinInfo | null;
  items: CartItem[];
  paymentError: string | null;
  turnstileToken: string | null;
  setTurnstileToken: (token: string | null) => void;
  processingPayment: boolean;
  selectedCardToken: string | null;
  isNewlyTokenized: boolean;
  paymentMode: "saved" | "new";
  savedCardCvc: string;
  total: number;
  handleConfirmPayment: () => void;
  setStep: (step: Step) => void;
  setPaymentError: (error: string | null) => void;
}

export function CheckoutConfirmStep({
  shipping,
  selectedCardInfo,
  installmentsType,
  setInstallmentsType,
  installmentsCount,
  setInstallmentsCount,
  supportsDeferred,
  isDebitOrPrepaid,
  selectedCardBin,
  items,
  paymentError,
  turnstileToken,
  setTurnstileToken,
  processingPayment,
  selectedCardToken,
  isNewlyTokenized,
  paymentMode,
  savedCardCvc,
  total,
  handleConfirmPayment,
  setStep,
  setPaymentError,
}: CheckoutConfirmStepProps) {
  return (
    <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-xl space-y-5">
      <h2 className="text-lg font-semibold text-text-main">Confirmar Pedido</h2>

      {/* Resumen de envío */}
      {shipping && (
        <div className="border border-border-subtle rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm text-text-main">
              Dirección de Envío
            </h3>
            <button
              onClick={() => setStep("shipping")}
              className="text-xs text-primary hover:text-primary-hover underline underline-offset-2 transition-colors"
            >
              Cambiar
            </button>
          </div>
          <p className="text-sm text-text-main/70">{shipping.fullName}</p>
          <p className="text-sm text-text-main/50">
            {shipping.address}, {shipping.city}, {shipping.province}
          </p>
          <p className="text-sm text-text-main/50">{shipping.phone}</p>
        </div>
      )}

      {/* Resumen del método de pago */}
      <div className="border border-border-subtle rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-text-main">
            Método de Pago
          </h3>
          <button
            onClick={() => {
              setStep("payment");
              setPaymentError(null);
            }}
            className="text-xs text-primary hover:text-primary-hover underline underline-offset-2 transition-colors"
          >
            Cambiar
          </button>
        </div>
        {selectedCardInfo ? (
          <div className="flex items-center gap-3">
            <FaCreditCard className="w-5 h-5 text-text-main/40" />
            <div>
              <p className="text-sm text-text-main/70">
                {getCardBrandName(selectedCardInfo.type)}{" "}
                <span className="font-mono">****{selectedCardInfo.number}</span>
              </p>
              <p className="text-xs text-text-main/40">
                {selectedCardInfo.holder_name} · Exp{" "}
                {selectedCardInfo.expiry_month}/{selectedCardInfo.expiry_year}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-main/60">Nueva tarjeta agregada</p>
        )}
      </div>

      {/* Forma de pago / Diferidos */}
      <div className="border border-border-subtle rounded-lg p-4">
        <h3 className="font-semibold text-sm text-text-main mb-3">
          Forma de Pago
        </h3>
        <div className="space-y-2">
          {/* Corriente */}
          <label
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              installmentsType === 0 && installmentsCount === 0
                ? "border-primary bg-primary/5"
                : "border-border-subtle hover:border-border-default"
            }`}
          >
            <input
              type="radio"
              name="installments"
              checked={installmentsType === 0 && installmentsCount === 0}
              onChange={() => {
                setInstallmentsType(0);
                setInstallmentsCount(0);
              }}
              className="accent-primary"
            />
            <div>
              <p className="text-sm font-medium text-text-main">Corriente</p>
              <p className="text-xs text-text-main/50">
                Cargo completo en un solo estado de cuenta
              </p>
            </div>
          </label>

          {/* Diferidos */}
          {supportsDeferred && (
            <>
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  installmentsType === 1
                    ? "border-primary bg-primary/5"
                    : "border-border-subtle hover:border-border-default"
                }`}
              >
                <input
                  type="radio"
                  name="installments"
                  checked={installmentsType === 1}
                  onChange={() => {
                    setInstallmentsType(1);
                    setInstallmentsCount(3);
                  }}
                  className="accent-primary"
                />
                <div className="grow">
                  <p className="text-sm font-medium text-text-main">
                    Diferido con intereses
                  </p>
                  <p className="text-xs text-text-main/50">
                    Tu banco aplica intereses a las cuotas
                  </p>
                </div>
              </label>
              {installmentsType === 1 && (
                <div className="flex flex-wrap gap-2 pl-9">
                  {INSTALLMENTS_WITH_INTEREST.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setInstallmentsCount(n)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        installmentsCount === n
                          ? "bg-primary text-white"
                          : "bg-surface-elevated text-text-main/60 hover:text-text-main"
                      }`}
                    >
                      {n} cuotas
                    </button>
                  ))}
                </div>
              )}

              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  installmentsType === 2
                    ? "border-primary bg-primary/5"
                    : "border-border-subtle hover:border-border-default"
                }`}
              >
                <input
                  type="radio"
                  name="installments"
                  checked={installmentsType === 2}
                  onChange={() => {
                    setInstallmentsType(2);
                    setInstallmentsCount(3);
                  }}
                  className="accent-primary"
                />
                <div className="grow">
                  <p className="text-sm font-medium text-text-main">
                    Diferido sin intereses
                  </p>
                  <p className="text-xs text-text-main/50">Meses sin intereses</p>
                </div>
              </label>
              {installmentsType === 2 && (
                <div className="flex flex-wrap gap-2 pl-9">
                  {INSTALLMENTS_WITHOUT_INTEREST.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setInstallmentsCount(n)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        installmentsCount === n
                          ? "bg-primary text-white"
                          : "bg-surface-elevated text-text-main/60 hover:text-text-main"
                      }`}
                    >
                      {n} cuotas
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <p className="text-xs text-text-main/40 mt-3">
          {supportsDeferred
            ? "La disponibilidad de diferidos depende de tu banco emisor."
            : isDebitOrPrepaid
              ? "Las tarjetas de débito y prepago solo admiten pagos corrientes."
              : `Tu tarjeta de ${selectedCardBin?.bank ?? "este banco"} solo admite pagos corrientes.`}
        </p>
      </div>

      {/* Listado de productos */}
      <div className="border border-border-subtle rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-text-main">
            Productos ({items.length})
          </h3>
          <button
            onClick={() => setStep("cart")}
            className="text-xs text-primary hover:text-primary-hover underline underline-offset-2 transition-colors"
          >
            Editar
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-text-main/60 truncate mr-2">
                {item.name} x{item.quantity}
              </span>
              <span className="font-medium text-text-main">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {paymentError && (
        <div className="bg-error/10 text-error p-4 rounded-lg text-sm">
          {paymentError}
        </div>
      )}

      {/* Cloudflare Turnstile — token requerido por el handler de charge */}
      <div className="flex justify-center">
        <TurnstileWidget onToken={setTurnstileToken} />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setStep("payment");
            setPaymentError(null);
          }}
          className="flex items-center justify-center gap-2 flex-1 border border-border-default text-text-main/60 font-medium py-3 rounded-xl hover:bg-surface-elevated transition-colors"
        >
          <FaArrowLeft className="w-3 h-3" />
          Editar pago
        </button>
        <button
          onClick={handleConfirmPayment}
          disabled={
            processingPayment ||
            !selectedCardToken ||
            (!isNewlyTokenized && paymentMode === "saved" && !savedCardCvc) ||
            !turnstileToken
          }
          className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all duration-200 disabled:bg-surface-elevated disabled:text-text-main/30 active:scale-[0.97]"
        >
          {processingPayment ? (
            <>
              <div className="simple-spinner w-5! h-5! border-2! border-white! border-b-transparent!" />
              Procesando...
            </>
          ) : (
            <>
              <FaLock className="w-3.5 h-3.5" />
              Confirmar y Pagar ${total.toFixed(2)}
              {installmentsCount > 0 && ` (${installmentsCount} cuotas)`}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
