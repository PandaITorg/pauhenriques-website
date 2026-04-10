"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getPlanByUserId,
  getContributions,
  getRedemptions,
} from "@/services/firestore/planNoviosService";
import type { PlanNovios, Contribution, Redemption } from "@/types/planNovios";
import { QRCodeSVG } from "qrcode.react";
import { FaCopy, FaCheck, FaGift, FaExchangeAlt } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

export default function MiPlanPage() {
  const { user, loading: authLoading } = useAuth();

  const [plan, setPlan] = useState<PlanNovios | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [noPlan, setNoPlan] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"contributions" | "redemptions">("contributions");

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const planData = await getPlanByUserId(user.uid);
      if (!planData) {
        setNoPlan(true);
        return;
      }
      setPlan(planData);

      const [contribs, redems] = await Promise.all([
        getContributions(planData.id),
        getRedemptions(planData.id),
      ]);
      setContributions(contribs);
      setRedemptions(redems);
    } catch (err) {
      console.error("Error fetching plan:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
    if (!authLoading && !user) setLoading(false);
  }, [authLoading, user, fetchData]);

  const shareUrl = plan ? `https://www.pauhenriques.com/plan-novios/${plan.slug}` : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatDate = (timestamp: any) => {
    let date: Date;
    if (timestamp && typeof timestamp === "object" && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString("es-EC", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <div className="simple-spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background text-text-main">
        <div className="text-center">
          <h1 className="font-cormorant text-3xl font-semibold mb-4">Inicia Sesion</h1>
          <p className="text-text-main/70 mb-6">Inicia sesion para ver tu Plan Novios.</p>
        </div>
      </div>
    );
  }

  if (noPlan) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background text-text-main">
        <div className="text-center">
          <h1 className="font-cormorant text-3xl font-semibold mb-4">No tienes un Plan Novios</h1>
          <p className="text-text-main/70 mb-6">Crea tu plan para empezar a recibir contribuciones.</p>
          <Link
            href="/plan-novios/registrar"
            className="bg-primary text-white font-semibold py-3 px-8 rounded-full hover:bg-primary-hover transition-all duration-200 cursor-pointer"
          >
            Crear Plan Novios
          </Link>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const paidContributions = contributions.filter((c) => c.status === "paid");

  return (
    <div className="bg-background text-text-main min-h-screen py-8 px-5">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="font-dancing-script text-primary text-lg mb-1">Plan Novios Carico</p>
          <h1 className="font-cormorant text-3xl md:text-4xl font-semibold">
            {plan.partner1Name} y {plan.partner2Name}
          </h1>
        </div>

        {/* Balance card */}
        <div className="bg-surface-card border border-border-default rounded-xl p-6 md:p-8 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-text-main/50 text-xs uppercase tracking-wider mb-1">Contribuido</p>
              <p className="text-primary text-2xl md:text-3xl font-bold">${plan.totalContributed.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-text-main/50 text-xs uppercase tracking-wider mb-1">Canjeado</p>
              <p className="text-text-main/70 text-2xl md:text-3xl font-bold">${plan.totalRedeemed.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-text-main/50 text-xs uppercase tracking-wider mb-1">Disponible</p>
              <p className="text-success text-2xl md:text-3xl font-bold">${plan.balance.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Selected products + goal progress */}
        {(plan.selectedProducts ?? []).length > 0 && (
          <div className="bg-surface-card border border-border-default rounded-xl p-6 mb-6">
            <h2 className="font-cormorant text-lg font-semibold mb-4">Tus Productos Seleccionados</h2>

            {/* Goal progress bar (novios see amounts) */}
            {(plan.goalAmount ?? 0) > 0 && (
              <div className="mb-5">
                <div className="flex justify-between text-xs text-text-main/50 mb-1.5">
                  <span>Progreso: ${plan.totalContributed.toFixed(2)} de ${(plan.goalAmount ?? 0).toFixed(2)}</span>
                  <span>{Math.min(100, Math.round((plan.totalContributed / (plan.goalAmount ?? 1)) * 100))}%</span>
                </div>
                <div className="bg-surface-elevated rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-linear-to-r from-primary/60 to-primary rounded-full h-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.round((plan.totalContributed / (plan.goalAmount ?? 1)) * 100))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Product grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(plan.selectedProducts ?? []).map((sp) => (
                <div key={sp.productId} className="flex items-center gap-3 bg-surface-elevated rounded-lg p-2.5">
                  {sp.productImage ? (
                    <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-background">
                      <Image
                        src={sp.productImage}
                        alt={sp.productName}
                        fill
                        className="object-contain"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 shrink-0 rounded-md bg-background flex items-center justify-center text-text-main/20 text-sm">?</div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-main truncate">{sp.productName}</p>
                    {sp.quantity > 1 && (
                      <p className="text-[10px] text-text-main/40">x{sp.quantity}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share section */}
        <div className="bg-surface-card border border-border-default rounded-xl p-6 mb-6">
          <h2 className="font-cormorant text-lg font-semibold mb-4">Comparte con tus Invitados</h2>

          {/* URL + copy */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 bg-input-bg border border-border-default rounded-lg text-text-main/70 text-sm font-mono truncate"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors cursor-pointer text-sm font-medium shrink-0"
            >
              {copied ? <FaCheck className="w-3.5 h-3.5" /> : <FaCopy className="w-3.5 h-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-xl inline-block">
              <QRCodeSVG
                value={shareUrl}
                size={180}
                bgColor="#ffffff"
                fgColor="#343d2a"
                level="M"
              />
            </div>
          </div>
          <p className="text-center text-text-main/40 text-xs mt-3">
            Descarga o comparte este QR con tus invitados
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-default mb-4">
          <button
            onClick={() => setActiveTab("contributions")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "contributions"
                ? "text-primary border-b-2 border-primary"
                : "text-text-main/50 hover:text-text-main/70"
            }`}
          >
            <FaGift className="w-3.5 h-3.5" />
            Contribuciones ({paidContributions.length})
          </button>
          <button
            onClick={() => setActiveTab("redemptions")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "redemptions"
                ? "text-primary border-b-2 border-primary"
                : "text-text-main/50 hover:text-text-main/70"
            }`}
          >
            <FaExchangeAlt className="w-3.5 h-3.5" />
            Canjes ({redemptions.length})
          </button>
        </div>

        {/* Contributions list */}
        {activeTab === "contributions" && (
          <div className="space-y-3">
            {paidContributions.length === 0 ? (
              <div className="bg-surface-card border border-border-default rounded-xl p-8 text-center">
                <p className="text-text-main/50">Aun no has recibido contribuciones.</p>
                <p className="text-text-main/40 text-sm mt-2">Comparte tu enlace con tus invitados para empezar.</p>
              </div>
            ) : (
              paidContributions.map((c) => (
                <div
                  key={c.id}
                  className="bg-surface-card border border-border-default rounded-xl p-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.guestName}</p>
                    {c.guestMessage && (
                      <p className="text-text-main/50 text-sm mt-1 italic truncate">
                        &ldquo;{c.guestMessage}&rdquo;
                      </p>
                    )}
                    <p className="text-text-main/40 text-xs mt-1">
                      {c.createdAt && formatDate(c.createdAt)}
                    </p>
                  </div>
                  <p className="text-primary font-bold text-lg shrink-0">
                    ${c.amount.toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Redemptions list */}
        {activeTab === "redemptions" && (
          <div className="space-y-3">
            {redemptions.length === 0 ? (
              <div className="bg-surface-card border border-border-default rounded-xl p-8 text-center">
                <p className="text-text-main/50">Aun no has realizado canjes.</p>
                <p className="text-text-main/40 text-sm mt-2">Contacta a Pau para canjear tu balance por productos Carico.</p>
              </div>
            ) : (
              redemptions.map((r) => (
                <div
                  key={r.id}
                  className="bg-surface-card border border-border-default rounded-xl p-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.description}</p>
                    <p className="text-text-main/40 text-xs mt-1">
                      {r.createdAt && formatDate(r.createdAt)}
                    </p>
                  </div>
                  <p className="text-error font-bold text-lg shrink-0">
                    -${r.amount.toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
