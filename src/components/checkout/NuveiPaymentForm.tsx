"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { FaLock } from "react-icons/fa";

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

interface NuveiPaymentFormProps {
  uid: string;
  email: string;
  onTokenSuccess: (token: string) => void;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sdkInitRef = useRef(false);
  const pgSdkRef = useRef<PaymentGatewayInstance | null>(null);

  const responseCallback = useCallback(
    (response: any) => {
      setIsProcessing(false);
      console.log(
        "Nuvei tokenize response:",
        JSON.stringify(response, null, 2),
      );

      if (response.error) {
        const msg =
          response.error.type || "Error al procesar la tarjeta.";
        setError(msg);
        onTokenError(msg);
        return;
      }

      if (!response.card) {
        setError("Respuesta inesperada del procesador de pagos.");
        onTokenError("Unexpected response");
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
          const msg = "No se recibió token de la tarjeta.";
          setError(msg);
          onTokenError(msg);
        }
      } else {
        const rawMsg = response.card.message || "";
        const friendlyMessages: Record<string, string> = {
          "Response by mock": "Tarjeta rechazada. Verifica los datos o usa otra tarjeta.",
          "Card already added": "Esta tarjeta ya está registrada. Puedes seleccionarla de tus tarjetas guardadas.",
          "Card rejected": "Tarjeta rechazada por el banco emisor.",
        };
        const msg = friendlyMessages[rawMsg] || rawMsg || "Error al procesar la tarjeta.";
        setError(msg);
        onTokenError(msg);
      }
    },
    [onTokenSuccess, onTokenError],
  );

  const notCompletedCallback = useCallback((message: string) => {
    setIsProcessing(false);
    setError(`Completa todos los campos: ${message}`);
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
      setError("No se pudo inicializar el sistema de pagos.");
    }
  }, []);

  useEffect(() => {
    if (!sdkReady || sdkInitRef.current) return;
    sdkInitRef.current = true;

    const appCode = process.env.NEXT_PUBLIC_NUVEI_CLIENT_APP_CODE;
    const appKey = process.env.NEXT_PUBLIC_NUVEI_CLIENT_APP_KEY;

    if (!appCode || !appKey) {
      setError("Credenciales de pago no configuradas.");
      return;
    }

    const env = process.env.NODE_ENV === "production" ? "prod" : "stg";
    const PGClass = (window as any).PaymentGateway;

    if (!PGClass) {
      setError("Error: SDK de pagos no disponible. Recarga la página.");
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
        <p className="text-error text-sm bg-error/10 p-3 rounded-lg">
          {error}
        </p>
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
