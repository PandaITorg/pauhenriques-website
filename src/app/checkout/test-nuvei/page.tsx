"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { SavedCard, getCardBrandName } from "@/types/card";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
  FaFlask,
  FaPlay,
  FaCreditCard,
  FaLock,
  FaCheck,
  FaPlus,
} from "react-icons/fa";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface PaymentGatewayInstance {
  generate_tokenize: (
    data: any,
    containerSelector: string,
    responseCallback: (response: any) => void,
    notCompletedCallback: (message: string) => void,
  ) => void;
  tokenize: () => void;
}

type PageState = "form" | "charging" | "success" | "failed";
type PayMode = "saved" | "new";

const SDK_URL =
  "https://cdn.paymentez.com/ccapi/sdk/payment_sdk_stable.min.js";
const CONTAINER_ID = "nuvei-test-container";

const SIMULATED_RESPONSES = {
  success: {
    transaction: {
      id: "DF-12345",
      status: "success",
      status_detail: 3,
      message: "Transacción aprobada",
      authorization_code: "AUTH-789456",
      carrier_code: "00",
    },
  },
  rejected: {
    transaction: {
      id: "DF-67890",
      status: "failure",
      status_detail: 9,
      message: "Fondos insuficientes",
      authorization_code: null,
      carrier_code: "51",
    },
  },
  bank_error: {
    transaction: {
      id: "DF-11111",
      status: "failure",
      status_detail: 12,
      message: "Tarjeta no habilitada para compras en línea",
      authorization_code: null,
      carrier_code: "57",
    },
  },
  timeout: {
    error: {
      type: "timeout",
      description: "Error de conexión con el procesador de pagos",
    },
  },
};

