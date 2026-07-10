"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/stores/cart.store";
import { useToastStore } from "@/stores/toast.store";
import { useAuth } from "@/context/AuthContext";
import { productService } from "@/services/firestore/productService";
import { calcCheckoutTotals } from "@/lib/checkout-totals";
import { isWellMeProduct } from "@/types/product";
import { FaLock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import type { TokenizedCardInfo, BinInfo } from "@pandait.tech/payment-nuvei/ui";
import StepIndicator from "@/components/checkout/StepIndicator";
import { useCupon } from "@/hooks/useCupon";
import { ShippingAddress } from "@/types/order";
import { SavedCard } from "@/types/card";
import { useCheckoutPayment } from "@/hooks/useCheckoutPayment";
import { OtpPanel } from "@/components/checkout/OtpPanel";
import { ChallengeIframe } from "@/components/checkout/ChallengeIframe";
import { CheckoutResumen } from "@/components/checkout/CheckoutResumen";
import { CheckoutConfirmStep } from "@/components/checkout/CheckoutConfirmStep";
import { CheckoutPaymentStep } from "@/components/checkout/CheckoutPaymentStep";
import { CheckoutCartStep } from "@/components/checkout/CheckoutCartStep";
import { CheckoutShippingStep } from "@/components/checkout/CheckoutShippingStep";

type Step = "cart" | "shipping" | "payment" | "confirm";

const STEPS: Step[] = ["cart", "shipping", "payment", "confirm"];

export default function CheckoutPage() {
  const [isClient, setIsClient] = useState(false);
  const [step, setStep] = useState<Step>("cart");
  const [shipping, setShipping] = useState<ShippingAddress | null>(null);

  const [paymentMode, setPaymentMode] = useState<"saved" | "new">("saved");
  const [selectedCardToken, setSelectedCardToken] = useState<string | null>(null);
  const [selectedCardInfo, setSelectedCardInfo] = useState<SavedCard | null>(null);
  const [savedCardCvc, setSavedCardCvc] = useState("");
  const [isNewlyTokenized, setIsNewlyTokenized] = useState(false);
  const [deleteCardAfterPayment, setDeleteCardAfterPayment] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [installmentsType, setInstallmentsType] = useState<number>(0);
  const [installmentsCount, setInstallmentsCount] = useState<number>(0);
  const [selectedCardBin, setSelectedCardBin] = useState<BinInfo | null>(null);

  // Reglas de diferidos según tipo de tarjeta y carrier
  const isDebitOrPrepaid =
    selectedCardBin?.type === "debit" || selectedCardBin?.type === "prepaid";
  const isMedianetOnly = selectedCardBin?.carrier === "medianet";
  const supportsDeferred = !isDebitOrPrepaid && !isMedianetOnly;

  // Lookup BIN al seleccionar tarjeta
  useEffect(() => {
    if (!selectedCardInfo?.bin) {
      setSelectedCardBin(null);
      return;
    }
    let cancelled = false;
    import("@pandait.tech/payment-nuvei/ui").then(({ getBinDatabase, lookupBinSync }) => {
      getBinDatabase().then((db) => {
        if (cancelled) return;
        setSelectedCardBin(lookupBinSync(selectedCardInfo.bin, db));
      });
    });
    return () => { cancelled = true; };
  }, [selectedCardInfo?.bin]);

  // Si el usuario cambia a tarjeta que no admite diferidos, resetear a corriente
  useEffect(() => {
    if (!supportsDeferred && installmentsType !== 0) {
      setInstallmentsType(0);
      setInstallmentsCount(0);
    }
  }, [supportsDeferred, installmentsType]);

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const addToast = useToastStore((state) => state.addToast);
  const { user, loading: authLoading } = useAuth();

  const cupon = useCupon({
    subtotal: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    items: items.map((i) => ({ productId: i.id, price: i.price, quantity: i.quantity })),
  });

  const { subtotal, discount, discountedSubtotal, vat, total } = calcCheckoutTotals(
    items,
    cupon.discount,
  );
  const shippingCost: number = 0;

  useEffect(() => { setIsClient(true); }, []);

  const revalidateCartStock = useCallback(async () => {
    const cartItems = useCartStore.getState().items;
    if (cartItems.length === 0) return;
    await Promise.all(
      cartItems.map(async (item) => {
        try {
          const fresh = await productService.getProductById(item.id);
          if (!fresh || !fresh.isActive) {
            useCartStore.getState().removeItem(item.id);
            addToast({ type: "warning", message: `"${item.name}" ya no está disponible y se removió del carrito.` });
            return;
          }
          if (!isWellMeProduct(fresh)) return;
          const isDigital = (fresh as unknown as Record<string, unknown>).isDigital === true;
          if (isDigital) return;
          if (fresh.stock <= 0) {
            useCartStore.getState().removeItem(item.id);
            addToast({ type: "warning", message: `"${item.name}" se agotó y se removió del carrito.` });
          } else if (fresh.stock < item.quantity) {
            useCartStore.getState().updateQuantity(item.id, fresh.stock);
            addToast({ type: "warning", message: `Solo quedan ${fresh.stock} unidades de "${item.name}". Ajustamos tu carrito.` });
          }
        } catch (err) {
          console.error(`[checkout] Failed to revalidate ${item.id}:`, err);
        }
      }),
    );
  }, [addToast]);

  // Revalidar stock al montar para detectar items obsoletos entre sesiones
  useEffect(() => {
    revalidateCartStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    processingPayment,
    paymentSuccess,
    paymentFailed,
    setPaymentFailed,
    paymentError,
    setPaymentError,
    handleConfirmPayment,
    threeDSChallenge,
    challengeVerifying,
    otpChallenge,
    setOtpChallenge,
    otpCode,
    setOtpCode,
    otpSubmitting,
    otpError,
    paymentLockRef,
    submitOtp,
  } = useCheckoutPayment({
    user,
    shipping,
    items,
    discountedSubtotal,
    vat,
    total,
    discount,
    shippingCost,
    selectedCardToken,
    selectedCardInfo,
    savedCardCvc,
    deleteCardAfterPayment,
    installmentsCount,
    installmentsType,
    turnstileToken,
    appliedCoupon: cupon.appliedCoupon,
    clearCart,
    revalidateCartStock,
    setStep,
  });

  const currentStepIndex = STEPS.indexOf(step);

  function canGoToStep(target: Step): boolean {
    const targetIndex = STEPS.indexOf(target);
    if (targetIndex <= currentStepIndex) return true;
    if (target === "shipping" && items.length > 0) return true;
    if (target === "payment" && shipping) return true;
    if (target === "confirm" && shipping && (selectedCardToken || paymentMode === "new")) return true;
    return false;
  }

  const handleTokenSuccess = async (token: string, cardInfo: TokenizedCardInfo, saveCard = true) => {
    setSelectedCardToken(token);
    setIsNewlyTokenized(true);
    setDeleteCardAfterPayment(!saveCard);
    setPaymentMode("saved");
    setSelectedCardInfo({
      token,
      type: cardInfo.type ?? "",
      number: cardInfo.number ?? "",
      expiry_year: cardInfo.expiry_year ?? "",
      expiry_month: cardInfo.expiry_month ?? "",
      holder_name: "",
      bin: "",
      status: "valid",
      transaction_reference: "",
    });
    setStep("confirm");
    try {
      const res = await fetch("/api/nuvei/cards");
      if (res.ok) {
        const data = await res.json();
        const newCard = (data.cards || []).find((c: SavedCard) => c.token === token);
        if (newCard) setSelectedCardInfo(newCard);
      }
    } catch { /* mantener info del SDK si falla el enriquecimiento */ }
  };

  const handleTokenError = (error: string) => {
    setPaymentError(error || "Error al procesar la tarjeta.");
  };

  // ponytail: guard en la raíz del carrito — espera a que el auth resuelva antes
  // de renderizar los pasos. Evita que CheckoutShippingStep/PaymentStep vean
  // user=null mientras Firebase inicializa y muestren "Debes iniciar sesión".
  if (!isClient || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="simple-spinner" />
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
        <div className="animate-[scale-in_0.4s_ease-out]">
          <FaCheckCircle className="w-16 h-16 text-success mx-auto mb-5" />
        </div>
        <h1 className="font-cormorant text-2xl md:text-3xl font-semibold text-text-main mb-2">
          Pago aprobado
        </h1>
        <p className="text-text-main/50 text-sm">Redirigiendo a tu confirmación...</p>
        <div className="mt-6"><div className="simple-spinner" /></div>
      </div>
    );
  }

  if (paymentFailed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
        <div className="animate-[scale-in_0.4s_ease-out]">
          <FaTimesCircle className="w-16 h-16 text-error mx-auto mb-5" />
        </div>
        <h1 className="font-cormorant text-2xl md:text-3xl font-semibold text-text-main mb-2">
          Pago no procesado
        </h1>
        <p className="text-text-main/50 text-sm max-w-xs">{paymentFailed}</p>
        <button
          onClick={() => { setPaymentFailed(null); setPaymentError(paymentFailed); setStep("confirm"); }}
          className="mt-6 bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200"
        >
          Volver al checkout
        </button>
      </div>
    );
  }

  if (processingPayment) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
        <div className="simple-spinner w-10! h-10! border-3! mb-5" />
        <h2 className="font-cormorant text-xl font-semibold text-text-main mb-2">
          Procesando tu pago
        </h2>
        <p className="text-text-main/50 text-sm max-w-xs">
          No cierres esta página. Estamos verificando tu transacción con el banco...
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
        <h1 className="font-cormorant text-2xl font-semibold text-text-main mb-3">
          Tu carrito está vacío
        </h1>
        <p className="text-text-main/50 mb-6">Explora nuestra tienda</p>
        <Link
          href="/tienda"
          className="bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200"
        >
          Ir a la Tienda
        </Link>
      </div>
    );
  }

  if (otpChallenge) {
    return (
      <OtpPanel
        otpCode={otpCode}
        setOtpCode={setOtpCode}
        otpError={otpError}
        otpSubmitting={otpSubmitting}
        submitOtp={submitOtp}
        onCancel={() => {
          setOtpChallenge(null);
          paymentLockRef.current = false;
          setPaymentFailed("Verificación OTP cancelada.");
        }}
      />
    );
  }

  if (threeDSChallenge) {
    return (
      <ChallengeIframe
        threeDSChallenge={threeDSChallenge}
        challengeVerifying={challengeVerifying}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/60 via-background to-background" />
        <div className="relative max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 pt-10 pb-4 md:pt-16 md:pb-6 text-center">
          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-2">
            Compra segura
          </span>
          <h1 className="font-cormorant text-2xl sm:text-3xl md:text-4xl font-semibold text-text-main mb-1">
            Checkout
          </h1>
          <p className="text-sm text-text-main/50">
            <FaLock className="inline w-3 h-3 mr-1 -mt-0.5" />
            Conexion encriptada
          </p>
        </div>
      </section>

      <div className="h-px max-w-5xl mx-auto bg-linear-to-r from-transparent via-border-default to-transparent" />

      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-6 md:py-10">
        <StepIndicator
          currentStep={step}
          onStepClick={setStep}
          canGoToStep={canGoToStep}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            {step === "cart" && (
              <CheckoutCartStep
                items={items}
                onRemove={removeItem}
                onUpdateQty={updateQuantity}
                setStep={setStep}
                cupon={cupon}
              />
            )}

            {step === "shipping" && (
              <CheckoutShippingStep
                user={user}
                shipping={shipping}
                setShipping={setShipping}
                setStep={setStep}
              />
            )}

            {step === "payment" && (
              <CheckoutPaymentStep
                user={user}
                paymentMode={paymentMode}
                setPaymentMode={setPaymentMode}
                selectedCardToken={selectedCardToken}
                isNewlyTokenized={isNewlyTokenized}
                savedCardCvc={savedCardCvc}
                setSelectedCardToken={setSelectedCardToken}
                setSelectedCardInfo={setSelectedCardInfo}
                setSavedCardCvc={setSavedCardCvc}
                setIsNewlyTokenized={setIsNewlyTokenized}
                paymentError={paymentError}
                setPaymentError={setPaymentError}
                processingPayment={processingPayment}
                setStep={setStep}
                onTokenSuccess={handleTokenSuccess}
                onTokenError={handleTokenError}
              />
            )}

            {step === "confirm" && (
              <CheckoutConfirmStep
                shipping={shipping}
                selectedCardInfo={selectedCardInfo}
                installmentsType={installmentsType}
                setInstallmentsType={setInstallmentsType}
                installmentsCount={installmentsCount}
                setInstallmentsCount={setInstallmentsCount}
                supportsDeferred={supportsDeferred}
                isDebitOrPrepaid={isDebitOrPrepaid}
                selectedCardBin={selectedCardBin}
                items={items}
                paymentError={paymentError}
                turnstileToken={turnstileToken}
                setTurnstileToken={setTurnstileToken}
                processingPayment={processingPayment}
                selectedCardToken={selectedCardToken}
                isNewlyTokenized={isNewlyTokenized}
                paymentMode={paymentMode}
                savedCardCvc={savedCardCvc}
                total={total}
                handleConfirmPayment={handleConfirmPayment}
                setStep={setStep}
                setPaymentError={setPaymentError}
              />
            )}
          </div>

          <div className="lg:col-span-1">
            <CheckoutResumen
              items={items}
              subtotal={subtotal}
              discount={discount}
              vat={vat}
              total={total}
              shippingCost={shippingCost}
              appliedCoupon={cupon.appliedCoupon}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
