"use client";

import { useState } from "react";
import Image from "next/image";
import ProductPlaceholder from "@/components/ui/ProductPlaceholder";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

const ProductGallery = ({ images, productName }: ProductGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const cleanImages = images
    .map((img) => img.replace(/"/g, "").trim())
    .filter(Boolean);

  if (cleanImages.length === 0) {
    return (
      <ProductPlaceholder className="w-full aspect-square rounded-xl bg-surface-card" />
    );
  }

  return (
    <div>
      {/* Main image */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-surface-card mb-3 group">
        <Image
          src={cleanImages[activeIndex]}
          alt={`${productName} - Imagen ${activeIndex + 1}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails */}
      {cleanImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {cleanImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                i === activeIndex
                  ? "border-primary shadow-[--shadow-glow-primary]"
                  : "border-border-default opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`${productName} - Thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
