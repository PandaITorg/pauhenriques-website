"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaPlus,
  FaPencilAlt,
  FaTrash,
  FaPowerOff,
  FaBan,
  FaTimes,
} from "react-icons/fa";
import DiscountTiersEditor, {
  emptyTierDraft,
  fromEcuadorLocalInput,
  rawTierToDraft,
  type TierDraft,
} from "@/components/admin/DiscountTiersEditor";
import {
  TALLER_PRICE_MAX,
  TALLER_PRICE_MIN,
  isValidTallerSlug,
  type Taller,
} from "@/lib/talleres/types";

const inputClass =
  "w-full bg-input-bg border border-border-default rounded-xl text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 px-3 py-2.5";
const labelClass = "block text-xs font-medium text-text-main/60 mb-1.5";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface CountsByTaller {
  links: Map<string, number>;
  enrollments: Map<string, number>;
}

export default function TalleresSection() {
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [counts, setCounts] = useState<CountsByTaller>({
    links: new Map(),
    enrollments: new Map(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Taller | "new" | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [talleresRes, linksRes, enrollmentsRes] = await Promise.all([
        fetch("/api/admin/talleres"),
        fetch("/api/admin/payment-links"),
        fetch("/api/admin/cursos/enrollments"),
      ]);
      if (!talleresRes.ok) {
        setError("No se pudo cargar la lista");
        return;
      }
      const data = (await talleresRes.json()) as { talleres: Taller[] };
      setTalleres(data.talleres ?? []);

      const linkCounts = new Map<string, number>();
      if (linksRes.ok) {
        const d = (await linksRes.json()) as {
          links: Array<{ tallerId: string; active: boolean; expiresAt: string }>;
        };
        const now = Date.now();
        for (const l of d.links ?? []) {
          if (!l.active) continue;
          if (new Date(l.expiresAt).getTime() < now) continue;
          linkCounts.set(l.tallerId, (linkCounts.get(l.tallerId) ?? 0) + 1);
        }
      }

      const enrollmentCounts = new Map<string, number>();
      if (enrollmentsRes.ok) {
        const list = (await enrollmentsRes.json()) as Array<{ courseId: string }>;
        for (const e of list ?? []) {
          enrollmentCounts.set(
            e.courseId,
            (enrollmentCounts.get(e.courseId) ?? 0) + 1,
          );
        }
      }

      setCounts({ links: linkCounts, enrollments: enrollmentCounts });
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-text-main/50">
          Talleres activos:{" "}
          <strong className="text-text-main">
            {talleres.filter((t) => t.active).length}
          </strong>
        </p>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Nuevo taller
        </button>
      </div>

      {error && (
        <div className="bg-error/10 text-error p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="simple-spinner mx-auto" />
          </div>
        ) : talleres.length === 0 ? (
          <div className="p-8 text-center text-text-main/50">
            Todavía no hay talleres. Creá el primero.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-elevated">
                  <th className="text-left p-4 font-medium text-text-main/50">
                    Taller
                  </th>
                  <th className="text-right p-4 font-medium text-text-main/50">
                    Precio base
                  </th>
                  <th className="text-center p-4 font-medium text-text-main/50">
                    Links activos
                  </th>
                  <th className="text-center p-4 font-medium text-text-main/50">
                    Inscripciones
                  </th>
                  <th className="text-center p-4 font-medium text-text-main/50">
                    Estado
                  </th>
                  <th className="text-right p-4 font-medium text-text-main/50">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {talleres.map((t) => (
                  <TallerRow
                    key={t.id}
                    taller={t}
                    linksCount={counts.links.get(t.id) ?? 0}
                    enrollmentsCount={counts.enrollments.get(t.id) ?? 0}
                    onEdit={() => setEditing(t)}
                    onChange={fetchAll}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <TallerFormModal
          taller={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchAll();
          }}
        />
      )}
    </>
  );
}

function TallerRow({
  taller,
  linksCount,
  enrollmentsCount,
  onEdit,
  onChange,
}: {
  taller: Taller;
  linksCount: number;
  enrollmentsCount: number;
  onEdit: () => void;
  onChange: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const goToDetail = () => router.push(`/admin/talleres/${taller.id}`);
  const stop = (handler: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    handler();
  };

  const toggleActive = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/talleres/${taller.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !taller.active }),
      });
      onChange();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (taller.active) {
      alert("Desactivá el taller antes de eliminarlo.");
      return;
    }
    if (!confirm(`¿Eliminar el taller "${taller.name}"? No se puede deshacer.`))
      return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/talleres/${taller.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Error al eliminar");
        return;
      }
      onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr
      onClick={goToDetail}
      className="border-b border-border-subtle hover:bg-surface-elevated transition-colors last:border-b-0 cursor-pointer"
    >
      <td className="p-4 min-w-64">
        <div className="font-medium text-text-main">{taller.name}</div>
        <div className="flex items-center gap-2 mt-1">
          <code className="text-[11px] text-text-main/60 bg-surface-elevated px-1.5 py-0.5 rounded">
            {taller.slug}
          </code>
          <span className="text-[11px] text-text-main/40">
            actualizado {formatDateTime(taller.updatedAt)}
          </span>
        </div>
      </td>
      <td className="p-4 text-right font-semibold text-text-main whitespace-nowrap">
        ${taller.basePrice.toFixed(2)}
      </td>
      <td className="p-4 text-center font-medium text-text-main">
        {linksCount}
      </td>
      <td className="p-4 text-center font-medium text-text-main">
        {enrollmentsCount}
      </td>
      <td className="p-4 text-center">
        {taller.active ? (
          <span className="bg-success/15 text-success text-xs font-medium px-2.5 py-1 rounded-full">
            Activo
          </span>
        ) : (
          <span className="bg-text-main/10 text-text-main/60 text-xs font-medium px-2.5 py-1 rounded-full">
            Inactivo
          </span>
        )}
      </td>
      <td className="p-4 text-right">
        <div className="inline-flex items-center gap-1.5">
          <button
            onClick={stop(onEdit)}
            className="inline-flex items-center gap-1.5 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Editar"
          >
            <FaPencilAlt className="w-3 h-3" />
          </button>
          <button
            onClick={stop(toggleActive)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            title={taller.active ? "Desactivar" : "Reactivar"}
          >
            {taller.active ? (
              <FaBan className="w-3 h-3" />
            ) : (
              <FaPowerOff className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={stop(remove)}
            disabled={busy || taller.active}
            className="inline-flex items-center gap-1.5 border border-error/30 text-error hover:bg-error/10 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title={taller.active ? "Desactivá primero" : "Eliminar"}
          >
            <FaTrash className="w-3 h-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

interface FormState {
  slug: string;
  name: string;
  brand: string;
  shortDescription: string;
  longDescription: string;
  coverImage: string;
  basePrice: string;
  postPurchaseNote: string;
  whatsappContact: string;
  active: boolean;
  tiers: TierDraft[];
}

function tallerToFormState(t: Taller): FormState {
  return {
    slug: t.slug,
    name: t.name,
    brand: t.brand,
    shortDescription: t.shortDescription,
    longDescription: t.longDescription,
    coverImage: t.coverImage,
    basePrice: String(t.basePrice),
    postPurchaseNote: t.postPurchaseNote,
    whatsappContact: t.whatsappContact ?? "",
    active: t.active,
    tiers: t.discountTiers.map(rawTierToDraft),
  };
}

const EMPTY_FORM: FormState = {
  slug: "",
  name: "",
  brand: "Pau Henriques",
  shortDescription: "",
  longDescription: "",
  coverImage: "",
  basePrice: "",
  postPurchaseNote: "",
  whatsappContact: "",
  active: true,
  tiers: [],
};

function TallerFormModal({
  taller,
  onClose,
  onSaved,
}: {
  taller: Taller | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = taller !== null;
  const [form, setForm] = useState<FormState>(() =>
    taller ? tallerToFormState(taller) : EMPTY_FORM,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const basePriceNum = useMemo(() => Number(form.basePrice) || 0, [form.basePrice]);

  const validate = (): string | null => {
    if (!isValidTallerSlug(form.slug)) {
      return "Slug inválido (3-60 caracteres, minúsculas/números/guiones).";
    }
    if (!form.name.trim()) return "Nombre requerido.";
    if (!form.brand.trim()) return "Marca requerida.";
    if (!form.shortDescription.trim()) return "Descripción corta requerida.";
    if (!form.longDescription.trim()) return "Descripción larga requerida.";
    if (!form.coverImage.trim()) return "Imagen de portada requerida.";
    if (
      !Number.isFinite(basePriceNum) ||
      basePriceNum < TALLER_PRICE_MIN ||
      basePriceNum > TALLER_PRICE_MAX
    ) {
      return `Precio base entre $${TALLER_PRICE_MIN} y $${TALLER_PRICE_MAX}.`;
    }
    if (!form.postPurchaseNote.trim()) return "Nota post-compra requerida.";
    if (form.whatsappContact && !/^[0-9]{8,15}$/.test(form.whatsappContact)) {
      return "WhatsApp: solo dígitos (formato wa.me, sin '+').";
    }
    for (const t of form.tiers) {
      if (!t.label.trim()) return "Cada tier necesita una etiqueta.";
      const fp = Number(t.finalPrice);
      if (!Number.isFinite(fp) || fp <= 0) {
        return "Cada tier necesita un precio final válido.";
      }
      if (!t.validUntilLocal) {
        return "Cada tier necesita una fecha de expiración.";
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      brand: form.brand.trim(),
      shortDescription: form.shortDescription.trim(),
      longDescription: form.longDescription.trim(),
      coverImage: form.coverImage.trim(),
      basePrice: basePriceNum,
      discountTiers: form.tiers.map((t) => {
        const vu = fromEcuadorLocalInput(t.validUntilLocal);
        return {
          finalPrice: Number(t.finalPrice),
          label: t.label.trim(),
          validUntil: vu!.toISOString(),
        };
      }),
      postPurchaseNote: form.postPurchaseNote.trim(),
      whatsappContact: form.whatsappContact.trim() || null,
      active: form.active,
    };

    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/admin/talleres/${taller!.id}`
        : "/api/admin/talleres";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error guardando taller");
        return;
      }
      onSaved();
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-card border border-border-subtle rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-start justify-between p-5 border-b border-border-subtle">
          <div>
            <h2 className="font-cormorant text-xl font-semibold text-text-main">
              {isEdit ? "Editar taller" : "Nuevo taller"}
            </h2>
            <p className="text-xs text-text-main/50 mt-0.5">
              Los talleres se venden vía links de pago en /pago/t/[token].
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 flex items-center justify-center text-text-main/40 hover:text-text-main hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Cerrar"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Slug <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => update("slug", e.target.value.toLowerCase())}
                disabled={submitting}
                placeholder="toxica-sin-toxicos"
                className={inputClass}
              />
              <p className="text-[11px] text-text-main/40 mt-1">
                Identificador interno. Solo minúsculas, números, guiones.
              </p>
            </div>
            <div>
              <label className={labelClass}>
                Marca <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => update("brand", e.target.value)}
                disabled={submitting}
                maxLength={80}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Nombre <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              disabled={submitting}
              maxLength={120}
              placeholder="Tóxica sin Tóxicos — Taller Online"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Descripción corta <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.shortDescription}
              onChange={(e) => update("shortDescription", e.target.value)}
              disabled={submitting}
              maxLength={280}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Descripción larga <span className="text-error">*</span>
            </label>
            <textarea
              value={form.longDescription}
              onChange={(e) => update("longDescription", e.target.value)}
              disabled={submitting}
              maxLength={4000}
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Imagen de portada <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={form.coverImage}
                onChange={(e) => update("coverImage", e.target.value)}
                disabled={submitting}
                placeholder="/assets/foto.webp o https://…"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Precio base con IVA <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-main/40 text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min={TALLER_PRICE_MIN}
                  max={TALLER_PRICE_MAX}
                  value={form.basePrice}
                  onChange={(e) => update("basePrice", e.target.value)}
                  disabled={submitting}
                  placeholder="97.00"
                  className={`${inputClass} pl-7`}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Nota post-compra <span className="text-error">*</span>
            </label>
            <textarea
              value={form.postPurchaseNote}
              onChange={(e) => update("postPurchaseNote", e.target.value)}
              disabled={submitting}
              maxLength={1000}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Recibirás el acceso por correo en máximo 24 horas…"
            />
          </div>

          <div>
            <label className={labelClass}>
              WhatsApp del organizador (opcional)
            </label>
            <input
              type="text"
              value={form.whatsappContact}
              onChange={(e) =>
                update(
                  "whatsappContact",
                  e.target.value.replace(/[^0-9]/g, ""),
                )
              }
              disabled={submitting}
              placeholder="593982839650"
              className={inputClass}
            />
            <p className="text-[11px] text-text-main/40 mt-1">
              Solo dígitos (formato wa.me, sin "+"). Vacío = usar número
              general del sitio.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => update("active", e.target.checked)}
                disabled={submitting}
              />
              <span className="text-sm text-text-main">Taller activo</span>
            </label>
          </div>

          <div className="border-t border-border-subtle pt-5">
            <h3 className="text-sm font-semibold text-text-main mb-1">
              Descuentos programados
            </h3>
            <p className="text-xs text-text-main/50 mb-3 leading-relaxed">
              Tiers que se aplican por fecha cuando el taller se renderiza sin
              link fijo. Los paymentLinks definen su propio precio y ignoran
              estos tiers.
            </p>
            <DiscountTiersEditor
              value={form.tiers}
              onChange={(next) => setForm((prev) => ({ ...prev, tiers: next }))}
              basePriceWithVat={basePriceNum}
              disabled={submitting}
            />
            {form.tiers.length === 0 && (
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    tiers: [emptyTierDraft()],
                  }))
                }
                disabled={submitting}
                className="mt-3 inline-flex items-center gap-2 border border-border-default text-text-main/70 hover:text-text-main hover:bg-surface-elevated font-medium py-2 px-3.5 rounded-lg transition-colors text-sm cursor-pointer disabled:opacity-50"
              >
                <FaPlus className="w-3 h-3" />
                Agregar primer tier
              </button>
            )}
          </div>

          {error && (
            <div className="bg-error/10 text-error p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-border-subtle bg-surface-elevated/30">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 border border-border-default text-text-main/60 hover:text-text-main hover:bg-surface-elevated font-medium py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer disabled:bg-surface-elevated disabled:text-text-main/30"
          >
            {submitting ? (
              <div className="simple-spinner w-4! h-4! border-2! border-white! border-b-transparent!" />
            ) : isEdit ? (
              "Guardar cambios"
            ) : (
              "Crear taller"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
