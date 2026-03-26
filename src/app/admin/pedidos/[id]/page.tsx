"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  paid: "Pagado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  failed: "Fallido",
  refunded: "Reembolsado",
};

const STATUS_FLOW = [
  "pending",
  "processing",
  "paid",
  "shipped",
  "delivered",
];

interface OrderDetail {
  id: string;
  userId: string;
  items: {
    productId: string;
    name: string;
    brand: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  paymentTransactionId?: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export default function AdminPedidoDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundResult, setRefundResult] = useState<{ success?: boolean; error?: string } | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`);
        if (res.ok) setOrder(await res.json());
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const updateStatus = async (newStatus: string) => {
    if (!confirm(`¿Cambiar estado a "${STATUS_LABELS[newStatus]}"?`)) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrder((prev) =>
          prev ? { ...prev, status: newStatus } : prev,
        );
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRefund = async () => {
    if (!confirm("¿Estás seguro de que deseas reembolsar esta orden? Esta acción no se puede deshacer.")) return;
    setRefunding(true);
    setRefundResult(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setRefundResult({ success: true });
        setOrder((prev) => prev ? { ...prev, status: "refunded" } : prev);
      } else {
        setRefundResult({ error: data.error || "Error al reembolsar" });
      }
    } catch {
      setRefundResult({ error: "Error de conexión" });
    } finally {
      setRefunding(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="simple-spinner" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 text-text-main/50">
        Orden no encontrada.
      </div>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <div>
      {/* ── Header ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/40 to-background" />
        <div className="relative px-5 lg:px-8 pt-6 pb-4 md:pt-8 md:pb-6">
          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-1">
            Pedidos
          </span>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-text-main">
              Orden{" "}
              <span className="font-mono text-text-main/60">
                {orderId.slice(0, 8)}...
              </span>
            </h1>
            <span className="text-sm text-text-main/40">
              {formatDate(order.createdAt)}
            </span>
          </div>
        </div>
      </div>
      <div className="h-px bg-linear-to-r from-transparent via-border-default to-transparent" />

      <div className="px-5 lg:px-8 py-6 max-w-4xl">
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center gap-2 text-sm text-text-main/50 hover:text-text-main transition-colors mb-6"
      >
        <FaArrowLeft className="w-3 h-3" /> Volver a Pedidos
      </Link>

      {/* Status timeline */}
      <div className="bg-surface-card border border-border-subtle rounded-xl p-6 mb-6">
        <h2 className="text-xs font-bold text-text-main/40 uppercase tracking-wider mb-4">
          Estado del Pedido
        </h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {STATUS_FLOW.map((s, i) => {
            const isActive = i <= currentIndex;
            const isCurrent = s === order.status;
            return (
              <div key={s} className="flex items-center gap-2">
                <button
                  onClick={() => updateStatus(s)}
                  disabled={updating || s === order.status}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    isCurrent
                      ? "bg-primary text-white"
                      : isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-surface-elevated text-text-main/30 hover:bg-surface-elevated hover:text-text-main/50"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
                {i < STATUS_FLOW.length - 1 && (
                  <div
                    className={`w-6 h-0.5 ${
                      i < currentIndex ? "bg-primary" : "bg-border-default"
                    }`}
                  />
                )}
              </div>
            );
          })}
          {order.status !== "cancelled" && (
            <>
              <div className="w-6 h-0.5 bg-border-default" />
              <button
                onClick={() => updateStatus("cancelled")}
                disabled={updating}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-error/15 text-error hover:bg-error/25 whitespace-nowrap transition-colors"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order items */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
          <h2 className="text-xs font-bold text-text-main/40 uppercase tracking-wider mb-4">
            Productos
          </h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-sm"
              >
                <div>
                  <p className="font-medium text-text-main">{item.name}</p>
                  <p className="text-text-main/40 text-xs">
                    {item.brand} — x{item.quantity}
                  </p>
                </div>
                <p className="font-medium text-text-main">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-border-subtle mt-4 pt-4 space-y-1 text-sm">
            <div className="flex justify-between text-text-main/50">
              <span>Subtotal</span>
              <span>${order.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-text-main/50">
              <span>Envío</span>
              <span>
                {order.shipping === 0
                  ? "Gratis"
                  : `$${order.shipping?.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between font-bold text-primary text-base pt-2">
              <span>Total</span>
              <span>${order.total?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping + Payment info */}
        <div className="space-y-6">
          <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
            <h2 className="text-xs font-bold text-text-main/40 uppercase tracking-wider mb-4">
              Dirección de Envío
            </h2>
            <div className="text-sm space-y-1 text-text-main/60">
              <p className="font-medium text-text-main">
                {order.shippingAddress.fullName}
              </p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city},{" "}
                {order.shippingAddress.province}
              </p>
              {order.shippingAddress.postalCode && (
                <p>CP: {order.shippingAddress.postalCode}</p>
              )}
              <p>{order.shippingAddress.country}</p>
              <p className="pt-2">Tel: {order.shippingAddress.phone}</p>
            </div>
          </div>

          {order.paymentTransactionId && (
            <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
              <h2 className="text-xs font-bold text-text-main/40 uppercase tracking-wider mb-4">
                Pago
              </h2>
              <div className="text-sm text-text-main/60 space-y-2">
                <p>
                  <span className="text-text-main/40">Transacción:</span>{" "}
                  <span className="font-mono text-text-main">
                    {order.paymentTransactionId}
                  </span>
                </p>
                {order.status === "paid" && (
                  <div className="pt-3 border-t border-border-subtle">
                    <button
                      onClick={handleRefund}
                      disabled={refunding}
                      className="w-full bg-error/15 hover:bg-error/25 text-error font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm disabled:opacity-50 cursor-pointer"
                    >
                      {refunding ? "Procesando reembolso..." : "Reembolsar pago"}
                    </button>
                    <p className="text-xs text-text-main/30 mt-2 text-center">
                      Solo antes del cierre diario (5:50 PM Datafast / 5:00 PM Medianet)
                    </p>
                  </div>
                )}
                {order.status === "refunded" && (
                  <p className="text-success font-medium pt-2">Reembolsado</p>
                )}
                {refundResult?.success && (
                  <p className="text-success text-xs font-medium">Reembolso procesado correctamente</p>
                )}
                {refundResult?.error && (
                  <p className="text-error text-xs font-medium">{refundResult.error}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
