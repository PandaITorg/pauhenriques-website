"use client";

import { useEffect, useRef, useState } from "react";

// Declara la variable global Paymentez para que TypeScript no se queje
declare global {
  interface Window {
    Paymentez: any;
  }
}

interface NuveiPaymentFormProps {
  onTokenSuccess: (token: string) => void;
  onTokenError: (error: any) => void;
}

const NuveiPaymentForm: React.FC<NuveiPaymentFormProps> = ({
  onTokenSuccess,
  onTokenError,
}) => {
  console.log("NuveiPaymentForm rendering");
  const [paymentez, setPaymentez] = useState<any>(null);
  const formCreatedRef = useRef(false);
  console.log("formCreatedRef.current:", formCreatedRef.current);

  // Efecto para cargar el SDK de Paymentez desde el CDN
  useEffect(() => {
    console.log("Loading Paymentez SDK effect triggered");
    if (document.getElementById("paymentez-sdk")) return;

    const script = document.createElement("script");
    script.id = "paymentez-sdk";
    script.src =
      "https://cdn.paymentez.com/ccapi/sdk/staging/v2/paymentez.min.js"; // Staging URL
    script.async = true;

    script.onload = () => {
      console.log("Paymentez SDK cargado.");
      const pz = new window.Paymentez({
        client_app_code: process.env.NEXT_PUBLIC_Nuvei_CLIENT_APP_CODE,
        client_app_key: process.env.NEXT_PUBLIC_Nuvei_CLIENT_APP_KEY,
        test_mode: true,
      });
      setPaymentez(pz);
    };

    script.onerror = () => {
      console.error("Error al cargar Paymentez SDK.");
    };

    document.body.appendChild(script);
  }, []);

  // Efecto para crear el formulario una vez que el SDK está listo
  useEffect(() => {
    console.log("Creating card form effect triggered");
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
    // La lógica de tokenización se agregará en el siguiente paso (5.5)
    console.log("Formulario enviado. Próximo paso: generar token.");
  };

  return (
    <form id="add-card-form" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del Tarjetahabiente
        </label>
        <div
          id="card-holder-name-container"
          className="p-3 border border-gray-300 rounded-md shadow-sm"
        ></div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número de Tarjeta
        </label>
        <div
          id="card-number-container"
          className="p-3 border border-gray-300 rounded-md shadow-sm"
        ></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Expiración
          </label>
          <div
            id="card-expiry-container"
            className="p-3 border border-gray-300 rounded-md shadow-sm"
          ></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CVC
          </label>
          <div
            id="card-cvc-container"
            className="p-3 border border-gray-300 rounded-md shadow-sm"
          ></div>
        </div>
      </div>
      <div id="payment-feedback" className="text-red-500 text-sm mt-2"></div>
      <button
        type="submit"
        className="w-full bg-[#343d2a] hover:bg-[#5a6b4a] text-white font-bold py-3 px-4 rounded-md transition-colors duration-300 disabled:bg-gray-400"
      >
        Pagar
      </button>
    </form>
  );
};

export default NuveiPaymentForm;
