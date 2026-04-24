"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaSearch,
  FaPaperPlane,
  FaCopy,
  FaCheck,
  FaTimes,
  FaExternalLinkAlt,
} from "react-icons/fa";

type AccessStatus = "pending_access" | "access_sent";

interface Enrollment {
  id: string;
  orderId: string;
  courseId: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerIdNumber: string;
  customerPhone: string;
  paidAt: string | null;
  amountPaid: number;
  accessStatus: AccessStatus;
  accessLink: string | null;
  accessSentAt: string | null;
  accessMessage?: string;
  notes?: string;
}

const STATUS_TABS: Array<{ key: "pending_access" | "access_sent" | ""; label: string }> = [
  { key: "pending_access", label: "Pendientes" },
  { key: "access_sent", label: "Enviados" },
  { key: "", label: "Todos" },
];

const inputClass =
  "bg-input-bg border border-border-default rounded-xl text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200";

export default function AdminCursosPage() {
  const [tab, setTab] = useState<"pending_access" | "access_sent" | "">("pending_access");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalEnrollment, setModalEnrollment] = useState<Enrollment | null>(null);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const url = tab ? `/api/admin/cursos/enrollments?accessStatus=${tab}` : "/api/admin/cursos/enrollments";
      const res = await fetch(url);
      if (res.ok) setEnrollments(await res.json());
    } catch (err) {
      console.error("[admin-cursos] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const filtered = useMemo(() => {
    if (!search) return enrollments;
    const q = search.toLowerCase();
    return enrollments.filter(
      (e) =>
        e.customerEmail?.toLowerCase().includes(q) ||
        e.customerFirstName?.toLowerCase().includes(q) ||
        e.customerLastName?.toLowerCase().includes(q) ||
        e.customerIdNumber?.toLowerCase().includes(q) ||
        e.orderId?.toLowerCase().includes(q),
    );
  }, [enrollments, search]);

  const counts = useMemo(() => {
    return {
      pending: enrollments.filter((e) => e.accessStatus === "pending_access").length,
      sent: enrollments.filter((e) => e.accessStatus === "access_sent").length,
    };
  }, [enrollments]);

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
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/40 to-background" />
        <div className="relative px-5 lg:px-8 pt-6 pb-4 md:pt-8 md:pb-6">
          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-1">
            Gestión
          </span>
          <h1 className="text-2xl font-semibold text-text-main">Talleres</h1>
          <p className="text-sm text-text-main/50 mt-1">
            Inscripciones al taller Tóxica sin Tóxicos. Enviá el acceso manualmente cuando esté listo.
          </p>
        </div>
      </div>

      <div className="h-px bg-linear-to-r from-transparent via-border-default to-transparent" />

      {/* Content */}
      <div className="px-5 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {STATUS_TABS.map((t) => {
            const active = tab === t.key;
            const badge =
              t.key === "pending_access"
                ? counts.pending
                : t.key === "access_sent"
                  ? counts.sent
                  : enrollments.length;
            return (
              <button
                key={t.key || "all"}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-primary text-white"
                    : "bg-surface-card border border-border-subtle text-text-main/60 hover:text-text-main hover:border-border-default"
                }`}
              >
                {t.label}
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full min-w-5 text-center ${
                    active ? "bg-white/20 text-white" : "bg-surface-elevated text-text-main/50"
                  }`}
                >
                  {loading ? "—" : badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-main/30" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, cédula o orden…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} w-full pl-9 pr-3 py-2.5`}
          />
        </div>

        {/* Table */}
        <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="simple-spinner mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-text-main/50">
              {tab === "pending_access"
                ? "No hay inscripciones pendientes de acceso."
                : tab === "access_sent"
                  ? "Todavía no enviaste acceso a nadie."
                  : "No hay inscripciones."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-elevated">
                    <th className="text-left p-4 font-medium text-text-main/50">Fecha pago</th>
                    <th className="text-left p-4 font-medium text-text-main/50">Cliente</th>
                    <th className="text-left p-4 font-medium text-text-main/50">Contacto</th>
                    <th className="text-left p-4 font-medium text-text-main/50">Cédula</th>
                    <th className="text-right p-4 font-medium text-text-main/50">Pagó</th>
                    <th className="text-center p-4 font-medium text-text-main/50">Estado</th>
                    <th className="text-right p-4 font-medium text-text-main/50">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-border-subtle hover:bg-surface-elevated transition-colors last:border-b-0"
                    >
                      <td className="p-4 text-text-main/60 text-xs whitespace-nowrap">
                        {formatDate(e.paidAt)}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-text-main">
                          {e.customerFirstName} {e.customerLastName}
                        </div>
                        <div className="text-xs text-text-main/40 font-mono">
                          Orden: {e.orderId?.slice(0, 8)}…
                        </div>
                      </td>
                      <td className="p-4">
                        <EmailCell email={e.customerEmail} />
                        <div className="text-xs text-text-main/40 mt-0.5">{e.customerPhone}</div>
                      </td>
                      <td className="p-4 text-text-main/60 font-mono text-xs">
                        {e.customerIdNumber}
                      </td>
                      <td className="p-4 text-right font-medium text-text-main">
                        ${e.amountPaid?.toFixed(2) ?? "0.00"}
                      </td>
                      <td className="p-4 text-center">
                        <StatusBadge status={e.accessStatus} />
                        {e.accessStatus === "access_sent" && e.accessSentAt && (
                          <div className="text-[10px] text-text-main/40 mt-1">
                            {formatDate(e.accessSentAt)}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {e.accessStatus === "pending_access" ? (
                          <button
                            onClick={() => setModalEnrollment(e)}
                            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <FaPaperPlane className="w-3 h-3" />
                            Enviar acceso
                          </button>
                        ) : (
                          <button
                            onClick={() => setModalEnrollment(e)}
                            className="inline-flex items-center gap-1.5 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <FaExternalLinkAlt className="w-3 h-3" />
                            Reenviar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalEnrollment && (
        <SendAccessModal
          enrollment={modalEnrollment}
          onClose={() => setModalEnrollment(null)}
          onSent={() => {
            setModalEnrollment(null);
            fetchEnrollments();
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: AccessStatus }) {
  if (status === "access_sent") {
    return (
      <span className="inline-flex items-center gap-1 bg-success/15 text-success text-xs font-medium px-2.5 py-1 rounded-full">
        <FaCheck className="w-2.5 h-2.5" />
        Enviado
      </span>
    );
  }
  return (
    <span className="bg-warning/15 text-warning text-xs font-medium px-2.5 py-1 rounded-full">
      Pendiente
    </span>
  );
}

function EmailCell({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className="text-text-main/70 text-xs truncate max-w-48">{email}</span>
      <button
        onClick={async (e) => {
          e.stopPropagation();
          try {
            await navigator.clipboard.writeText(email);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {}
        }}
        className="text-text-main/30 hover:text-primary transition-colors cursor-pointer"
        aria-label="Copiar email"
      >
        {copied ? <FaCheck className="w-3 h-3 text-success" /> : <FaCopy className="w-3 h-3" />}
      </button>
    </div>
  );
}

interface SendAccessModalProps {
  enrollment: Enrollment;
  onClose: () => void;
  onSent: () => void;
}

function SendAccessModal({ enrollment, onClose, onSent }: SendAccessModalProps) {
  const [accessLink, setAccessLink] = useState(enrollment.accessLink || "");
  const [message, setMessage] = useState(enrollment.accessMessage || "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setError(null);

    if (!accessLink.trim()) {
      setError("Ingresá el link del curso");
      return;
    }
    if (!/^https?:\/\//i.test(accessLink.trim())) {
      setError("El link debe empezar con http:// o https://");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(
        `/api/admin/cursos/enrollments/${enrollment.id}/send-access`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessLink: accessLink.trim(),
            customMessage: message.trim() || undefined,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Error al enviar el acceso");
        return;
      }
      onSent();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-card border border-border-subtle rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between p-5 border-b border-border-subtle">
          <div>
            <h2 className="font-cormorant text-xl font-semibold text-text-main">
              {enrollment.accessStatus === "access_sent" ? "Reenviar acceso" : "Enviar acceso"}
            </h2>
            <p className="text-xs text-text-main/50 mt-1">
              A <strong className="text-text-main/70">{enrollment.customerEmail}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={sending}
            className="w-8 h-8 flex items-center justify-center text-text-main/40 hover:text-text-main hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Cerrar"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label htmlFor="access-link" className="block text-xs font-medium text-text-main/60 mb-1.5">
              Link del curso <span className="text-error">*</span>
            </label>
            <input
              id="access-link"
              type="url"
              value={accessLink}
              onChange={(ev) => setAccessLink(ev.target.value)}
              placeholder="https://..."
              disabled={sending}
              autoFocus
              className={`${inputClass} w-full px-3 py-2.5`}
            />
            <p className="text-[11px] text-text-main/40 mt-1">
              Pegá la URL donde el cliente accede al curso (Kajabi, Teachable, Drive, etc.)
            </p>
          </div>

          <div>
            <label htmlFor="access-message" className="block text-xs font-medium text-text-main/60 mb-1.5">
              Mensaje personalizado (opcional)
            </label>
            <textarea
              id="access-message"
              value={message}
              onChange={(ev) => setMessage(ev.target.value)}
              placeholder="Ej: Te envío también un usuario temporal: ..."
              disabled={sending}
              rows={4}
              className={`${inputClass} w-full px-3 py-2.5 resize-none`}
            />
          </div>

          {error && (
            <div className="bg-error/10 text-error p-3 rounded-lg text-sm">{error}</div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-border-subtle bg-surface-elevated/30">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated font-medium py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !accessLink.trim()}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer disabled:bg-surface-elevated disabled:text-text-main/30"
          >
            {sending ? (
              <>
                <div className="simple-spinner w-4! h-4! border-2! border-white! border-b-transparent!" />
                Enviando…
              </>
            ) : (
              <>
                <FaPaperPlane className="w-3.5 h-3.5" />
                {enrollment.accessStatus === "access_sent" ? "Reenviar" : "Enviar ahora"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
