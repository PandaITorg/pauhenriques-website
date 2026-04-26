"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaSearch,
  FaPaperPlane,
  FaTimes,
  FaExternalLinkAlt,
  FaFileCsv,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
  FaStickyNote,
  FaSave,
  FaUndo,
} from "react-icons/fa";
import CopyButton from "@/components/ui/CopyButton";
import StatusBadge from "@/components/admin/StatusBadge";
import PhoneCell, {
  sanitizePhoneForWhatsApp,
} from "@/components/admin/PhoneCell";
import { useToastStore } from "@/stores/toast.store";
import { useConfirm } from "@/stores/confirm.store";
import TableSkeleton from "@/components/ui/TableSkeleton";

type AccessStatus = "pending_access" | "access_sent" | "refunded";

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
  paymentLinkId?: string;
  // Campos enriquecidos del order asociado
  paymentTransactionId?: string | null;
  authorizationCode?: string | null;
}

interface TallerLite {
  id: string;
  name: string;
  slug: string;
}

const STATUS_TABS: Array<{
  key: "pending_access" | "access_sent" | "refunded" | "";
  label: string;
}> = [
  { key: "pending_access", label: "Pendientes" },
  { key: "access_sent", label: "Enviados" },
  { key: "refunded", label: "Devueltos" },
  { key: "", label: "Todos" },
];

const PAGE_SIZE = 50;

const inputClass =
  "bg-input-bg border border-border-default rounded-xl text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200";

type SortKey = "paidAt" | "name" | "amount";
type SortDir = "asc" | "desc";

interface EnrollmentsSectionProps {
  /**
   * Si está, filtra inscripciones a este courseId (= taller.id en el
   * nuevo modelo). Si no, muestra el cross-taller pipeline global.
   */
  courseId?: string;
}

