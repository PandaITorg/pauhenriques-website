"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import ProductPlaceholder from "@/components/ui/ProductPlaceholder";
import { FaWhatsapp, FaEye } from "react-icons/fa";

interface CatalogoCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

const CatalogoCard = ({ product, onQuickView }: CatalogoCardProps) => {
  const hasImage = product.images && product.images.length > 0;
  const firstImage = hasImage ? product.images[0].replace(/"/g, "").trim() : "";

  const whatsappLink = `https://api.whatsapp.com/send?phone=593991712532&text=${encodeURIComponent(
    `Hola Pau, quiero conocer más sobre "${product.name}".`,
  )}`;

  return (
    <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden flex flex-col group hover:border-warm-600/40 transition-all duration-300 hover:shadow-[--shadow-glow-primary]">
      {/* Image — taller aspect for editorial feel */}
      <div
        className="relative w-full aspect-3/4 cursor-pointer overflow-hidden"
        onClick={() => onQuickView(product)}
      >
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

        {/* Warm overlay on hover */}
        <div className="absolute inset-0 bg-warm-950/0 group-hover:bg-warm-950/30 transition-colors duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 text-text-inverted text-sm font-medium px-4 py-2 rounded-full flex items-center gap-2">
            <FaEye className="w-3.5 h-3.5" /> Vista rápida
          </span>
        </div>

        {/* Badge */}
        <span className="absolute top-2.5 left-2.5 bg-warm-700 text-warm-100 text-[11px] font-semibold px-2.5 py-1 rounded-full">
          Asesoría
        </span>
      </div>

      {/* Content — links to detail page */}
      <Link href={`/tienda/${product.id}`} className="p-4 flex flex-col grow">
        <span className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1">
          {product.brand}
        </span>
        <h3 className="font-cormorant text-lg font-semibold text-text-main line-clamp-2 mb-1.5">
          {product.name}
        </h3>
        <p className="text-xs text-text-main/50 mb-4 line-clamp-2 grow leading-relaxed">
          {product.description}
        </p>

        {/* CTA — WhatsApp */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-auto w-full bg-whatsapp text-white font-semibold py-2.5 px-4 rounded-lg text-sm text-center transition-all duration-200 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.97]"
        >
          <FaWhatsapp className="w-4 h-4" /> Consultar por WhatsApp
        </a>
      </Link>
    </div>
  );
};

export default CatalogoCard;
