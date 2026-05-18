"use client";

import { useState } from "react";
import type { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaLock,
  FaShieldAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
  FaPencilAlt,
} from "react-icons/fa";

import { useAuth } from "@/context/AuthContext";
import { NuveiPaymentForm } from "@pandait.tech/payment-nuvei/ui";
import TurnstileWidget from "@/components/pricing/TurnstileWidget";
import TallerCard from "@/components/pago-link/TallerCard";
import GuestInfoForm, {
  type GuestInfoValues,
} from "@/components/pago-link/GuestInfoForm";
import { ensureAnonymousSession } from "@/lib/pago-link/anonymousAuth";
import { createOrder, markOrderFailed } from "@/services/firestore/orderService";
import { useNuveiChallenges } from "@/hooks/useNuveiChallenges";
import type {
  SerializablePriceDisplay,
  TallerSummary,
} from "@/lib/pago-link/linkBootstrap";

type Step = "guest-info" | "payment";

interface PagoLinkClientProps {
  taller: TallerSummary;
  pricing: SerializablePriceDisplay;
  /** PaymentLink fijo (privado). Si está presente, la orden lo guarda. */
  paymentLinkId?: string;
  /**
   * URL de éxito tras pago aprobado. Debe contener el placeholder literal
   * "{ORDER_ID}" que será reemplazado por el orderId real.
   * Funciones NO son serializables a través del boundary RSC, por eso
   * pasamos un string con placeholder en vez de un callback.
   */
  successUrlPattern: string;
  /** Descripción enviada al backend de pago (ej. "Taller X"). */
  paymentDescription: string;
}

const ORDER_ID_PLACEHOLDER = "{ORDER_ID}";

function buildSuccessUrl(pattern: string, orderId: string): string {
  return pattern.replace(ORDER_ID_PLACEHOLDER, encodeURIComponent(orderId));
}

