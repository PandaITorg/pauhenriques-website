"use client";

import React, { useState, useEffect, useCallback } from "react";
import TiendaSchema from "@/components/schemas/TiendaSchema";
import { Product, isInfrrarrojoProduct } from "@/types/product";
import { productService } from "@/services/firestore/productService";
import ProductCard from "@/components/tienda/ProductCard";
import CategoryFilter from "@/components/tienda/CategoryFilter";
import SearchBar from "@/components/tienda/SearchBar";
import QuickViewDrawer from "@/components/tienda/QuickViewDrawer";

type Tab = "compra" | "catalogo";

const ProductSkeleton = () => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col animate-pulse">
    <div className="w-full aspect-square bg-gray-200" />
    <div className="p-4 flex flex-col gap-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-5/6" />
      <div className="h-5 bg-gray-200 rounded w-1/3 mt-2" />
      <div className="h-10 bg-gray-200 rounded mt-auto" />
    </div>
  </div>
);

export default function TiendaClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("compra");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const all = await productService.getAllProducts();
        setProducts(all);
        setError(null);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("No se pudieron cargar los productos. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const filteredProducts = products.filter((p) => {
    if (activeTab === "compra" && !isInfrrarrojoProduct(p)) return false;
    if (activeTab === "catalogo" && isInfrrarrojoProduct(p)) return false;

    if (selectedCategory) {
      if (p.subCategory !== selectedCategory && p.category !== selectedCategory)
        return false;
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      const matches =
        p.name.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower) ||
        p.brand.toLowerCase().includes(lower) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(lower)));
      if (!matches) return false;
    }

    return true;
  });

  if (error) {
    return (
      <div className="min-h-screen bg-tertiary flex items-center justify-center px-5">
        <p className="text-center text-red-700 bg-red-100 rounded-lg p-6 max-w-md">
          {error}
        </p>
      </div>
    );
  }

  return (
    <>
      <TiendaSchema />
      <div className="min-h-screen bg-gray-50 py-6 md:py-10 px-4 sm:px-6">
        <div className="container mx-auto">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-text-inverted mb-2">
              Tienda Toxic Free
            </h1>
            <p className="text-text-inverted/60 text-sm md:text-base">
              Productos para una vida mas saludable y libre de toxicos
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => {
                setActiveTab("compra");
                setSelectedCategory(null);
              }}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === "compra"
                  ? "bg-background text-white shadow-md"
                  : "bg-white text-text-inverted/60 border border-gray-200 hover:border-gray-300"
              }`}
            >
              Compra Online
            </button>
            <button
              onClick={() => {
                setActiveTab("catalogo");
                setSelectedCategory(null);
              }}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === "catalogo"
                  ? "bg-primary text-white shadow-md"
                  : "bg-white text-text-inverted/60 border border-gray-200 hover:border-gray-300"
              }`}
            >
              Catalogo Carico
            </button>
          </div>

          {/* Search */}
          <div className="flex justify-center mb-6">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Category filter (mobile pills) */}
          <div className="mb-6">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />
          </div>

          {/* Main content */}
          <div className="flex gap-8">
            {/* Product grid */}
            <div className="grow">
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-text-inverted/40 text-lg">
                    No se encontraron productos
                  </p>
                  {(searchTerm || selectedCategory) && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory(null);
                      }}
                      className="mt-3 text-primary hover:text-accent text-sm font-medium underline"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onQuickView={setDrawerProduct}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick View Drawer */}
      <QuickViewDrawer
        product={drawerProduct}
        isOpen={!!drawerProduct}
        onClose={() => setDrawerProduct(null)}
      />
    </>
  );
}
