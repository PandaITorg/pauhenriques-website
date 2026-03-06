"use client";

import Image from "next/image";
import Link from "next/link";
import { FaTimes, FaShoppingCart, FaWhatsapp } from "react-icons/fa";
import { Product, isInfrrarrojoProduct } from "@/types/product";
import ProductPlaceholder from "@/components/ui/ProductPlaceholder";
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

  const handleAddToCart = () => {
    if (isInfrrarrojoProduct(product)) {
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
    { label: "Garantia", value: product.warranty },
  ].filter((s) => s.value);

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Cerrar"
      >
        <FaTimes className="w-5 h-5 text-gray-500" />
      </button>

      {/* Image */}
      <div className="relative w-full aspect-square bg-gray-50">
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
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
          {product.brand}
        </span>
        <h2 className="text-xl font-bold text-text-inverted mt-1 mb-2">
          {product.name}
        </h2>

        {isInfrrarrojoProduct(product) && (
          <p className="text-2xl font-bold text-text-inverted mb-3">
            ${product.price.toFixed(2)}
          </p>
        )}

        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          {product.description}
        </p>

        {/* Specs preview */}
        {specs.length > 0 && (
          <div className="border-t border-gray-100 pt-3 mb-4">
            <div className="grid grid-cols-2 gap-2">
              {specs.slice(0, 4).map((s) => (
                <div key={s.label}>
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className="text-sm text-text-inverted font-medium">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {isInfrrarrojoProduct(product) ? (
          <div className="space-y-3">
            {/* Quantity */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Cantidad:</span>
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  -
                </button>
                <span className="px-3 py-1.5 text-sm font-medium min-w-[2rem] text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="px-3 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isAdded}
              className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                isAdded
                  ? "bg-green-500 text-white"
                  : "bg-background hover:bg-bosque-profundo-400 text-white"
              }`}
            >
              {isAdded ? (
                "Agregado al carrito!"
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
            className="w-full bg-primary hover:bg-accent text-white font-bold py-3 px-4 rounded-lg text-center transition-colors duration-300 flex items-center justify-center gap-2"
          >
            <FaWhatsapp className="w-5 h-5" /> Consultar por WhatsApp
          </a>
        )}

        {/* Link to full detail */}
        <Link
          href={`/tienda/${product.id}`}
          onClick={onClose}
          className="block text-center text-sm text-primary hover:text-accent font-medium mt-4 underline underline-offset-2"
        >
          Ver detalles completos
        </Link>
      </div>
    </Drawer>
  );
};

export default QuickViewDrawer;
