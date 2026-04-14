"use client";

import { useEffect, useState } from "react";
import { FaExclamationTriangle, FaExternalLinkAlt, FaCheck } from "react-icons/fa";

interface AuditOrder {
  id: string;
  status: string;
  total: number;
  userEmail: string;
  paymentTransactionId: string | null;
  authorizationCode: string | null;
  missingAuthCodeLoggedAt: string | null;
  emailPending: boolean;
  emailSentAt: string | null;
  webhookStatus: string | null;
  webhookStatusDetail: number | null;
  webhookReceivedAt: string | null;
  createdAt: string | null;
}

export default function AdminAuditoriaPage() {
  const [orders, setOrders] = useState<AuditOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auditoria");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Error fetching audit orders:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  async function handleResolve(orderId: string) {
    if (!confirm(`¿Marcar orden ${orderId.slice(0, 8)} como revisada?`)) return;
    setResolving(orderId);
    try {
      const res = await fetch("/api/admin/auditoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    } catch (err) {
      console.error("Error resolving audit:", err);
    } finally {
      setResolving(null);
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-main mb-1 flex items-center gap-2">
          <FaExclamationTriangle className="text-warning w-5 h-5" />
          Auditoría de Pagos
        </h1>
        <p className="text-sm text-text-main/60">
          Órdenes donde Nuvei confirmó el pago pero no entregó código de autorización.
          Revisa cada caso manualmente y marca como resuelto cuando esté verificado.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="simple-spinner" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-surface-card border border-border-subtle rounded-xl p-10 text-center">
          <FaCheck className="w-8 h-8 text-success/60 mx-auto mb-3" />
          <p className="text-text-main/70 text-sm">
            No hay órdenes pendientes de auditoría
          </p>
          <p className="text-text-main/40 text-xs mt-1">
            Todas las órdenes tienen código de autorización correcto
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-surface-card border border-border-subtle rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-text-main/40">
                      #{o.id.slice(0, 12)}...
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[11px] rounded-full font-medium ${
                        o.status === "paid"
                          ? "bg-success/15 text-success"
                          : "bg-warning/15 text-warning"
                      }`}
                    >
                      {o.status}
                    </span>
                    {o.emailPending && (
                      <span className="px-2 py-0.5 text-[11px] rounded-full font-medium bg-info/15 text-info">
                        Email pendiente
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-main">{o.userEmail}</p>
                  <p className="text-xs text-text-main/50 mt-0.5">
                    Flagged: {formatDate(o.missingAuthCodeLoggedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-text-main">
                    ${o.total?.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-4 pt-3 border-t border-border-subtle">
                <div>
                  <span className="text-text-main/40 uppercase tracking-wide">
                    Transaction ID
                  </span>
                  <p className="font-mono text-text-main mt-0.5 break-all">
                    {o.paymentTransactionId || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-text-main/40 uppercase tracking-wide">
                    Auth Code
                  </span>
                  <p className="font-mono mt-0.5">
                    {o.authorizationCode ? (
                      <span className="text-success">{o.authorizationCode}</span>
                    ) : (
                      <span className="text-error">Sin código</span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-text-main/40 uppercase tracking-wide">
                    Webhook
                  </span>
                  <p className="mt-0.5 text-text-main/70">
                    {o.webhookReceivedAt
                      ? `${o.webhookStatus} (${o.webhookStatusDetail}) — ${formatDate(o.webhookReceivedAt)}`
                      : "No recibido"}
                  </p>
                </div>
                <div>
                  <span className="text-text-main/40 uppercase tracking-wide">
                    Email enviado
                  </span>
                  <p className="mt-0.5 text-text-main/70">
                    {o.emailSentAt ? formatDate(o.emailSentAt) : "Pendiente"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={`https://console.firebase.google.com/project/pau-henriques-web-v1/firestore/data/~2Forders~2F${o.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-xs text-center border border-border-default text-text-main/70 font-medium py-2 rounded-lg hover:bg-surface-elevated transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <FaExternalLinkAlt className="w-3 h-3" /> Ver en Firestore
                </a>
                <button
                  onClick={() => handleResolve(o.id)}
                  disabled={resolving === o.id}
                  className="flex-1 text-xs bg-success/15 text-success font-medium py-2 rounded-lg hover:bg-success/25 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  <FaCheck className="w-3 h-3" />
                  {resolving === o.id ? "Marcando..." : "Marcar como revisado"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
