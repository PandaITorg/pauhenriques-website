"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { createOrder, markOrderFailed } from "@/services/firestore/orderService";
import { ShippingAddress } from "@/types/order";
import { SavedCard } from "@/types/card";
import { CartItem } from "@/stores/cart.store";
import { AppliedCoupon } from "@/components/checkout/CouponInput";
import { useNuveiChallenges } from "@/hooks/useNuveiChallenges";
import { resolveChargeOutcome } from "@/lib/checkout/resolve-charge-outcome";

type Step = "cart" | "shipping" | "payment" | "confirm";

interface UseCheckoutPaymentProps {
  user: User | null;
  shipping: ShippingAddress | null;
  items: CartItem[];

  // Totales (ya calculados por calcCheckoutTotals en el componente)
  discountedSubtotal: number;
  vat: number;
  total: number;
  discount: number;
  shippingCost: number;

  // Selección de pago
  selectedCardToken: string | null;
  selectedCardInfo: SavedCard | null;
  savedCardCvc: string;
  deleteCardAfterPayment: boolean;
  installmentsCount: number;
  installmentsType: number;
  turnstileToken: string | null;
  appliedCoupon: AppliedCoupon | null;

  // Acciones del componente
  clearCart: () => void;
  revalidateCartStock: () => Promise<void>;
  setStep: (s: Step) => void;
}

/**
 * Envuelve TODO el cableado del pago del checkout:
 *
 *   - Estado de pago (processing / success / failed / error inline)
 *   - La máquina de challenges 3DS/OTP (vía `useNuveiChallenges`)
 *   - `handleConfirmPayment`: crea la orden, llama a `/api/payment/charge` y
 *     enruta la respuesta según `resolveChargeOutcome` (la decisión pura)
 *
 * La aritmética y la decisión de routing viven fuera (calcCheckoutTotals,
 * resolveChargeOutcome). Aquí solo está el cableado React: setState, mostrar
 * iframe/OTP, redirección. Comportamiento idéntico al inline que vivía en
 * `checkout/page.tsx`.
 */
export function useCheckoutPayment({
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
  appliedCoupon,
  clearCart,
  revalidateCartStock,
  setStep,
}: UseCheckoutPaymentProps) {
  const router = useRouter();

  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const challenges = useNuveiChallenges({
    user,
    onSuccess: ({ orderId, emailSent }) => {
      setPaymentSuccess(true);
      clearCart();
      const emailParam = emailSent === false ? "&emailSent=false" : "";
      setTimeout(() => {
        router.push(`/checkout/confirmacion?orderId=${orderId}${emailParam}`);
      }, 1500);
    },
    onFailed: (error) => setPaymentFailed(error),
    onProcessingChange: setProcessingPayment,
  });

  const {
    threeDSChallenge,
    setThreeDSChallenge,
    otpChallenge,
    setOtpChallenge,
    otpCode,
    setOtpCode,
    otpSubmitting,
    otpError,
    setOtpError,
    challengeVerifying,
    paymentLockRef,
    threeDSCompleteCalledRef,
    submitOtp,
  } = challenges;

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
          turnstileToken,
          ...(installmentsCount > 0
            ? { installments: installmentsCount, installmentsType }
            : {}),
          ...(deleteCardAfterPayment ? { deleteCardAfterPayment: true } : {}),
        }),
      });

      const data = await response.json();
      const outcome = resolveChargeOutcome(data, response.status);

      switch (outcome.kind) {
        case "success": {
          setProcessingPayment(false);
          setPaymentSuccess(true);
          clearCart();
          const emailParam =
            outcome.emailSent === false ? "&emailSent=false" : "";
          setTimeout(() => {
            router.push(
              `/checkout/confirmacion?orderId=${orderId}${emailParam}`,
            );
          }, 1500);
          break;
        }
        case "review": {
          // Payment under review — treat as pending success, clear cart
          setProcessingPayment(false);
          setPaymentSuccess(true);
          clearCart();
          setTimeout(() => {
            router.push(`/checkout/confirmacion?orderId=${orderId}&review=1`);
          }, 1500);
          break;
        }
        case "otp": {
          // OTP verification required (status_detail 31) — show OTP form
          setProcessingPayment(false);
          setOtpChallenge({
            orderId: outcome.orderId,
            nuveiTransactionId: outcome.nuveiTransactionId,
          });
          setOtpCode("");
          setOtpError(null);
          break;
        }
        case "challenge": {
          // 3DS challenge required — show challenge modal (status 35 or 36)
          setProcessingPayment(false);
          setThreeDSChallenge({
            html: outcome.html,
            orderId: outcome.orderId,
            isDeviceFingerprint: outcome.isDeviceFingerprint,
            nuveiTransactionId: outcome.nuveiTransactionId,
            statusDetail: outcome.statusDetail,
          });
          // Don't reset paymentLockRef — payment is still in progress via 3DS
          break;
        }
        case "error": {
          const errorMsg = outcome.message;
          if (orderId) {
            try {
              await markOrderFailed(orderId);
            } catch {
              /* best effort */
            }
          }
          paymentLockRef.current = false;
          setProcessingPayment(false);

          // Bug fix: if the charge failed because an item ran out of stock
          // between page load and Pagar (409 from the package's standard
          // validation), resync the cart against live stock and bounce the
          // user back to the cart step so they see the updated contents.
          if (outcome.isStockConflict) {
            await revalidateCartStock();
            setStep("cart");
          }

          setPaymentFailed(errorMsg);
          break;
        }
      }
    } catch (err) {
      console.error("Payment error:", err);
      if (orderId) {
        try {
          await markOrderFailed(orderId);
        } catch {}
      }
      const errorMsg = "Error de conexión. Intenta de nuevo.";
      paymentLockRef.current = false;
      setProcessingPayment(false);
      setPaymentFailed(errorMsg);
    }
  }

  return {
    // Estado de pago
    processingPayment,
    paymentSuccess,
    paymentFailed,
    setPaymentFailed,
    paymentError,
    setPaymentError,

    // Acción principal
    handleConfirmPayment,

    // Challenges 3DS/OTP (lo que la UI del componente necesita renderizar)
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
  };
}
