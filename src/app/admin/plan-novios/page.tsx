"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaGift } from "react-icons/fa";

interface PlanSummary {
  id: string;
  partner1Name: string;
  partner2Name: string;
  slug: string;
  totalContributed: number;
  totalRedeemed: number;
  balance: number;
  status: string;
  isActive: boolean;
  createdAt: { _seconds: number } | string;
}

export default function AdminPlanNoviosPage() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/admin/plan-novios");
        if (!res.ok) return;
        const data = await res.json();
        setPlans(data.plans || []);
      } catch (err) {
        console.error("Error fetching plans:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const formatDate = (timestamp: { _seconds: number } | string) => {
    if (!timestamp) return "-";
    const date = typeof timestamp === "object" && "_seconds" in timestamp
      ? new Date(timestamp._seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" });
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-success/10 text-success",
      paused: "bg-warning/10 text-warning",
      completed: "bg-info/10 text-info",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-surface-elevated text-text-main/60"}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="simple-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cormorant text-2xl md:text-3xl font-semibold flex items-center gap-2">
          <FaGift className="text-primary" />
          Plan Novios
        </h1>
        <p className="text-text-main/50 text-sm">{plans.length} planes</p>
      </div>

      {plans.length === 0 ? (
        <div className="bg-surface-card border border-border-default rounded-xl p-8 text-center">
          <p className="text-text-main/50">No hay planes registrados aun.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/admin/plan-novios/${plan.id}`}
              className="block bg-surface-card border border-border-default rounded-xl p-4 hover:border-primary/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">
                      {plan.partner1Name} y {plan.partner2Name}
                    </h3>
                    {statusBadge(plan.status)}
                  </div>
                  <p className="text-text-main/40 text-xs font-mono">
                    /{plan.slug} &middot; {formatDate(plan.createdAt)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-primary font-bold text-lg">${plan.totalContributed.toFixed(2)}</p>
                  <p className="text-success text-xs">Disp: ${plan.balance.toFixed(2)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
