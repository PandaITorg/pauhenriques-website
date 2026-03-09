"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Product,
  isInfrrarrojoProduct,
  isCaricoProduct,
} from "@/types/product";
import { productService } from "@/services/firestore/productService";
import CaricoDetail from "@/components/tienda/CaricoDetail";
import InfrarrojoDetail from "@/components/tienda/InfrarrojoDetail";

interface ProductDetailClientProps {
  productId: string;
}

export default function ProductDetailClient({
  productId,
}: ProductDetailClientProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const p = await productService.getProductById(productId);
      setProduct(p);

      if (p?.parentCategory) {
        const categoryProducts = await productService.getProductsByCategory(
          p.parentCategory,
        );
        setRelated(
          categoryProducts.filter((r) => r.id !== p.id).slice(0, 4),
        );
      }
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="simple-spinner" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center">
        <h1 className="font-cormorant text-2xl font-semibold text-text-main mb-3">
          Producto no encontrado
        </h1>
        <Link
          href="/tienda"
          className="text-primary hover:text-primary-hover font-medium underline underline-offset-2 transition-colors"
        >
          Volver a la tienda
        </Link>
      </div>
    );
  }

  if (isCaricoProduct(product)) {
    return <CaricoDetail product={product} related={related} />;
  }

  if (isInfrrarrojoProduct(product)) {
    return <InfrarrojoDetail product={product} related={related} />;
  }

  return null;
}
