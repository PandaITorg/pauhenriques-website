"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, ALL_PARENT_CATEGORIES } from "@/constants/categories";
import type { ProductType } from "@/types/product";
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
  productType: "Infrarrojo",
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
  const [form, setForm] = useState<ProductFormData>({
    ...emptyForm,
    ...initialData,
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
      // Build payload based on product type
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

      if (form.productType === "Infrarrojo") {
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

      router.push("/admin/productos");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Basic info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Informacion Basica
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
            <label className={labelClass}>Descripcion *</label>
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
              <option value="Infrarrojo">Infrarrojo (Venta Online)</option>
              <option value="Carico">Carico (Catalogo)</option>
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
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Producto activo
            </label>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Categorias</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Categoria Principal</label>
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
            <label className={labelClass}>Subcategoria</label>
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

      {/* Pricing (Infrarrojo only) */}
      {form.productType === "Infrarrojo" && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
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
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
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
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
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
              ["warranty", "Garantia"],
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
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Imagenes</h2>
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
          onClick={() => router.push("/admin/productos")}
          className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
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
