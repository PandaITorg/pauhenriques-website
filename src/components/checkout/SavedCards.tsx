"use client";

import { useEffect, useState } from "react";
import { SavedCard, getCardBrandName } from "@/types/card";
import { FaCheck, FaCreditCard, FaPlus, FaTrash } from "react-icons/fa";

interface SavedCardsProps {
  onSelectCard: (card: SavedCard) => void;
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

  useEffect(() => {
    loadCards();
  }, []);

  async function loadCards() {
    setLoading(true);
    try {
      const res = await fetch("/api/nuvei/cards");
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards || []);
        if (!selectedToken && data.cards?.length > 0) {
          onSelectCard(data.cards[0]);
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
        if (selectedToken === token) {
          const remaining = cards.filter((c) => c.token !== token);
          if (remaining.length > 0) {
            onSelectCard(remaining[0]);
          }
        }
      }
    } catch (err) {
      console.error("Error deleting card:", err);
    } finally {
      setDeleting(null);
    }
  }

  function getCardColor(type: string) {
    const colors: Record<string, string> = {
      vi: "text-blue-400",
      mc: "text-orange-400",
      ax: "text-green-400",
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

  return (
    <div className="space-y-4">
      {cards.length > 0 && (
        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.token}
              onClick={() => onSelectCard(card)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedToken === card.token
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border-default hover:border-border-strong"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaCreditCard className={`w-5 h-5 ${getCardColor(card.type)}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-text-main">
                        {getCardBrandName(card.type)}{" "}
                        <span className="font-mono">****{card.number}</span>
                      </span>
                      {selectedToken === card.token && (
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
                  className="text-text-main/30 hover:text-error p-1 disabled:opacity-50 transition-colors"
                  title="Eliminar tarjeta"
                >
                  <FaTrash className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onAddNewCard}
        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border-default rounded-lg text-sm text-text-main/50 hover:border-primary hover:text-primary transition-colors"
      >
        <FaPlus className="w-3 h-3" />
        {cards.length > 0 ? "Usar otra tarjeta" : "Agregar tarjeta"}
      </button>
    </div>
  );
}
