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
    <div className="min-h-screen bg-background">
      {/* ── Hero header ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/60 via-background to-background" />
        {/* Ambient success glow */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-success/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-md mx-auto px-5 sm:px-6 pt-14 pb-8 md:pt-20 md:pb-10 text-center">
          {/* Success icon with glow */}
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="absolute -inset-1 rounded-full bg-success/20 blur-sm" />
            <div className="relative w-full h-full rounded-full bg-success/15 flex items-center justify-center">
              <FaCheckCircle className="w-9 h-9 text-success" />
            </div>
          </div>

          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-success/70 mb-2">
            Pago confirmado
          </span>
          <h1 className="font-cormorant text-2xl sm:text-3xl md:text-4xl font-semibold text-text-main mb-2">
            Compra Exitosa!
          </h1>
          <p className="text-text-main/50">
            Gracias por tu compra. Tu pedido ha sido procesado.
          </p>
        </div>
      </section>

      {/* ── Separator ── */}
      <div className="h-px max-w-md mx-auto bg-linear-to-r from-transparent via-border-default to-transparent" />

      <div className="max-w-md mx-auto px-5 sm:px-6 py-8 md:py-10 text-center">

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
            className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:-translate-y-px hover:shadow-(--shadow-glow-primary) text-center"
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/tienda"
            className="flex-1 border border-primary/40 text-primary font-semibold py-3 px-6 rounded-xl hover:bg-primary/10 transition-all duration-200 text-center"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
