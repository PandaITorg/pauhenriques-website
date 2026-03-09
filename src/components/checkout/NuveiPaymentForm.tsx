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
}

interface NuveiPaymentFormProps {
  uid: string;
  email: string;
  onTokenSuccess: (token: string) => void;
  onTokenError: (error: string) => void;
  onGoToSavedCards?: () => void;
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
  onGoToSavedCards,
}) => {
  const [sdkReady, setSdkReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<CardError | null>(null);
  const sdkInitRef = useRef(false);
  const pgSdkRef = useRef<PaymentGatewayInstance | null>(null);

  function buildError(rawMsg: string): CardError {
    if (rawMsg === "Card already added" || rawMsg.includes("already")) {
      return {
        variant: "duplicate",
        title: "Tarjeta ya registrada",
        message:
          "Esta tarjeta ya está en tu cuenta. Selecciónala desde tus tarjetas guardadas.",
      };
    }
    if (
      rawMsg === "Card rejected" ||
      rawMsg === "Response by mock" ||
      rawMsg.toLowerCase().includes("reject")
    ) {
      return {
        variant: "rejected",
        title: "Tarjeta rechazada",
        message:
          "El banco emisor rechazó esta tarjeta. Verifica que los datos sean correctos o intenta con otra tarjeta.",
      };
    }
    return {
      variant: "system",
      title: "Error de procesamiento",
      message: rawMsg || "Ocurrió un error inesperado. Intenta de nuevo.",
    };
  }

  const responseCallback = useCallback(
    (response: any) => {
      setIsProcessing(false);

      if (response.error) {
        const err: CardError = {
          variant: "system",
          title: "Error del procesador",
          message:
            response.error.type || "Error al comunicarse con el procesador de pagos.",
        };
        setError(err);
        onTokenError(err.message);
        return;
      }

      if (!response.card) {
        const err: CardError = {
          variant: "system",
          title: "Respuesta inesperada",
          message: "No se recibió respuesta del procesador. Intenta de nuevo.",
        };
        setError(err);
        onTokenError(err.message);
        return;
      }

      if (
        response.card.status === "valid" ||
        response.card.status === "review"
      ) {
        if (response.card.token) {
          setError(null);
          onTokenSuccess(response.card.token);
        } else {
          const err: CardError = {
            variant: "system",
            title: "Token no recibido",
            message: "No se pudo registrar la tarjeta. Intenta de nuevo.",
          };
          setError(err);
          onTokenError(err.message);
        }
      } else {
        const err = buildError(response.card.message || "");
        setError(err);
        onTokenError(err.message);
      }
    },
    [onTokenSuccess, onTokenError],
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

    const env = process.env.NODE_ENV === "production" ? "prod" : "stg";
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
        exclusive_types: ["vi", "mc", "ax"],
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

      {/* SDK renders its iframe-based form inside this container */}
      <div
        id={CONTAINER_ID}
        className="bg-surface-elevated border border-border-subtle rounded-xl p-4 min-h-16"
      />

      {error && (
        <div
          className={`rounded-xl border p-4 text-sm transition-all duration-300 ${
            error.variant === "rejected"
              ? "bg-error/5 border-error/20"
              : error.variant === "duplicate"
                ? "bg-primary/5 border-primary/20"
                : error.variant === "incomplete"
                  ? "bg-warning/5 border-warning/20"
                  : "bg-surface-elevated border-border-subtle"
          }`}
        >
          <div className="flex gap-3">
            <div className="shrink-0 mt-0.5">
              {error.variant === "rejected" && (
                <FaTimesCircle className="w-4 h-4 text-error" />
              )}
              {error.variant === "duplicate" && (
                <FaInfoCircle className="w-4 h-4 text-primary" />
              )}
              {error.variant === "incomplete" && (
                <FaExclamationTriangle className="w-4 h-4 text-warning" />
              )}
              {error.variant === "system" && (
                <FaExclamationTriangle className="w-4 h-4 text-text-main/40" />
              )}
            </div>
            <div className="grow space-y-1">
              <p className="font-semibold text-text-main">{error.title}</p>
              <p className="text-text-main/60 leading-relaxed">
                {error.message}
              </p>
              <div className="flex gap-2 pt-2">
                {error.variant === "duplicate" && onGoToSavedCards && (
                  <button
                    type="button"
                    onClick={onGoToSavedCards}
                    className="text-xs font-semibold text-primary hover:text-primary-hover underline underline-offset-2 transition-colors"
                  >
                    Ver tarjetas guardadas
                  </button>
                )}
                {(error.variant === "rejected" || error.variant === "system") && (
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-main/50 hover:text-text-main transition-colors"
                  >
                    <FaRedo className="w-2.5 h-2.5" />
                    Intentar de nuevo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {sdkReady && (
        <button
          type="button"
          onClick={handlePay}
          disabled={isProcessing}
          className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:bg-surface-elevated disabled:text-text-main/30 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.97]"
        >
          {isProcessing ? (
            <>
              <div className="simple-spinner w-5! h-5! border-2! border-white! border-b-transparent!" />
              Verificando...
            </>
          ) : (
            "Agregar Tarjeta"
          )}
        </button>
      )}

      {!sdkReady && (
        <div className="flex justify-center py-4">
          <div className="simple-spinner" />
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
