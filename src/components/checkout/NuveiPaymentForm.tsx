"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Paymentez: any;
  }
}

interface NuveiPaymentFormProps {
  onTokenSuccess: (token: string) => void;
  onTokenError: (error: any) => void;
  disabled?: boolean;
}

const NuveiPaymentForm: React.FC<NuveiPaymentFormProps> = ({
  onTokenSuccess,
  onTokenError,
  disabled = false,
}) => {
  const [paymentez, setPaymentez] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formCreatedRef = useRef(false);

  useEffect(() => {
    if (document.getElementById("paymentez-sdk")) return;

    const script = document.createElement("script");
    script.id = "paymentez-sdk";
    script.src =
      "https://cdn.paymentez.com/ccapi/sdk/staging/v2/paymentez.min.js";
    script.async = true;

    script.onload = () => {
      const pz = new window.Paymentez({
        client_app_code: process.env.NEXT_PUBLIC_NUVEI_CLIENT_APP_CODE,
        client_app_key: process.env.NEXT_PUBLIC_NUVEI_CLIENT_APP_KEY,
        test_mode: true,
      });
      setPaymentez(pz);
    };

    script.onerror = () => {
      setError("No se pudo cargar el sistema de pagos. Recarga la pagina.");
    };

    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!paymentez || formCreatedRef.current) return;

    formCreatedRef.current = true;
    paymentez.createCardForm({
      card_holder_name_div: "card-holder-name-container",
      card_number_div: "card-number-container",
      card_expiry_div: "card-expiry-container",
      card_cvc_div: "card-cvc-container",
      style: {
        base: {
          color: "#333",
          "font-family": '"Helvetica Neue", Helvetica, sans-serif',
          "font-smoothing": "antialiased",
          "font-size": "16px",
          "::placeholder": { color: "#aaa" },
        },
        invalid: { color: "#fa755a", iconColor: "#fa755a" },
      },
    });
  }, [paymentez]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentez || isLoading || disabled) return;

    setIsLoading(true);
    setError(null);

    paymentez.getToken(
      document.getElementById("add-card-form"),
      (response: any) => {
        setIsLoading(false);
        if (response.token) {
          onTokenSuccess(response.token);
        } else {
          const errMsg = response.error?.description || "Error al procesar la tarjeta";
          setError(errMsg);
          onTokenError(response.error);
        }
      },
      (err: any) => {
        setIsLoading(false);
        const errMsg = err?.description || "Error de conexion con el procesador de pagos";
        setError(errMsg);
        onTokenError(err);
      },
    );
  };

  return (
    <form id="add-card-form" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del Tarjetahabiente
        </label>
        <div
          id="card-holder-name-container"
          className="p-3 border border-gray-300 rounded-lg shadow-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Numero de Tarjeta
        </label>
        <div
          id="card-number-container"
          className="p-3 border border-gray-300 rounded-lg shadow-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Expiracion
          </label>
          <div
            id="card-expiry-container"
            className="p-3 border border-gray-300 rounded-lg shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CVC
          </label>
          <div
            id="card-cvc-container"
            className="p-3 border border-gray-300 rounded-lg shadow-sm"
          />
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
      )}

      <button
        type="submit"
        disabled={isLoading || disabled || !paymentez}
        className="w-full bg-background hover:bg-bosque-profundo-400 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? "Procesando..." : "Pagar"}
      </button>
    </form>
  );
};

export default NuveiPaymentForm;
