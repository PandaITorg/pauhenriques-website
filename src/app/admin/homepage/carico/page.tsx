"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaChevronUp,
  FaChevronDown,
  FaSpinner,
  FaTimes,
  FaMagic,
} from "react-icons/fa";
import { useConfirm } from "@/stores/confirm.store";
import { useToastStore } from "@/stores/toast.store";

interface CategoryRow {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  bgColor: string;
  ctaLink: string;
  order: number;
  active: boolean;
}

const EMPTY: Omit<CategoryRow, "id"> = {
  name: "",
  description: "",
  imageUrl: "",
  bgColor: "#634d32",
  ctaLink: "",
  order: 0,
  active: true,
};

const SEED_CATEGORIES: Array<Omit<CategoryRow, "id">> = [
  {
    name: "Cocina",
    description: "Sartenes, ollas y utensilios libres de PFAS y metales pesados",
    imageUrl: "",
    bgColor: "#634d32",
    ctaLink: "",
    order: 0,
    active: true,
  },
  {
    name: "Hogar y Salud",
    description: "Purificadores de agua y aire para un ambiente limpio",
    imageUrl: "",
    bgColor: "#7a6240",
    ctaLink: "",
    order: 1,
    active: true,
  },
  {
    name: "Dormitorio",
    description: "Tecnología de descanso para recuperarte mientras duermes",
    imageUrl: "",
    bgColor: "#4f3c25",
    ctaLink: "",
    order: 2,
    active: true,
  },
];

const inputClass =
  "bg-input-bg border border-border-default rounded-xl text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 px-3 py-2.5 w-full";
const labelClass = "block text-xs font-medium text-text-main/60 mb-1.5";

