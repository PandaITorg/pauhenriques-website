"use client";

import Image from "next/image";
import { Product, isWellMeProduct } from "@/types/product";
import ProductPlaceholder from "@/components/ui/ProductPlaceholder";
import PriceDisplay from "@/components/pricing/PriceDisplay";
import { useCartStore } from "@/stores/cart.store";
import { useState } from "react";
import { FaEye, FaShoppingCart, FaWhatsapp } from "react-icons/fa";

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

const ProductCard = ({ product, onQuickView }: ProductCardProps) => {
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const hasImage = product.images && product.images.length > 0;
  const firstImage = hasImage ? product.images[0].replace(/"/g, "").trim() : "";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWellMeProduct(product)) {
      addItem(product);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);
    }
  };

  const whatsappLink = isWellMeProduct(product)
    ? undefined
    : `https://api.whatsapp.com/send?phone=593991712532&text=${encodeURIComponent(
        `Hola Pau, quiero conocer más sobre "${product.name}".`,
      )}`;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col group">
      {/* Image */}
      <div
        className="relative w-full aspect-square cursor-pointer overflow-hidden"
        onClick={() => onQuickView(product)}
      >
        {hasImage ? (
          <Image
            src={firstImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <ProductPlaceholder className="w-full h-full" />
        )}

        {/* Quick view overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 text-text-inverted text-sm font-medium px-4 py-2 rounded-full flex items-center gap-2">
            <FaEye className="w-3.5 h-3.5" /> Vista rapida
          </span>
        </div>

        {/* Brand badge */}
        <span className="absolute top-2 left-2 bg-white/90 text-text-inverted text-xs font-semibold px-2.5 py-1 rounded-full">
          {product.brand}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col grow">
        <h3 className="font-bold text-sm sm:text-base text-text-inverted line-clamp-2 mb-1">
          {product.name}
        </h3>
        <p className="text-xs text-text-inverted/50 mb-2 line-clamp-2 grow">
          {product.description}
        </p>

        {isWellMeProduct(product) ? (
          <div className="mt-auto">
            <div className="mb-2">
              <PriceDisplay product={product} variant="inline" withVat={false} />
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isAdded}
              className={`w-full font-semibold py-2.5 px-4 rounded-lg text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                isAdded
                  ? "bg-success text-white"
                  : "bg-background hover:bg-bosque-profundo-400 text-white"
              }`}
            >
              {isAdded ? (
                "Agregado!"
              ) : (
                <>
                  <FaShoppingCart className="w-3.5 h-3.5" /> Agregar al carrito
                </>
              )}
            </button>
          </div>
        ) : (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto w-full bg-primary hover:bg-accent text-white font-semibold py-2.5 px-4 rounded-lg text-sm text-center transition-colors duration-300 flex items-center justify-center gap-2"
          >
            <FaWhatsapp className="w-4 h-4" /> Consultar por WhatsApp
          </a>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
