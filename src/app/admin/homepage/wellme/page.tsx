"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  FaPlus,
  FaTrash,
  FaChevronUp,
  FaChevronDown,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";

interface FeaturedRow {
  id: string;
  productId: string;
  badge: string | null;
  bentoSize: "normal" | "wide" | "tall";
  order: number;
  active: boolean;
}

interface ProductOption {
  id: string;
  name: string;
  price: number;
  images: string[];
  productType: "Infrarrojo" | "Carico";
  isActive: boolean;
}

const inputClass =
  "bg-input-bg border border-border-default rounded-xl text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 px-3 py-2.5 w-full";
const labelClass = "block text-xs font-medium text-text-main/60 mb-1.5";

const EMPTY: Omit<FeaturedRow, "id"> = {
  productId: "",
  badge: null,
  bentoSize: "normal",
  order: 0,
  active: true,
};

export default function AdminWellMePage() {
  const [refs, setRefs] = useState<FeaturedRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FeaturedRow | null>(null);
  const [form, setForm] = useState<Omit<FeaturedRow, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [refsRes, productsRes] = await Promise.all([
        fetch("/api/admin/featured-products"),
        fetch("/api/admin/products"),
      ]);
      if (!refsRes.ok) throw new Error(`featured ${refsRes.status}`);
      if (!productsRes.ok) throw new Error(`products ${productsRes.status}`);
      setRefs(await refsRes.json());
      const products = await productsRes.json();
      setProducts(products);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const productById = (id: string) => products.find((p) => p.id === id);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, order: refs.length });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: FeaturedRow) => {
    setEditing(row);
    setForm({
      productId: row.productId,
      badge: row.badge,
      bentoSize: row.bentoSize,
      order: row.order,
      active: row.active,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.productId) {
      setFormError("Selecciona un producto");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const url = editing
        ? `/api/admin/featured-products/${editing.id}`
        : "/api/admin/featured-products";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setModalOpen(false);
      fetchAll();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Quitar este producto del homepage?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/featured-products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`${res.status}`);
      fetchAll();
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (row: FeaturedRow) => {
    await fetch(`/api/admin/featured-products/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    });
    fetchAll();
  };

  const handleReorder = async (row: FeaturedRow, direction: "up" | "down") => {
    const sorted = [...refs].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((r) => r.id === row.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await Promise.all([
      fetch(`/api/admin/featured-products/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: other.order }),
      }),
      fetch(`/api/admin/featured-products/${other.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: row.order }),
      }),
    ]);
    fetchAll();
  };

  const infrarrojoOptions = products.filter((p) => p.productType === "Infrarrojo" && p.isActive);

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-main/60">
          Curación manual del bento Well Me del homepage. Selecciona productos infrarrojo existentes.
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium px-4 py-2 rounded-xl text-sm cursor-pointer hover:shadow-(--shadow-glow-primary)"
        >
          <FaPlus className="w-3 h-3" /> Agregar producto
        </button>
      </div>

      {loading && <p className="text-sm text-text-main/50">Cargando...</p>}
      {error && <p className="text-sm text-error">Error: {error}</p>}

      {!loading && refs.length === 0 && !error && (
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-10 text-center">
          <p className="text-text-main/50 mb-1">No hay productos destacados.</p>
          <p className="text-text-main/40 text-xs">
            Agrega productos infrarrojo existentes desde el botón superior.
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {refs
          .sort((a, b) => a.order - b.order)
          .map((row, idx) => {
            const p = productById(row.productId);
            const missing = !p;
            return (
              <div
                key={row.id}
                className={`bg-surface-card border rounded-2xl p-4 flex items-center gap-4 ${
                  missing ? "border-error/40" : "border-border-subtle"
                }`}
              >
                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-surface-elevated">
                  {p?.images?.[0] && (
                    <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="80px" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-cormorant text-lg font-semibold text-text-main truncate">
                    {p?.name ?? "(producto no encontrado)"}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-text-main/50 mt-0.5">
                    {missing && (
                      <span className="text-error">productId: {row.productId}</span>
                    )}
                    {!missing && <span>${p.price.toFixed(2)}</span>}
                    <span>·</span>
                    <span className="uppercase tracking-wider">{row.bentoSize}</span>
                    {row.badge && (
                      <>
                        <span>·</span>
                        <span className="text-primary">{row.badge}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleReorder(row, "up")}
                    disabled={idx === 0}
                    className="p-1.5 text-text-main/30 hover:text-primary disabled:opacity-30 cursor-pointer"
                  >
                    <FaChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleReorder(row, "down")}
                    disabled={idx === refs.length - 1}
                    className="p-1.5 text-text-main/30 hover:text-primary disabled:opacity-30 cursor-pointer"
                  >
                    <FaChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => handleToggleActive(row)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <span className={`w-2 h-2 rounded-full ${row.active ? "bg-success" : "bg-text-main/25"}`} />
                  <span className={`hidden sm:inline ${row.active ? "text-success" : "text-text-main/40"}`}>
                    {row.active ? "Activo" : "Inactivo"}
                  </span>
                </button>
                <button
                  onClick={() => openEdit(row)}
                  className="px-3 py-1.5 rounded-lg text-xs text-text-main/60 hover:text-primary cursor-pointer"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(row.id)}
                  disabled={deleting === row.id}
                  className="p-2 text-text-main/30 hover:text-error disabled:opacity-50 cursor-pointer"
                >
                  {deleting === row.id ? (
                    <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FaTrash className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <h2 className="text-base font-semibold text-text-main">
                {editing ? "Editar destacado" : "Nuevo destacado"}
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
                <label className={labelClass}>Producto (solo Infrarrojo activos)</label>
                <select
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  className={inputClass}
                >
                  <option value="">— Selecciona —</option>
                  {infrarrojoOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · ${p.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tamaño en bento</label>
                  <select
                    value={form.bentoSize}
                    onChange={(e) =>
                      setForm({ ...form, bentoSize: e.target.value as FeaturedRow["bentoSize"] })
                    }
                    className={inputClass}
                  >
                    <option value="normal">Normal (1×1)</option>
                    <option value="wide">Wide (2×1)</option>
                    <option value="tall">Tall (1×2)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Badge (opcional)</label>
                  <input
                    type="text"
                    value={form.badge ?? ""}
                    onChange={(e) => setForm({ ...form, badge: e.target.value || null })}
                    placeholder="NUEVO · TOP · -15%"
                    className={inputClass}
                  />
                </div>
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
                {editing ? "Guardar cambios" : "Agregar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
