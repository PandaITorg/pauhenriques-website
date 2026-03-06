"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaCheckCircle } from "react-icons/fa";
import { getOrderById } from "@/services/firestore/orderService";
import { Order } from "@/types/order";

export default function ConfirmacionPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    const fetchOrder = async () => {
      const o = await getOrderById(orderId);
      setOrder(o);
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="simple-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
        <FaCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-text-inverted mb-2">
          Compra Exitosa!
        </h1>
        <p className="text-gray-500 mb-6">
          Gracias por tu compra. Tu pedido ha sido procesado.
        </p>

        {order && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Orden</span>
              <span className="font-mono font-medium text-text-inverted">
                {orderId?.slice(0, 8)}...
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Productos</span>
              <span className="font-medium">{order.items.length}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Total</span>
              <span className="font-bold text-text-inverted">
                ${order.total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Estado</span>
              <span className="text-green-600 font-medium capitalize">
                {order.status}
              </span>
            </div>
          </div>
        )}

        <Link
          href="/tienda"
          className="inline-block bg-background hover:bg-bosque-profundo-400 text-white font-bold py-3 px-8 rounded-lg transition-colors"
        >
          Seguir Comprando
        </Link>
      </div>
    </div>
  );
}
