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
} from "react-icons/fa";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pendiente",
    color: "bg-yellow-50 text-yellow-700",
    icon: <FaClock className="w-3.5 h-3.5" />,
  },
  processing: {
    label: "Procesando",
    color: "bg-blue-50 text-blue-700",
    icon: <FaCreditCard className="w-3.5 h-3.5" />,
  },
  paid: {
    label: "Pagado",
    color: "bg-green-50 text-green-700",
    icon: <FaCheckCircle className="w-3.5 h-3.5" />,
  },
  shipped: {
    label: "Enviado",
    color: "bg-indigo-50 text-indigo-700",
    icon: <FaTruck className="w-3.5 h-3.5" />,
  },
  delivered: {
    label: "Entregado",
    color: "bg-green-50 text-green-700",
    icon: <FaCheckCircle className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-50 text-red-700",
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

export default function MisPedidosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="simple-spinner" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
          <Link
            href="/mi-cuenta"
            className="text-sm text-primary hover:underline"
          >
            Mi cuenta
          </Link>
        </div>

        {loadingOrders ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="simple-spinner mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <FaBox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              No tienes pedidos
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Cuando realices una compra, aparecera aqui.
            </p>
            <Link
              href="/tienda"
              className="inline-block bg-background hover:bg-bosque-profundo-400 text-white font-medium py-2.5 px-6 rounded-lg transition-colors text-sm"
            >
              Ir a la Tienda
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">
                        Orden #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">
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
                        <span className="text-gray-600 truncate mr-2">
                          {item.name} x{item.quantity}
                        </span>
                        <span className="text-gray-900 font-medium shrink-0">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="text-xs text-gray-500">
                      {order.shippingAddress?.city},{" "}
                      {order.shippingAddress?.province}
                    </div>
                    <p className="text-base font-bold text-gray-900">
                      ${order.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
