"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PromotionForm from "@/components/admin/PromotionForm";

export default function EditarPromocionPage() {
  const params = useParams();
  const promotionId = params.id as string;
  const [promotion, setPromotion] = useState<Record<string, unknown> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPromotion() {
      try {
        const res = await fetch(`/api/admin/promotions/${promotionId}`);
        if (!res.ok) throw new Error("Promocion no encontrada");
        const data = await res.json();

        // Convert Firestore timestamps to datetime-local format
        const formatTs = (ts: { _seconds: number }) =>
          new Date(ts._seconds * 1000).toISOString().slice(0, 16);

        setPromotion({
          name: data.name,
          description: data.description || "",
          code: data.code,
          type: data.type,
          value: data.value,
          maxDiscountAmount: data.maxDiscountAmount,
          showAsBanner: data.showAsBanner,
          minPurchaseAmount: data.rules?.minPurchaseAmount ?? null,
          maxTotalUses: data.rules?.maxTotalUses ?? null,
          maxUsesPerUser: data.rules?.maxUsesPerUser ?? null,
          validFrom: data.rules?.validFrom ? formatTs(data.rules.validFrom) : "",
          validUntil: data.rules?.validUntil ? formatTs(data.rules.validUntil) : "",
          applicableCategories: data.rules?.applicableCategories || [],
          _currentUses: data.currentUses,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    }
    fetchPromotion();
  }, [promotionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="simple-spinner" />
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div className="text-center py-20">
        <p className="text-error">{error || "Promocion no encontrada"}</p>
      </div>
    );
  }

  const { _currentUses, ...formData } = promotion;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-text-main mb-6">
        Editar Promocion
      </h1>
      <PromotionForm
        promotionId={promotionId}
        initialData={formData as Record<string, unknown>}
        currentUses={_currentUses as number}
      />
    </div>
  );
}
