"use client";

// Forzar renderizado dinámico — esta página usa Firestore que requiere el browser
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { ProductCard } from "@/components/ProductCard";
import { ProductService } from "@/services/firestore/productService";
import {
  Product,
  isInfrrarrojoProduct,
  isCaricoProduct,
} from "@/types/product";

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<"Infrarrojo" | "Carico">(
    "Infrarrojo",
  );

  useEffect(() => {
    const fetchProducts = async () => {
      const productService = new ProductService();
      const allProducts = await productService.getAllProducts();
      setProducts(allProducts);
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) =>
    activeTab === "Infrarrojo"
      ? isInfrrarrojoProduct(product)
      : isCaricoProduct(product),
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex mb-8 border-b">
        <button
          className={`px-4 py-2 ${activeTab === "Infrarrojo" ? "border-b-2 border-green-500 text-green-500" : "text-gray-500"}`}
          onClick={() => setActiveTab("Infrarrojo")}
        >
          Productos Propios
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "Carico" ? "border-b-2 border-green-500 text-green-500" : "text-gray-500"}`}
          onClick={() => setActiveTab("Carico")}
        >
          Catálogo de Asesoría
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={
              isInfrrarrojoProduct(product)
                ? (p) => console.log("Add to cart:", p)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
