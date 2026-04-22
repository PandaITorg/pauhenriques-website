"use client";

import { useEffect, useRef, useState } from "react";
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
import NuveiPaymentForm from "@/components/checkout/NuveiPaymentForm";
import CourseCard from "@/components/pago-link/CourseCard";
import GuestInfoForm, {
  type GuestInfoValues,
} from "@/components/pago-link/GuestInfoForm";
import { CURSO_TOXICA_SIN_TOXICOS } from "@/lib/pago-link/course";
import { ensureAnonymousSession } from "@/lib/pago-link/anonymousAuth";
import { createOrder, markOrderFailed } from "@/services/firestore/orderService";
import { ensureCourseProduct } from "./actions";

type Step = "guest-info" | "payment" | "processing";

interface ThreeDSChallenge {
  html: string;
  orderId: string;
  isDeviceFingerprint: boolean;
  nuveiTransactionId: string;
  statusDetail: number;
}

const COURSE = CURSO_TOXICA_SIN_TOXICOS;

export default function PagoToxicaSinToxicosPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [bootError, setBootError] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [step, setStep] = useState<Step>("guest-info");
  const [guestInfo, setGuestInfo] = useState<GuestInfoValues | null>(null);

  const [processing, setProcessing] = useState(false);
  const paymentLockRef = useRef(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState<string | null>(null);
  const [threeDSChallenge, setThreeDSChallenge] =
    useState<ThreeDSChallenge | null>(null);
  const threeDSCompleteCalledRef = useRef(false);

  // Bootstrap: ensure course product exists + anonymous session
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ensureRes = await ensureCourseProduct();
        if (!ensureRes.ok) throw new Error(ensureRes.error || "No se pudo cargar el curso");
        await ensureAnonymousSession(user);
        if (!cancelled) setBooting(false);
      } catch (err) {
        if (cancelled) return;
        console.error("[pago-link] bootstrap error:", err);
        setBootError(err instanceof Error ? err.message : "Error al preparar la página");
        setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for 3DS completion postMessage from Cloud Function
  useEffect(() => {
    if (!threeDSChallenge || !user) return;

    async function handle3DSMessage(event: MessageEvent) {
      if (event.data?.type !== "3DS_COMPLETE") return;
      const { orderId } = event.data;
      if (!orderId || !user) return;

      setThreeDSChallenge(null);
      if (threeDSCompleteCalledRef.current) return;
      threeDSCompleteCalledRef.current = true;
      setProcessing(true);

      try {
        const response = await fetch("/api/payment/3ds-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, userId: user.uid, type: "BY_CRES" }),
        });
        const data = await response.json();
        if (data.success) {
          setProcessing(false);
          setPaymentSuccess(true);
          setTimeout(() => {
            router.push(`/pago/toxica-sin-toxicos/exito?orderId=${data.orderId}`);
          }, 1200);
        } else {
          paymentLockRef.current = false;
          setProcessing(false);
          setPaymentFailed(data.error || "La autenticación 3DS no se completó.");
        }
      } catch {
        paymentLockRef.current = false;
        setProcessing(false);
        setPaymentFailed("Error de conexión al completar la autenticación 3DS.");
      }
    }

    window.addEventListener("message", handle3DSMessage);
    return () => window.removeEventListener("message", handle3DSMessage);
  }, [threeDSChallenge, user, router]);

  function handleGuestSubmit(values: GuestInfoValues) {
    setGuestInfo(values);
    setStep("payment");
  }

  function handleTokenSuccess(token: string) {
    console.log("[pago-link] tokenize success, token:", token?.substring(0, 10) + "...");
    setPaymentError(null);
    // One-click: tokenize + charge immediately. No intermediate button.
    void handleConfirmPayment(token);
  }

  function handleTokenError(error: string) {
    console.error("[pago-link] tokenize error:", error);
    setPaymentError(error);
  }

  async function handleConfirmPayment(token: string) {
    console.log("[pago-link] handleConfirmPayment start", {
      hasUser: !!user,
      hasGuestInfo: !!guestInfo,
      hasToken: !!token,
      locked: paymentLockRef.current,
    });
    if (!user || !guestInfo || !token) {
      console.error("[pago-link] missing prerequisites — aborting");
      setPaymentError("Faltan datos para procesar el pago. Recargá la página.");
      return;
    }
    if (paymentLockRef.current) {
      console.warn("[pago-link] payment lock active — ignoring");
      return;
    }
    paymentLockRef.current = true;

    setProcessing(true);
    setPaymentError(null);
    threeDSCompleteCalledRef.current = false;

    let orderId: string | null = null;

    try {
      const fullName = `${guestInfo.firstName} ${guestInfo.lastName}`.trim();

      console.log("[pago-link] creating order…");
      orderId = await createOrder({
        userId: user.uid,
        items: [
          {
            productId: COURSE.productId,
            name: COURSE.name,
            brand: COURSE.brand,
            price: COURSE.priceWithoutVat,
            quantity: 1,
          },
        ],
        subtotal: COURSE.priceWithoutVat,
        vat: COURSE.vat,
        shipping: 0,
        total: COURSE.total,
        shippingAddress: {
          fullName,
          phone: guestInfo.phone,
          address: "-",
          city: "-",
          province: "-",
          postalCode: "-",
          country: "EC",
        },
        paymentToken: token,
        guestInfo,
        postPurchaseNote: COURSE.postPurchaseNote,
        courseId: COURSE.productId,
      });
      console.log("[pago-link] order created:", orderId);

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

      console.log("[pago-link] calling /api/payment/charge…");
      const response = await fetch("/api/payment/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          orderId,
          amount: COURSE.total,
          vat: COURSE.vat,
          description: `Curso ${COURSE.name}`,
          userId: user.uid,
          userEmail: guestInfo.email,
          browserInfo,
          deleteCardAfterPayment: true,
        }),
      });
      const data = await response.json();
      console.log("[pago-link] charge response:", { status: response.status, data });

      if (data.success) {
        setProcessing(false);
        setPaymentSuccess(true);
        setTimeout(() => {
          router.push(`/pago/toxica-sin-toxicos/exito?orderId=${orderId}`);
        }, 1200);
      } else if (data.review) {
        setProcessing(false);
        setPaymentSuccess(true);
        setTimeout(() => {
          router.push(`/pago/toxica-sin-toxicos/exito?orderId=${orderId}&review=1`);
        }, 1200);
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
          } catch { /* best effort */ }
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

  // ── UI states ────────────────────────────────────────────────────────────

  if (booting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="simple-spinner" />
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
        <FaTimesCircle className="w-12 h-12 text-error mb-4" />
        <h1 className="font-cormorant text-2xl font-semibold text-text-main mb-2">
          No se pudo cargar la página
        </h1>
        <p className="text-text-main/60 text-sm max-w-xs mb-6">{bootError}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-8 rounded-xl transition-all"
        >
          Reintentar
        </button>
      </div>
    );
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

  if (threeDSChallenge) {
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
            <iframe
              srcDoc={threeDSChallenge.html}
              className="w-full border-0"
              style={{
                height: threeDSChallenge.isDeviceFingerprint ? "1px" : "600px",
              }}
              title="Autenticación 3DS"
              sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-popups"
            />
          </div>
          <p className="text-center text-xs text-text-main/40 mt-3">
            No cierres esta página. Conexión segura con tu banco.
          </p>
        </div>
      </div>
    );
  }

  // ── Main layout ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
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
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            <CourseCard course={COURSE} />

            {/* Step 1: Guest info */}
            {step === "guest-info" && (
              <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-xl">
                <h2 className="text-lg font-semibold text-text-main mb-1">
                  Tus datos
                </h2>
                <p className="text-sm text-text-main/50 mb-5">
                  Necesitamos esta información para emitir el comprobante y enviarte el acceso al curso.
                </p>
                <GuestInfoForm
                  initial={guestInfo ?? undefined}
                  onSubmit={handleGuestSubmit}
                />
              </div>
            )}

            {/* Step 2: Payment */}
            {step === "payment" && guestInfo && (
              <div className="space-y-6">
                {/* Guest info summary */}
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
                    <SummaryRow label="Nombre" value={`${guestInfo.firstName} ${guestInfo.lastName}`} />
                    <SummaryRow label="Cédula / Pasaporte" value={guestInfo.idNumber} />
                    <SummaryRow label="Correo" value={guestInfo.email} />
                    <SummaryRow label="Teléfono" value={guestInfo.phone} />
                  </dl>
                </div>

                {/* Card form */}
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

                  <NuveiPaymentForm
                    uid={user!.uid}
                    email={guestInfo.email}
                    onTokenSuccess={handleTokenSuccess}
                    onTokenError={handleTokenError}
                    disabled={processing}
                    buttonLabel={`Pagar $${COURSE.total.toFixed(2)}`}
                    processingLabel="Procesando pago…"
                    showSaveCardCheckbox={false}
                  />

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

          {/* Summary sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-surface-card border border-border-subtle p-5 sm:p-6 rounded-xl lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold text-text-main mb-4">Resumen</h2>
              <div className="flex items-start justify-between gap-3 text-sm pb-4 border-b border-border-subtle">
                <div>
                  <p className="font-medium text-text-main leading-snug">
                    {COURSE.name}
                  </p>
                  <p className="text-xs text-text-main/50 mt-0.5">Curso online</p>
                </div>
                <p className="font-medium text-text-main whitespace-nowrap">
                  ${COURSE.total.toFixed(2)}
                </p>
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-text-main/45">
                  <span>Incluye IVA (15%)</span>
                  <span>${COURSE.vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-primary pt-3 mt-3 border-t border-border-subtle">
                  <span>Total</span>
                  <span>${COURSE.total.toFixed(2)}</span>
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
