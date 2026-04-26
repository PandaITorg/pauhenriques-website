"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { useConfirm } from "@/stores/confirm.store";
import { useToastStore } from "@/stores/toast.store";
import Switch from "@/components/ui/Switch";
import TallerCoverUploader from "@/components/admin/talleres/TallerCoverUploader";
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

export default function TallerInfoForm({ taller }: { taller: Taller }) {
  const router = useRouter();
  const confirm = useConfirm();
  const addToast = useToastStore((s) => s.addToast);
  const [form, setForm] = useState<FormState>(() => tallerToFormState(taller));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);

  const basePriceNum = useMemo(() => Number(form.basePrice) || 0, [form.basePrice]);

  const validate = (): string | null => {
    if (!isValidTallerSlug(form.slug)) {
      return "Slug inválido (3-60 caracteres, minúsculas/números/guiones).";
    }
    if (!form.name.trim()) return "Nombre requerido.";
    if (!form.brand.trim()) return "Marca requerida.";
    if (!form.shortDescription.trim()) return "Descripción corta requerida.";
    if (!form.longDescription.trim()) return "Descripción larga requerida.";
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
    setMessage(null);
    const err = validate();
    if (err) {
      setMessage({ kind: "error", text: err });
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
      discountTiers: form.tiers.map((t) => ({
        finalPrice: Number(t.finalPrice),
        label: t.label.trim(),
        validUntil: fromEcuadorLocalInput(t.validUntilLocal)!.toISOString(),
      })),
      postPurchaseNote: form.postPurchaseNote.trim(),
      whatsappContact: form.whatsappContact.trim() || null,
      active: form.active,
    };

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/talleres/${taller.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "error", text: data.error || "Error guardando" });
        return;
      }
      setMessage({ kind: "ok", text: "Cambios guardados." });
      // Refresca el server component padre para que el header refleje cambios.
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "Error de conexión" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (form.active) {
      addToast({
        type: "warning",
        message: "Desactivá el taller antes de eliminarlo.",
      });
      return;
    }
    const ok = await confirm({
      title: `¿Eliminar "${taller.name}"?`,
      description:
        "El taller se borra de Firestore. Las inscripciones y links de pago existentes quedan intactos pero perderán la referencia. No se puede deshacer.",
      confirmLabel: "Eliminar taller",
      variant: "destructive",
    });
    if (!ok) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/talleres/${taller.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        addToast({
          type: "error",
          message: data?.error || "Error al eliminar",
        });
        return;
      }
      addToast({ type: "success", message: "Taller eliminado" });
      router.push("/admin/talleres");
    } finally {
      setSubmitting(false);
    }
  };

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="bg-surface-card border border-border-subtle rounded-xl p-5 sm:p-6 space-y-5 max-w-3xl">
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
            className={inputClass}
          />
          <p className="text-[11px] text-text-main/40 mt-1">
            URL pública: /pago/{form.slug || "<slug>"}
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
          <label className={labelClass}>Imagen de portada</label>
          <TallerCoverUploader
            value={form.coverImage}
            onChange={(url) => update("coverImage", url)}
            disabled={submitting}
          />
          <p className="text-[11px] text-text-main/40 mt-1">
            Opcional. Si la dejás vacía se usa la imagen del primer taller.
          </p>
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
              className={`${inputClass} pl-7`}
            />
          </div>
          <p className="text-[11px] text-text-main/40 mt-1">
            Precio sin descuentos. Cada tier programado calcula su % off
            contra este valor.
          </p>
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
            update("whatsappContact", e.target.value.replace(/[^0-9]/g, ""))
          }
          disabled={submitting}
          placeholder="593982839650"
          className={inputClass}
        />
        <p className="text-[11px] text-text-main/40 mt-1">
          Solo dígitos (formato wa.me, sin "+"). Vacío = usar número general.
        </p>
      </div>

      <div>
        <Switch
          checked={form.active}
          onCheckedChange={(next) => update("active", next)}
          disabled={submitting}
          label="Taller activo"
          description="Si está inactivo no se puede comprar y se oculta del link oficial."
        />
      </div>

      <div className="border-t border-border-subtle pt-5">
        <h3 className="text-sm font-semibold text-text-main mb-1">
          Descuentos programados (precio del link oficial)
        </h3>
        <p className="text-xs text-text-main/50 mb-3 leading-relaxed">
          Tiers que aplican por fecha en el link oficial /pago/{form.slug}.
          Los paymentLinks privados definen su propio precio fijo y ignoran
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
              setForm((prev) => ({ ...prev, tiers: [emptyTierDraft()] }))
            }
            disabled={submitting}
            className="mt-3 inline-flex items-center gap-2 border border-border-default text-text-main/70 hover:text-text-main hover:bg-surface-elevated font-medium py-2 px-3.5 rounded-lg transition-colors text-sm cursor-pointer disabled:opacity-50"
          >
            <FaPlus className="w-3 h-3" />
            Agregar primer tier
          </button>
        )}
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.kind === "ok"
              ? "bg-success/10 text-success"
              : "bg-error/10 text-error"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border-subtle">
        <button
          type="button"
          onClick={handleDelete}
          disabled={submitting || form.active}
          className="inline-flex items-center justify-center gap-2 border border-error/30 text-error hover:bg-error/10 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          title={form.active ? "Desactivá primero" : "Eliminar taller"}
        >
          <FaTrash className="w-3 h-3" />
          Eliminar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm cursor-pointer disabled:bg-surface-elevated disabled:text-text-main/30"
        >
          {submitting ? (
            <div className="simple-spinner w-4! h-4! border-2! border-white! border-b-transparent!" />
          ) : (
            <>
              <FaSave className="w-3.5 h-3.5" />
              Guardar cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
}