export default function AdminCaricoPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState<Omit<CategoryRow, "id">>(EMPTY);
  const confirm = useConfirm();
  const addToast = useToastStore((s) => s.addToast);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/carico-categories");
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setCategories(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, order: categories.length });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (cat: CategoryRow) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description,
      imageUrl: cat.imageUrl,
      bgColor: cat.bgColor || "#634d32",
      ctaLink: cat.ctaLink || "",
      order: cat.order,
      active: cat.active,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const url = editing
        ? `/api/admin/carico-categories/${editing.id}`
        : "/api/admin/carico-categories";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setModalOpen(false);
      fetchCategories();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "¿Eliminar esta categoría?",
      description: "Se quita del bento de Carico en el homepage.",
      confirmLabel: "Eliminar",
      variant: "destructive",
    });
    if (!ok) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/carico-categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`${res.status}`);
      addToast({ type: "success", message: "Categoría eliminada" });
      fetchCategories();
    } catch (e) {
      addToast({
        type: "error",
        message: e instanceof Error ? e.message : "Error al eliminar",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (cat: CategoryRow) => {
    try {
      await fetch(`/api/admin/carico-categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !cat.active }),
      });
      fetchCategories();
    } catch {
      /* noop */
    }
  };

  const handleReorder = async (cat: CategoryRow, direction: "up" | "down") => {
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((c) => c.id === cat.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await Promise.all([
      fetch(`/api/admin/carico-categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: other.order }),
      }),
      fetch(`/api/admin/carico-categories/${other.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: cat.order }),
      }),
    ]);
    fetchCategories();
  };

  const handleSeed = async () => {
    const ok = await confirm({
      title: "¿Sembrar las 3 categorías Carico?",
      description: "Crea Cocina, Hogar y Salud, y Dormitorio con datos de ejemplo. Útil para arrancar de cero.",
      confirmLabel: "Sembrar",
    });
    if (!ok) return;
    setSeeding(true);
    try {
      await Promise.all(
        SEED_CATEGORIES.map((cat) =>
          fetch("/api/admin/carico-categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cat),
          }),
        ),
      );
      addToast({ type: "success", message: "3 categorías sembradas" });
      fetchCategories();
    } finally {
      setSeeding(false);
    }
  };

  const handleImageFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(`${res.status}`);
      const { url } = await res.json();
      setForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (e) {
      addToast({
        type: "error",
        message: e instanceof Error ? e.message : "Error al subir",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-main/60">
          Categorías del showcase Carico en el homepage (Cocina, Hogar y Salud, Dormitorio, ...).
        </p>
        <div className="flex gap-2">
          {categories.length === 0 && !loading && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 bg-surface-elevated hover:bg-surface-card border border-border-default text-text-main/80 px-4 py-2 rounded-xl text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {seeding ? (
                <FaSpinner className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FaMagic className="w-3.5 h-3.5" />
              )}
              Sembrar 3 defaults
            </button>
          )}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium px-4 py-2 rounded-xl text-sm transition-all cursor-pointer hover:shadow-(--shadow-glow-primary)"
          >
            <FaPlus className="w-3 h-3" /> Nueva categoría
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-text-main/50">Cargando...</p>}
      {error && <p className="text-sm text-error">Error: {error}</p>}

      {!loading && categories.length === 0 && !error && (
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-10 text-center">
          <p className="text-text-main/50 mb-1">No hay categorías configuradas.</p>
          <p className="text-text-main/40 text-xs">
            Siembra las 3 defaults o crea una nueva desde el botón superior.
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {categories
          .sort((a, b) => a.order - b.order)
          .map((cat, idx) => (
            <div
              key={cat.id}
              className="bg-surface-card border border-border-subtle rounded-2xl p-4 flex items-center gap-4"
            >
              {/* Image / color */}
              <div
                className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0"
                style={{ backgroundColor: cat.bgColor || "#634d32" }}
              >
                {cat.imageUrl && (
                  <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover" sizes="80px" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-cormorant text-lg font-semibold text-text-main truncate">
                  {cat.name || "(sin nombre)"}
                </h3>
                <p className="text-xs text-text-main/50 line-clamp-2">{cat.description}</p>
              </div>

              {/* Reorder */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleReorder(cat, "up")}
                  disabled={idx === 0}
                  className="p-1.5 text-text-main/30 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <FaChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleReorder(cat, "down")}
                  disabled={idx === categories.length - 1}
                  className="p-1.5 text-text-main/30 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <FaChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Toggle active */}
              <button
                onClick={() => handleToggleActive(cat)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                title={cat.active ? "Desactivar" : "Activar"}
              >
                <span className={`w-2 h-2 rounded-full ${cat.active ? "bg-success" : "bg-text-main/25"}`} />
                <span className={`hidden sm:inline ${cat.active ? "text-success" : "text-text-main/40"}`}>
                  {cat.active ? "Activo" : "Inactivo"}
                </span>
              </button>

              {/* Edit */}
              <button
                onClick={() => openEdit(cat)}
                className="p-2 text-text-main/30 hover:text-primary transition-colors cursor-pointer"
              >
                <FaEdit className="w-4 h-4" />
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDelete(cat.id)}
                disabled={deleting === cat.id}
                className="p-2 text-text-main/30 hover:text-error transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleting === cat.id ? (
                  <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FaTrash className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <h2 className="text-base font-semibold text-text-main">
                {editing ? "Editar categoría" : "Nueva categoría"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-text-main/40 hover:text-text-main cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={labelClass}>Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Cocina"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Sartenes, ollas y utensilios..."
                  rows={2}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Imagen (opcional — si no hay, se usa el color de fondo)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://... o /products/..."
                    className={`${inputClass} flex-1`}
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 py-2.5 bg-surface-elevated hover:bg-surface-card border border-border-default rounded-xl text-sm text-text-main/60 disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {uploading ? <FaSpinner className="w-4 h-4 animate-spin" /> : "Subir"}
                  </button>
                </div>
                {form.imageUrl && (
                  <div className="mt-2 relative w-24 h-16 rounded-lg overflow-hidden bg-surface-elevated">
                    <Image src={form.imageUrl} alt="Preview" fill className="object-cover" sizes="96px" />
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Color de fondo (fallback si no hay imagen)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.bgColor}
                    onChange={(e) => setForm({ ...form, bgColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-border-default cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.bgColor}
                    onChange={(e) => setForm({ ...form, bgColor: e.target.value })}
                    placeholder="#634d32"
                    className={`${inputClass} flex-1 font-mono text-xs`}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Link CTA (opcional — si se deja vacío usa el CTA general)</label>
                <input
                  type="text"
                  value={form.ctaLink}
                  onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                  placeholder="https://wa.me/... o /tienda/..."
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className={labelClass}>Orden</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                    min={0}
                    className={inputClass}
                  />
                </div>
                <div className="flex items-center gap-3 pb-0.5">
                  <label className={`${labelClass} mb-0`}>Activo</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, active: !form.active })}
                    className={`relative w-10 h-6 rounded-full cursor-pointer ${
                      form.active ? "bg-success" : "bg-text-main/20"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        form.active ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {formError && <p className="text-error text-xs font-medium">{formError}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle">
              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="px-4 py-2 text-sm text-text-main/60 hover:text-text-main cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium px-5 py-2.5 rounded-xl text-sm disabled:opacity-60 cursor-pointer"
              >
                {saving && <FaSpinner className="w-3.5 h-3.5 animate-spin" />}
                {editing ? "Guardar cambios" : "Crear categoría"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
