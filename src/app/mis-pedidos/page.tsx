"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getOrdersByUser } from "@/services/firestore/orderService";
import { Order, OrderStatus } from "@/types/order";
import {
  FaBox,
  FaClock,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaCreditCard,
  FaTimes,
  FaMapMarkerAlt,
  FaChevronRight,
  FaArrowLeft,
} from "react-icons/fa";

/* ─── Status config ─── */
const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pendiente",
    color: "bg-warning/15 text-warning",
    icon: <FaClock className="w-3.5 h-3.5" />,
  },
  processing: {
    label: "Procesando",
    color: "bg-info/15 text-info",
    icon: <FaCreditCard className="w-3.5 h-3.5" />,
  },
  paid: {
    label: "Pagado",
    color: "bg-success/15 text-success",
    icon: <FaCheckCircle className="w-3.5 h-3.5" />,
  },
  shipped: {
    label: "Enviado",
    color: "bg-primary/15 text-primary",
    icon: <FaTruck className="w-3.5 h-3.5" />,
  },
  delivered: {
    label: "Entregado",
    color: "bg-success/15 text-success",
    icon: <FaCheckCircle className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-error/15 text-error",
    icon: <FaTimesCircle className="w-3.5 h-3.5" />,
  },
  failed: {
    label: "Fallido",
    color: "bg-error/15 text-error",
    icon: <FaTimesCircle className="w-3.5 h-3.5" />,
  },
};

function formatDate(timestamp: { seconds: number } | Date | null): string {
  if (!timestamp) return "—";
  const date =
    "seconds" in timestamp
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
  return date.toLocaleDateString("es-EC", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ─── Order Detail Drawer ─── */
function OrderDrawer({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative w-full max-w-md bg-surface-card border-l border-border-subtle h-full overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-surface-card border-b border-border-subtle p-5 flex items-center justify-between z-10">
          <div>
            <p className="text-xs text-text-main/40 font-mono">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-sm text-text-main/50">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-main/40 hover:text-text-main hover:bg-surface-elevated transition-colors"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-main">Estado</span>
            <span
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${status.color}`}
            >
              {status.icon}
              {status.label}
            </span>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-sm font-semibold text-text-main mb-3">
              Productos
            </h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-surface-elevated rounded-lg p-3"
                >
                  <div className="w-12 h-12 bg-surface-card border border-border-subtle rounded-lg flex items-center justify-center shrink-0">
                    <FaBox className="w-4 h-4 text-text-main/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-main truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-text-main/50">
                      {item.brand} · Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-text-main shrink-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-surface-elevated rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-main/50">Subtotal</span>
              <span className="text-text-main">
                ${order.subtotal?.toFixed(2) || order.total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-main/50">Envío</span>
              <span className="text-text-main">
                ${order.shipping?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="border-t border-border-subtle pt-2 flex justify-between">
              <span className="font-semibold text-text-main">Total</span>
              <span className="font-bold text-primary text-lg">
                ${order.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div>
              <h3 className="text-sm font-semibold text-text-main mb-3 flex items-center gap-2">
                <FaMapMarkerAlt className="w-3.5 h-3.5 text-text-main/40" />
                Dirección de envío
              </h3>
              <div className="bg-surface-elevated rounded-lg p-4 text-sm space-y-1">
                <p className="font-medium text-text-main">
                  {order.shippingAddress.fullName}
                </p>
                <p className="text-text-main/60">
                  {order.shippingAddress.address}
                </p>
                <p className="text-text-main/60">
                  {order.shippingAddress.city},{" "}
                  {order.shippingAddress.province}
                  {order.shippingAddress.postalCode
                    ? ` · ${order.shippingAddress.postalCode}`
                    : ""}
                </p>
                <p className="text-text-main/60">
                  {order.shippingAddress.phone}
                </p>
              </div>
            </div>
          )}

          {/* Payment info */}
          <div>
            <h3 className="text-sm font-semibold text-text-main mb-3 flex items-center gap-2">
              <FaCreditCard className="w-3.5 h-3.5 text-text-main/40" />
              Información de pago
            </h3>
            <div className="bg-surface-elevated rounded-lg p-4 text-sm space-y-2">
              {order.paymentTransactionId && (
                <div className="flex justify-between">
                  <span className="text-text-main/50">Transaction ID</span>
                  <span className="font-mono text-text-main text-xs">
                    {order.paymentTransactionId}
                  </span>
                </div>
              )}
              {order.paymentToken && (
                <div className="flex justify-between">
                  <span className="text-text-main/50">Token</span>
                  <span className="font-mono text-text-main text-xs">
                    ····{order.paymentToken.slice(-8)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function MisPedidosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in?redirect=/mis-pedidos");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function fetchOrders() {
      try {
        const data = await getOrdersByUser(user!.uid);
        setOrders(data);
      } catch (err) {
        console.error("Error loading orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    }
    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="simple-spinner" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/mi-cuenta"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-main/40 hover:text-text-main hover:bg-surface-card transition-colors"
            >
              <FaArrowLeft className="w-3.5 h-3.5" />
            </Link>
            <h1 className="font-cormorant text-2xl font-semibold text-text-main">
              Mis Pedidos
            </h1>
          </div>
          <Link
            href="/mi-cuenta"
            className="text-sm text-primary hover:text-primary-hover transition-colors"
          >
            Mi cuenta
          </Link>
        </div>

        {loadingOrders ? (
          <div className="bg-surface-card border border-border-subtle rounded-xl p-8 text-center">
            <div className="simple-spinner mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          /* ─── Empty state ─── */
          <div className="bg-surface-card border border-border-subtle rounded-xl p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mx-auto mb-4">
              <FaBox className="w-7 h-7 text-text-main/20" />
            </div>
            <h2 className="text-lg font-semibold text-text-main mb-1">
              No tienes pedidos aún
            </h2>
            <p className="text-sm text-text-main/50 mb-6">
              Cuando realices una compra, aparecerá aquí.
            </p>
            <Link
              href="/tienda"
              className="inline-block bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-6 rounded-lg transition-colors text-sm"
            >
              Ir a la Tienda
            </Link>
          </div>
        ) : (
          /* ─── Orders list ─── */
          <div className="space-y-4">
            {orders.map((order) => {
              const status =
                STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left bg-surface-card border border-border-subtle rounded-xl p-5 hover:border-border-strong transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-text-main/40 mb-0.5 font-mono">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-text-main/50">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}
                    >
                      {status.icon}
                      {status.label}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-text-main/60 truncate mr-2">
                          {item.name} x{item.quantity}
                        </span>
                        <span className="text-text-main font-medium shrink-0">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-border-subtle pt-3">
                    <div className="text-xs text-text-main/40">
                      {order.shippingAddress?.city},{" "}
                      {order.shippingAddress?.province}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-primary">
                        ${order.total.toFixed(2)}
                      </p>
                      <FaChevronRight className="w-3 h-3 text-text-main/20 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Order detail drawer */}
      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
