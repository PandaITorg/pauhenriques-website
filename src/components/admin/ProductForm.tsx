"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, ALL_PARENT_CATEGORIES } from "@/constants/categories";
import type { ProductType } from "@/types/product";
import Switch from "@/components/ui/Switch";
import ImageUploader from "./ImageUploader";

interface ProductFormData {
  name: string;
  description: string;
  brand: string;
  productType: ProductType;
  category: string;
  parentCategory: string;
  subCategory: string;
  price: number;
  stock: number;
  consultationWhatsapp: string;
  material: string;
  color: string;
  weight: string;
  dimensions: string;
  voltage: string;
  power: string;
  warranty: string;
  manufacturer: string;
  isActive: boolean;
  images: string[];
}

const emptyForm: ProductFormData = {
  name: "",
  description: "",
  brand: "",
  productType: "WellMe",
  category: "",
  parentCategory: "",
  subCategory: "",
  price: 0,
  stock: 0,
  consultationWhatsapp: "",
  material: "",
  color: "",
  weight: "",
  dimensions: "",
  voltage: "",
  power: "",
  warranty: "",
  manufacturer: "",
  isActive: true,
  images: [],
};

export default function ProductForm({
  initialData,
  productId,
}: {
  initialData?: Partial<ProductFormData>;
  productId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipoParam = searchParams.get("tipo");
  const initialProductType: ProductType =
    tipoParam === "carico"
      ? "Carico"
      : tipoParam === "well-me"
        ? "WellMe"
        : (initialData?.productType ?? emptyForm.productType);
  const [form, setForm] = useState<ProductFormData>({
    ...emptyForm,
    ...initialData,
    productType: initialProductType,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!productId;
  const subCategories = form.parentCategory
    ? CATEGORIES[form.parentCategory] || []
    : [];

  const set = (field: keyof ProductFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description,
        brand: form.brand,
        productType: form.productType,
        category: form.subCategory || form.parentCategory || form.category,
        parentCategory: form.parentCategory,
        subCategory: form.subCategory || null,
        isActive: form.isActive,
        images: form.images,
        material: form.material || null,
        color: form.color || null,
        weight: form.weight || null,
        dimensions: form.dimensions || null,
        voltage: form.voltage || null,
        power: form.power || null,
        warranty: form.warranty || null,
        manufacturer: form.manufacturer || null,
      };

      if (form.productType === "WellMe") {
        payload.price = form.price;
        payload.stock = form.stock;
      } else {
        payload.consultationWhatsapp = form.consultationWhatsapp;
      }

      const url = isEdit
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      const targetList =
        form.productType === "Carico"
          ? "/admin/productos/carico"
          : "/admin/productos/well-me";
      router.push(targetList);
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
        <div className="bg-error/10 text-error p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Basic info */}
      <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-main mb-4">
          Información Básica
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Nombre *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Descripción *</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Marca *</label>
            <select
              required
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              className={inputClass}
            >
              <option value="">Seleccionar</option>
              <option value="Well Me">Well Me</option>
              <option value="Carico">Carico</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Tipo de Producto *</label>
            <select
              required
              value={form.productType}
              onChange={(e) => set("productType", e.target.value)}
              className={inputClass}
            >
              <option value="WellMe">Well Me (Venta Online)</option>
              <option value="Carico">Carico (Catálogo)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Fabricante</label>
            <input
              type="text"
              value={form.manufacturer}
              onChange={(e) => set("manufacturer", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex items-center pt-6">
            <Switch
              checked={form.isActive}
              onCheckedChange={(next) => set("isActive", next)}
              label="Producto activo"
              description="Si está inactivo, no se muestra en la tienda pública."
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-main mb-4">
          Categorías
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Categoría Principal</label>
            <select
              value={form.parentCategory}
              onChange={(e) => {
                set("parentCategory", e.target.value);
                set("subCategory", "");
              }}
              className={inputClass}
            >
              <option value="">Seleccionar</option>
              {ALL_PARENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Subcategoría</label>
            <select
              value={form.subCategory}
              onChange={(e) => set("subCategory", e.target.value)}
              className={inputClass}
              disabled={!form.parentCategory}
            >
              <option value="">Seleccionar</option>
              {subCategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pricing (Well Me only) */}
      {form.productType === "WellMe" && (
        <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-main mb-4">
            Precio y Stock
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Precio (USD) *</label>
              <input
                type="number"
                required
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Stock *</label>
              <input
                type="number"
                required
                min={0}
                value={form.stock}
                onChange={(e) => set("stock", parseInt(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* Consultation (Carico only) */}
      {form.productType === "Carico" && (
        <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-main mb-4">
            Datos de Consulta
          </h2>
          <div>
            <label className={labelClass}>WhatsApp de Consulta *</label>
            <input
              type="text"
              required
              placeholder="https://wa.me/593..."
              value={form.consultationWhatsapp}
              onChange={(e) => set("consultationWhatsapp", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Specs */}
      <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-main mb-4">
          Especificaciones
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(
            [
              ["material", "Material"],
              ["color", "Color"],
              ["weight", "Peso"],
              ["dimensions", "Dimensiones"],
              ["voltage", "Voltaje"],
              ["power", "Potencia"],
              ["warranty", "Garantía"],
            ] as const
          ).map(([field, label]) => (
            <div key={field}>
              <label className={labelClass}>{label}</label>
              <input
                type="text"
                value={form[field]}
                onChange={(e) => set(field, e.target.value)}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-main mb-4">
          Imágenes
        </h2>
        <ImageUploader
          images={form.images}
          onChange={(imgs) => set("images", imgs)}
          productId={productId}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            const targetList =
              form.productType === "Carico"
                ? "/admin/productos/carico"
                : "/admin/productos/well-me";
            router.push(targetList);
          }}
          className="flex-1 border border-border-default text-text-main/60 font-medium py-3 rounded-lg hover:bg-surface-elevated transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg transition-colors disabled:bg-surface-elevated disabled:text-text-main/30"
        >
          {saving
            ? "Guardando..."
            : isEdit
              ? "Guardar Cambios"
              : "Crear Producto"}
        </button>
      </div>
    </form>
  );
}