export default function TestNuveiPage() {
  const { user } = useAuth();
  const [pageState, setPageState] = useState<PageState>("form");
  const [payMode, setPayMode] = useState<PayMode>("saved");
  const [resultMessage, setResultMessage] = useState("");
  const [resultDetail, setResultDetail] = useState<object | null>(null);

  // Saved cards state
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [cardsLoading, setCardsLoading] = useState(true);

  // SDK state (for new card form)
  const [sdkReady, setSdkReady] = useState(false);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const sdkInitRef = useRef(false);
  const pgSdkRef = useRef<PaymentGatewayInstance | null>(null);

  // Simulator state
  const [simProcessing, setSimProcessing] = useState(false);

  // Load saved cards
  useEffect(() => {
    if (!user) return;
    loadCards();
  }, [user]);

  async function loadCards() {
    setCardsLoading(true);
    try {
      const res = await fetch("/api/nuvei/cards");
      if (res.ok) {
        const data = await res.json();
        const cards = data.cards || [];
        setSavedCards(cards);
        if (cards.length > 0) {
          setSelectedToken(cards[0].token);
          setPayMode("saved");
        } else {
          setPayMode("new");
        }
      }
    } catch (err) {
      console.error("Error loading cards:", err);
    } finally {
      setCardsLoading(false);
    }
  }

  // Charge with a token (saved or newly tokenized)
  const chargeWithToken = useCallback(
    async (token: string) => {
      if (!user) return;

      setPageState("charging");
      const devReference = `TEST-${Date.now()}`;

      try {
        const res = await fetch("/api/nuvei/test-charge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            amount: 1.15,
            vat: 0.15,
            description: `Prueba Nuvei - ${devReference}`,
            devReference,
          }),
        });

        const data = await res.json();
        console.log("Charge response:", data);

        if (data.success) {
          setResultMessage("Transacción aprobada");
          setResultDetail(data);
          setPageState("success");
        } else {
          setResultMessage(data.error || "Transacción rechazada");
          setResultDetail(data.detail || data);
          setPageState("failed");
        }
      } catch (err) {
        console.error("Charge error:", err);
        setResultMessage("Error de conexión al procesar el cobro.");
        setResultDetail({ error: String(err) });
        setPageState("failed");
      }
    },
    [user],
  );

  // Pay with saved card
  function handlePayWithSaved() {
    if (!selectedToken) return;
    chargeWithToken(selectedToken);
  }

  // --- New card tokenization ---
  const handleScriptReady = useCallback(() => {
    try {
      const PG = new Function("return PaymentGateway")();
      (window as any).PaymentGateway = PG;
      setSdkReady(true);
    } catch {
      setFormError(
        "No se pudo inicializar el SDK de pagos. Recarga la página.",
      );
    }
  }, []);

  const responseCallback = useCallback(
    (response: any) => {
      setIsTokenizing(false);
      console.log("Tokenize response:", response);

      if (response.error) {
        setFormError(
          response.error.type || "Error al comunicarse con el procesador.",
        );
        return;
      }

      if (!response.card) {
        setFormError("No se recibió respuesta del procesador.");
        return;
      }

      if (
        response.card.status === "valid" ||
        response.card.status === "review"
      ) {
        if (response.card.token) {
          setFormError(null);
          chargeWithToken(response.card.token);
        } else {
          setFormError("No se pudo registrar la tarjeta. Intenta de nuevo.");
        }
      } else {
        const msg: string = response.card.message || "";
        setResultMessage(msg || "Tarjeta rechazada por el procesador");
        setResultDetail(response.card);
        setPageState("failed");
      }
    },
    [chargeWithToken],
  );

  const notCompletedCallback = useCallback((message: string) => {
    setIsTokenizing(false);
    setFormError(`Revisa los campos del formulario: ${message}`);
  }, []);

  // Init SDK when switching to "new" mode
  useEffect(() => {
    if (payMode !== "new" || !sdkReady || sdkInitRef.current || !user) return;
    sdkInitRef.current = true;

    const appCode = process.env.NEXT_PUBLIC_NUVEI_CLIENT_APP_CODE;
    const appKey = process.env.NEXT_PUBLIC_NUVEI_CLIENT_APP_KEY;

    if (!appCode || !appKey) {
      setFormError("Credenciales Nuvei no configuradas en .env.local");
      return;
    }

    const env = process.env.NODE_ENV === "production" ? "prod" : "stg";
    const PGClass = (window as any).PaymentGateway;

    if (!PGClass) {
      setFormError("SDK no disponible después de cargar.");
      return;
    }

    const pgSdk: PaymentGatewayInstance = new PGClass(env, appCode, appKey);
    pgSdkRef.current = pgSdk;

    pgSdk.generate_tokenize(
      {
        locale: "es",
        user: { id: user.uid, email: user.email || "test@test.com" },
        configuration: {
          default_country: "ECU",
          icon_colour: "#a68a63",
          use_dropdowns: false,
          exclusive_types: ["vi", "mc", "ax"],
          invalid_card_type_message:
            "Tipo de tarjeta no aceptada para esta operación.",
        },
      },
      `#${CONTAINER_ID}`,
      responseCallback,
      notCompletedCallback,
    );
  }, [payMode, sdkReady, user, responseCallback, notCompletedCallback]);

  const handlePayNewCard = () => {
    if (!pgSdkRef.current) return;
    setFormError(null);
    setIsTokenizing(true);
    pgSdkRef.current.tokenize();
  };

  const resetToForm = () => {
    setPageState("form");
    setResultMessage("");
    setResultDetail(null);
    setFormError(null);
    setIsTokenizing(false);
  };

  // Simulator
  function simulateFlow(scenario: keyof typeof SIMULATED_RESPONSES) {
    setSimProcessing(true);
    const delay = scenario === "timeout" ? 4000 : 2000;

    setTimeout(() => {
      setSimProcessing(false);
      const response = SIMULATED_RESPONSES[scenario];
      if ("transaction" in response) {
        setResultMessage(response.transaction.message);
        setResultDetail(response.transaction);
        setPageState(
          response.transaction.status === "success" &&
            response.transaction.status_detail === 3
            ? "success"
            : "failed",
        );
      } else {
        setResultMessage(response.error.description);
        setResultDetail(response.error);
        setPageState("failed");
      }
    }, delay);
  }

  function getCardColor(type: string) {
    const colors: Record<string, string> = {
      vi: "text-blue-400",
      mc: "text-orange-400",
      ax: "text-green-400",
    };
    return colors[type] || "text-text-main/40";
  }

  // --- Full-screen states ---

  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
        <div className="animate-[scale-in_0.4s_ease-out]">
          <FaCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-5" />
        </div>
        <h1 className="font-cormorant text-2xl md:text-3xl font-semibold text-text-main mb-2">
          Pago aprobado
        </h1>
        <p className="text-text-main/50 text-sm mb-4">{resultMessage}</p>
        {resultDetail && (
          <div className="bg-surface-elevated border border-border-subtle rounded-lg p-4 text-left text-xs font-mono text-text-main/60 max-w-md w-full overflow-auto max-h-48 mb-6">
            <p className="text-text-main/30 text-[10px] uppercase tracking-wider mb-2 font-sans">
              Respuesta Nuvei
            </p>
            <pre>{JSON.stringify(resultDetail, null, 2)}</pre>
          </div>
        )}
        <button
          onClick={resetToForm}
          className="bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm"
        >
          Volver al menú de pruebas
        </button>
      </div>
    );
  }

  if (pageState === "failed") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
        <div className="animate-[scale-in_0.4s_ease-out]">
          <FaTimesCircle className="w-16 h-16 text-error mx-auto mb-5" />
        </div>
        <h1 className="font-cormorant text-2xl md:text-3xl font-semibold text-text-main mb-2">
          Pago no procesado
        </h1>
        <p className="text-text-main/50 text-sm mb-4">{resultMessage}</p>
        {resultDetail && (
          <div className="bg-surface-elevated border border-border-subtle rounded-lg p-4 text-left text-xs font-mono text-text-main/60 max-w-md w-full overflow-auto max-h-48 mb-6">
            <p className="text-text-main/30 text-[10px] uppercase tracking-wider mb-2 font-sans">
              Respuesta Nuvei
            </p>
            <pre>{JSON.stringify(resultDetail, null, 2)}</pre>
          </div>
        )}
        <button
          onClick={resetToForm}
          className="bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm"
        >
          Volver al menú de pruebas
        </button>
      </div>
    );
  }

  if (pageState === "charging" || simProcessing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-5">
        <div className="simple-spinner w-10! h-10! border-3! mb-5" />
        <h2 className="font-cormorant text-xl font-semibold text-text-main mb-2">
          Procesando tu pago
        </h2>
        <p className="text-text-main/50 text-sm max-w-xs">
          No cierres esta página. Estamos verificando tu transacción con el
          banco...
        </p>
      </div>
    );
  }

  // --- Main form ---

  return (
    <div className="min-h-screen bg-background py-6 md:py-10 px-4 sm:px-6">
      <Script
        src={SDK_URL}
        strategy="afterInteractive"
        onReady={handleScriptReady}
      />

      <div className="container mx-auto max-w-lg">
        <Link
          href="/checkout"
          className="inline-flex items-center gap-2 text-sm text-text-main/50 hover:text-text-main mb-6 transition-colors"
        >
          <FaArrowLeft className="w-3 h-3" />
          Volver al checkout
        </Link>

        {/* Real card payment section */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-1">
            <FaCreditCard className="w-3.5 h-3.5" />
            Prueba de pago real
          </div>
          <p className="text-text-main/50 text-xs leading-relaxed mb-4">
            Cobra $1.00 + IVA contra Nuvei staging. Usa una tarjeta guardada o
            ingresa una nueva.
          </p>

          <div className="bg-surface-elevated border border-border-subtle rounded-lg p-3 mb-4">
            <p className="text-text-main/40 text-[10px] uppercase tracking-wider mb-1.5 font-semibold">
              Tarjetas de prueba
            </p>
            <div className="space-y-1 text-xs text-text-main/60">
              <p>
                <span className="text-green-500 font-semibold">Aprobada:</span>{" "}
                <span className="font-mono">4111 1111 1111 1111</span>
              </p>
              <p>
                <span className="text-error font-semibold">Rechazada:</span>{" "}
                <span className="font-mono">4242 4242 4242 4242</span>
              </p>
              <p className="text-text-main/40">Exp: 01/28 · CVV: 634</p>
            </div>
          </div>

          {!user && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-sm text-warning mb-4">
              Debes{" "}
              <Link
                href="/sign-in?redirect=/checkout/test-nuvei"
                className="font-bold underline"
              >
                iniciar sesión
              </Link>{" "}
              para probar el pago.
            </div>
          )}

          {formError && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-sm text-error mb-4">
              {formError}
            </div>
          )}

          {user && (
            <>
              {/* Mode tabs */}
              <div className="flex gap-1 bg-surface-elevated rounded-lg p-1 mb-4">
                <button
                  onClick={() => setPayMode("saved")}
                  className={`flex-1 text-xs font-semibold py-2 rounded-md transition-all ${
                    payMode === "saved"
                      ? "bg-primary text-white"
                      : "text-text-main/50 hover:text-text-main"
                  }`}
                >
                  Tarjetas guardadas
                </button>
                <button
                  onClick={() => setPayMode("new")}
                  className={`flex-1 text-xs font-semibold py-2 rounded-md transition-all ${
                    payMode === "new"
                      ? "bg-primary text-white"
                      : "text-text-main/50 hover:text-text-main"
                  }`}
                >
                  Nueva tarjeta
                </button>
              </div>

              {/* Saved cards mode */}
              {payMode === "saved" && (
                <div className="space-y-3 mb-4">
                  {cardsLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="simple-spinner" />
                    </div>
                  ) : savedCards.length > 0 ? (
                    <>
                      {savedCards.map((card) => (
                        <div
                          key={card.token}
                          onClick={() => setSelectedToken(card.token)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedToken === card.token
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border-default hover:border-border-strong"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <FaCreditCard
                              className={`w-4 h-4 ${getCardColor(card.type)}`}
                            />
                            <div className="grow">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-text-main">
                                  {getCardBrandName(card.type)}{" "}
                                  <span className="font-mono">
                                    ****{card.number}
                                  </span>
                                </span>
                                {selectedToken === card.token && (
                                  <FaCheck className="w-3 h-3 text-primary" />
                                )}
                              </div>
                              <p className="text-xs text-text-main/45">
                                {card.holder_name} · Exp {card.expiry_month}/
                                {card.expiry_year}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={handlePayWithSaved}
                        disabled={!selectedToken}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:bg-surface-elevated disabled:text-text-main/30 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.97]"
                      >
                        <FaLock className="w-3.5 h-3.5" />
                        Pagar $1.15 con tarjeta guardada
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-text-main/50 mb-3">
                        No tienes tarjetas guardadas.
                      </p>
                      <button
                        onClick={() => setPayMode("new")}
                        className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:text-primary-hover transition-colors"
                      >
                        <FaPlus className="w-3 h-3" />
                        Agregar una tarjeta
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* New card mode */}
              {payMode === "new" && (
                <div className="space-y-4 mb-4">
                  <div
                    id={CONTAINER_ID}
                    className="bg-surface-elevated border border-border-subtle rounded-xl p-4 min-h-16"
                  />

                  {sdkReady ? (
                    <button
                      type="button"
                      onClick={handlePayNewCard}
                      disabled={isTokenizing}
                      className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:bg-surface-elevated disabled:text-text-main/30 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.97]"
                    >
                      {isTokenizing ? (
                        <>
                          <div className="simple-spinner w-5! h-5! border-2! border-white! border-b-transparent!" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <FaLock className="w-3.5 h-3.5" />
                          Pagar $1.15 con nueva tarjeta
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex justify-center py-4">
                      <div className="simple-spinner" />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-center gap-2 text-text-main/30 text-xs">
            <FaLock className="w-3 h-3" />
            <span>Nuvei Staging · No se cobran fondos reales</span>
          </div>
        </div>

        {/* Simulator section */}
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-warning text-sm font-semibold mb-1">
            <FaFlask className="w-3.5 h-3.5" />
            Simulador de pantallas
          </div>
          <p className="text-text-main/50 text-xs leading-relaxed">
            Prueba las pantallas de procesamiento, aprobación y rechazo sin
            llamadas a Nuvei.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-main">
            Escenarios simulados
          </h2>

          <button
            onClick={() => simulateFlow("success")}
            className="w-full bg-surface-card border border-border-subtle hover:border-green-500/30 rounded-xl p-4 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <p className="font-semibold text-sm text-text-main">
                    Pago aprobado
                  </p>
                </div>
                <p className="text-xs text-text-main/50">
                  status: success · status_detail: 3
                </p>
              </div>
              <FaPlay className="w-3 h-3 text-text-main/20 group-hover:text-green-500 transition-colors" />
            </div>
          </button>

          <button
            onClick={() => simulateFlow("rejected")}
            className="w-full bg-surface-card border border-border-subtle hover:border-error/30 rounded-xl p-4 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-error" />
                  <p className="font-semibold text-sm text-text-main">
                    Fondos insuficientes
                  </p>
                </div>
                <p className="text-xs text-text-main/50">
                  status: failure · status_detail: 9
                </p>
              </div>
              <FaPlay className="w-3 h-3 text-text-main/20 group-hover:text-error transition-colors" />
            </div>
          </button>

          <button
            onClick={() => simulateFlow("bank_error")}
            className="w-full bg-surface-card border border-border-subtle hover:border-error/30 rounded-xl p-4 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-error" />
                  <p className="font-semibold text-sm text-text-main">
                    Tarjeta no habilitada
                  </p>
                </div>
                <p className="text-xs text-text-main/50">
                  status: failure · status_detail: 12
                </p>
              </div>
              <FaPlay className="w-3 h-3 text-text-main/20 group-hover:text-error transition-colors" />
            </div>
          </button>

          <button
            onClick={() => simulateFlow("timeout")}
            className="w-full bg-surface-card border border-border-subtle hover:border-warning/30 rounded-xl p-4 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  <p className="font-semibold text-sm text-text-main">
                    Timeout / Error de conexión
                  </p>
                </div>
                <p className="text-xs text-text-main/50">
                  Simula 4s de espera + error de red
                </p>
              </div>
              <FaPlay className="w-3 h-3 text-text-main/20 group-hover:text-warning transition-colors" />
            </div>
          </button>
        </div>

        <p className="text-text-main/25 text-xs text-center mt-8">
          Página de pruebas · Solo visible en desarrollo
        </p>
      </div>
    </div>
  );
}
