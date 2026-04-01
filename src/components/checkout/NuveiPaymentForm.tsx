"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import {
  FaLock,
  FaExclamationTriangle,
  FaTimesCircle,
  FaInfoCircle,
  FaRedo,
} from "react-icons/fa";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface PaymentGatewayInstance {
  generate_tokenize: (
    data: TokenizeData,
    containerSelector: string,
    responseCallback: (response: TokenizeResponse) => void,
    notCompletedCallback: (message: string) => void,
  ) => void;
  tokenize: () => void;
}

interface TokenizeData {
  locale: string;
  user: {
    id: string;
    email: string;
  };
  configuration: {
    default_country: string;
    icon_colour?: string;
    use_dropdowns?: boolean;
    exclusive_types?: string[];
    invalid_card_type_message?: string;
  };
}

interface TokenizeResponse {
  card: {
    bin: string;
    status: "valid" | "review" | "rejected" | string;
    token?: string;
    message?: string;
    expiry_year?: string;
    expiry_month?: string;
    transaction_reference?: string;
    type?: string;
    number?: string;
  };
}

type ErrorVariant = "rejected" | "duplicate" | "incomplete" | "system";

interface CardError {
  variant: ErrorVariant;
  title: string;
  message: string;
  duplicateToken?: string;
}

export interface TokenizedCardInfo {
  type?: string;
  number?: string;
  expiry_year?: string;
  expiry_month?: string;
}

interface NuveiPaymentFormProps {
  uid: string;
  email: string;
  onTokenSuccess: (token: string, cardInfo: TokenizedCardInfo, saveCard: boolean) => void;
  onTokenError: (error: string) => void;
  disabled?: boolean;
}

const SDK_URL =
  "https://cdn.paymentez.com/ccapi/sdk/payment_sdk_stable.min.js";
const CONTAINER_ID = "nuvei-tokenize-container";

