"use client";

import { useEffect, useState } from "react";
import { SavedCard, getCardBrandName } from "@/types/card";
import {
  FaCheck,
  FaCreditCard,
  FaLock,
  FaPlus,
  FaTrash,
  FaExclamationTriangle,
  FaShieldAlt,
} from "react-icons/fa";

interface SavedCardsProps {
  onSelectCard: (card: SavedCard, cvc: string) => void;
  selectedToken: string | null;
  onAddNewCard: () => void;
}

export default function SavedCards({
  onSelectCard,
  selectedToken,
  onAddNewCard,
}: SavedCardsProps) {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [cvcValues, setCvcValues] = useState<Record<string, string>>({});
  const [verifyingToken, setVerifyingToken] = useState<string | null>(null);
  const [verifyValue, setVerifyValue] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySubmitting, setVerifySubmitting] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  async function loadCards() {
    setLoading(true);
    try {
      const res = await fetch("/api/nuvei/cards");
      if (res.ok) {
        const data = await res.json();
        const allCards: SavedCard[] = data.cards || [];
        setCards(allCards);
        // Auto-select first valid card only
        if (!selectedToken) {
          const firstValid = allCards.find((c) => c.status === "valid");
          if (firstValid) onSelectCard(firstValid, "");
        }
      }
    } catch (err) {
      console.error("Error loading cards:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(token: string) {
    setDeleting(token);
    try {
      const res = await fetch("/api/nuvei/cards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setCards((prev) => prev.filter((c) => c.token !== token));
        if (verifyingToken === token) {
          setVerifyingToken(null);
          setVerifyValue("");
          setVerifyError(null);
        }
        if (selectedToken === token) {
          const remaining = cards.filter(
            (c) => c.token !== token && c.status === "valid",
          );
          if (remaining.length > 0) {
            onSelectCard(remaining[0], "");
          }
        }
      }
    } catch (err) {
      console.error("Error deleting card:", err);
    } finally {
      setDeleting(null);
    }
  }

  async function handleVerify(card: SavedCard) {
    if (!verifyValue.trim()) return;
    setVerifySubmitting(true);
    setVerifyError(null);

    try {
      const res = await fetch("/api/nuvei/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardToken: card.token,
          transactionReference: card.transaction_reference,
          value: verifyValue.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Card verified — update status locally and select it
        setCards((prev) =>
          prev.map((c) =>
            c.token === card.token ? { ...c, status: "valid" as const } : c,
          ),
        );
        setVerifyingToken(null);
        setVerifyValue("");
        onSelectCard({ ...card, status: "valid" }, "");
      } else {
        setVerifyError(
          data.error || "Monto incorrecto. Revisa tu estado de cuenta.",
        );
      }
    } catch {
      setVerifyError("Error de conexión. Intenta de nuevo.");
    } finally {
      setVerifySubmitting(false);
    }
  }

  function getCardColor(type: string) {
    const colors: Record<string, string> = {
      vi: "text-info",
      mc: "text-warning",
      ax: "text-success",
      di: "text-info/70",
    };
    return colors[type] || "text-text-main/40";
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="simple-spinner" />
      </div>
    );
  }

  const validCards = cards.filter((c) => c.status === "valid");
  const reviewCards = cards.filter(
    (c) => c.status === "review" || c.status === "pending",
  );

  return (
    <div className="space-y-4">
      {/* Valid cards */}
      {validCards.length > 0 && (
        <div className="space-y-3">
          {validCards.map((card) => {
            const isSelected = selectedToken === card.token;
            const cvc = cvcValues[card.token] || "";
            const maxCvc = card.type === "ax" ? 4 : 3;

            return (
              <div
                key={card.token}
                onClick={() => {
                  onSelectCard(card, cvc);
                  if (!isSelected) {
                    setCvcValues((prev) => ({ ...prev, [card.token]: "" }));
                  }
                }}
                className={`border rounded-lg cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border-default hover:border-border-strong"
                }`}
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaCreditCard
                      className={`w-5 h-5 ${getCardColor(card.type)}`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-text-main">
                          {getCardBrandName(card.type)}{" "}
                          <span className="font-mono">****{card.number}</span>
                        </span>
                        {isSelected && (
                          <FaCheck className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-text-main/45">
                        {card.holder_name} · Exp {card.expiry_month}/
                        {card.expiry_year}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(card.token);
                    }}
                    disabled={deleting === card.token}
                    className="text-text-main/30 hover:text-error p-1 disabled:opacity-50 transition-colors cursor-pointer"
                    title="Eliminar tarjeta"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>

                {/* CVC input — appears inline when card is selected */}
                {isSelected && (
                  <div className="px-4 pb-4 pt-0 border-t border-primary/15 animate-[fadeSlideDown_200ms_ease-out]">
                    <div className="flex items-center gap-3 pt-3">
                      <FaLock className="w-3 h-3 text-text-main/30 shrink-0" />
                      <label
                        htmlFor={`cvc-${card.token}`}
                        className="text-xs text-text-main/50 shrink-0"
                      >
                        Código de seguridad
                      </label>
                      <input
                        id={`cvc-${card.token}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={maxCvc}
                        autoComplete="cc-csc"
                        placeholder={maxCvc === 4 ? "····" : "···"}
                        value={cvc}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setCvcValues((prev) => ({
                            ...prev,
                            [card.token]: val,
                          }));
                          onSelectCard(card, val);
                        }}
                        autoFocus
                        className="w-16 text-center font-mono text-sm tracking-[0.25em] border border-border-default rounded-lg py-2 bg-background text-text-main placeholder:text-text-main/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review cards — need verification */}
      {reviewCards.length > 0 && (
        <div className="space-y-3">
          {reviewCards.map((card) => {
            const isExpanded = verifyingToken === card.token;
            return (
              <div
                key={card.token}
                className="border border-warning/30 bg-warning/5 rounded-lg overflow-hidden transition-all duration-200"
              >
                {/* Card header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <FaCreditCard
                        className={`w-5 h-5 ${getCardColor(card.type)}`}
                      />
                      <FaExclamationTriangle className="w-2.5 h-2.5 text-warning absolute -top-1 -right-1.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-text-main">
                          {getCardBrandName(card.type)}{" "}
                          <span className="font-mono">****{card.number}</span>
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-wider bg-warning/15 text-warning px-1.5 py-0.5 rounded">
                          Verificar
                        </span>
                      </div>
                      <p className="text-xs text-text-main/45">
                        {card.holder_name} · Exp {card.expiry_month}/
                        {card.expiry_year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isExpanded && (
                      <button
                        onClick={() => {
                          setVerifyingToken(card.token);
                          setVerifyValue("");
                          setVerifyError(null);
                        }}
                        className="text-xs font-medium text-primary hover:text-primary-hover underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        Verificar
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(card.token)}
                      disabled={deleting === card.token}
                      className="text-text-main/30 hover:text-error p-1 disabled:opacity-50 transition-colors cursor-pointer"
                      title="Eliminar tarjeta"
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Verification form — expanded inline */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-warning/20">
                    <div className="pt-3 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <FaShieldAlt className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-text-main/60 leading-relaxed">
                          Se realizó un micro-cobro a tu tarjeta. Revisa tu
                          estado de cuenta bancario e ingresa el monto exacto
                          para verificarla.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-main/40 text-sm">
                            $
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={verifyValue}
                            onChange={(e) => {
                              const val = e.target.value.replace(
                                /[^0-9.]/g,
                                "",
                              );
                              setVerifyValue(val);
                            }}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-2.5 text-sm border border-border-default rounded-lg bg-background text-text-main placeholder:text-text-main/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleVerify(card);
                            }}
                          />
                        </div>
                        <button
                          onClick={() => handleVerify(card)}
                          disabled={verifySubmitting || !verifyValue.trim()}
                          className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors disabled:bg-surface-elevated disabled:text-text-main/30 cursor-pointer"
                        >
                          {verifySubmitting ? (
                            <div className="simple-spinner w-4! h-4! border-2! border-white! border-b-transparent!" />
                          ) : (
                            "Verificar"
                          )}
                        </button>
                      </div>

                      {verifyError && (
                        <p className="text-xs text-error">{verifyError}</p>
                      )}

                      <button
                        onClick={() => {
                          setVerifyingToken(null);
                          setVerifyValue("");
                          setVerifyError(null);
                        }}
                        className="text-xs text-text-main/40 hover:text-text-main/60 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={onAddNewCard}
        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border-default rounded-lg text-sm text-text-main/50 hover:border-primary hover:text-primary transition-colors cursor-pointer"
      >
        <FaPlus className="w-3 h-3" />
        {cards.length > 0 ? "Usar otra tarjeta" : "Agregar tarjeta"}
      </button>
    </div>
  );
}
