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
        // Auto-select first card if none selected
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

  function getCardIcon(type: string) {
    // Simple color coding by brand
    const colors: Record<string, string> = {
      vi: "text-blue-600",
      mc: "text-orange-500",
      ax: "text-green-600",
    };
    return (
      <FaCreditCard className={`w-5 h-5 ${colors[type] || "text-gray-500"}`} />
    );
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
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getCardIcon(card.type)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-text-inverted">
                        {getCardBrandName(card.type)} ****{card.number}
                      </span>
                      {selectedToken === card.token && (
                        <FaCheck className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
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
                  className="text-gray-400 hover:text-red-500 p-1 disabled:opacity-50"
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
        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors"
      >
        <FaPlus className="w-3 h-3" />
        {cards.length > 0 ? "Usar otra tarjeta" : "Agregar tarjeta"}
      </button>
    </div>
  );
}