const NuveiPaymentForm: React.FC<NuveiPaymentFormProps> = ({
  uid,
  email,
  onTokenSuccess,
  onTokenError,
}) => {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkTimedOut, setSdkTimedOut] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeletingDuplicate, setIsDeletingDuplicate] = useState(false);
  const [error, setError] = useState<CardError | null>(null);
  const [saveCard, setSaveCard] = useState(true);
  const sdkInitRef = useRef(false);
  const pgSdkRef = useRef<PaymentGatewayInstance | null>(null);
  const saveCardRef = useRef(true);

  // Keep ref in sync for use inside memoized callback
  useEffect(() => { saveCardRef.current = saveCard; }, [saveCard]);

  // Timeout: if SDK hasn't loaded in 15s, show a helpful message
  useEffect(() => {
    if (sdkReady) return;
    const timer = setTimeout(() => {
      if (!sdkReady) setSdkTimedOut(true);
    }, 15000);
    return () => clearTimeout(timer);
  }, [sdkReady]);

  function buildError(rawMsg: string): CardError {
    const msg = rawMsg.toLowerCase();

    if (msg.includes("already")) {
      return {
        variant: "duplicate",
        title: "Tarjeta ya registrada",
        message:
          "Esta tarjeta ya está en tu cuenta. Selecciónala desde tus tarjetas guardadas.",
      };
    }
    if (msg.includes("blacklist") || msg.includes("black list")) {
      return {
        variant: "rejected",
        title: "Tarjeta no aceptada",
        message:
          "Esta tarjeta está en una lista restringida y no puede ser utilizada. Contacta a tu banco o intenta con otra tarjeta.",
      };
    }
    if (msg.includes("fraud")) {
      return {
        variant: "rejected",
        title: "Tarjeta rechazada por seguridad",
        message:
          "El sistema de seguridad rechazó esta tarjeta. Intenta con otra tarjeta.",
      };
    }
    if (
      msg.includes("reject") ||
      msg.includes("response by mock") ||
      msg.includes("denied") ||
      msg.includes("declined")
    ) {
      return {
        variant: "rejected",
        title: "Tarjeta rechazada",
        message:
          "El banco emisor rechazó esta tarjeta. Verifica los datos o intenta con otra tarjeta.",
      };
    }
    if (msg.includes("expired")) {
      return {
        variant: "rejected",
        title: "Tarjeta vencida",
        message:
          "Esta tarjeta está vencida. Actualiza tu método de pago o usa otra tarjeta.",
      };
    }
    if (msg.includes("invalid") || msg.includes("not valid")) {
      return {
        variant: "rejected",
        title: "Tarjeta inválida",
        message:
          "Los datos de la tarjeta no son válidos. Verifica el número, fecha y CVV.",
      };
    }
    // Fallback — never show raw Nuvei messages to the user
    return {
      variant: "rejected",
      title: "Tarjeta no aceptada",
      message: "No se pudo registrar esta tarjeta. Verifica los datos o intenta con otra.",
    };
  }

  const responseCallback = useCallback(
    (response: any) => {
      setIsProcessing(false);

      if (response.error) {
        console.log("[NuveiPaymentForm] SDK error response:", JSON.stringify(response.error));
        const errorType = response.error?.type || "";
        if (errorType.toLowerCase().includes("card already added")) {
          // Extract token from "Card already added: TOKEN_HERE"
          const tokenMatch = errorType.match(/Card already added:\s*(\S+)/i);
          setError({
            variant: "duplicate",
            title: "Tarjeta ya registrada",
            message: "Esta tarjeta ya existe en tu cuenta pero no se puede usar. Puedes eliminarla y volver a agregarla.",
            duplicateToken: tokenMatch?.[1],
          });
        } else {
          setError({
            variant: "rejected",
            title: "Tarjeta no aceptada",
            message: "No se pudo registrar esta tarjeta. Verifica los datos o intenta con otra.",
          });
        }
        return;
      }

      if (!response.card) {
        setError({
          variant: "system",
          title: "Respuesta inesperada",
          message: "No se recibió respuesta del procesador. Intenta de nuevo.",
        });
        return;
      }

      if (
        response.card.status === "valid" ||
        response.card.status === "review"
      ) {
        if (response.card.token) {
          setError(null);
          onTokenSuccess(response.card.token, {
            type: response.card.type,
            number: response.card.number,
            expiry_year: response.card.expiry_year,
            expiry_month: response.card.expiry_month,
          }, saveCardRef.current);
        } else {
          setError({
            variant: "system",
            title: "Token no recibido",
            message: "No se pudo registrar la tarjeta. Intenta de nuevo.",
          });
        }
      } else {
        // Show error inline only — don't propagate to parent to avoid duplicate messages
        setError(buildError(response.card.message || ""));
      }
    },
    [onTokenSuccess],
  );

  const notCompletedCallback = useCallback((message: string) => {
    setIsProcessing(false);
    setError({
      variant: "incomplete",
      title: "Datos incompletos",
      message: `Revisa los campos del formulario: ${message}`,
    });
  }, []);

  const handlePay = () => {
    if (!pgSdkRef.current) return;
    setError(null);
    setIsProcessing(true);
    pgSdkRef.current.tokenize();
  };

  const handleScriptReady = useCallback(() => {
    try {
      const PG = new Function("return PaymentGateway")();
      (window as any).PaymentGateway = PG;
      setSdkReady(true);
    } catch {
      setError({
        variant: "system",
        title: "Error de inicialización",
        message: "No se pudo inicializar el sistema de pagos. Recarga la página.",
      });
    }
  }, []);

  useEffect(() => {
    if (!sdkReady || sdkInitRef.current) return;
    sdkInitRef.current = true;

    const appCode = process.env.NEXT_PUBLIC_NUVEI_CLIENT_APP_CODE;
    const appKey = process.env.NEXT_PUBLIC_NUVEI_CLIENT_APP_KEY;

    if (!appCode || !appKey) {
      setError({
        variant: "system",
        title: "Configuración incompleta",
        message: "Credenciales de pago no configuradas. Contacta soporte.",
      });
      return;
    }

    const env = process.env.NEXT_PUBLIC_NUVEI_ENV === "prod" ? "prod" : "stg";
    const PGClass = (window as any).PaymentGateway;

    if (!PGClass) {
      setError({
        variant: "system",
        title: "SDK no disponible",
        message: "El sistema de pagos no cargó correctamente. Recarga la página.",
      });
      return;
    }

    const pgSdk: PaymentGatewayInstance = new PGClass(env, appCode, appKey);
    pgSdkRef.current = pgSdk;

    const tokenizeData: TokenizeData = {
      locale: "es",
      user: {
        id: uid,
        email: email,
      },
      configuration: {
        default_country: "ECU",
        icon_colour: "#a68a63",
        use_dropdowns: false,
        exclusive_types: ["vi", "mc", "ax", "di"],
        invalid_card_type_message:
          "Tipo de tarjeta no aceptada para esta operación.",
      },
    };

    pgSdk.generate_tokenize(
      tokenizeData,
      `#${CONTAINER_ID}`,
      responseCallback,
      notCompletedCallback,
    );
  }, [sdkReady, uid, email, responseCallback, notCompletedCallback]);

  return (
    <div className="space-y-4">
      <Script
        src={SDK_URL}
        strategy="afterInteractive"
        onReady={handleScriptReady}
      />

      {/* Terminal error state — hide form, show only error with clear actions */}
      {error && error.variant !== "incomplete" ? (
        <div
          className={`rounded-xl border p-5 text-sm ${
            error.variant === "duplicate"
              ? "bg-primary/5 border-primary/20"
              : "bg-error/5 border-error/20"
          }`}
        >
          <div className="flex gap-3">
            <div className="shrink-0 mt-0.5">
              {error.variant === "duplicate" ? (
                <FaInfoCircle className="w-4 h-4 text-primary" />
              ) : (
                <FaTimesCircle className="w-4 h-4 text-error" />
              )}
            </div>
            <div className="grow space-y-1">
              <p className="font-semibold text-text-main">{error.title}</p>
              <p className="text-text-main/60 leading-relaxed">
                {error.message}
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4 pt-3 border-t border-border-subtle">
            {error.variant === "duplicate" && error.duplicateToken ? (
              <button
                type="button"
                disabled={isDeletingDuplicate}
                onClick={async () => {
                  setIsDeletingDuplicate(true);
                  try {
                    const res = await fetch("/api/nuvei/cards", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ token: error.duplicateToken }),
                    });
                    const data = await res.json().catch(() => ({}));
                    console.log("[NuveiPaymentForm] Delete response:", res.status, JSON.stringify(data));
                    if (res.ok && !data.error) {
                      setError(null);
                      // Re-initialize SDK form so user can add again
                      sdkInitRef.current = false;
                      setSdkReady(false);
                      setTimeout(() => handleScriptReady(), 100);
                    } else {
                      setError({
                        variant: "rejected",
                        title: "No se pudo eliminar",
                        message: "El procesador de pagos no permitió eliminar esta tarjeta. Intenta con otra tarjeta o contacta a tu banco.",
                      });
                    }
                  } catch {
                    setError({
                      variant: "system",
                      title: "Error de conexión",
                      message: "No se pudo conectar al servidor. Intenta de nuevo.",
                    });
                  } finally {
                    setIsDeletingDuplicate(false);
                  }
                }}
                className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeletingDuplicate ? "Eliminando..." : "Eliminar y reintentar"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  // Clean DOM container and re-initialize SDK form
                  const container = document.getElementById(CONTAINER_ID);
                  if (container) container.innerHTML = "";
                  sdkInitRef.current = false;
                  setSdkReady(false);
                  setTimeout(() => handleScriptReady(), 100);
                }}
                className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <FaRedo className="w-3 h-3" />
                Intentar con otra tarjeta
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* SDK renders its iframe-based form inside this container */}
          <div
            id={CONTAINER_ID}
            className="bg-surface-elevated border border-border-subtle rounded-xl p-4 min-h-16"
          />

          {/* Inline validation errors (incomplete fields, system errors) */}
          {error && (
            <div
              className={`rounded-xl border p-4 text-sm ${
                error.variant === "incomplete"
                  ? "bg-warning/5 border-warning/20"
                  : "bg-surface-elevated border-border-subtle"
              }`}
            >
              <div className="flex gap-3">
                <FaExclamationTriangle
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    error.variant === "incomplete"
                      ? "text-warning"
                      : "text-text-main/40"
                  }`}
                />
                <div className="grow">
                  <p className="font-semibold text-text-main">{error.title}</p>
                  <p className="text-text-main/60 leading-relaxed">
                    {error.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {sdkReady && (
            <>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                  className="w-4 h-4 rounded border-border-default text-primary focus:ring-primary/30 cursor-pointer accent-primary"
                />
                <span className="text-sm text-text-main/60">
                  Guardar tarjeta para futuras compras
                </span>
              </label>
              <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing}
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:bg-surface-elevated disabled:text-text-main/30 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.97] cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="simple-spinner w-5! h-5! border-2! border-white! border-b-transparent!" />
                    Verificando...
                  </>
                ) : (
                  saveCard ? "Agregar Tarjeta" : "Continuar con pago"
                )}
              </button>
            </>
          )}
        </>
      )}

      {!sdkReady && (
        <div className="flex flex-col items-center py-4 gap-3">
          <div className="simple-spinner" />
          {sdkTimedOut && (
            <div className="text-center space-y-2">
              <p className="text-xs text-text-main/50">
                El sistema de pagos está tardando en cargar.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-xs font-semibold text-primary hover:text-primary-hover underline underline-offset-2 transition-colors"
              >
                Recargar página
              </button>
            </div>
          )}
        </div>
      )}

      {/* Trust indicator */}
      <div className="flex items-center justify-center gap-2 text-text-main/30 text-xs">
        <FaLock className="w-3 h-3" />
        <span>Pago 100% seguro · Tokenización PCI Compliant</span>
      </div>
    </div>
  );
};

export default NuveiPaymentForm;
