"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { isInfrrarrojoProduct } from "@/types/product";

export function CartComponent() {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      if (isInfrrarrojoProduct(item.product)) {
        return total + item.product.price * item.quantity;
      }
      return total;
    }, 0);
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Tu carrito está vacío</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Tu Carrito</h2>
      <div className="grid gap-6">
        {cart.map(({ product, quantity }) => (
          <div key={product.id} className="flex items-center border-b pb-4">
            <div className="relative w-24 h-24 mr-4">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover rounded"
              />
            </div>
            <div className="grow">
              <h3 className="text-lg font-semibold">{product.name}</h3>
              {isInfrrarrojoProduct(product) && (
                <p className="text-green-600 font-bold">
                  ${product.price.toFixed(2)}
                </p>
              )}
            </div>
            <div className="flex items-center">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="px-3 py-1 bg-gray-200 rounded-l"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) =>
                  updateQuantity(product.id, parseInt(e.target.value))
                }
                className="w-16 text-center border-t border-b py-1"
                min="1"
              />
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                className="px-3 py-1 bg-gray-200 rounded-r"
              >
                +
              </button>
              <button
                onClick={() => removeFromCart(product.id)}
                className="ml-4 text-red-500 hover:text-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-right">
        <p className="text-xl font-bold">
          Total: ${calculateTotal().toFixed(2)}
        </p>
        <button className="mt-4 bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">
          Proceder al Pago
        </button>
      </div>
    </div>
  );
}
