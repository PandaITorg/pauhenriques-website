"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaDice, FaPercent, FaDollarSign, FaTruck } from "react-icons/fa";
import { ALL_PARENT_CATEGORIES } from "@/constants/categories";
import type { PromotionType } from "@/types/promotion";
import PromotionDateRangePicker from "./PromotionDateRangePicker";

interface PromotionFormData {
  name: string;
  description: string;
  code: string;
  type: PromotionType;
  value: number;
  maxDiscountAmount: number | null;
  showAsBanner: boolean;
  minPurchaseAmount: number | null;
  maxTotalUses: number | null;
  maxUsesPerUser: number | null;
  validFrom: string;
  validUntil: string;
  applicableCategories: string[];
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultValidFrom(): string {
  return toLocalInputValue(new Date());
}

function defaultValidUntil(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return toLocalInputValue(d);
}

const emptyForm: PromotionFormData = {
  name: "",
  description: "",
  code: "",
  type: "percentage",
  value: 0,
  maxDiscountAmount: null,
  showAsBanner: false,
  minPurchaseAmount: null,
  maxTotalUses: null,
  maxUsesPerUser: null,
  validFrom: defaultValidFrom(),
  validUntil: defaultValidUntil(),
  applicableCategories: [],
};

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const typeOptions: { value: PromotionType; label: string; icon: typeof FaPercent }[] = [
  { value: "percentage", label: "Porcentaje", icon: FaPercent },
  { value: "fixed_amount", label: "Monto fijo", icon: FaDollarSign },
  { value: "free_shipping", label: "Envio gratis", icon: FaTruck },
];

export default function PromotionForm({
  initialData,
  promotionId,
  currentUses,
}: {
  initialData?: Partial<PromotionFormData>;
  promotionId?: string;
  currentUses?: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState<PromotionFormData>({
    ...emptyForm,
    ...initialData,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [rulesOpen, setRulesOpen] = useState(true);

  const isEdit = !!promotionId;
  const codeIsLocked = isEdit && (currentUses ?? 0) > 0;

  const set = (field: keyof PromotionFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCategory = (cat: string) => {
    setForm((prev) => ({
      ...prev,
      applicableCategories: prev.applicableCategories.includes(cat)
        ? prev.applicableCategories.filter((c) => c !== cat)
        : [...prev.applicableCategories, cat],
    }));
  };

  const previewDiscount = (() => {
    const example = 100;
    if (form.type === "percentage") {
      const d = example * (form.value / 100);
      const capped = form.maxDiscountAmount ? Math.min(d, form.maxDiscountAmount) : d;
      return `En una compra de $${example}, el descuento seria $${capped.toFixed(2)}`;
    }
    if (form.type === "fixed_amount") {
      return `En cualquier compra, el descuento seria $${form.value.toFixed(2)}`;
    }
    return "El envio sera gratuito";
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors([]);

    try {
      if (!form.validFrom || !form.validUntil) {
        throw new Error("Las fechas de inicio y fin son obligatorias");
      }
      const validFromDate = new Date(form.validFrom);
      const validUntilDate = new Date(form.validUntil);
      if (isNaN(validFromDate.getTime()) || isNaN(validUntilDate.getTime())) {
        throw new Error("Las fechas no son validas");
      }

      const payload = {
        name: form.name,
        description: form.description || undefined,
        code: form.code.toUpperCase(),
        type: form.type,
        value: form.type === "free_shipping" ? 0 : form.value,
        maxDiscountAmount: form.type === "percentage" ? form.maxDiscountAmount : undefined,
        showAsBanner: form.showAsBanner,
        rules: {
          minPurchaseAmount: form.minPurchaseAmount ?? undefined,
          maxTotalUses: form.maxTotalUses ?? undefined,
          maxUsesPerUser: form.maxUsesPerUser ?? undefined,
          validFrom: validFromDate.toISOString(),
          validUntil: validUntilDate.toISOString(),
          applicableCategories:
            form.applicableCategories.length > 0
              ? form.applicableCategories
              : undefined,
        },
      };

      const url = isEdit
        ? `/api/admin/promotions/${promotionId}`
        : "/api/admin/promotions";

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        const details = data?.details as
          | {
              formErrors?: string[];
              fieldErrors?: Record<string, string[]>;
            }
          | undefined;
        const collected: string[] = [];
        if (details?.formErrors?.length) collected.push(...details.formErrors);
        if (details?.fieldErrors) {
          for (const [field, msgs] of Object.entries(details.fieldErrors)) {
            for (const m of msgs) collected.push(`${field}: ${m}`);
          }
        }
        if (collected.length) setFieldErrors(collected);
        throw new Error(data.error || "Error al guardar");
      }

      router.push("/admin/promociones");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full p-2.5 bg-input-bg border border-border-default rounded-lg text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors";
  const labelClass = "block text-sm font-medium text-text-main/60 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-error/10 text-error p-4 rounded-lg text-sm space-y-2">
          <div>{error}</div>
          {fieldErrors.length > 0 && (
            <ul className="list-disc pl-5 text-xs opacity-90">
              {fieldErrors.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Basic info */}
        <div className="space-y-6">
          <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text-main mb-4">
              Informacion Basica
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nombre *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Black Friday 20%"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Codigo de cupon *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="BLACKFRIDAY"
                    value={form.code}
                    onChange={(e) => set("code", e.target.value.toUpperCase())}
                    className={`${inputClass} font-mono uppercase ${codeIsLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={codeIsLocked}
                    maxLength={20}
                  />
                  {!codeIsLocked && (
                    <button
                      type="button"
                      onClick={() => set("code", generateCode())}
                      className="shrink-0 px-3 py-2.5 bg-surface-elevated border border-border-default rounded-lg text-text-main/60 hover:text-text-main hover:bg-surface-card transition-colors cursor-pointer"
                      title="Generar codigo aleatorio"
                    >
                      <FaDice className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {codeIsLocked && (
                  <p className="text-xs text-text-main/40 mt-1">
                    El codigo no se puede cambiar porque ya ha sido utilizado
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>Descripcion publica</label>
                <textarea
                  rows={2}
                  placeholder="Texto visible para los usuarios (banners, checkout)"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className={inputClass}
                  maxLength={200}
                />
                <p className="text-xs text-text-main/30 mt-1">
                  {form.description.length}/200
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showAsBanner"
                  checked={form.showAsBanner}
                  onChange={(e) => set("showAsBanner", e.target.checked)}
                  className="w-4 h-4 accent-primary rounded"
                />
                <label
                  htmlFor="showAsBanner"
                  className="text-sm text-text-main/60"
                >
                  Mostrar como banner en la tienda
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Configuration */}
        <div className="space-y-6">
          <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text-main mb-4">
              Configuracion de Descuento
            </h2>
            <div className="space-y-4">
              {/* Type selection */}
              <div>
                <label className={labelClass}>Tipo de descuento *</label>
                <div className="grid grid-cols-3 gap-2">
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("type", opt.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                        form.type === opt.value
                          ? "bg-primary/15 border-primary text-primary"
                          : "bg-surface-elevated border-border-default text-text-main/50 hover:border-primary/40"
                      }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value */}
              {form.type !== "free_shipping" && (
                <div>
                  <label className={labelClass}>
                    {form.type === "percentage" ? "Porcentaje (%)" : "Monto (USD)"} *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={form.type === "percentage" ? 100 : undefined}
                    step={form.type === "percentage" ? 1 : 0.01}
                    value={form.value}
                    onChange={(e) =>
                      set("value", parseFloat(e.target.value) || 0)
                    }
                    className={inputClass}
                  />
                </div>
              )}

              {/* Max discount for percentage */}
              {form.type === "percentage" && (
                <div>
                  <label className={labelClass}>
                    Descuento maximo (USD, opcional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.maxDiscountAmount ?? ""}
                    onChange={(e) =>
                      set(
                        "maxDiscountAmount",
                        e.target.value ? parseFloat(e.target.value) : null,
                      )
                    }
                    placeholder="Sin limite"
                    className={inputClass}
                  />
                </div>
              )}

              {/* Preview */}
              <div className="bg-surface-elevated rounded-lg p-3">
                <p className="text-xs text-text-main/50">{previewDiscount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules section - collapsible */}
      <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setRulesOpen(!rulesOpen)}
          className="w-full flex items-center justify-between p-6 text-left cursor-pointer"
        >
          <h2 className="text-lg font-semibold text-text-main">
            Reglas y Restricciones
          </h2>
          <span
            className={`text-text-main/40 transition-transform duration-200 ${
              rulesOpen ? "rotate-180" : ""
            }`}
          >
            &#9660;
          </span>
        </button>

        {rulesOpen && (
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Compra minima (USD)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.minPurchaseAmount ?? ""}
                  onChange={(e) =>
                    set(
                      "minPurchaseAmount",
                      e.target.value ? parseFloat(e.target.value) : null,
                    )
                  }
                  placeholder="Sin minimo"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Usos maximos totales</label>
                <input
                  type="number"
                  min={0}
                  value={form.maxTotalUses ?? ""}
                  onChange={(e) =>
                    set(
                      "maxTotalUses",
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                  placeholder="Ilimitado"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Usos por usuario</label>
                <input
                  type="number"
                  min={0}
                  value={form.maxUsesPerUser ?? ""}
                  onChange={(e) =>
                    set(
                      "maxUsesPerUser",
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                  placeholder="Ilimitado"
                  className={inputClass}
                />
              </div>
            </div>

            <PromotionDateRangePicker
              validFrom={form.validFrom}
              validUntil={form.validUntil}
              onChange={(next) =>
                setForm((prev) => ({
                  ...prev,
                  validFrom: next.validFrom,
                  validUntil: next.validUntil,
                }))
              }
            />

            {/* Category restrictions */}
            <div>
              <label className={labelClass}>
                Categorias aplicables (dejar vacio = todas)
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ALL_PARENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      form.applicableCategories.includes(cat)
                        ? "bg-primary/15 border-primary text-primary"
                        : "bg-surface-elevated border-border-default text-text-main/50 hover:border-primary/40"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/promociones")}
          className="flex-1 border border-border-default text-text-main/60 font-medium py-3 rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg transition-colors disabled:bg-surface-elevated disabled:text-text-main/30 cursor-pointer"
        >
          {saving
            ? "Guardando..."
            : isEdit
              ? "Guardar Cambios"
              : "Crear Promocion"}
        </button>
      </div>
    </form>
  );
}
