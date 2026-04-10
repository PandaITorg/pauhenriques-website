"use client";

import Link from "next/link";
import Image from "next/image";
import { FaWhatsapp, FaChevronRight } from "react-icons/fa";
import { CaricoProduct, Product } from "@/types/product";
import ProductPlaceholder from "@/components/ui/ProductPlaceholder";
import CatalogoCard from "@/components/tienda/CatalogoCard";
import QuickViewDrawer from "@/components/tienda/QuickViewDrawer";
import { useState } from "react";

interface CaricoDetailProps {
  product: CaricoProduct;
  related: Product[];
}

export default function CaricoDetail({ product, related }: CaricoDetailProps) {
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(null);

  const cleanImages = product.images
    .map((img) => img.replace(/"/g, "").trim())
    .filter(Boolean);

  const heroImage = cleanImages[0] || "";

  const whatsappLink = `https://api.whatsapp.com/send?phone=593991712532&text=${encodeURIComponent(
    `Hola Pau, quiero conocer más sobre "${product.name}".`,
  )}`;

  const specs = [
    { label: "Material", value: product.material },
    { label: "Color", value: product.color },
    { label: "Peso", value: product.weight },
    { label: "Dimensiones", value: product.dimensions },
    { label: "Voltaje", value: product.voltage },
    { label: "Potencia", value: product.power },
    { label: "Garantía", value: product.warranty },
    { label: "Fabricante", value: product.manufacturer },
  ].filter((s) => s.value);

  return (
    <div className="min-h-screen bg-background py-6 md:py-10 px-4 sm:px-6">
      <div className="container mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-text-main/50 mb-6 overflow-x-auto">
          <Link href="/tienda?tab=catalogo" className="hover:text-primary shrink-0">
            Catálogo
          </Link>
          {product.parentCategory && (
            <>
              <FaChevronRight className="w-2.5 h-2.5 shrink-0" />
              <span className="shrink-0">{product.parentCategory}</span>
            </>
          )}
          {product.subCategory && (
            <>
              <FaChevronRight className="w-2.5 h-2.5 shrink-0" />
              <span className="shrink-0">{product.subCategory}</span>
            </>
          )}
          <FaChevronRight className="w-2.5 h-2.5 shrink-0" />
          <span className="text-text-main font-medium truncate">
            {product.name}
          </span>
        </nav>

        {/* Hero image — full-width editorial */}
        <div className="relative w-full aspect-video md:aspect-21/9 rounded-2xl overflow-hidden bg-surface-card mb-8">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 960px"
              priority
            />
          ) : (
            <ProductPlaceholder className="w-full h-full" />
          )}
          {/* Warm gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-background/80 to-transparent" />
          <span className="absolute top-4 left-4 bg-warm-700 text-warm-100 text-xs font-semibold px-3 py-1.5 rounded-full">
            Asesoría
          </span>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            {product.brand}
          </span>
          <h1 className="font-cormorant text-3xl sm:text-4xl md:text-5xl font-semibold text-text-main mt-1 mb-4">
            {product.name}
          </h1>

          <p className="text-text-main/60 leading-relaxed text-base md:text-lg mb-8">
            {product.description}
          </p>

          {/* Specs grid */}
          {specs.length > 0 && (
            <div className="bg-surface-card border border-border-subtle rounded-xl p-5 md:p-6 mb-8">
              <h2 className="font-semibold text-text-main mb-4 text-sm uppercase tracking-wider">
                Especificaciones
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {specs.map((s) => (
                  <div key={s.label}>
                    <p className="text-xs text-text-main/35 uppercase tracking-wider">
                      {s.label}
                    </p>
                    <p className="text-sm text-text-main font-medium mt-0.5">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-warm-800 text-warm-200 px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 mb-12">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-whatsapp text-white font-semibold py-3.5 px-6 rounded-lg text-center transition-all duration-200 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.97]"
            >
              <FaWhatsapp className="w-5 h-5" /> Consultar por WhatsApp
            </a>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 border border-warm-600 text-warm-300 font-semibold py-3.5 px-6 rounded-lg text-center transition-all duration-200 flex items-center justify-center gap-2 hover:bg-warm-800/50 active:scale-[0.97]"
            >
              Solicitar Asesoría
            </a>
          </div>

          {/* Secondary images grid */}
          {cleanImages.length > 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12">
              {cleanImages.slice(1).map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-xl overflow-hidden bg-surface-card"
                >
                  <Image
                    src={img}
                    alt={`${product.name} - ${i + 2}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 300px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="border-t border-border-subtle pt-10">
            <h2 className="font-cormorant text-xl md:text-2xl font-semibold text-text-main mb-6">
              Productos Relacionados
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((p) => (
                <CatalogoCard
                  key={p.id}
                  product={p}
                  onQuickView={setDrawerProduct}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <QuickViewDrawer
        product={drawerProduct}
        isOpen={!!drawerProduct}
        onClose={() => setDrawerProduct(null)}
      />
    </div>
  );
}
