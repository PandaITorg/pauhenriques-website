"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore, CartItem } from "@/stores/cart.store";
import { useAuth } from "@/context/AuthContext";
import {
  FaTrash,
  FaMinus,
  FaPlus,
  FaArrowLeft,
  FaLock,
  FaCreditCard,
  FaShieldAlt,
  FaTruck,
  FaUndo,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import NuveiPaymentForm from "@/components/checkout/NuveiPaymentForm";
import SavedAddresses from "@/components/checkout/SavedAddresses";
import SavedCards from "@/components/checkout/SavedCards";
import StepIndicator from "@/components/checkout/StepIndicator";
import ProductPlaceholder from "@/components/ui/ProductPlaceholder";
import { createOrder, markOrderFailed } from "@/services/firestore/orderService";
import { ShippingAddress } from "@/types/order";
import { SavedCard, getCardBrandName } from "@/types/card";

type Step = "cart" | "shipping" | "payment" | "confirm";

const STEPS: Step[] = ["cart", "shipping", "payment", "confirm"];

const CartItemRow = ({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
}) => {
  const hasImage = item.images && item.images.length > 0;
  const firstImage = hasImage ? item.images[0].replace(/"/g, "").trim() : "";

  return (
    <div className="flex items-center gap-4 border-b border-border-subtle py-4 last:border-b-0">
      <div className="w-16 h-16 relative rounded-lg overflow-hidden shrink-0 bg-surface-elevated">
        {hasImage ? (
          <Image
            src={firstImage}
            alt={item.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <ProductPlaceholder className="w-full h-full" />
        )}
      </div>
      <div className="grow min-w-0">
        <h3 className="font-semibold text-text-main text-sm truncate">
          {item.name}
        </h3>
        <p className="text-xs text-text-main/45">${item.price.toFixed(2)} c/u</p>
      </div>
      <div className="flex items-center border border-border-default rounded-lg">
        <button
          onClick={() => onUpdateQty(item.id, item.quantity - 1)}
          className="p-2 text-text-main/40 hover:text-text-main transition-colors"
        >
          <FaMinus className="w-2.5 h-2.5" />
        </button>
        <span className="px-2 text-sm font-medium text-text-main min-w-6 text-center">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQty(item.id, item.quantity + 1)}
          className="p-2 text-text-main/40 hover:text-text-main transition-colors"
        >
          <FaPlus className="w-2.5 h-2.5" />
        </button>
      </div>
      <p className="font-semibold text-text-main text-sm w-20 text-right">
        ${(item.price * item.quantity).toFixed(2)}
      </p>
      <button
        onClick={() => onRemove(item.id)}
        className="text-error/50 hover:text-error p-1 transition-colors"
      >
        <FaTrash className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

interface ThreeDSChallenge {
  html: string;
  orderId: string;
  isDeviceFingerprint: boolean;
}

export default function CheckoutPage() {
  const [isClient, setIsClient] = useState(false);
  const [step, setStep] = useState<Step>("cart");
  const [processingPayment, setProcessingPayment] = useState(false);
  const paymentLockRef = useRef(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [shipping, setShipping] = useState<ShippingAddress | null>(null);
  const [threeDSChallenge, setThreeDSChallenge] = useState<ThreeDSChallenge | null>(null);

  const [paymentMode, setPaymentMode] = useState<"saved" | "new">("saved");
  const [selectedCardToken, setSelectedCardToken] = useState<string | null>(
    null,
  );
  const [selectedCardInfo, setSelectedCardInfo] = useState<SavedCard | null>(
    null,
  );

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const { user } = useAuth();
  const router = useRouter();

  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const IVA_RATE = 0.15;
  const vat = Math.round(subtotal * IVA_RATE * 100) / 100;
  const shippingCost: number = 0;
  const total = Math.round((subtotal + vat + shippingCost) * 100) / 100;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Listen for 3DS challenge completion from /checkout/3ds-return
  useEffect(() => {
    async function handle3DSMessage(event: MessageEvent) {
      if (event.data?.type !== "3DS_COMPLETE") return;
      const { orderId } = event.data;
      if (!orderId || !user || !selectedCardToken) return;

      setThreeDSChallenge(null);
      setProcessingPayment(true);

      try {
        const response = await fetch("/api/payment/3ds-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            userId: user.uid,
            userEmail: user.email,
            token: selectedCardToken,
            amount: total,
            vat,
            description: `Orden ${orderId} - Pau Henriques`,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setProcessingPayment(false);
          setPaymentSuccess(true);
          clearCart();
          setTimeout(() => {
            router.push(`/checkout/confirmacion?orderId=${orderId}`);
          }, 1500);
        } else {
          paymentLockRef.current = false;
          setProcessingPayment(false);
          setPaymentFailed(data.error || "Error al completar el pago 3DS.");
        }
      } catch {
        paymentLockRef.current = false;
        setProcessingPayment(false);
        setPaymentFailed("Error de conexión al completar la autenticación 3DS.");
      }
    }

    window.addEventListener("message", handle3DSMessage);
    return () => window.removeEventListener("message", handle3DSMessage);
  }, [user, selectedCardToken, total, vat, clearCart, router]);

  const currentStepIndex = STEPS.indexOf(step);

  function canGoToStep(target: Step): boolean {
    const targetIndex = STEPS.indexOf(target);
    if (targetIndex <= currentStepIndex) return true;
    if (target === "shipping" && items.length > 0) return true;
    if (target === "payment" && shipping) return true;
    if (
      target === "confirm" &&
      shipping &&
      (selectedCardToken || paymentMode === "new")
    )
      return true;
    return false;
  }

  const handleTokenSuccess = (token: string) => {
    setSelectedCardToken(token);
    setPaymentMode("saved");
    setStep("confirm");
  };

  const handleTokenError = (error: string) => {
    setPaymentError(error || "Error al procesar la tarjeta.");
  };

  async function handleConfirmPayment() {
    if (!user || !shipping || !selectedCardToken) return;
    if (paymentLockRef.current) return;
    paymentLockRef.current = true;

    setProcessingPayment(true);
    setPaymentError(null);

    let orderId: string | null = null;

    try {
      const orderItems = items.map((item) => ({
        productId: item.id,
        name: item.name,
        brand: item.brand,
        price: item.price,
        quantity: item.quantity,
      }));

      orderId = await createOrder({
        userId: user.uid,
        items: orderItems,
        subtotal,
        vat,
        shipping: shippingCost,
        total,
        shippingAddress: shipping,
        paymentToken: selectedCardToken,
      });

      const browserInfo = {
        accept_header: "text/html",
        user_agent: navigator.userAgent,
        language: navigator.language,
        timezone_offset: new Date().getTimezoneOffset(),
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        color_depth: window.screen.colorDepth,
        js_enabled: true,
        java_enabled: false,
      };

      const response = await fetch("/api/payment/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: selectedCardToken,
          orderId,
          amount: total,
          vat,
          description: `Orden ${orderId} - Pau Henriques`,
          userId: user.uid,
          userEmail: user.email,
          browserInfo,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProcessingPayment(false);
        setPaymentSuccess(true);
        clearCart();
        setTimeout(() => {
          router.push(`/checkout/confirmacion?orderId=${orderId}`);
        }, 1500);
      } else if (data.challenge) {
        // 3DS challenge required — show challenge modal
        setProcessingPayment(false);
        setThreeDSChallenge({
          html: data.challengeHtml,
          orderId: data.orderId,
          isDeviceFingerprint: data.isDeviceFingerprint ?? false,
        });
        // Don't reset paymentLockRef — payment is still in progress via 3DS
      } else {
        const errorMsg = data.error || "Error al procesar el pago.";
        paymentLockRef.current = false;
        setProcessingPayment(false);
        setPaymentFailed(errorMsg);
      }
    } catch (err) {
      console.error("Payment error:", err);
      if (orderId) {
        try { await markOrderFailed(orderId); } catch {}
      }
      const errorMsg = "Error de conexión. Intenta de nuevo.";
      paymentLockRef.current = false;
      setProcessingPayment(false);
      setPaymentFailed(errorMsg);
    }
  }

  if (!isClient) {
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
          <FaCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-5" />
        </div>
        <h1 className="font-cormorant text-2xl md:text-3xl font-semibold text-text-main mb-2">
          Pago aprobado
        </h1>
        <p className="text-text-main/50 text-sm">
          Redirigiendo a tu confirmación...
        </p>
        <div className="mt-6">
          <div className="simple-spinner" />
        </div>
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
        <p className="text-text-main/50 text-sm max-w-xs">
          {paymentFailed}
        </p>
        <button
          onClick={() => {
            setPaymentFailed(null);
            setPaymentError(paymentFailed);
            setStep("confirm");
          }}
          className="mt-6 bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-8 rounded-lg transition-colors"
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
          className="bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          Ir a la Tienda
        </Link>
      </div>
    );
  }

  // 3DS Challenge modal — shown when bank requires OTP/biometric verification
  if (threeDSChallenge) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-border-subtle flex items-center gap-3">
              <FaShieldAlt className="w-4 h-4 text-primary" />
              <div>
                <p className="font-semibold text-text-main text-sm">
                  Verificación de seguridad del banco
                </p>
                <p className="text-text-main/50 text-xs">
                  {threeDSChallenge.isDeviceFingerprint
                    ? "Verificando tu dispositivo..."
                    : "Tu banco requiere verificación adicional"}
                </p>
              </div>
            </div>
            <div className="relative">
              <iframe
                srcDoc={threeDSChallenge.html}
                className="w-full border-0"
                style={{ height: threeDSChallenge.isDeviceFingerprint ? "1px" : "450px" }}
                title="Autenticación 3DS"
                sandbox="allow-forms allow-scripts allow-same-origin"
              />
              {threeDSChallenge.isDeviceFingerprint && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <div className="simple-spinner" />
                  <p className="text-sm text-text-main/60">Verificando tu dispositivo...</p>
                </div>
              )}
            </div>
          </div>
          <p className="text-center text-xs text-text-main/40 mt-3">
            No cierres esta página. Conexión segura con tu banco.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 md:py-10 px-4 sm:px-6">
      <div className="container mx-auto max-w-5xl">
        <h1 className="font-cormorant text-2xl md:text-3xl font-semibold text-text-main text-center mb-6">
          Checkout
        </h1>

        {/* Steps indicator */}
        <StepIndicator
          currentStep={step}
          onStepClick={setStep}
          canGoToStep={canGoToStep}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* STEP 1: Cart */}
            {step === "cart" && (
              <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-xl">
                <h2 className="text-lg font-semibold text-text-main mb-4">
                  Tu Carrito ({items.length}{" "}
                  {items.length === 1 ? "producto" : "productos"})
                </h2>
                {items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onRemove={removeItem}
                    onUpdateQty={updateQuantity}
                  />
                ))}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Link
                    href="/tienda"
                    className="flex items-center justify-center gap-2 flex-1 border border-border-default text-text-main/60 font-medium py-3 rounded-lg hover:bg-surface-elevated transition-colors text-sm"
                  >
                    <FaArrowLeft className="w-3 h-3" />
                    Seguir comprando
                  </Link>
                  <button
                    onClick={() => setStep("shipping")}
                    className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Continuar con el envío
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Shipping */}
            {step === "shipping" && (
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
                    className="flex items-center justify-center gap-2 flex-1 border border-border-default text-text-main/60 font-medium py-3 rounded-lg hover:bg-surface-elevated transition-colors"
                  >
                    <FaArrowLeft className="w-3 h-3" />
                    Volver
                  </button>
                  <button
                    onClick={() => setStep("payment")}
                    disabled={!shipping}
                    className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-surface-elevated disabled:text-text-main/30"
                  >
                    Continuar al Pago
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Payment */}
            {step === "payment" && (
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
                      onSelectCard={(card) => {
                        setSelectedCardToken(card.token);
                        setSelectedCardInfo(card);
                      }}
                      selectedToken={selectedCardToken}
                      onAddNewCard={() => setPaymentMode("new")}
                    />

                    {selectedCardToken && (
                      <button
                        onClick={() => setStep("confirm")}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-lg transition-colors"
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
                      onTokenSuccess={handleTokenSuccess}
                      onTokenError={handleTokenError}
                      onGoToSavedCards={() => setPaymentMode("saved")}
                      disabled={processingPayment}
                    />
                  </div>
                )}

                {/* TODO: Remove after Nuvei testing */}
                {process.env.NEXT_PUBLIC_NUVEI_ENV !== "prod" && (
                  <Link
                    href="/checkout/test-nuvei"
                    className="mt-4 flex items-center justify-center gap-2 text-xs text-warning/60 hover:text-warning border border-dashed border-warning/20 hover:border-warning/40 rounded-lg py-2 transition-colors"
                  >
                    <span>🧪</span>
                    Simulador de flujo de pago Nuvei
                  </Link>
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
                  className="mt-4 w-full flex items-center justify-center gap-2 border border-border-default text-text-main/60 font-medium py-3 rounded-lg hover:bg-surface-elevated transition-colors"
                >
                  <FaArrowLeft className="w-3 h-3" />
                  Volver
                </button>
              </div>
            )}

            {/* STEP 4: Confirmation */}
            {step === "confirm" && (
              <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-xl space-y-5">
                <h2 className="text-lg font-semibold text-text-main">
                  Confirmar Pedido
                </h2>

                {/* Shipping summary */}
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
                    <p className="text-sm text-text-main/70">
                      {shipping.fullName}
                    </p>
                    <p className="text-sm text-text-main/50">
                      {shipping.address}, {shipping.city}, {shipping.province}
                    </p>
                    <p className="text-sm text-text-main/50">{shipping.phone}</p>
                  </div>
                )}

                {/* Payment method summary */}
                <div className="border border-border-subtle rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-text-main">
                      Método de Pago
                    </h3>
                    <button
                      onClick={() => setStep("payment")}
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
                          {selectedCardInfo.expiry_month}/
                          {selectedCardInfo.expiry_year}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-text-main/60">
                      Nueva tarjeta agregada
                    </p>
                  )}
                </div>

                {/* Items summary */}
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
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
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

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("payment")}
                    className="flex items-center justify-center gap-2 flex-1 border border-border-default text-text-main/60 font-medium py-3 rounded-lg hover:bg-surface-elevated transition-colors"
                  >
                    <FaArrowLeft className="w-3 h-3" />
                    Editar pago
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={processingPayment || !selectedCardToken}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-lg transition-all duration-200 disabled:bg-surface-elevated disabled:text-text-main/30 active:scale-[0.97]"
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
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-xl sticky top-24">
              <h2 className="text-lg font-semibold text-text-main mb-4">
                Resumen
              </h2>
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-text-main/60"
                  >
                    <span className="truncate mr-2">
                      {item.name} x{item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border-subtle mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-main/50">Subtotal</span>
                  <span className="font-medium text-text-main">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-main/50">IVA (15%)</span>
                  <span className="font-medium text-text-main">
                    ${vat.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-main/50">Envío</span>
                  <span className="font-medium text-text-main">
                    {shippingCost === 0
                      ? "Gratis"
                      : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-border-subtle pt-3 flex justify-between font-bold text-lg text-primary">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
