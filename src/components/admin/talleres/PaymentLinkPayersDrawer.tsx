"use client";

import { useEffect, useState } from "react";
import { FaTimes, FaPaperPlane, FaCheck } from "react-icons/fa";
import Drawer from "@/components/ui/Drawer";
import StatusBadge from "@/components/admin/StatusBadge";
import CopyButton from "@/components/ui/CopyButton";
import PhoneCell from "@/components/admin/PhoneCell";

interface Payer {
  id: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  paidAt: string | null;
  amountPaid: number;
  accessStatus: "pending_access" | "access_sent" | "refunded";
  paymentTransactionId?: string | null;
}

interface PaymentLinkPayersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  paymentLinkId: string;
  /** Texto del header — nombre del link para contexto. */
  linkLabel: string;
  /** Pagos esperados según link.timesPaid (para validar). */
  expectedCount: number;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(s: Payer["accessStatus"]): {
  tone: "success" | "warning" | "neutral";
  text: string;
} {
  if (s === "access_sent") return { tone: "success", text: "Enviado" };
  if (s === "refunded") return { tone: "neutral", text: "Devuelto" };
  return { tone: "warning", text: "Pendiente" };
}

export default function PaymentLinkPayersDrawer({
  isOpen,
  onClose,
  paymentLinkId,
  linkLabel,
  expectedCount,
}: PaymentLinkPayersDrawerProps) {
  const [payers, setPayers] = useState<Payer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/cursos/enrollments?paymentLinkId=${encodeURIComponent(paymentLinkId)}`,
        );
        if (!res.ok) {
          if (!cancelled) setError("No se pudo cargar la lista");
          return;
        }
        const list = (await res.json()) as Payer[];
        if (!cancelled) setPayers(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setError("Error de conexión");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, paymentLinkId]);

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <div className="flex items-start justify-between p-5 border-b border-border-subtle">
        <div>
          <h2 className="font-cormorant text-xl font-semibold text-text-main">
            Pagos del link
          </h2>
          <p className="text-xs text-text-main/50 mt-1 truncate max-w-72">
            {linkLabel}
          </p>
          <p className="text-[11px] text-text-main/40 mt-1">
            {expectedCount} pago{expectedCount === 1 ? "" : "s"} registrado
            {expectedCount === 1 ? "" : "s"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-text-main/40 hover:text-text-main hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
          aria-label="Cerrar"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="simple-spinner mx-auto" />
          </div>
        ) : error ? (
          <div className="bg-error/10 text-error p-3 rounded-lg text-sm">
            {error}
          </div>
        ) : payers.length === 0 ? (
          <p className="text-sm text-text-main/50 text-center py-8">
            Aún no hay pagos registrados para este link.
          </p>
        ) : (
          payers.map((p) => {
            const st = statusLabel(p.accessStatus);
            const Icon = p.accessStatus === "access_sent" ? FaCheck : FaPaperPlane;
            return (
              <div
                key={p.id}
                className="bg-surface-card border border-border-subtle rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-medium text-text-main text-sm">
                      {p.customerFirstName} {p.customerLastName}
                    </p>
                    <p className="text-[11px] text-text-main/50 mt-0.5">
                      {formatDate(p.paidAt)}
                    </p>
                  </div>
                  <StatusBadge tone={st.tone} icon={Icon} size="xs">
                    {st.text}
                  </StatusBadge>
                </div>
                <div className="flex items-center gap-2 text-xs mb-1.5">
                  <a
                    href={`mailto:${p.customerEmail}`}
                    className="text-text-main/70 hover:text-primary transition-colors truncate max-w-56"
                  >
                    {p.customerEmail}
                  </a>
                  <CopyButton text={p.customerEmail} ariaLabel="Copiar email" />
                </div>
                <PhoneCell phone={p.customerPhone} />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
                  <span className="text-xs text-text-main/40">
                    {p.paymentTransactionId && (
                      <code className="font-mono">
                        {p.paymentTransactionId}
                      </code>
                    )}
                  </span>
                  <span className="font-semibold text-text-main text-sm">
                    ${p.amountPaid?.toFixed(2) ?? "0.00"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Drawer>
  );
}
