"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";

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

      // Handle error responses (no card property)
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
        const msg =
          response.card.message || "Error al procesar la tarjeta.";
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
    // Sends a postMessage to the iframe telling it to validate & tokenize
    pgSdkRef.current.tokenize();
  };

  // When Next.js <Script> fires onReady, bridge the class to window
  const handleScriptReady = useCallback(() => {
    try {
      // class declarations are in global lexical scope, not on window.
      // Use Function() constructor which evaluates in global scope.
      const PG = new Function("return PaymentGateway")();
      (window as any).PaymentGateway = PG;
      setSdkReady(true);
    } catch {
      setError("No se pudo inicializar el sistema de pagos.");
    }
  }, []);

  // Initialize PaymentGateway + generate_tokenize once SDK is ready
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
      <div id={CONTAINER_ID} />

      {error && (
        <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </p>
      )}

      {sdkReady && (
        <button
          type="button"
          onClick={handlePay}
          disabled={isProcessing}
          className="w-full bg-background hover:bg-bosque-profundo-400 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Procesando..." : "Pagar"}
        </button>
      )}

      {!sdkReady && (
        <div className="flex justify-center py-4">
          <div className="simple-spinner" />
        </div>
      )}
    </div>
  );
};

export default NuveiPaymentForm;
