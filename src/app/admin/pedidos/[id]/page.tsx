"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  paid: "Pagado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
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
  items: { productId: string; name: string; brand: string; price: number; quantity: number }[];
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
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
        setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdating(false);
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
      <div className="text-center py-20 text-gray-500">
        Orden no encontrada.
      </div>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <FaArrowLeft className="w-3 h-3" /> Volver a Pedidos
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Orden {orderId.slice(0, 8)}...
        </h1>
        <span className="text-sm text-gray-500">
          {formatDate(order.createdAt)}
        </span>
      </div>

      {/* Status timeline */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">
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
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
                {i < STATUS_FLOW.length - 1 && (
                  <div
                    className={`w-6 h-0.5 ${
                      i < currentIndex ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
          {order.status !== "cancelled" && (
            <>
              <div className="w-6 h-0.5 bg-gray-200" />
              <button
                onClick={() => updateStatus("cancelled")}
                disabled={updating}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 whitespace-nowrap"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order items */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">
            Productos
          </h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-sm"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-gray-500 text-xs">
                    {item.brand} — x{item.quantity}
                  </p>
                </div>
                <p className="font-medium text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>${order.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Envio</span>
              <span>
                {order.shipping === 0 ? "Gratis" : `$${order.shipping?.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2">
              <span>Total</span>
              <span>${order.total?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping + Payment info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">
              Direccion de Envio
            </h2>
            <div className="text-sm space-y-1 text-gray-600">
              <p className="font-medium text-gray-900">
                {order.shippingAddress.fullName}
              </p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.province}
              </p>
              {order.shippingAddress.postalCode && (
                <p>CP: {order.shippingAddress.postalCode}</p>
              )}
              <p>{order.shippingAddress.country}</p>
              <p className="pt-2">Tel: {order.shippingAddress.phone}</p>
            </div>
          </div>

          {order.paymentTransactionId && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">
                Pago
              </h2>
              <div className="text-sm text-gray-600">
                <p>
                  <span className="text-gray-500">Transaccion:</span>{" "}
                  <span className="font-mono">{order.paymentTransactionId}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
