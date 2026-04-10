"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import NuveiPaymentForm from "@/components/checkout/NuveiPaymentForm";
import type { TokenizedCardInfo } from "@/components/checkout/NuveiPaymentForm";
import { useAuth } from "@/context/AuthContext";
import { FaGift, FaSpinner } from "react-icons/fa";

interface PlanPublicData {
  id: string;
  partner1Name: string;
  partner2Name: string;
  weddingDate: string | null;
  message: string;
  coverImage: string | null;
  slug: string;
  status: string;
  progressPercent: number | null;
}

type PaymentStep = "form" | "processing" | "3ds" | "otp" | "success" | "error";

export default function ContributeClient() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [plan, setPlan] = useState<PlanPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");

  // Payment state
  const [step, setStep] = useState<PaymentStep>("form");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3DS state
  const [challengeHtml, setChallengeHtml] = useState("");
  const [isDeviceFingerprint, setIsDeviceFingerprint] = useState(false);
  const [contributionId, setContributionId] = useState("");
  const [nuveiTransactionId, setNuveiTransactionId] = useState("");
  const [nuveiUserId, setNuveiUserId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const challengeRef = useRef<HTMLDivElement>(null);

  // Pre-fill guest info from auth if available
  useEffect(() => {
    if (user) {
      setGuestName(user.displayName || "");
      setGuestEmail(user.email || "");
    }
  }, [user]);

  // Fetch plan data
  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch(`/api/plan-novios/${slug}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setPlan(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchPlan();
  }, [slug]);

  const getBrowserInfo = useCallback(() => {
    return {
      accept_header: "text/html",
      user_agent: navigator.userAgent,
      language: navigator.language || "es",
      timezone_offset: new Date().getTimezoneOffset(),
      screen_width: screen.width,
      screen_height: screen.height,
      color_depth: screen.colorDepth,
      js_enabled: true,
      java_enabled: false,
    };
  }, []);

  const handleTokenSuccess = async (token: string, _cardInfo: TokenizedCardInfo, _saveCard: boolean) => {
    if (!plan) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      setAmountError("El monto minimo es $1.00");
      return;
    }
    if (parsedAmount > 10000) {
      setAmountError("El monto maximo es $10,000.00");
      return;
    }
    if (!guestName.trim()) {
      setErrorMessage("Por favor ingresa tu nombre");
      return;
    }

    setIsSubmitting(true);
    setStep("processing");

    try {
      const res = await fetch("/api/plan-novios/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          slug: plan.slug,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim() || "",
          guestMessage: guestMessage.trim() || "",
          amount: parsedAmount,
          token,
          browserInfo: getBrowserInfo(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStep("success");
        setTimeout(() => {
          router.push(`/plan-novios/${slug}/confirmacion?amount=${parsedAmount}&name=${encodeURIComponent(guestName)}`);
        }, 1500);
        return;
      }

      if (data.challenge) {
        setChallengeHtml(data.challengeHtml);
        setIsDeviceFingerprint(data.isDeviceFingerprint);
        setContributionId(data.contributionId);
        setNuveiTransactionId(data.nuveiTransactionId);
        setNuveiUserId(data.nuveiUserId);
        setStep("3ds");
        handle3DSChallenge(data);
        return;
      }

      if (data.otpRequired) {
        setContributionId(data.contributionId);
        setNuveiTransactionId(data.nuveiTransactionId);
        setNuveiUserId(data.nuveiUserId);
        setStep("otp");
        return;
      }

      setErrorMessage(data.error || "Error al procesar el pago");
      setStep("error");
    } catch {
      setErrorMessage("Error de conexion. Intenta de nuevo.");
      setStep("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle3DSChallenge = useCallback(
    (data: { isDeviceFingerprint: boolean; contributionId: string; nuveiTransactionId: string; nuveiUserId: string }) => {
      if (data.isDeviceFingerprint) {
        // Hidden iframe — wait 5 seconds then verify
        setTimeout(() => {
          complete3DS("AUTHENTICATION_CONTINUE", data.contributionId, data.nuveiTransactionId, data.nuveiUserId);
        }, 5000);
      } else {
        // Interactive challenge — listen for postMessage from 3DS window
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === "3DS_COMPLETE" || event.data?.MessageType === "CRes") {
            window.removeEventListener("message", handleMessage);
            // Poll for completion
            pollFor3DSCompletion(data.contributionId, data.nuveiTransactionId, data.nuveiUserId);
          }
        };
        window.addEventListener("message", handleMessage);
      }
    },
    [],
  );

  const pollFor3DSCompletion = async (contribId: string, txId: string, userId: string, attempts = 0) => {
    if (attempts > 20) {
      setErrorMessage("Tiempo de espera agotado para la verificacion 3DS");
      setStep("error");
      return;
    }

    const res = await fetch("/api/plan-novios/3ds-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contributionId: contribId,
        planId: plan?.id,
        nuveiUserId: userId,
        type: "AUTHENTICATION_CONTINUE",
        nuveiTransactionId: txId,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setStep("success");
      const parsedAmount = parseFloat(amount);
      setTimeout(() => {
        router.push(`/plan-novios/${slug}/confirmacion?amount=${parsedAmount}&name=${encodeURIComponent(guestName)}`);
      }, 1500);
      return;
    }

    if (data.pending) {
      setTimeout(() => pollFor3DSCompletion(contribId, txId, userId, attempts + 1), 2000);
      return;
    }

    if (data.challenge) {
      setChallengeHtml(data.challengeHtml);
      setIsDeviceFingerprint(data.isDeviceFingerprint);
      handle3DSChallenge(data);
      return;
    }

    setErrorMessage(data.error || "Error en la verificacion 3DS");
    setStep("error");
  };

  const complete3DS = async (type: "AUTHENTICATION_CONTINUE" | "BY_OTP", contribId: string, txId: string, userId: string, otpValue?: string) => {
    try {
      const res = await fetch("/api/plan-novios/3ds-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributionId: contribId,
          planId: plan?.id,
          nuveiUserId: userId,
          type,
          nuveiTransactionId: txId,
          ...(otpValue ? { otpCode: otpValue } : {}),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStep("success");
        const parsedAmount = parseFloat(amount);
        setTimeout(() => {
          router.push(`/plan-novios/${slug}/confirmacion?amount=${parsedAmount}&name=${encodeURIComponent(guestName)}`);
        }, 1500);
        return;
      }

      if (data.pending) {
        setTimeout(() => pollFor3DSCompletion(contribId, txId, userId), 2000);
        return;
      }

      if (data.challenge) {
        setChallengeHtml(data.challengeHtml);
        setIsDeviceFingerprint(data.isDeviceFingerprint);
        handle3DSChallenge(data);
        return;
      }

      setErrorMessage(data.error || "Error en la verificacion");
      setStep("error");
    } catch {
      setErrorMessage("Error de conexion");
      setStep("error");
    }
  };

  const handleOtpSubmit = () => {
    if (!otpCode.trim()) return;
    setStep("processing");
    complete3DS("BY_OTP", contributionId, nuveiTransactionId, nuveiUserId, otpCode.trim());
  };

  // Render 3DS challenge HTML
  useEffect(() => {
    if (step === "3ds" && challengeHtml && challengeRef.current) {
      challengeRef.current.innerHTML = challengeHtml;
      const scripts = challengeRef.current.querySelectorAll("script");
      scripts.forEach((script) => {
        const newScript = document.createElement("script");
        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.textContent = script.textContent;
        }
        script.parentNode?.replaceChild(newScript, script);
      });
    }
  }, [step, challengeHtml]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <div className="simple-spinner" />
      </div>
    );
  }

  if (notFound || !plan) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background text-text-main">
        <div className="text-center">
          <h1 className="font-cormorant text-3xl font-semibold mb-4">Plan no encontrado</h1>
          <p className="text-text-main/70">Este enlace no corresponde a ningun Plan Novios activo.</p>
        </div>
      </div>
    );
  }

  const coupleNames = `${plan.partner1Name} y ${plan.partner2Name}`;

  return (
    <div className="bg-background text-text-main min-h-screen py-8 px-5">
      <div className="max-w-lg mx-auto">
        {/* Couple header */}
        <div className="text-center mb-8">
          <p className="font-dancing-script text-primary text-lg mb-1">Plan Novios Carico</p>
          <h1 className="font-cormorant text-3xl md:text-4xl font-semibold mb-3">
            {coupleNames}
          </h1>
          {plan.message && (
            <p className="text-text-main/70 text-sm max-w-md mx-auto italic">
              &ldquo;{plan.message}&rdquo;
            </p>
          )}
        </div>

        {/* Progress bar — ambiguous, no amounts */}
        {plan.progressPercent !== null && plan.progressPercent < 100 && (
          <div className="mb-8">
            <div className="bg-surface-elevated rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-linear-to-r from-primary/60 to-primary rounded-full h-full transition-all duration-700"
                style={{ width: `${plan.progressPercent}%` }}
              />
            </div>
            <p className="text-text-main/40 text-xs text-center mt-2">
              Tu aporte los acerca mas a construir su hogar
            </p>
          </div>
        )}

        {/* Form */}
        {step === "form" && (
          <div className="bg-surface-card border border-border-default rounded-xl p-6 md:p-8">
            <h2 className="font-cormorant text-xl font-semibold mb-6 flex items-center gap-2">
              <FaGift className="text-primary" />
              Tu Contribucion
            </h2>

            {/* Guest name */}
            <div className="mb-4">
              <label htmlFor="guestName" className="block text-sm font-medium mb-1.5 text-text-main/80">
                Tu Nombre *
              </label>
              <input
                type="text"
                id="guestName"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3 py-2.5 bg-input-bg border border-border-default rounded-lg focus:outline-none focus:border-primary text-text-main"
                placeholder="Tu nombre completo"
                required
              />
            </div>

            {/* Guest email */}
            <div className="mb-4">
              <label htmlFor="guestEmail" className="block text-sm font-medium mb-1.5 text-text-main/80">
                Tu Email <span className="text-text-main/40">(opcional - para recibir confirmacion)</span>
              </label>
              <input
                type="email"
                id="guestEmail"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-input-bg border border-border-default rounded-lg focus:outline-none focus:border-primary text-text-main"
                placeholder="tu@email.com"
              />
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label htmlFor="amount" className="block text-sm font-medium mb-1.5 text-text-main/80">
                Monto a Contribuir (USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-semibold text-lg">$</span>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setAmountError("");
                  }}
                  min="1"
                  max="10000"
                  step="0.01"
                  className="w-full pl-8 pr-3 py-2.5 bg-input-bg border border-border-default rounded-lg focus:outline-none focus:border-primary text-text-main text-lg"
                  placeholder="50.00"
                  required
                />
              </div>
              {amountError && <p className="text-error text-sm mt-1">{amountError}</p>}
              <div className="flex gap-2 mt-2">
                {[10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => { setAmount(String(preset)); setAmountError(""); }}
                    className="px-3 py-1 text-sm border border-border-default rounded-full hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <label htmlFor="guestMessage" className="block text-sm font-medium mb-1.5 text-text-main/80">
                Mensaje para los Novios <span className="text-text-main/40">(opcional)</span>
              </label>
              <textarea
                id="guestMessage"
                value={guestMessage}
                onChange={(e) => setGuestMessage(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2.5 bg-input-bg border border-border-default rounded-lg focus:outline-none focus:border-primary text-text-main resize-none"
                placeholder="Felicidades por su boda!"
              />
            </div>

            {/* Nuvei Payment Form */}
            <div className="mb-4">
              <NuveiPaymentForm
                uid={user?.uid || `guest_${plan.id}_${Date.now()}`}
                email={guestEmail || user?.email || "guest@pauhenriques.com"}
                onTokenSuccess={handleTokenSuccess}
                onTokenError={(error) => {
                  setErrorMessage(error);
                  setStep("error");
                }}
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {/* Processing */}
        {step === "processing" && (
          <div className="bg-surface-card border border-border-default rounded-xl p-8 text-center">
            <FaSpinner className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-lg font-medium">Procesando tu contribucion...</p>
            <p className="text-text-main/60 text-sm mt-2">No cierres esta ventana</p>
          </div>
        )}

        {/* 3DS Challenge */}
        {step === "3ds" && (
          <div className="bg-surface-card border border-border-default rounded-xl p-6">
            <h2 className="font-cormorant text-xl font-semibold mb-4 text-center">
              Verificacion de Seguridad
            </h2>
            <p className="text-text-main/60 text-sm text-center mb-4">
              Tu banco requiere verificacion adicional. Completa el proceso a continuacion.
            </p>
            <div
              ref={challengeRef}
              className={isDeviceFingerprint ? "hidden" : "min-h-75"}
            />
            {isDeviceFingerprint && (
              <div className="text-center py-8">
                <FaSpinner className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
                <p className="text-sm text-text-main/60">Verificando con tu banco...</p>
              </div>
            )}
          </div>
        )}

        {/* OTP */}
        {step === "otp" && (
          <div className="bg-surface-card border border-border-default rounded-xl p-6">
            <h2 className="font-cormorant text-xl font-semibold mb-4 text-center">
              Codigo de Verificacion
            </h2>
            <p className="text-text-main/60 text-sm text-center mb-6">
              Tu banco envio un codigo OTP a tu telefono. Ingresalo a continuacion.
            </p>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full px-3 py-3 bg-input-bg border border-border-default rounded-lg focus:outline-none focus:border-primary text-text-main text-center text-xl tracking-widest mb-4"
              placeholder="000000"
              maxLength={8}
              autoFocus
            />
            <button
              onClick={handleOtpSubmit}
              disabled={!otpCode.trim()}
              className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Verificar
            </button>
          </div>
        )}

        {/* Success */}
        {step === "success" && (
          <div className="bg-surface-card border border-border-default rounded-xl p-8 text-center">
            <div className="w-14 h-14 bg-success/10 border-2 border-success/25 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-success text-2xl">&#10003;</span>
            </div>
            <h2 className="font-cormorant text-2xl font-semibold mb-2">Contribucion Exitosa</h2>
            <p className="text-text-main/60">Redirigiendo...</p>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="bg-surface-card border border-border-default rounded-xl p-8 text-center">
            <div className="w-14 h-14 bg-error/10 border-2 border-error/25 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-error text-2xl">&#10005;</span>
            </div>
            <h2 className="font-cormorant text-2xl font-semibold mb-2">Error en el Pago</h2>
            <p className="text-text-main/60 mb-6">{errorMessage}</p>
            <button
              onClick={() => { setStep("form"); setErrorMessage(""); }}
              className="bg-primary text-white font-semibold py-3 px-8 rounded-lg hover:bg-primary-hover transition-colors cursor-pointer"
            >
              Intentar de Nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
