"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { FaBookOpen } from "react-icons/fa";
import TiendaSchema from "@/components/schemas/TiendaSchema";
import { Product, isInfrrarrojoProduct } from "@/types/product";
import { productService } from "@/services/firestore/productService";
import CatalogoCard from "@/components/tienda/CatalogoCard";
import CompraCard from "@/components/tienda/CompraCard";
import CategoryFilter from "@/components/tienda/CategoryFilter";
import SearchBar from "@/components/tienda/SearchBar";
import QuickViewDrawer from "@/components/tienda/QuickViewDrawer";

type Tab = "compra" | "catalogo";

/* --- Skeleton variants --- */

const CompraCardSkeleton = () => (
  <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden flex flex-col animate-pulse">
    <div className="w-full aspect-square bg-bosque-profundo-400/30" />
    <div className="p-4 flex flex-col gap-3">
      <div className="h-3 bg-bosque-profundo-400/30 rounded w-1/3" />
      <div className="h-4 bg-bosque-profundo-400/30 rounded w-3/4" />
      <div className="h-3 bg-bosque-profundo-400/30 rounded w-full" />
      <div className="h-6 bg-bosque-profundo-400/30 rounded w-1/3 mt-2" />
      <div className="h-10 bg-bosque-profundo-400/30 rounded mt-2" />
    </div>
  </div>
);

const CatalogoCardSkeleton = () => (
  <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden flex flex-col animate-pulse">
    <div className="w-full aspect-3/4 bg-warm-800/40" />
    <div className="p-4 flex flex-col gap-3">
      <div className="h-3 bg-warm-800/40 rounded w-1/4" />
      <div className="h-5 bg-warm-800/40 rounded w-3/4" />
      <div className="h-3 bg-warm-800/40 rounded w-full" />
      <div className="h-10 bg-warm-800/40 rounded mt-2" />
    </div>
  </div>
);

/* --- Empty state --- */

const EmptyState = ({
  searchTerm,
  selectedCategory,
  onClear,
  isCatalogo,
}: {
  searchTerm: string;
  selectedCategory: string | null;
  onClear: () => void;
  isCatalogo: boolean;
}) => (
  <div className="text-center py-20">
    <div className={`w-16 h-16 rounded-full ${isCatalogo ? "bg-warm-800" : "bg-surface-card"} flex items-center justify-center mx-auto mb-4`}>
      {isCatalogo ? (
        <FaBookOpen className="w-6 h-6 text-warm-400" />
      ) : (
        <HiOutlineShoppingBag className="w-7 h-7 text-text-main/30" />
      )}
    </div>
    <p className="text-text-main/50 text-lg mb-1">
      No se encontraron productos
    </p>
    <p className="text-text-main/30 text-sm mb-4">
      Intenta con otros términos o categorías
    </p>
    {(searchTerm || selectedCategory) && (
      <button
        onClick={onClear}
        className="text-primary hover:text-primary-hover text-sm font-medium transition-colors"
      >
        Limpiar filtros
      </button>
    )}
  </div>
);

export default function TiendaClient() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(
    searchParams.get("tab") === "catalogo" ? "catalogo" : "compra"
  );
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

  const isCatalogo = activeTab === "catalogo";

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <p className="text-center text-error bg-error-light rounded-xl p-6 max-w-md text-sm">
          {error}
        </p>
      </div>
    );
  }

  return (
    <>
      <TiendaSchema />
      <div className="min-h-screen bg-background py-6 md:py-10 px-4 sm:px-6">
        <div className="container mx-auto">
          {/* Header */}
          <div className="text-center mb-8 md:mb-10">
            <h1 className="font-cormorant text-3xl md:text-4xl font-semibold text-text-main mb-2">
              Tienda{" "}
              <span className="font-dancing-script text-primary text-[1.1em]">
                Toxic Free
              </span>
            </h1>
            <p className="text-text-main/50 text-sm md:text-base">
              Productos para una vida más saludable y libre de tóxicos
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => {
                setActiveTab("compra");
                setSelectedCategory(null);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === "compra"
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-surface-card text-text-main/50 border border-border-subtle hover:border-border-default"
              }`}
            >
              <HiOutlineShoppingBag className="w-4 h-4" />
              Compra Online
            </button>
            <button
              onClick={() => {
                setActiveTab("catalogo");
                setSelectedCategory(null);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === "catalogo"
                  ? "bg-warm-700 text-warm-50 shadow-md shadow-warm-900/30"
                  : "bg-surface-card text-text-main/50 border border-border-subtle hover:border-border-default"
              }`}
            >
              <FaBookOpen className="w-3.5 h-3.5" />
              Catálogo Carico
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
              activeTab={activeTab}
            />
          </div>

          {/* Main content */}
          <div className="flex gap-8">
            {/* Desktop sidebar — hidden on mobile (pills shown above instead) */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              activeTab={activeTab}
            />

            {/* Product grid */}
            <div className="grow">
              {loading ? (
                <div className={`grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6`}>
                  {Array.from({ length: 8 }).map((_, i) =>
                    isCatalogo ? (
                      <CatalogoCardSkeleton key={i} />
                    ) : (
                      <CompraCardSkeleton key={i} />
                    )
                  )}
                </div>
              ) : filteredProducts.length === 0 ? (
                <EmptyState
                  searchTerm={searchTerm}
                  selectedCategory={selectedCategory}
                  onClear={() => {
                    setSearchTerm("");
                    setSelectedCategory(null);
                  }}
                  isCatalogo={isCatalogo}
                />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {filteredProducts.map((product) =>
                    isCatalogo ? (
                      <CatalogoCard
                        key={product.id}
                        product={product}
                        onQuickView={setDrawerProduct}
                      />
                    ) : (
                      <CompraCard
                        key={product.id}
                        product={product}
                        onQuickView={setDrawerProduct}
                      />
                    )
                  )}
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
