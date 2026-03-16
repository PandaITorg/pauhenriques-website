"use client";

import PromotionForm from "@/components/admin/PromotionForm";

export default function NuevaPromocionPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-text-main mb-6">
        Nueva Promocion
      </h1>
      <PromotionForm />
    </div>
  );
}
