"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FaShoppingCart,
  FaChevronRight,
  FaCheck,
  FaShieldAlt,
  FaTruck,
  FaUndo,
  FaChevronDown,
} from "react-icons/fa";
import { InfrrarrojoProduct, Product } from "@/types/product";
import { useCartStore } from "@/stores/cart.store";
import ProductGallery from "@/components/tienda/ProductGallery";
import CompraCard from "@/components/tienda/CompraCard";
import QuickViewDrawer from "@/components/tienda/QuickViewDrawer";

interface InfrarrojoDetailProps {
  product: InfrrarrojoProduct;
  related: Product[];
}

export default function InfrarrojoDetail({
  product,
  related,
}: InfrarrojoDetailProps) {
  const [qty, setQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  const inStock = product.stock > 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    for (let i = 0; i < qty; i++) addItem(product);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      setQty(1);
    }, 1500);
  };

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

  const accordionSections = [
    {
      id: "description",
      title: "Descripción completa",
      content: product.description,
    },
    {
      id: "shipping",
      title: "Envío",
      content:
        "Envío disponible a nivel nacional en Ecuador. Tiempo estimado de entrega: 3-7 días hábiles según ubicación.",
    },
    {
      id: "returns",
      title: "Devoluciones",
      content:
        "Aceptamos devoluciones dentro de los primeros 15 días posteriores a la recepción del producto, siempre que se encuentre en su empaque original y sin uso.",
    },
  ];

  return (
    <div className="min-h-screen bg-background py-6 md:py-10 px-4 sm:px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-text-main/50 mb-6 overflow-x-auto">
          <Link href="/tienda" className="hover:text-primary shrink-0">
            Tienda
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

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12">
          {/* Gallery */}
          <ProductGallery images={product.images} productName={product.name} />

          {/* Info panel */}
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {product.brand}
            </span>
            <h1 className="font-cormorant text-2xl sm:text-3xl font-semibold text-text-main mt-1 mb-3">
              {product.name}
            </h1>

            {/* Price + Stock */}
            <div className="flex items-center gap-3 mb-4">
              <p className="text-3xl font-bold text-primary">
                ${product.price.toFixed(2)}
              </p>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  inStock
                    ? "bg-success/15 text-success"
                    : "bg-error/15 text-error"
                }`}
              >
                {inStock ? "En stock" : "Agotado"}
              </span>
            </div>

            <p className="text-text-main/60 leading-relaxed mb-6 line-clamp-3">
              {product.description}
            </p>

            {/* Specs preview */}
            {specs.length > 0 && (
              <div className="border-t border-border-subtle pt-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  {specs.slice(0, 4).map((s) => (
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
              <div className="flex flex-wrap gap-2 mb-6">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-surface-card text-text-main/60 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Quantity + CTA */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-main/50">Cantidad:</span>
                <div className="flex items-center border border-border-default rounded-lg">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-4 py-2 text-text-main/50 hover:text-text-main hover:bg-surface-card transition-colors rounded-l-lg"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-text-main min-w-12 text-center">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="px-4 py-2 text-text-main/50 hover:text-text-main hover:bg-surface-card transition-colors rounded-r-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isAdded || !inStock}
                className={`w-full font-semibold py-3.5 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.97] ${
                  isAdded
                    ? "bg-success text-white"
                    : !inStock
                      ? "bg-surface-card text-text-main/30 cursor-not-allowed"
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

              {inStock && (
                <Link
                  href="/checkout"
                  onClick={handleAddToCart}
                  className="w-full border border-primary text-primary font-semibold py-3.5 px-6 rounded-lg text-center transition-all duration-200 flex items-center justify-center gap-2 hover:bg-primary/10 active:scale-[0.97]"
                >
                  Comprar Ahora
                </Link>
              )}
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-border-subtle">
              <div className="flex items-center gap-2 text-text-main/40">
                <FaShieldAlt className="w-4 h-4" />
                <span className="text-xs">Pago seguro</span>
              </div>
              <div className="flex items-center gap-2 text-text-main/40">
                <FaTruck className="w-4 h-4" />
                <span className="text-xs">Envío nacional</span>
              </div>
              <div className="flex items-center gap-2 text-text-main/40">
                <FaUndo className="w-4 h-4" />
                <span className="text-xs">Devoluciones</span>
              </div>
            </div>
          </div>
        </div>

        {/* Accordion sections */}
        <div className="max-w-3xl mb-12 border-t border-border-subtle">
          {accordionSections.map((section) => (
            <div key={section.id} className="border-b border-border-subtle">
              <button
                onClick={() =>
                  setOpenSection(
                    openSection === section.id ? null : section.id,
                  )
                }
                className="w-full flex items-center justify-between py-4 text-left"
              >
                <span className="text-sm font-semibold text-text-main">
                  {section.title}
                </span>
                <FaChevronDown
                  className={`w-3 h-3 text-text-main/40 transition-transform duration-200 ${
                    openSection === section.id ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openSection === section.id
                    ? "max-h-96 pb-4"
                    : "max-h-0"
                }`}
              >
                <p className="text-sm text-text-main/60 leading-relaxed">
                  {section.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Full specs (if more than 4) */}
        {specs.length > 4 && (
          <div className="bg-surface-card border border-border-subtle rounded-xl p-5 md:p-6 mb-12 max-w-3xl">
            <h2 className="font-semibold text-text-main mb-4 text-sm uppercase tracking-wider">
              Todas las Especificaciones
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

        {/* Related products */}
        {related.length > 0 && (
          <section className="border-t border-border-subtle pt-10">
            <h2 className="font-cormorant text-xl md:text-2xl font-semibold text-text-main mb-6">
              Productos Relacionados
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((p) => (
                <CompraCard
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
