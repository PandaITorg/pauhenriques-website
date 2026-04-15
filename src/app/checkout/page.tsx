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
import CouponInput, { AppliedCoupon } from "@/components/checkout/CouponInput";
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
  nuveiTransactionId: string;
  statusDetail: number;
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
  const threeDSCompleteCalledRef = useRef(false);
  const [otpChallenge, setOtpChallenge] = useState<{ orderId: string; nuveiTransactionId: string } | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [challengeVerifying, setChallengeVerifying] = useState(false);

  const [paymentMode, setPaymentMode] = useState<"saved" | "new">("saved");
  const [selectedCardToken, setSelectedCardToken] = useState<string | null>(
    null,
  );
  const [selectedCardInfo, setSelectedCardInfo] = useState<SavedCard | null>(
    null,
  );
  const [savedCardCvc, setSavedCardCvc] = useState("");
  const [isNewlyTokenized, setIsNewlyTokenized] = useState(false);
  const [deleteCardAfterPayment, setDeleteCardAfterPayment] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // Installments / diferidos
  const [installmentsType, setInstallmentsType] = useState<number>(0); // 0=corriente, 1=con intereses, 2=sin intereses
  const [installmentsCount, setInstallmentsCount] = useState<number>(0); // 0=corriente (no diferido)

  const INSTALLMENTS_WITH_INTEREST = [3, 6, 9, 12, 18, 24, 36];
  const INSTALLMENTS_WITHOUT_INTEREST = [3, 6];

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
  const discount = appliedCoupon?.discount ?? 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const IVA_RATE = 0.15;
  const vat = Math.round(discountedSubtotal * IVA_RATE * 100) / 100;
  const shippingCost: number = 0;
  const total = Math.round((discountedSubtotal + vat + shippingCost) * 100) / 100;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Shared handler for verify API responses (used by both status 35 timer and status 36 postMessage)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleVerifyResponse = useRef((_data: any) => {});
  handleVerifyResponse.current = (data: any) => {
    if (data.success) {
      setThreeDSChallenge(null);
      setChallengeVerifying(false);
      setProcessingPayment(false);
      setPaymentSuccess(true);
      clearCart();
      const emailParam3ds = data.emailSent === false ? "&emailSent=false" : "";
      setTimeout(() => {
        router.push(`/checkout/confirmacion?orderId=${data.orderId}${emailParam3ds}`);
      }, 1500);
    } else if (data.challenge) {
      // Escalation: status 35 → 36 (or verify returned another challenge)
      // Reset the ref so postMessage/polling can resolve the new challenge
      threeDSCompleteCalledRef.current = false;
      setProcessingPayment(false);
      setChallengeVerifying(false);
      setThreeDSChallenge({
        html: data.challengeHtml,
        orderId: data.orderId,
        isDeviceFingerprint: false,
        nuveiTransactionId: data.nuveiTransactionId,
        statusDetail: data.statusDetail,
      });
    } else {
      paymentLockRef.current = false;
      setProcessingPayment(false);
      setChallengeVerifying(false);
      setPaymentFailed(data.error || "Error al completar el pago 3DS.");
      setThreeDSChallenge(null);
    }
  };

  // Timer for status_detail 35: wait 5 seconds, then call verify with AUTHENTICATION_CONTINUE
  useEffect(() => {
    if (!threeDSChallenge || threeDSChallenge.statusDetail !== 35 || !user) return;

    const timer = setTimeout(async () => {
      if (threeDSCompleteCalledRef.current) return;
      threeDSCompleteCalledRef.current = true;
      setProcessingPayment(true);
      try {
        const response = await fetch("/api/payment/3ds-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: threeDSChallenge.orderId,
            userId: user.uid,
            type: "AUTHENTICATION_CONTINUE",
            nuveiTransactionId: threeDSChallenge.nuveiTransactionId,
          }),
        });
        const data = await response.json();
        handleVerifyResponse.current(data);
      } catch {
        paymentLockRef.current = false;
        setProcessingPayment(false);
        setPaymentFailed("Error de conexión al verificar 3DS.");
        setThreeDSChallenge(null);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [threeDSChallenge, user]);

  // Listen for 3DS challenge completion via postMessage from Cloud Function.
  // The Cloud Function receives the ACS callback, stores cres in Firestore,
  // and sends postMessage to this parent window. Only ONE mechanism — no polling —
  // to guarantee verify is called exactly once (prevents race conditions that
  // trigger Nuvei's auto-reverse of the transaction).
  useEffect(() => {
    if (!threeDSChallenge || threeDSChallenge.statusDetail === 35 || !user) return;

    async function handle3DSMessage(event: MessageEvent) {
      if (event.data?.type !== "3DS_COMPLETE") return;
      const { orderId, transStatus } = event.data;
      if (!orderId || !user) return;

      setThreeDSChallenge(null);

      if (threeDSCompleteCalledRef.current) return;
      threeDSCompleteCalledRef.current = true;
      setProcessingPayment(true);

      // Always call the backend — it handles both success and failure cases
      // (including sending the rejection email when transStatus is N/R/U).
      try {
        const response = await fetch("/api/payment/3ds-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, userId: user.uid, type: "BY_CRES" }),
        });
        handleVerifyResponse.current(await response.json());
      } catch {
        paymentLockRef.current = false;
        setProcessingPayment(false);
        setPaymentFailed("Error de conexión al completar la autenticación 3DS.");
      }
    }

    window.addEventListener("message", handle3DSMessage);

    // Safety timeout: if postMessage never arrives in 3 minutes, show error.
    // Nuvei would have auto-reversed the transaction by then anyway.
    const CHALLENGE_TIMEOUT_MS = 180_000;
    const timeoutId = setTimeout(async () => {
      if (threeDSCompleteCalledRef.current) return;
      threeDSCompleteCalledRef.current = true;
      paymentLockRef.current = false;
      setProcessingPayment(false);
      setPaymentFailed("Tiempo de espera agotado para la verificación 3DS. Intenta de nuevo.");
      setThreeDSChallenge(null);
      // Call timeout endpoint to mark order failed AND send email
      try {
        await fetch("/api/payment/3ds-timeout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: threeDSChallenge.orderId }),
        });
      } catch { /* best effort */ }
    }, CHALLENGE_TIMEOUT_MS);

    return () => {
      window.removeEventListener("message", handle3DSMessage);
      clearTimeout(timeoutId);
    };
  }, [threeDSChallenge, user]);

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

  const handleTokenSuccess = async (token: string, cardInfo: import("@/components/checkout/NuveiPaymentForm").TokenizedCardInfo, saveCard: boolean = true) => {
    setSelectedCardToken(token);
    setIsNewlyTokenized(true);
    setDeleteCardAfterPayment(!saveCard);
    setPaymentMode("saved");
    // Build a synthetic card info from SDK data so confirm step never shows "Nueva tarjeta agregada"
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
    // Try to enrich with full data from API in background (has holder_name, etc.)
    try {
      const res = await fetch("/api/nuvei/cards");
      if (res.ok) {
        const data = await res.json();
        const newCard = (data.cards || []).find((c: SavedCard) => c.token === token);
        if (newCard) setSelectedCardInfo(newCard);
      }
    } catch { /* keep SDK-derived info */ }
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
    threeDSCompleteCalledRef.current = false;

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
        subtotal: discountedSubtotal,
        vat,
        shipping: shippingCost,
        total,
        shippingAddress: shipping,
        paymentToken: selectedCardToken,
        ...(selectedCardInfo?.type && { cardBrand: selectedCardInfo.type }),
        ...(selectedCardInfo?.number && { cardLast4: selectedCardInfo.number }),
        ...(appliedCoupon && {
          discount,
          couponCode: appliedCoupon.code,
          promotionId: appliedCoupon.promotionId,
          discountType: appliedCoupon.type,
        }),
        ...(installmentsCount > 0 && {
          installments: installmentsCount,
          installmentsType,
        }),
        ...(deleteCardAfterPayment && { deleteCardAfterPayment: true }),
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
          ...(savedCardCvc ? { cvc: savedCardCvc } : {}),
          orderId,
          amount: total,
          vat,
          description: `Orden ${orderId} - Pau Henriques`,
          userId: user.uid,
          userEmail: user.email,
          browserInfo,
          ...(installmentsCount > 0 ? { installments: installmentsCount, installmentsType } : {}),
          ...(deleteCardAfterPayment ? { deleteCardAfterPayment: true } : {}),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProcessingPayment(false);
        setPaymentSuccess(true);
        clearCart();
        const emailParam = data.emailSent === false ? "&emailSent=false" : "";
        setTimeout(() => {
          router.push(`/checkout/confirmacion?orderId=${orderId}${emailParam}`);
        }, 1500);
      } else if (data.review) {
        // Payment under review — treat as pending success, clear cart
        setProcessingPayment(false);
        setPaymentSuccess(true);
        clearCart();
        setTimeout(() => {
          router.push(`/checkout/confirmacion?orderId=${orderId}&review=1`);
        }, 1500);
      } else if (data.otpRequired) {
        // OTP verification required (status_detail 31) — show OTP form
        setProcessingPayment(false);
        setOtpChallenge({
          orderId: data.orderId,
          nuveiTransactionId: data.nuveiTransactionId || "",
        });
        setOtpCode("");
        setOtpError(null);
      } else if (data.challenge) {
        // 3DS challenge required — show challenge modal (status 35 or 36)
        setProcessingPayment(false);
        setThreeDSChallenge({
          html: data.challengeHtml,
          orderId: data.orderId,
          isDeviceFingerprint: data.isDeviceFingerprint ?? false,
          nuveiTransactionId: data.nuveiTransactionId || "",
          statusDetail: data.statusDetail || 36,
        });
        // Don't reset paymentLockRef — payment is still in progress via 3DS
      } else {
        const errorMsg = data.error || "Error al procesar el pago.";
        if (orderId) {
          try { await markOrderFailed(orderId); } catch { /* best effort */ }
        }
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
          <FaCheckCircle className="w-16 h-16 text-success mx-auto mb-5" />
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

  // OTP Challenge — shown when bank requires OTP verification (status_detail 31)
  if (otpChallenge) {
    const handleOtpSubmit = async () => {
      if (!otpCode.trim() || !user) return;
      setOtpSubmitting(true);
      setOtpError(null);
      try {
        const response = await fetch("/api/payment/3ds-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: otpChallenge.orderId,
            userId: user.uid,
            type: "BY_OTP",
            nuveiTransactionId: otpChallenge.nuveiTransactionId,
            otpCode: otpCode.trim(),
          }),
        });
        const data = await response.json();
        if (data.success) {
          setOtpChallenge(null);
          setPaymentSuccess(true);
          clearCart();
          const emailParamOtp = data.emailSent === false ? "&emailSent=false" : "";
          setTimeout(() => {
            router.push(`/checkout/confirmacion?orderId=${data.orderId}${emailParamOtp}`);
          }, 1500);
        } else {
          setOtpError(data.error || "Código OTP incorrecto. Intenta de nuevo.");
        }
      } catch {
        setOtpError("Error de conexión. Intenta de nuevo.");
      } finally {
        setOtpSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-border-subtle flex items-center gap-3">
              <FaShieldAlt className="w-4 h-4 text-primary" />
              <div>
                <p className="font-semibold text-text-main text-sm">
                  Verificación de seguridad
                </p>
                <p className="text-text-main/50 text-xs">
                  Tu banco ha enviado un código a tu teléfono
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-text-main/70 text-center">
                Ingresa el código de verificación (OTP) que recibiste por SMS de tu banco.
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Código OTP"
                className="w-full text-center text-2xl tracking-[0.3em] font-mono border border-border-default rounded-lg py-3 px-4 bg-background text-text-main placeholder:text-text-main/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleOtpSubmit();
                }}
              />
              {otpError && (
                <p className="text-error text-xs text-center">{otpError}</p>
              )}
              <button
                onClick={handleOtpSubmit}
                disabled={otpSubmitting || !otpCode.trim()}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {otpSubmitting ? (
                  <>
                    <div className="simple-spinner w-5! h-5! border-2! border-white! border-b-transparent!" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <FaLock className="w-3.5 h-3.5" />
                    Verificar código
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setOtpChallenge(null);
                  paymentLockRef.current = false;
                  setPaymentFailed("Verificación OTP cancelada.");
                }}
                disabled={otpSubmitting}
                className="w-full text-sm text-text-main/50 hover:text-text-main transition-colors py-2"
              >
                Cancelar
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-text-main/40 mt-3">
            No cierres esta página. Conexión segura con tu banco.
          </p>
        </div>
      </div>
    );
  }

  // 3DS Challenge modal — shown when bank requires OTP/biometric verification
  if (threeDSChallenge) {
    // After user completes challenge, iframe navigates to callback (which may 403).
    // Show our own spinner instead of the error.
    if (challengeVerifying) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
          <div className="bg-surface-card border border-border-subtle rounded-xl p-8 max-w-sm w-full shadow-xl">
            <FaShieldAlt className="w-8 h-8 text-primary mx-auto mb-4" />
            <div className="simple-spinner w-8! h-8! border-3! mx-auto mb-4" />
            <h2 className="font-cormorant text-xl font-semibold text-text-main mb-2">
              Verificando con tu banco
            </h2>
            <p className="text-text-main/50 text-sm">
              Estamos confirmando tu autenticación. Esto puede tomar unos segundos...
            </p>
          </div>
          <p className="text-center text-xs text-text-main/40 mt-3">
            No cierres esta página.
          </p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-lg">
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
                style={{ height: threeDSChallenge.isDeviceFingerprint ? "1px" : "600px" }}
                title="Autenticación 3DS"
                sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-popups"
                onLoad={(e) => {
                  // Detect when iframe navigates away from challenge (user completed it)
                  // The first load is the challenge form, subsequent loads mean the ACS
                  // submitted to our callback — switch to verifying spinner
                  const iframe = e.currentTarget;
                  if (!iframe.dataset.initialLoad) {
                    iframe.dataset.initialLoad = "true";
                  } else if (!threeDSChallenge.isDeviceFingerprint) {
                    setChallengeVerifying(true);
                  }
                }}
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
    <div className="min-h-screen bg-background">
      {/* ── Hero header ── */}
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

      {/* ── Separator ── */}
      <div className="h-px max-w-5xl mx-auto bg-linear-to-r from-transparent via-border-default to-transparent" />

      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-6 md:py-10">
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

                {/* Coupon code input */}
                <div className="mt-4 pt-4 border-t border-border-subtle">
                  <CouponInput
                    subtotal={subtotal}
                    items={items.map((i) => ({
                      productId: i.id,
                      price: i.price,
                      quantity: i.quantity,
                    }))}
                    appliedCoupon={appliedCoupon}
                    onApply={setAppliedCoupon}
                    onRemove={() => setAppliedCoupon(null)}
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
                      onTokenSuccess={handleTokenSuccess}
                      onTokenError={handleTokenError}
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
                      onClick={() => { setStep("payment"); setPaymentError(null); }}
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

                {/* Installments / Diferidos */}
                <div className="border border-border-subtle rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-text-main mb-3">
                    Forma de Pago
                  </h3>
                  <div className="space-y-2">
                    {/* Corriente */}
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${installmentsType === 0 && installmentsCount === 0 ? "border-primary bg-primary/5" : "border-border-subtle hover:border-border-default"}`}>
                      <input
                        type="radio"
                        name="installments"
                        checked={installmentsType === 0 && installmentsCount === 0}
                        onChange={() => { setInstallmentsType(0); setInstallmentsCount(0); }}
                        className="accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium text-text-main">Corriente</p>
                        <p className="text-xs text-text-main/50">Cargo completo en un solo estado de cuenta</p>
                      </div>
                    </label>

                    {/* Diferido con intereses */}
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${installmentsType === 1 ? "border-primary bg-primary/5" : "border-border-subtle hover:border-border-default"}`}>
                      <input
                        type="radio"
                        name="installments"
                        checked={installmentsType === 1}
                        onChange={() => { setInstallmentsType(1); setInstallmentsCount(3); }}
                        className="accent-primary"
                      />
                      <div className="grow">
                        <p className="text-sm font-medium text-text-main">Diferido con intereses</p>
                        <p className="text-xs text-text-main/50">Tu banco aplica intereses a las cuotas</p>
                      </div>
                    </label>
                    {installmentsType === 1 && (
                      <div className="flex flex-wrap gap-2 pl-9">
                        {INSTALLMENTS_WITH_INTEREST.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setInstallmentsCount(n)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${installmentsCount === n ? "bg-primary text-white" : "bg-surface-elevated text-text-main/60 hover:text-text-main"}`}
                          >
                            {n} cuotas
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Diferido sin intereses */}
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${installmentsType === 2 ? "border-primary bg-primary/5" : "border-border-subtle hover:border-border-default"}`}>
                      <input
                        type="radio"
                        name="installments"
                        checked={installmentsType === 2}
                        onChange={() => { setInstallmentsType(2); setInstallmentsCount(3); }}
                        className="accent-primary"
                      />
                      <div className="grow">
                        <p className="text-sm font-medium text-text-main">Diferido sin intereses</p>
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
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${installmentsCount === n ? "bg-primary text-white" : "bg-surface-elevated text-text-main/60 hover:text-text-main"}`}
                          >
                            {n} cuotas
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-text-main/40 mt-3">
                    La disponibilidad de diferidos depende de tu banco emisor.
                  </p>
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
                    onClick={() => { setStep("payment"); setPaymentError(null); }}
                    className="flex items-center justify-center gap-2 flex-1 border border-border-default text-text-main/60 font-medium py-3 rounded-xl hover:bg-surface-elevated transition-colors"
                  >
                    <FaArrowLeft className="w-3 h-3" />
                    Editar pago
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={processingPayment || !selectedCardToken || (!isNewlyTokenized && paymentMode === "saved" && !savedCardCvc)}
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
                {appliedCoupon && discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-success">
                      Descuento ({appliedCoupon.code})
                    </span>
                    <span className="font-medium text-success">
                      -${discount.toFixed(2)}
                    </span>
                  </div>
                )}
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
