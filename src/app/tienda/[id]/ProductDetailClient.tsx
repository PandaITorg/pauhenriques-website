"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaShoppingCart, FaWhatsapp, FaChevronRight } from "react-icons/fa";
import { Product, isInfrrarrojoProduct } from "@/types/product";
import { productService } from "@/services/firestore/productService";
import { useCartStore } from "@/stores/cart.store";
import ProductGallery from "@/components/tienda/ProductGallery";
import ProductCard from "@/components/tienda/ProductCard";
import QuickViewDrawer from "@/components/tienda/QuickViewDrawer";

interface ProductDetailClientProps {
  productId: string;
}

export default function ProductDetailClient({
  productId,
}: ProductDetailClientProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(null);
  const addItem = useCartStore((state) => state.addItem);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="simple-spinner" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5 text-center">
        <h1 className="text-2xl font-bold text-text-inverted mb-3">
          Producto no encontrado
        </h1>
        <Link
          href="/tienda"
          className="text-primary hover:text-accent font-medium underline"
        >
          Volver a la tienda
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (isInfrrarrojoProduct(product)) {
      for (let i = 0; i < qty; i++) addItem(product);
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
    { label: "Fabricante", value: product.manufacturer },
  ].filter((s) => s.value);

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-10 px-4 sm:px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-text-inverted/50 mb-6 overflow-x-auto">
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
          <span className="text-text-inverted font-medium truncate">
            {product.name}
          </span>
        </nav>

        {/* Product detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12">
          {/* Gallery */}
          <ProductGallery
            images={product.images}
            productName={product.name}
          />

          {/* Info */}
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {product.brand}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-inverted mt-1 mb-3">
              {product.name}
            </h1>

            {isInfrrarrojoProduct(product) && (
              <p className="text-3xl font-bold text-text-inverted mb-4">
                ${product.price.toFixed(2)}
              </p>
            )}

            <p className="text-gray-600 leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Specs */}
            {specs.length > 0 && (
              <div className="border-t border-gray-200 pt-4 mb-6">
                <h2 className="font-semibold text-text-inverted mb-3">
                  Especificaciones
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {specs.map((s) => (
                    <div key={s.label}>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                        {s.label}
                      </p>
                      <p className="text-sm text-text-inverted font-medium">
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
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* CTA */}
            {isInfrrarrojoProduct(product) ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Cantidad:</span>
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="px-4 py-2 text-gray-500 hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty(qty + 1)}
                      className="px-4 py-2 text-gray-500 hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isAdded}
                  className={`w-full sm:w-auto font-bold py-3 px-10 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
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
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-accent text-white font-bold py-3 px-10 rounded-lg transition-colors duration-300"
              >
                <FaWhatsapp className="w-5 h-5" /> Consultar por WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-text-inverted mb-6">
              Productos Relacionados
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((p) => (
                <ProductCard
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
