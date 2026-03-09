"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaCheckCircle, FaEnvelope } from "react-icons/fa";
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="simple-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="bg-surface-card border border-border-subtle rounded-xl p-8 max-w-md w-full text-center">
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-5">
          <FaCheckCircle className="w-8 h-8 text-success" />
        </div>

        <h1 className="font-cormorant text-2xl font-semibold text-text-main mb-2">
          Compra Exitosa!
        </h1>
        <p className="text-text-main/50 mb-6">
          Gracias por tu compra. Tu pedido ha sido procesado.
        </p>

        {order && (
          <div className="bg-surface-elevated rounded-lg p-4 mb-6 text-left text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-text-main/50">Orden</span>
              <span className="font-mono font-medium text-text-main">
                {orderId?.slice(0, 8)}...
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-text-main/50">Productos</span>
              <span className="font-medium text-text-main">
                {order.items.length}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-text-main/50">Total</span>
              <span className="font-bold text-primary">
                ${order.total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-main/50">Estado</span>
              <span className="text-success font-medium capitalize">
                {order.status}
              </span>
            </div>
          </div>
        )}

        {/* Email notice */}
        <div className="flex items-center justify-center gap-2 text-text-main/40 text-sm mb-6">
          <FaEnvelope className="w-4 h-4" />
          <span>Revisa tu correo para más detalles</span>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/mis-pedidos"
            className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/tienda"
            className="flex-1 border border-primary text-primary font-semibold py-3 px-6 rounded-lg hover:bg-primary/10 transition-colors text-center"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
