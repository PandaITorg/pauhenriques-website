"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaGift, FaExchangeAlt, FaArrowLeft, FaTrashAlt } from "react-icons/fa";
import Link from "next/link";

interface PlanDetail {
  id: string;
  partner1Name: string;
  partner2Name: string;
  slug: string;
  userEmail: string;
  weddingDate: { _seconds: number } | string | null;
  totalContributed: number;
  totalRedeemed: number;
  balance: number;
  status: string;
  isActive: boolean;
  createdAt: { _seconds: number } | string;
}

interface ContributionDetail {
  id: string;
  guestName: string;
  guestEmail?: string;
  guestMessage?: string;
  amount: number;
  status: string;
  createdAt: { _seconds: number } | string;
}

interface RedemptionDetail {
  id: string;
  amount: number;
  description: string;
  createdAt: { _seconds: number } | string;
}

export default function AdminPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [contributions, setContributions] = useState<ContributionDetail[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // Redeem form
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeemDescription, setRedeemDescription] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState("");

  // Status toggle
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPlanDetail();
  }, [planId]);

  async function fetchPlanDetail() {
    try {
      const res = await fetch(`/api/admin/plan-novios/${planId}`);
      if (!res.ok) return;
      const data = await res.json();
      setPlan(data.plan);
      setContributions(data.contributions || []);
      setRedemptions(data.redemptions || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (timestamp: { _seconds: number } | string | null) => {
    if (!timestamp) return "-";
    const date = typeof timestamp === "object" && "_seconds" in timestamp
      ? new Date(timestamp._seconds * 1000)
      : new Date(timestamp as string);
    return date.toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" });
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemError("");
    setRedeemSuccess("");

    const amount = parseFloat(redeemAmount);
    if (isNaN(amount) || amount <= 0) {
      setRedeemError("Monto invalido");
      return;
    }
    if (!redeemDescription.trim()) {
      setRedeemError("Descripcion requerida");
      return;
    }

    setIsRedeeming(true);

    try {
      const res = await fetch(`/api/admin/plan-novios/${planId}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, description: redeemDescription.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRedeemError(data.error || "Error al registrar canje");
        return;
      }

      setRedeemSuccess("Canje registrado exitosamente");
      setRedeemAmount("");
      setRedeemDescription("");
      fetchPlanDetail(); // Refresh data
    } catch {
      setRedeemError("Error de conexion");
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleDelete = async () => {
    if (!plan) return;
    const expectedText = `${plan.partner1Name} y ${plan.partner2Name}`;
    if (deleteConfirmText.trim() !== expectedText) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/plan-novios/${planId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin/plan-novios");
      }
    } catch (err) {
      console.error("Error deleting plan:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStatus = async () => {
    if (!plan) return;
    setIsUpdatingStatus(true);

    const newStatus = plan.status === "active" ? "paused" : "active";
    try {
      await fetch(`/api/admin/plan-novios/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, isActive: newStatus === "active" }),
      });
      fetchPlanDetail();
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="simple-spinner" />
      </div>
    );
  }

  if (!plan) {
    return <p className="text-text-main/50">Plan no encontrado.</p>;
  }

  const paidContributions = contributions.filter((c) => c.status === "paid");

  return (
    <div>
      {/* Back + header */}
      <Link
        href="/admin/plan-novios"
        className="inline-flex items-center gap-1.5 text-text-main/50 hover:text-text-main text-sm mb-4 cursor-pointer"
      >
        <FaArrowLeft className="w-3 h-3" /> Volver
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-cormorant text-2xl font-semibold">
            {plan.partner1Name} y {plan.partner2Name}
          </h1>
          <p className="text-text-main/40 text-xs font-mono mt-1">
            /{plan.slug} &middot; {plan.userEmail}
          </p>
        </div>
        <button
          onClick={toggleStatus}
          disabled={isUpdatingStatus}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            plan.status === "active"
              ? "bg-warning/10 text-warning hover:bg-warning/20"
              : "bg-success/10 text-success hover:bg-success/20"
          }`}
        >
          {plan.status === "active" ? "Pausar" : "Activar"}
        </button>
      </div>

      {/* Balance */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-card border border-border-default rounded-xl p-4 text-center">
          <p className="text-text-main/50 text-xs uppercase tracking-wider mb-1">Contribuido</p>
          <p className="text-primary text-xl font-bold">${plan.totalContributed.toFixed(2)}</p>
        </div>
        <div className="bg-surface-card border border-border-default rounded-xl p-4 text-center">
          <p className="text-text-main/50 text-xs uppercase tracking-wider mb-1">Canjeado</p>
          <p className="text-text-main/70 text-xl font-bold">${plan.totalRedeemed.toFixed(2)}</p>
        </div>
        <div className="bg-surface-card border border-border-default rounded-xl p-4 text-center">
          <p className="text-text-main/50 text-xs uppercase tracking-wider mb-1">Disponible</p>
          <p className="text-success text-xl font-bold">${plan.balance.toFixed(2)}</p>
        </div>
      </div>

      {/* Redeem form */}
      <div className="bg-surface-card border border-border-default rounded-xl p-4 mb-6">
        <h2 className="font-medium mb-3 flex items-center gap-2">
          <FaExchangeAlt className="text-primary w-4 h-4" />
          Registrar Canje
        </h2>
        <form onSubmit={handleRedeem} className="flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            placeholder="Monto"
            value={redeemAmount}
            onChange={(e) => setRedeemAmount(e.target.value)}
            step="0.01"
            min="0.01"
            className="px-3 py-2 bg-input-bg border border-border-default rounded-lg text-text-main text-sm w-full sm:w-32"
          />
          <input
            type="text"
            placeholder="Descripcion (ej: Set ollas Carico)"
            value={redeemDescription}
            onChange={(e) => setRedeemDescription(e.target.value)}
            className="px-3 py-2 bg-input-bg border border-border-default rounded-lg text-text-main text-sm flex-1"
          />
          <button
            type="submit"
            disabled={isRedeeming}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover text-sm font-medium disabled:opacity-50 cursor-pointer shrink-0"
          >
            {isRedeeming ? "Registrando..." : "Registrar"}
          </button>
        </form>
        {redeemError && <p className="text-error text-sm mt-2">{redeemError}</p>}
        {redeemSuccess && <p className="text-success text-sm mt-2">{redeemSuccess}</p>}
      </div>

      {/* Contributions */}
      <h2 className="font-medium mb-3 flex items-center gap-2">
        <FaGift className="text-primary w-4 h-4" />
        Contribuciones ({paidContributions.length})
      </h2>
      <div className="space-y-2 mb-8">
        {paidContributions.length === 0 ? (
          <p className="text-text-main/50 text-sm">Sin contribuciones aun.</p>
        ) : (
          paidContributions.map((c) => (
            <div
              key={c.id}
              className="bg-surface-card border border-border-default rounded-lg p-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{c.guestName}</p>
                {c.guestEmail && <p className="text-text-main/40 text-xs">{c.guestEmail}</p>}
                {c.guestMessage && <p className="text-text-main/50 text-xs italic mt-0.5 truncate">&ldquo;{c.guestMessage}&rdquo;</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-primary font-bold">${c.amount.toFixed(2)}</p>
                <p className="text-text-main/40 text-xs">{formatDate(c.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Redemptions */}
      <h2 className="font-medium mb-3 flex items-center gap-2">
        <FaExchangeAlt className="text-primary w-4 h-4" />
        Canjes ({redemptions.length})
      </h2>
      <div className="space-y-2 mb-12">
        {redemptions.length === 0 ? (
          <p className="text-text-main/50 text-sm">Sin canjes aun.</p>
        ) : (
          redemptions.map((r) => (
            <div
              key={r.id}
              className="bg-surface-card border border-border-default rounded-lg p-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-error font-bold">-${r.amount.toFixed(2)}</p>
                <p className="text-text-main/40 text-xs">{formatDate(r.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Danger zone */}
      <div className="border border-error/20 rounded-xl p-4 mt-8">
        <h2 className="font-medium mb-2 flex items-center gap-2 text-error">
          <FaTrashAlt className="w-3.5 h-3.5" />
          Zona Peligrosa
        </h2>
        <p className="text-text-main/50 text-sm mb-4">
          Eliminar este plan es permanente. Se borraran todas las contribuciones
          y canjes asociados. Esta accion no se puede deshacer.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 border border-error/30 text-error rounded-lg hover:bg-error/10 text-sm font-medium transition-colors cursor-pointer"
          >
            Eliminar Plan
          </button>
        ) : (
          <div className="bg-error/5 border border-error/15 rounded-lg p-4 space-y-3">
            <p className="text-sm text-text-main/70">
              Para confirmar, escribe{" "}
              <strong className="text-text-main">
                {plan.partner1Name} y {plan.partner2Name}
              </strong>{" "}
              a continuacion:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={`${plan.partner1Name} y ${plan.partner2Name}`}
              className="w-full px-3 py-2 bg-input-bg border border-error/30 rounded-lg text-text-main text-sm focus:outline-none focus:border-error"
            />
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={
                  isDeleting ||
                  deleteConfirmText.trim() !==
                    `${plan.partner1Name} y ${plan.partner2Name}`
                }
                className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {isDeleting
                  ? "Eliminando..."
                  : "Confirmar Eliminacion"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                className="px-4 py-2 border border-border-default rounded-lg text-text-main/60 hover:text-text-main text-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
