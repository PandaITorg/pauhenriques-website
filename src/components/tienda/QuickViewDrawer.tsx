"use client";

import Image from "next/image";
import Link from "next/link";
import { FaTimes, FaShoppingCart, FaWhatsapp, FaCheck } from "react-icons/fa";
import { Product, isWellMeProduct } from "@/types/product";
import ProductPlaceholder from "@/components/ui/ProductPlaceholder";
import PriceDisplay from "@/components/pricing/PriceDisplay";
import Drawer from "@/components/ui/Drawer";
import { useCartStore } from "@/stores/cart.store";
import { useState } from "react";

interface QuickViewDrawerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const QuickViewDrawer = ({ product, isOpen, onClose }: QuickViewDrawerProps) => {
  const [isAdded, setIsAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  if (!product) return null;

  const hasImage = product.images && product.images.length > 0;
  const firstImage = hasImage ? product.images[0].replace(/"/g, "").trim() : "";
  const isWellMe = isWellMeProduct(product);

  const handleAddToCart = () => {
    if (isWellMe) {
      for (let i = 0; i < qty; i++) {
        addItem(product);
      }
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
        setQty(1);
      }, 1500);
    }
  };

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
  ].filter((s) => s.value);

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-surface-card hover:bg-surface-elevated transition-colors"
        aria-label="Cerrar"
      >
        <FaTimes className="w-4 h-4 text-text-main/60" />
      </button>

      {/* Image */}
      <div className="relative w-full aspect-square bg-surface-card">
        {hasImage ? (
          <Image
            src={firstImage}
            alt={product.name}
            fill
            className="object-cover"
            sizes="448px"
          />
        ) : (
          <ProductPlaceholder className="w-full h-full" />
        )}

        {/* Badge */}
        {isWellMe ? (
          <span className="absolute top-3 left-3 bg-success/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            Disponible
          </span>
        ) : (
          <span className="absolute top-3 left-3 bg-warm-700 text-warm-100 text-xs font-semibold px-2.5 py-1 rounded-full">
            Asesoría
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
          {product.brand}
        </span>
        <h2 className="font-cormorant text-2xl font-semibold text-text-main mt-1 mb-2">
          {product.name}
        </h2>

        {isWellMe && (
          <div className="mb-3">
            <PriceDisplay
              product={product}
              variant="stacked"
              priceClassName="text-2xl font-bold"
              priceColorClassName="text-primary"
            />
          </div>
        )}

        <p className="text-sm text-text-main/60 leading-relaxed mb-4">
          {product.description}
        </p>

        {/* Specs preview */}
        {specs.length > 0 && (
          <div className="border-t border-border-subtle pt-3 mb-4">
            <div className="grid grid-cols-2 gap-2">
              {specs.slice(0, 4).map((s) => (
                <div key={s.label}>
                  <p className="text-xs text-text-main/35">{s.label}</p>
                  <p className="text-sm text-text-main font-medium">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {isWellMe ? (
          <div className="space-y-3">
            {/* Quantity */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-main/50">Cantidad:</span>
              <div className="flex items-center border border-border-default rounded-lg">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-1.5 text-text-main/50 hover:text-text-main hover:bg-surface-card transition-colors rounded-l-lg"
                >
                  -
                </button>
                <span className="px-3 py-1.5 text-sm font-medium text-text-main min-w-8 text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="px-3 py-1.5 text-text-main/50 hover:text-text-main hover:bg-surface-card transition-colors rounded-r-lg"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isAdded}
              className={`w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.97] ${
                isAdded
                  ? "bg-success text-white"
                  : "bg-primary text-white hover:bg-primary-hover hover:shadow-[--shadow-glow-primary]"
              }`}
            >
              {isAdded ? (
                <>
                  <FaCheck className="w-3.5 h-3.5" /> Agregado al carrito!
                </>
              ) : (
                <>
                  <FaShoppingCart /> Agregar al carrito
                </>
              )}
            </button>
          </div>
        ) : (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-whatsapp text-white font-semibold py-3 px-4 rounded-lg text-center transition-all duration-200 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.97]"
          >
            <FaWhatsapp className="w-5 h-5" /> Consultar por WhatsApp
          </a>
        )}

        {/* Link to full detail */}
        <Link
          href={`/tienda/${product.id}`}
          onClick={onClose}
          className="block text-center text-sm text-primary hover:text-primary-hover font-medium mt-4 underline underline-offset-2 transition-colors"
        >
          Ver detalles completos
        </Link>
      </div>
    </Drawer>
  );
};

export default QuickViewDrawer;
