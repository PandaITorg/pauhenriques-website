"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  paid: "Pagado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  processing: "bg-blue-50 text-blue-700",
  paid: "bg-green-50 text-green-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

interface OrderRow {
  id: string;
  userId: string;
  total: number;
  status: string;
  createdAt: string | null;
  items: { name: string; quantity: number }[];
  shippingAddress?: { fullName: string };
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const url = statusFilter
          ? `/api/admin/orders?status=${statusFilter}`
          : "/api/admin/orders";
        const res = await fetch(url);
        if (res.ok) {
          setOrders(await res.json());
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    fetchOrders();
  }, [statusFilter]);

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="simple-spinner mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay pedidos{statusFilter ? ` con estado "${STATUS_LABELS[statusFilter]}"` : ""}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left p-4 font-medium text-gray-500">
                    Orden
                  </th>
                  <th className="text-left p-4 font-medium text-gray-500">
                    Cliente
                  </th>
                  <th className="text-left p-4 font-medium text-gray-500">
                    Items
                  </th>
                  <th className="text-right p-4 font-medium text-gray-500">
                    Total
                  </th>
                  <th className="text-center p-4 font-medium text-gray-500">
                    Estado
                  </th>
                  <th className="text-left p-4 font-medium text-gray-500">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="font-mono text-primary hover:underline"
                      >
                        {order.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="p-4 text-gray-600">
                      {order.shippingAddress?.fullName || order.userId.slice(0, 8)}
                    </td>
                    <td className="p-4 text-gray-600">
                      {order.items?.length || 0} productos
                    </td>
                    <td className="p-4 text-right font-medium text-gray-900">
                      ${order.total?.toFixed(2) || "0.00"}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
