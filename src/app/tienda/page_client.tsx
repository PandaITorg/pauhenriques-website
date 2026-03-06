"use client";

import React, { useState, useEffect } from "react";
import TiendaSchema from "@/components/schemas/TiendaSchema";
import Image from "next/image";

import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { Product, isInfrrarrojoProduct } from "@/types/product";

import { useCartStore } from "@/stores/cart.store";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const addItemToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (product.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(
          (prevIndex) => (prevIndex + 1) % product.images.length,
        );
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [product.images.length]);

  const handleAddToCart = () => {
    if (isInfrrarrojoProduct(product)) {
      addItemToCart(product);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);
    }
  };

  const whatsappLink = `https://api.whatsapp.com/send?phone=593991712532&text=Hola%20Pau,%20quiero%20conocer%20m%C3%A1s%20sobre%20el%20producto%20"${product.name}".`;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl flex flex-col">
      <div className="relative w-full aspect-square sm:aspect-4/3">
        {product.images.map((image, index) => {
          const cleanedImage = image.replace(/"/g, "").trim();
          return (
            <Image
              key={index}
              src={cleanedImage}
              alt={`${product.name} - Imagen ${index + 1}`}
              fill
              className={`object-cover transition-opacity duration-1000 ease-in-out ${
                index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={index === 0}
            />
          );
        })}
      </div>
      <div className="p-4 sm:p-5 grow flex flex-col">
        <h3 className="font-bold text-lg sm:text-xl mb-1 text-text-inverted">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 mb-2 capitalize">{product.brand}</p>
        <p className="text-gray-600 text-sm sm:text-base mb-4 grow leading-relaxed">
          {product.description}
        </p>

        {isInfrrarrojoProduct(product) ? (
          <div className="mt-auto">
            {product.price && (
              <p className="font-bold text-2xl text-text-inverted mb-3">
                ${product.price.toFixed(2)}
              </p>
            )}
            <button
              onClick={handleAddToCart}
              disabled={isAdded}
              className={`block w-full font-bold py-3 px-4 rounded-lg text-center transition-all duration-300 ${
                isAdded
                  ? "bg-green-500 text-white cursor-not-allowed"
                  : "bg-background hover:bg-bosque-profundo-400 text-white"
              }`}
            >
              {isAdded ? "Anadido!" : "Agregar al Carrito"}
            </button>
          </div>
        ) : (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full mt-auto bg-primary hover:bg-accent text-white font-bold py-3 px-4 rounded-lg text-center transition-colors duration-300"
          >
            Preguntar por WhatsApp
          </a>
        )}
      </div>
    </div>
  );
};

const ProductSkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col animate-pulse">
    <div className="w-full aspect-square sm:aspect-4/3 bg-gray-200" />
    <div className="p-4 sm:p-5 flex flex-col gap-3">
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-12 bg-gray-200 rounded mt-auto" />
    </div>
  </div>
);

export default function Tienda() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsQuery = query(collection(db, "products"));
        const querySnapshot = await getDocs(productsQuery);
        const productsData = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Product,
        );
        setProducts(productsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(
          "No se pudieron cargar los productos. Por favor, intenta de nuevo mas tarde.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

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
      <div className="min-h-screen bg-tertiary text-text-inverted py-8 md:py-12 px-5">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-text-inverted mb-8 md:mb-12 text-center">
            Nuestros Productos
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
