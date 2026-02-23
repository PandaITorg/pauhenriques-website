"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore, CartItem } from "@/stores/cart.store";
import { FaTrash } from "react-icons/fa";
import NuveiPaymentForm from "@/components/checkout/NuveiPaymentForm"; // IMPORTAMOS el componente del formulario

// --- COMPONENTE PARA UNA FILA DE ITEM EN EL CARRITO ---
interface CartItemRowProps {
  item: CartItem;
  onRemove: (productId: string) => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ item, onRemove }) => (
  <div className="flex items-center justify-between border-b border-gray-200 py-4">
    <div className="flex items-center space-x-4">
      <div className="w-16 h-16 relative rounded-md overflow-hidden">
        <Image
          src={item.images[0]} // Mostramos la primera imagen del producto
          alt={item.name}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>
      <div>
        <h3 className="font-semibold text-lg text-[#343d2a]">{item.name}</h3>
        <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
      </div>
    </div>
    <div className="flex items-center space-x-4">
      <p className="font-semibold text-lg text-[#343d2a]">
        ${((item.price || 0) * item.quantity).toFixed(2)}
      </p>
      <button
        onClick={() => onRemove(item.id)}
        className="text-red-500 hover:text-red-700 transition-colors"
      >
        <FaTrash />
      </button>
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL DE LA PÁGINA DE CHECKOUT ---
const CheckoutPage = () => {
  const [isClient, setIsClient] = useState(false);

  // FIX: Use separate selectors instead of returning a new object `{}` from a single selector.
  // Returning `{ items, removeItem }` from one selector creates a new object reference on every
  // call, causing Zustand's useSyncExternalStore to detect a "change" and trigger an infinite
  // re-render loop ("Maximum update depth exceeded").
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const subtotal = items.reduce(
    (total, item) => total + (item.price || 0) * item.quantity,
    0,
  );

  // Manejadores para el resultado de la tokenización
  const handleTokenSuccess = (token: string) => {
    console.log("Token recibido en la página de checkout:", token);
    // Aquí llamaremos a la Server Action (Paso 6)
  };

  const handleTokenError = (error: any) => {
    console.error("Error de tokenización en la página de checkout:", error);
    // Aquí mostraremos un mensaje de error al usuario
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Cargando carrito...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl font-bold text-[#343d2a] mb-4">
          Tu carrito está vacío
        </h1>
        <p className="text-gray-600 mb-8">
          Parece que aún no has agregado productos. ¡Explora nuestra tienda!
        </p>
        <Link
          href="/tienda"
          className="bg-[#343d2a] hover:bg-[#5a6b4a] text-white font-bold py-3 px-6 rounded-md text-center transition-colors duration-300"
        >
          Ir a la Tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-center text-[#343d2a] mb-12">
          Resumen de Compra
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Columna Izquierda: Lista de Productos */}
          <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-[#343d2a] border-b pb-4 mb-6">
              Tus Productos
            </h2>
            <div className="space-y-4">
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} onRemove={removeItem} />
              ))}
            </div>
          </div>

          {/* Columna Derecha: Resumen de Pago y Formulario */}
          <div className="lg:col-span-1 bg-white p-8 rounded-lg shadow-md h-fit sticky top-32">
            <h2 className="text-2xl font-semibold text-[#343d2a] border-b pb-4 mb-6">
              Total a Pagar
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <p className="text-gray-600">Subtotal</p>
                <p className="font-semibold">${subtotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600">Envío</p>
                <p className="font-semibold">Por calcular</p>
              </div>
              <div className="border-t pt-4 mt-4 flex justify-between font-bold text-xl text-[#343d2a]">
                <p>Total</p>
                <p>${subtotal.toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-8">
              {/* --- AQUÍ SE INTEGRA EL FORMULARIO DE PAGO DE NUVEI --- */}
              <NuveiPaymentForm
                onTokenSuccess={handleTokenSuccess}
                onTokenError={handleTokenError}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