export default function EnrollmentsSection({ courseId }: EnrollmentsSectionProps = {}) {
  const isGlobalView = !courseId;

  const [tab, setTab] = useState<
    "pending_access" | "access_sent" | "refunded" | ""
  >("pending_access");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [talleres, setTalleres] = useState<Map<string, TallerLite>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalEnrollment, setModalEnrollment] = useState<Enrollment | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("paidAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const addToast = useToastStore((s) => s.addToast);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab) params.set("accessStatus", tab);
      if (courseId) params.set("courseId", courseId);
      const qs = params.toString();
      const url = qs
        ? `/api/admin/cursos/enrollments?${qs}`
        : "/api/admin/cursos/enrollments";
      const res = await fetch(url);
      if (res.ok) setEnrollments(await res.json());
    } catch (err) {
      console.error("[admin-cursos] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [tab, courseId]);

  // Cargar talleres SOLO en vista global, para mapear courseId → name.
  useEffect(() => {
    if (!isGlobalView) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/talleres");
        if (!res.ok) return;
        const data = (await res.json()) as { talleres: TallerLite[] };
        if (cancelled) return;
        const map = new Map<string, TallerLite>();
        for (const t of data.talleres ?? []) {
          map.set(t.id, t);
        }
        setTalleres(map);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [isGlobalView]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // Marcar la tab como vista (resetea el badge "inscripciones nuevas" del
  // sidebar) apenas el componente monta.
  useEffect(() => {
    fetch("/api/admin/talleres/inbox/mark-seen", { method: "POST" }).catch(() => {});
  }, []);

  // Reset página cuando cambia search/tab.
  useEffect(() => {
    setPage(1);
  }, [search, tab]);

  const filtered = useMemo(() => {
    if (!search.trim()) return enrollments;
    const q = search.trim().toLowerCase();
    const qDigits = q.replace(/[^\d]/g, "");
    return enrollments.filter((e) => {
      if (
        e.customerEmail?.toLowerCase().includes(q) ||
        e.customerFirstName?.toLowerCase().includes(q) ||
        e.customerLastName?.toLowerCase().includes(q) ||
        e.customerIdNumber?.toLowerCase().includes(q) ||
        e.orderId?.toLowerCase().includes(q)
      ) {
        return true;
      }
      // Búsqueda por teléfono: comparar dígitos contra dígitos para
      // matchear con o sin formato (ej. +593 99 → 59399).
      if (qDigits.length >= 3 && e.customerPhone) {
        const phoneDigits = sanitizePhoneForWhatsApp(e.customerPhone);
        if (phoneDigits.includes(qDigits)) return true;
      }
      return false;
    });
  }, [enrollments, search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "paidAt") {
        const aT = a.paidAt ? new Date(a.paidAt).getTime() : 0;
        const bT = b.paidAt ? new Date(b.paidAt).getTime() : 0;
        cmp = aT - bT;
      } else if (sortKey === "name") {
        const aN = `${a.customerFirstName ?? ""} ${a.customerLastName ?? ""}`.trim().toLowerCase();
        const bN = `${b.customerFirstName ?? ""} ${b.customerLastName ?? ""}`.trim().toLowerCase();
        cmp = aN.localeCompare(bN);
      } else if (sortKey === "amount") {
        cmp = (a.amountPaid ?? 0) - (b.amountPaid ?? 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const isAtHardLimit = enrollments.length >= 500;

  const counts = useMemo(() => {
    return {
      pending: enrollments.filter((e) => e.accessStatus === "pending_access").length,
      sent: enrollments.filter((e) => e.accessStatus === "access_sent").length,
      refunded: enrollments.filter((e) => e.accessStatus === "refunded").length,
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

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const SortHeader = ({
    label,
    column,
    align = "left",
  }: {
    label: string;
    column: SortKey;
    align?: "left" | "right" | "center";
  }) => {
    const active = sortKey === column;
    const Icon = !active ? FaSort : sortDir === "asc" ? FaSortUp : FaSortDown;
    return (
      <th
        className={`text-${align} p-4 font-medium text-text-main/50`}
      >
        <button
          type="button"
          onClick={() => toggleSort(column)}
          className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-text-main transition-colors ${
            active ? "text-primary" : ""
          }`}
        >
          {label}
          <Icon className="w-3 h-3 opacity-70" />
        </button>
      </th>
    );
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportUrl = courseId
        ? `/api/admin/cursos/enrollments/export?courseId=${encodeURIComponent(courseId)}`
        : "/api/admin/cursos/enrollments/export";
      const res = await fetch(exportUrl);
      if (!res.ok) {
        addToast({ type: "error", message: "Error al descargar el CSV" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `inscripciones-taller-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast({ type: "success", message: "CSV descargado" });
    } catch (err) {
      console.error("[admin-cursos] export error:", err);
      addToast({ type: "error", message: "Error al descargar el CSV" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex flex-wrap gap-2 flex-1">
          {STATUS_TABS.map((t) => {
            const active = tab === t.key;
            const badge =
              t.key === "pending_access"
                ? counts.pending
                : t.key === "access_sent"
                  ? counts.sent
                  : t.key === "refunded"
                    ? counts.refunded
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
        <button
          onClick={handleExport}
          disabled={exporting || loading || enrollments.length === 0}
          className="inline-flex items-center gap-2 border border-border-default text-text-main/70 hover:text-text-main hover:bg-surface-elevated text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Exportar a CSV"
        >
          <FaFileCsv className="w-3.5 h-3.5" />
          {exporting ? "Descargando…" : "Exportar CSV"}
        </button>
      </div>

      <div className="relative mb-5">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-main/30" />
        <input
          type="text"
          placeholder="Buscar por nombre, email, teléfono, cédula u orden…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} w-full pl-9 pr-3 py-2.5`}
        />
      </div>

      {isAtHardLimit && (
        <div className="mb-3 bg-warning/10 border border-warning/30 text-warning text-xs p-3 rounded-lg">
          Mostrando los primeros 500 resultados. Refiná la búsqueda o el
          filtro para ver más específicos.
        </div>
      )}

      <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden">
        {loading ? (
          <TableSkeleton
            rows={6}
            showLeading
            columnWidths={
              isGlobalView
                ? ["12%", "18%", "16%", "16%", "14%", "8%", "8%", "8%", "8%"]
                : ["12%", "18%", "20%", "16%", "10%", "8%", "8%", "8%"]
            }
          />
        ) : sorted.length === 0 ? (
          <div className="p-8 text-center text-text-main/50">
            {tab === "pending_access"
              ? "No hay inscripciones pendientes de acceso."
              : tab === "access_sent"
                ? "Todavía no enviaste acceso a nadie."
                : tab === "refunded"
                  ? "No hay inscripciones devueltas."
                  : "No hay inscripciones."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-elevated">
                  <SortHeader label="Fecha pago" column="paidAt" />
                  <SortHeader label="Cliente" column="name" />
                  {isGlobalView && (
                    <th className="text-left p-4 font-medium text-text-main/50">
                      Taller
                    </th>
                  )}
                  <th className="text-left p-4 font-medium text-text-main/50">
                    Contacto
                  </th>
                  <th className="text-left p-4 font-medium text-text-main/50">
                    Pago
                  </th>
                  <SortHeader label="Pagó" column="amount" align="right" />
                  <th className="text-center p-4 font-medium text-text-main/50">
                    Notas
                  </th>
                  <th className="text-center p-4 font-medium text-text-main/50">
                    Estado
                  </th>
                  <th className="text-right p-4 font-medium text-text-main/50">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((e) => {
                  const taller = isGlobalView
                    ? talleres.get(e.courseId)
                    : null;
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-border-subtle hover:bg-surface-elevated transition-colors last:border-b-0 align-top"
                    >
                      <td className="p-4 text-text-main/60 text-xs whitespace-nowrap">
                        {formatDate(e.paidAt)}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-text-main">
                          {e.customerFirstName} {e.customerLastName}
                        </div>
                        <div className="text-[11px] text-text-main/40 font-mono mt-0.5">
                          {e.customerIdNumber}
                        </div>
                        <div className="text-[10px] text-text-main/30 font-mono mt-0.5">
                          Orden: {e.orderId?.slice(0, 8)}…
                        </div>
                      </td>
                      {isGlobalView && (
                        <td className="p-4 text-xs">
                          {taller ? (
                            <span className="inline-flex flex-col">
                              <span className="text-text-main/80 font-medium">
                                {taller.name}
                              </span>
                              <code className="text-[10px] text-text-main/40 mt-0.5">
                                {taller.slug}
                              </code>
                            </span>
                          ) : (
                            <span className="text-text-main/40">—</span>
                          )}
                        </td>
                      )}
                      <td className="p-4">
                        <EmailCell email={e.customerEmail} />
                        <div className="mt-1">
                          <PhoneCell phone={e.customerPhone} />
                        </div>
                      </td>
                      <td className="p-4 text-[11px]">
                        <PaymentMetaCell
                          transactionId={e.paymentTransactionId ?? null}
                          authCode={e.authorizationCode ?? null}
                        />
                      </td>
                      <td className="p-4 text-right font-medium text-text-main whitespace-nowrap">
                        ${e.amountPaid?.toFixed(2) ?? "0.00"}
                      </td>
                      <td className="p-4 text-center">
                        <NotesIndicator notes={e.notes} />
                      </td>
                      <td className="p-4 text-center">
                        <AccessStatusBadge status={e.accessStatus} />
                        {e.accessStatus === "access_sent" && e.accessSentAt && (
                          <div className="text-[10px] text-text-main/40 mt-1">
                            {formatDate(e.accessSentAt)}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <EnrollmentActions
                          enrollment={e}
                          onSendAccess={() => setModalEnrollment(e)}
                          onChange={fetchEnrollments}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && sorted.length > 0 && (
        <PaginationControls
          page={safePage}
          totalPages={totalPages}
          totalItems={sorted.length}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      )}

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
    </>
  );
}

function EnrollmentActions({
  enrollment,
  onSendAccess,
  onChange,
}: {
  enrollment: Enrollment;
  onSendAccess: () => void;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();
  const addToast = useToastStore((s) => s.addToast);

  const handleMarkRefunded = async () => {
    const ok = await confirm({
      title: "¿Marcar como devuelta?",
      description:
        "Esta acción solo cambia el registro a 'Devuelto'. NO ejecuta ningún reembolso real ni cobro al banco. Usalo cuando ya devolviste el dinero por fuera del sistema (ej. transferencia bancaria directa).",
      confirmLabel: "Marcar devuelta",
      variant: "destructive",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/cursos/enrollments/${enrollment.id}/mark-refunded`,
        { method: "POST" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        addToast({
          type: "error",
          message: data?.error || "No se pudo marcar como devuelta",
        });
        return;
      }
      addToast({ type: "success", message: "Marcada como devuelta" });
      onChange();
    } finally {
      setBusy(false);
    }
  };

  if (enrollment.accessStatus === "refunded") {
    return (
      <span className="text-xs text-text-main/40">—</span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 justify-end">
      {enrollment.accessStatus === "pending_access" ? (
        <button
          onClick={onSendAccess}
          disabled={busy}
          className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <FaPaperPlane className="w-3 h-3" />
          Enviar acceso
        </button>
      ) : (
        <button
          onClick={onSendAccess}
          disabled={busy}
          className="inline-flex items-center gap-1.5 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <FaExternalLinkAlt className="w-3 h-3" />
          Reenviar
        </button>
      )}
      <button
        onClick={handleMarkRefunded}
        disabled={busy}
        title="Marcar como devuelta (refund manual ejecutado fuera del sistema)"
        className="inline-flex items-center gap-1.5 border border-error/30 text-error/80 hover:text-error hover:bg-error/10 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <FaUndo className="w-3 h-3" />
      </button>
    </div>
  );
}

function NotesIndicator({ notes }: { notes?: string | null }) {
  if (!notes || !notes.trim()) {
    return <span className="text-text-main/20 text-xs">—</span>;
  }
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary cursor-help"
      title={notes}
    >
      <FaStickyNote className="w-3 h-3" />
    </span>
  );
}

function AccessStatusBadge({ status }: { status: AccessStatus }) {
  if (status === "access_sent") {
    return (
      <StatusBadge tone="success">Enviado</StatusBadge>
    );
  }
  if (status === "refunded") {
    return <StatusBadge tone="neutral">Devuelto</StatusBadge>;
  }
  return <StatusBadge tone="warning">Pendiente</StatusBadge>;
}

function EmailCell({ email }: { email: string }) {
  if (!email) return <span className="text-text-main/40 text-xs">—</span>;
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <a
        href={`mailto:${email}`}
        onClick={(e) => e.stopPropagation()}
        className="text-text-main/70 hover:text-primary transition-colors truncate max-w-48"
        title={email}
      >
        {email}
      </a>
      <CopyButton text={email} ariaLabel="Copiar email" />
    </div>
  );
}

function PaymentMetaCell({
  transactionId,
  authCode,
}: {
  transactionId: string | null;
  authCode: string | null;
}) {
  if (!transactionId && !authCode) {
    return <span className="text-text-main/40">—</span>;
  }
  return (
    <div className="space-y-1">
      {transactionId && (
        <div className="flex items-center gap-1.5">
          <span className="text-text-main/40 uppercase tracking-wider text-[9px]">TX</span>
          <code className="font-mono text-text-main/70 text-[11px]">
            {transactionId}
          </code>
          <CopyButton text={transactionId} ariaLabel="Copiar transaction ID" />
        </div>
      )}
      {authCode && (
        <div className="flex items-center gap-1.5">
          <span className="text-text-main/40 uppercase tracking-wider text-[9px]">AUTH</span>
          <code className="font-mono text-text-main/70 text-[11px]">
            {authCode}
          </code>
          <CopyButton text={authCode} ariaLabel="Copiar auth code" />
        </div>
      )}
    </div>
  );
}

function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onChange: (next: number) => void;
}) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const canPrev = page > 1;
  const canNext = page < totalPages;
  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-xs text-text-main/50">
        Mostrando <strong className="text-text-main">{from}</strong>–
        <strong className="text-text-main">{to}</strong> de{" "}
        <strong className="text-text-main">{totalItems}</strong>
      </p>
      <div className="inline-flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={!canPrev}
          className="inline-flex items-center gap-1 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <FaChevronLeft className="w-2.5 h-2.5" />
          Anterior
        </button>
        <span className="text-xs text-text-main/50 px-2 min-w-16 text-center">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={!canNext}
          className="inline-flex items-center gap-1 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Siguiente
          <FaChevronRight className="w-2.5 h-2.5" />
        </button>
      </div>
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
  const [notes, setNotes] = useState(enrollment.notes || "");
  const [initialNotes] = useState(enrollment.notes || "");
  const [sending, setSending] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addToast = useToastStore((s) => s.addToast);

  const notesChanged = notes !== initialNotes;

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
      // Si las notas cambiaron, persistirlas también en el mismo flow
      // (las notas son independientes del envío del email, pero por
      // conveniencia se guardan en la misma acción).
      if (notesChanged) {
        await fetch(`/api/admin/cursos/enrollments/${enrollment.id}/notes`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notes.trim() || null }),
        }).catch(() => {});
      }
      addToast({ type: "success", message: "Acceso enviado" });
      onSent();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const handleSaveNotes = async () => {
    setError(null);
    setSavingNotes(true);
    try {
      const res = await fetch(
        `/api/admin/cursos/enrollments/${enrollment.id}/notes`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notes.trim() || null }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        addToast({
          type: "error",
          message: data?.error || "No se pudo guardar la nota",
        });
        return;
      }
      addToast({
        type: "success",
        message: notes.trim() ? "Nota guardada" : "Nota eliminada",
      });
      onSent();
    } catch {
      addToast({ type: "error", message: "Error de conexión" });
    } finally {
      setSavingNotes(false);
    }
  };

  const sanitizedAccessLink = accessLink.trim();
  const canTestLink =
    sanitizedAccessLink.length > 0 &&
    /^https?:\/\//i.test(sanitizedAccessLink);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-card border border-border-subtle rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
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
            disabled={sending || savingNotes}
            className="w-8 h-8 flex items-center justify-center text-text-main/40 hover:text-text-main hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Cerrar"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label htmlFor="access-link" className="block text-xs font-medium text-text-main/60 mb-1.5">
              Link del curso <span className="text-error">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="access-link"
                type="url"
                value={accessLink}
                onChange={(ev) => setAccessLink(ev.target.value)}
                placeholder="https://..."
                disabled={sending || savingNotes}
                autoFocus
                className={`${inputClass} flex-1 px-3 py-2.5`}
              />
              <a
                href={canTestLink ? sanitizedAccessLink : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!canTestLink}
                className={`inline-flex items-center gap-1.5 border border-border-default text-xs font-medium px-3 py-2.5 rounded-xl transition-colors ${
                  canTestLink
                    ? "text-text-main/70 hover:text-text-main hover:bg-surface-elevated cursor-pointer"
                    : "text-text-main/30 cursor-not-allowed pointer-events-none opacity-50"
                }`}
                title="Abrir link en nueva pestaña"
              >
                <FaExternalLinkAlt className="w-3 h-3" />
                Probar
              </a>
            </div>
            <p className="text-[11px] text-text-main/40 mt-1">
              URL donde el cliente accede al curso (Kajabi, Teachable, Drive, etc.). Probá antes de enviar.
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
              disabled={sending || savingNotes}
              rows={3}
              className={`${inputClass} w-full px-3 py-2.5 resize-none`}
            />
            <p className="text-[11px] text-text-main/40 mt-1">
              Texto extra que va dentro del email al cliente.
            </p>
          </div>

          <div className="border-t border-border-subtle pt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="notes" className="block text-xs font-medium text-text-main/60">
                Notas internas (no visibles al cliente)
              </label>
              {notesChanged && (
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes || sending}
                  className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:text-primary-hover font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingNotes ? (
                    <div className="simple-spinner w-3! h-3! border-2! border-primary! border-b-transparent!" />
                  ) : (
                    <FaSave className="w-3 h-3" />
                  )}
                  Guardar nota
                </button>
              )}
            </div>
            <textarea
              id="notes"
              value={notes}
              onChange={(ev) => setNotes(ev.target.value)}
              placeholder="Ej: Cliente pidió factura a nombre de su empresa…"
              disabled={sending || savingNotes}
              rows={3}
              maxLength={2000}
              className={`${inputClass} w-full px-3 py-2.5 resize-none`}
            />
            <p className="text-[11px] text-text-main/40 mt-1">
              Para registrar info interna (acuerdos, comprobantes, etc.).
              Dejá vacío para borrar.
            </p>
          </div>

          {error && (
            <div className="bg-error/10 text-error p-3 rounded-lg text-sm">{error}</div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-border-subtle bg-surface-elevated/30">
          <button
            onClick={onClose}
            disabled={sending || savingNotes}
            className="flex-1 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated font-medium py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={sending || savingNotes || !accessLink.trim()}
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
