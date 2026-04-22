"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import AutoDiscountsEditor from "@/components/admin/AutoDiscountsEditor";

export default function EditarProductoPage() {
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/admin/products/${productId}`);
        if (!res.ok) throw new Error("Producto no encontrado");
        setProduct(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="simple-spinner" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-20">
        <p className="text-error">{error || "Producto no encontrado"}</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/40 to-background" />
        <div className="relative px-5 lg:px-8 pt-6 pb-4 md:pt-8 md:pb-6">
          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-1">
            Productos
          </span>
          <h1 className="text-2xl font-semibold text-text-main">
            Editar Producto
          </h1>
        </div>
      </div>
      <div className="h-px bg-linear-to-r from-transparent via-border-default to-transparent" />

      <div className="px-5 lg:px-8 py-6 max-w-3xl space-y-6">
        <ProductForm
          productId={productId}
          initialData={product as Record<string, unknown>}
        />

        {typeof product.price === "number" && (
          <AutoDiscountsEditor
            productId={productId}
            basePriceSubtotal={product.price as number}
            initialDiscounts={
              Array.isArray(product.autoDiscounts)
                ? (product.autoDiscounts as Array<{
                    finalPrice: number;
                    label: string;
                    validUntil?: unknown;
                  }>)
                : []
            }
          />
        )}
      </div>
    </div>
  );
}
