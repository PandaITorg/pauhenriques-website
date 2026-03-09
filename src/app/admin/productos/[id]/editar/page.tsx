"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";

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
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-text-main mb-6">
        Editar Producto
      </h1>
      <ProductForm
        productId={productId}
        initialData={product as Record<string, unknown>}
      />
    </div>
  );
}
