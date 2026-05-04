"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import { productService } from "@/services/firestore/productService";
import ProductCard from "@/components/tienda/ProductCard";
import QuickViewDrawer from "@/components/tienda/QuickViewDrawer";

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const wellMe = await productService.getProductsByType("WellMe");
        setProducts(wellMe.slice(0, 6));
      } catch (err) {
        console.error("Error fetching featured products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  if (loading || products.length === 0) return null;

  return (
    <section className="bg-white py-12 md:py-20">
      <div className="container mx-auto px-5">
        <h2 className="font-cormorant text-2xl sm:text-3xl md:text-4xl font-semibold text-text-inverted text-center mb-3">
          Productos para una Vida sin Toxicos
        </h2>
        <p className="text-text-inverted/50 text-center mb-8 md:mb-12 max-w-lg mx-auto">
          Compra directamente y recibe en la puerta de tu casa
        </p>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 -mx-5 px-5 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none">
          {products.map((product) => (
            <div
              key={product.id}
              className="shrink-0 w-64 md:w-auto snap-start"
            >
              <ProductCard product={product} onQuickView={setDrawerProduct} />
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/tienda"
            className="inline-block bg-background hover:bg-bosque-profundo-400 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Ver toda la tienda
          </Link>
        </div>
      </div>

      <QuickViewDrawer
        product={drawerProduct}
        isOpen={!!drawerProduct}
        onClose={() => setDrawerProduct(null)}
      />
    </section>
  );
};

export default FeaturedProducts;