export default function PagoLinkClient({
  taller,
  pricing,
  paymentLinkId,
  successUrlPattern,
  paymentDescription,
}: PagoLinkClientProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("guest-info");
  const [guestInfo, setGuestInfo] = useState<GuestInfoValues | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Sesión anónima diferida: solo se establece cuando el cliente confirma
  // que va a pagar (pasa al step "payment"). Antes de eso el link es 100%
  // público — cualquiera puede ver el taller sin necesidad de Firebase Auth.
  const [anonUser, setAnonUser] = useState<User | null>(null);
  const [anonAuthing, setAnonAuthing] = useState(false);
  const [anonAuthError, setAnonAuthError] = useState<string | null>(null);

  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState<string | null>(null);

  // El user efectivo para pagar: si el visitante ya tenía sesión real
  // (ej. admin testeando), la usamos; si no, el anonymous on-demand.
  const payingUser = user ?? anonUser;

  const challenges = useNuveiChallenges({
    user,
    onSuccess: ({ orderId }) => {
      setPaymentSuccess(true);
      setTimeout(() => {
        router.push(buildSuccessUrl(successUrlPattern, orderId));
      }, 1200);
    },
    onFailed: (error) => setPaymentFailed(error),
    onProcessingChange: setProcessing,
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

  async function handleGuestSubmit(values: GuestInfoValues) {
    setGuestInfo(values);
    setStep("payment");
    // Iniciar sesión anónima en background apenas el cliente confirma
    // sus datos. Cuando llegue al click "Pagar" ya estará lista.
    if (!payingUser && !anonAuthing) {
      setAnonAuthing(true);
      setAnonAuthError(null);
      try {
        const u = await ensureAnonymousSession(null);
        setAnonUser(u);
      } catch (err) {
        console.error("[pago-link] anon auth failed:", err);
        setAnonAuthError(
          "No se pudo iniciar la sesión segura. Recargá la página e intentá de nuevo.",
        );
      } finally {
        setAnonAuthing(false);
      }
    }
  }

  function handleTokenSuccess(token: string) {
    setPaymentError(null);
    void handleConfirmPayment(token);
  }

  function handleTokenError(error: string) {
    setPaymentError(error);
  }

  async function handleConfirmPayment(cardToken: string) {
    if (!guestInfo || !cardToken) {
      setPaymentError("Faltan datos para procesar el pago. Recargá la página.");
      return;
    }
    if (!turnstileToken) {
      setPaymentError(
        "Verificación de seguridad en curso. Esperá un segundo e intentá de nuevo.",
      );
      return;
    }
    if (paymentLockRef.current) return;
    paymentLockRef.current = true;

    setProcessing(true);
    setPaymentError(null);
    threeDSCompleteCalledRef.current = false;

    // Re-asegurar sesión anónima si por algún motivo no está lista todavía
    // (el sign-in se dispara al pasar al step payment, pero por seguridad
    // lo verificamos otra vez antes de cobrar).
    let confirmedUser = payingUser;
    if (!confirmedUser) {
      try {
        confirmedUser = await ensureAnonymousSession(null);
        setAnonUser(confirmedUser);
      } catch (err) {
        console.error("[pago-link] anon auth failed:", err);
        paymentLockRef.current = false;
        setProcessing(false);
        setPaymentError(
          "No se pudo iniciar la sesión segura. Recargá la página e intentá de nuevo.",
        );
        return;
      }
    }

    let orderId: string | null = null;

    try {
      const fullName = `${guestInfo.firstName} ${guestInfo.lastName}`.trim();

      orderId = await createOrder({
        userId: confirmedUser.uid,
        items: [
          {
            productId: taller.id,
            name: taller.name,
            brand: taller.brand,
            price: pricing.finalSubtotal,
            quantity: 1,
          },
        ],
        subtotal: pricing.finalSubtotal,
        vat: pricing.finalVat,
        shipping: 0,
        total: pricing.finalPrice,
        shippingAddress: {
          fullName,
          phone: guestInfo.phone,
          address: "-",
          city: "-",
          province: "-",
          postalCode: "-",
          country: "EC",
        },
        paymentToken: cardToken,
        guestInfo,
        postPurchaseNote: taller.postPurchaseNote,
        courseId: taller.id,
        tallerId: taller.id,
        ...(paymentLinkId ? { paymentLinkId } : {}),
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
          token: cardToken,
          orderId,
          amount: pricing.finalPrice,
          vat: pricing.finalVat,
          description: paymentDescription,
          userId: confirmedUser.uid,
          userEmail: guestInfo.email,
          browserInfo,
          deleteCardAfterPayment: true,
          turnstileToken,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setProcessing(false);
        setPaymentSuccess(true);
        setTimeout(() => {
          router.push(buildSuccessUrl(successUrlPattern, orderId!));
        }, 1200);
      } else if (data.review) {
        setProcessing(false);
        setPaymentSuccess(true);
        setTimeout(() => {
          router.push(
            `${buildSuccessUrl(successUrlPattern, orderId!)}&review=1`,
          );
        }, 1200);
      } else if (data.otpRequired) {
        setProcessing(false);
        paymentLockRef.current = false;
        setOtpChallenge({
          orderId: data.orderId,
          nuveiTransactionId: data.nuveiTransactionId || "",
        });
        setOtpCode("");
        setOtpError(null);
      } else if (data.challenge) {
        setProcessing(false);
        setThreeDSChallenge({
          html: data.challengeHtml,
          orderId: data.orderId,
          isDeviceFingerprint: data.isDeviceFingerprint ?? false,
          nuveiTransactionId: data.nuveiTransactionId || "",
          statusDetail: data.statusDetail || 36,
        });
      } else {
        if (orderId) {
          try {
            await markOrderFailed(orderId);
          } catch {}
        }
        paymentLockRef.current = false;
        setProcessing(false);
        setPaymentFailed(data.error || "No se pudo procesar el pago.");
      }
    } catch (err) {
      console.error("[pago-link] payment error:", err);
      if (orderId) {
        try {
          await markOrderFailed(orderId);
        } catch {}
      }
      paymentLockRef.current = false;
      setProcessing(false);
      const msg =
        err instanceof Error ? err.message : "Error de conexión. Intenta de nuevo.";
      setPaymentFailed(msg);
    }
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
        <FaCheckCircle className="w-16 h-16 text-success mb-5 animate-[scale-in_0.4s_ease-out]" />
        <h1 className="font-cormorant text-2xl md:text-3xl font-semibold text-text-main mb-2">
          Pago aprobado
        </h1>
        <p className="text-text-main/50 text-sm">Redirigiéndote…</p>
        <div className="mt-6">
          <div className="simple-spinner" />
        </div>
      </div>
    );
  }

  if (paymentFailed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
        <FaTimesCircle className="w-16 h-16 text-error mb-5" />
        <h1 className="font-cormorant text-2xl md:text-3xl font-semibold text-text-main mb-2">
          Pago no procesado
        </h1>
        <p className="text-text-main/50 text-sm max-w-xs mb-6">{paymentFailed}</p>
        <button
          onClick={() => {
            setPaymentFailed(null);
            setPaymentError(paymentFailed);
            setStep("payment");
          }}
          className="bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-8 rounded-xl transition-all"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
        <div className="simple-spinner w-10! h-10! border-3! mb-5" />
        <h2 className="font-cormorant text-xl font-semibold text-text-main mb-2">
          Procesando tu pago
        </h2>
        <p className="text-text-main/50 text-sm max-w-xs">
          No cierres esta página. Estamos verificando la transacción con el banco…
        </p>
      </div>
    );
  }

  if (otpChallenge) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-border-subtle flex items-center gap-3">
              <FaShieldAlt className="w-4 h-4 text-primary" />
              <div>
                <p className="font-semibold text-text-main text-sm">
                  Verificación del banco
                </p>
                <p className="text-text-main/50 text-xs">
                  Tu banco envió un código por SMS
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-text-main/70 text-center">
                Ingresá el código OTP que recibiste en tu teléfono.
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
                  if (e.key === "Enter") submitOtp();
                }}
              />
              {otpError && (
                <p className="text-error text-xs text-center">{otpError}</p>
              )}
              <button
                onClick={submitOtp}
                disabled={otpSubmitting || !otpCode.trim()}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {otpSubmitting ? (
                  <>
                    <div className="simple-spinner w-5! h-5! border-2! border-white! border-b-transparent!" />
                    Verificando…
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

  if (threeDSChallenge) {
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
              Estamos confirmando tu autenticación. Esto puede tomar unos segundos…
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
                  Verificación de seguridad
                </p>
                <p className="text-text-main/50 text-xs">
                  {threeDSChallenge.isDeviceFingerprint
                    ? "Verificando tu dispositivo…"
                    : "Tu banco requiere verificación adicional"}
                </p>
              </div>
            </div>
            <div className="relative">
              <iframe
                srcDoc={threeDSChallenge.html}
                className="w-full border-0"
                style={{
                  height: threeDSChallenge.isDeviceFingerprint ? "1px" : "600px",
                }}
                title="Autenticación 3DS"
                sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-popups"
              />
              {threeDSChallenge.isDeviceFingerprint && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <div className="simple-spinner" />
                  <p className="text-sm text-text-main/60">Verificando tu dispositivo…</p>
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/60 via-background to-background" />
        <div className="relative max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 pt-10 pb-4 md:pt-16 md:pb-6 text-center">
          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-2">
            Pago seguro
          </span>
          <h1 className="font-cormorant text-2xl sm:text-3xl md:text-4xl font-semibold text-text-main mb-1">
            Finaliza tu compra
          </h1>
          <p className="text-sm text-text-main/50">
            <FaLock className="inline w-3 h-3 mr-1 -mt-0.5" />
            Conexión encriptada · Tokenización PCI
          </p>
        </div>
      </section>

      <div className="h-px max-w-5xl mx-auto bg-linear-to-r from-transparent via-border-default to-transparent" />

      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <TallerCard taller={taller} />

            {step === "guest-info" && (
              <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-xl">
                <h2 className="text-lg font-semibold text-text-main mb-1">
                  Tus datos
                </h2>
                <p className="text-sm text-text-main/50 mb-5">
                  Necesitamos esta información para emitir el comprobante y
                  enviarte el acceso al taller.
                </p>
                <GuestInfoForm
                  initial={guestInfo ?? undefined}
                  onSubmit={handleGuestSubmit}
                />
              </div>
            )}

            {step === "payment" && guestInfo && (
              <div className="space-y-6">
                <div className="bg-surface-card border border-border-subtle rounded-xl p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-text-main">
                        Comprador
                      </h3>
                      <p className="text-xs text-text-main/50 mt-0.5">
                        El comprobante llegará a este correo
                      </p>
                    </div>
                    <button
                      onClick={() => setStep("guest-info")}
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      <FaPencilAlt className="w-3 h-3" />
                      Editar
                    </button>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <SummaryRow
                      label="Nombre"
                      value={`${guestInfo.firstName} ${guestInfo.lastName}`}
                    />
                    <SummaryRow label="Cédula / Pasaporte" value={guestInfo.idNumber} />
                    <SummaryRow label="Correo" value={guestInfo.email} />
                    <SummaryRow label="Teléfono" value={guestInfo.phone} />
                  </dl>
                </div>

                <div className="bg-surface-card border border-border-subtle rounded-xl p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-text-main mb-1">
                    Método de pago
                  </h3>
                  <p className="text-sm text-text-main/50 mb-5">
                    Aceptamos Visa, Mastercard, American Express y Diners.
                  </p>

                  {paymentError && (
                    <div className="bg-error/10 text-error p-3 rounded-lg mb-4 text-sm">
                      {paymentError}
                    </div>
                  )}

                  {anonAuthError && (
                    <div className="bg-error/10 text-error p-3 rounded-lg mb-4 text-sm">
                      {anonAuthError}
                    </div>
                  )}

                  {!payingUser ? (
                    <div className="flex items-center justify-center gap-3 py-8">
                      <div className="simple-spinner" />
                      <span className="text-sm text-text-main/60">
                        Preparando el formulario de pago seguro…
                      </span>
                    </div>
                  ) : (
                    <>
                      <NuveiPaymentForm
                        uid={payingUser.uid}
                        email={guestInfo.email}
                        onTokenSuccess={handleTokenSuccess}
                        onTokenError={handleTokenError}
                        disabled={processing || !turnstileToken}
                        buttonLabel={`Pagar $${pricing.finalPrice.toFixed(2)}`}
                        processingLabel="Procesando pago…"
                        showSaveCardCheckbox={false}
                      />

                      <div className="mt-4 flex justify-center">
                        <TurnstileWidget onToken={setTurnstileToken} />
                      </div>
                    </>
                  )}

                  <button
                    onClick={() => setStep("guest-info")}
                    disabled={processing}
                    className="mt-3 w-full flex items-center justify-center gap-2 border border-border-default text-text-main/60 font-medium py-3 rounded-xl hover:bg-surface-elevated transition-colors disabled:opacity-50"
                  >
                    <FaArrowLeft className="w-3 h-3" />
                    Volver
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-xl lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold text-text-main mb-4">Resumen</h2>

              {pricing.label && (
                <div className="mb-4 inline-flex items-center gap-1.5 bg-primary/15 text-primary text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full">
                  🔥 {pricing.label}
                </div>
              )}

              <div className="flex items-start justify-between gap-3 text-sm pb-4 border-b border-border-subtle">
                <div>
                  <p className="font-medium text-text-main leading-snug">
                    {taller.name}
                  </p>
                  <p className="text-xs text-text-main/50 mt-0.5">Taller en vivo</p>
                </div>
                <div className="text-right">
                  {pricing.hasActiveDiscount && (
                    <p className="text-xs text-text-main/40 line-through">
                      ${pricing.basePrice.toFixed(2)}
                    </p>
                  )}
                  <p className="font-medium text-text-main whitespace-nowrap">
                    ${pricing.finalPrice.toFixed(2)}
                  </p>
                  {pricing.hasActiveDiscount && pricing.percentOff > 0 && (
                    <p className="text-[11px] font-bold text-success mt-0.5">
                      -{pricing.percentOff}% OFF
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-text-main/45">
                  <span>Incluye IVA (15%)</span>
                  <span>${pricing.finalVat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-primary pt-3 mt-3 border-t border-border-subtle">
                  <span>Total</span>
                  <span>${pricing.finalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-border-subtle space-y-2.5">
                <TrustRow icon={<FaLock className="w-3 h-3" />} text="Pago 100% seguro" />
                <TrustRow
                  icon={<FaShieldAlt className="w-3 h-3" />}
                  text="Tokenización PCI Compliant"
                />
              </div>

              <p className="mt-5 text-[11px] text-text-main/40 leading-relaxed">
                Al pagar aceptás los{" "}
                <Link
                  href="/terminos-servicio"
                  className="underline underline-offset-2 hover:text-text-main/70 transition-colors"
                >
                  términos
                </Link>{" "}
                y la{" "}
                <Link
                  href="/politica-privacidad"
                  className="underline underline-offset-2 hover:text-text-main/70 transition-colors"
                >
                  política de privacidad
                </Link>
                .
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-text-main/40 font-medium">
        {label}
      </dt>
      <dd className="text-text-main/80 break-all">{value}</dd>
    </div>
  );
}

function TrustRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-text-main/50">
      <span className="text-text-main/40">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
