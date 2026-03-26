"use client";

import Image from "next/image";
import Link from "next/link";
import { Product, isInfrrarrojoProduct } from "@/types/product";
import ProductPlaceholder from "@/components/ui/ProductPlaceholder";
import { useCartStore } from "@/stores/cart.store";
import { useState } from "react";
import { FaEye, FaShoppingCart, FaCheck } from "react-icons/fa";

interface CompraCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

const CompraCard = ({ product, onQuickView }: CompraCardProps) => {
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const hasImage = product.images && product.images.length > 0;
  const firstImage = hasImage ? product.images[0].replace(/"/g, "").trim() : "";

  const infraProduct = isInfrrarrojoProduct(product) ? product : null;
  const inStock = infraProduct ? infraProduct.stock > 0 : false;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (infraProduct && inStock) {
      addItem(infraProduct);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView(product);
  };

  return (
    <Link
      href={`/tienda/${product.id}`}
      className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden flex flex-col group hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative w-full aspect-square overflow-hidden">
        {hasImage ? (
          <Image
            src={firstImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <ProductPlaceholder className="w-full h-full" />
        )}

        {/* Quick view button — bottom-right, desktop only */}
        <button
          onClick={handleQuickView}
          className="hidden md:flex absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm text-text-inverted text-xs font-medium px-3 py-1.5 rounded-full items-center gap-1.5 hover:bg-white cursor-pointer"
        >
          <FaEye className="w-3 h-3" /> Vista rápida
        </button>

        {/* Stock badge */}
        <span
          className={`absolute top-2.5 left-2.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            inStock
              ? "bg-success/90 text-white"
              : "bg-error/90 text-white"
          }`}
        >
          {inStock ? "Disponible" : "Agotado"}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col grow">
        <span className="text-[11px] font-semibold text-text-main/45 uppercase tracking-wider mb-1">
          {product.brand}
        </span>
        <h3 className="font-semibold text-sm text-text-main line-clamp-2 mb-1">
          {product.name}
        </h3>
        <p className="text-xs text-text-main/45 mb-3 line-clamp-2 grow">
          {product.description}
        </p>

        {/* Price */}
        {infraProduct && (
          <p className="text-xl font-bold text-primary mb-3">
            ${infraProduct.price.toFixed(2)}
          </p>
        )}

        {/* CTA — Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={isAdded || !inStock}
          className={`mt-auto w-full font-semibold py-2.5 px-4 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.97] ${
            isAdded
              ? "bg-success text-white"
              : !inStock
                ? "bg-bosque-profundo-400 text-text-main/40 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-hover hover:shadow-[--shadow-glow-primary]"
          }`}
        >
          {isAdded ? (
            <>
              <FaCheck className="w-3.5 h-3.5" /> Agregado!
            </>
          ) : !inStock ? (
            "Agotado"
          ) : (
            <>
              <FaShoppingCart className="w-3.5 h-3.5" /> Agregar al carrito
            </>
          )}
        </button>
      </div>
    </Link>
  );
};

export default CompraCard;
