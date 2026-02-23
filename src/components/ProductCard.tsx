"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Product,
  isInfrrarrojoProduct,
  isCaricoProduct,
} from "@/types/product";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  if (isInfrrarrojoProduct(product)) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="relative w-full aspect-square">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold mb-2">{product.name}</h3>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-green-600">
              ${product.price.toFixed(2)}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => onAddToCart?.(product)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Agregar al Carrito
              </button>
              <Link
                href={`/producto/${product.id}`}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Ver Detalles
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCaricoProduct(product)) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="relative w-full aspect-square">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold mb-2">{product.name}</h3>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <a
            href={`https://wa.me/${product.consultationWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block text-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Consultar Asesoría
          </a>
        </div>
      </div>
    );
  }

  return null;
}
