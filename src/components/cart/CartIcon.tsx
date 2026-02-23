"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaShoppingCart } from "react-icons/fa";
import { useCartStore } from "@/stores/cart.store"; // Esta ruta ahora es correcta

const CartIcon = () => {
  const [isClient, setIsClient] = useState(false);
  const totalItems = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );

  useEffect(() => {
    // El componente solo se renderiza completamente en el lado del cliente
    // para evitar problemas de hidratación con el estado de Zustand.
    setIsClient(true);
  }, []);

  return (
    <Link
      href="/checkout"
      className="relative flex items-center text-text-main hover:text-[#5a6b4a] transition-colors"
    >
      <FaShoppingCart className="h-6 w-6" />
      {isClient && totalItems > 0 && (
        <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full">
          {totalItems}
        </span>
      )}
    </Link>
  );
};

export default CartIcon;
