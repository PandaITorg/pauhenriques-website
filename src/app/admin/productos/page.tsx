"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaPlus, FaEdit, FaTrash, FaImage, FaSearch } from "react-icons/fa";
import { useConfirm } from "@/stores/confirm.store";
import { useToastStore } from "@/stores/toast.store";

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  productType: string;
  price?: number;
  stock?: number;
  images?: string[];
  isActive: boolean;
}

export default function AdminProductosPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const confirm = useConfirm();
  const addToast = useToastStore((s) => s.addToast);

  const fetchProducts = async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(`Error ${res.status}: ${body.error ?? res.statusText}`);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchType = !typeFilter || p.productType === typeFilter;
      return matchSearch && matchType;
    });
  }, [products, search, typeFilter]);

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: `¿Eliminar "${name}"?`,
      description: "Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      variant: "destructive",
    });
    if (!ok) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        addToast({ type: "success", message: "Producto eliminado" });
      } else {
        addToast({ type: "error", message: "No se pudo eliminar" });
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      addToast({ type: "error", message: "Error de conexión" });
    } finally {
      setDeleting(null);
    }
  };

  const inputClass =
    "bg-input-bg border border-border-default rounded-xl text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200";

  return (
    <div>
      {/* ── Header with gradient ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/40 to-background" />
        <div className="relative px-5 lg:px-8 pt-6 pb-4 md:pt-8 md:pb-6 flex items-center justify-between">
          <div>
            <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-1">
              Gestion
            </span>
            <h1 className="text-2xl font-semibold text-text-main">Productos</h1>
          </div>
          <Link
            href="/admin/productos/nuevo"
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium px-4 py-2.5 rounded-xl transition-all duration-200 text-sm hover:-translate-y-px hover:shadow-(--shadow-glow-primary)"
          >
            <FaPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nuevo Producto</span>
            <span className="sm:hidden">Nuevo</span>
          </Link>
        </div>
      </div>

      {/* ── Separator ── */}
      <div className="h-px bg-linear-to-r from-transparent via-border-default to-transparent" />

      {/* ── Content ── */}
      <div className="px-5 lg:px-8 py-6">

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-main/30" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} w-full pl-9 pr-3 py-2.5`}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={`${inputClass} px-3 py-2.5 min-w-40`}
        >
          <option value="">Todos los tipos</option>
          <option value="Infrarrojo">Infrarrojo</option>
          <option value="Carico">Carico</option>
        </select>
      </div>

      <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="simple-spinner mx-auto" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-error text-sm font-medium mb-2">Error al cargar productos</p>
            <p className="text-text-main/50 text-xs">{error}</p>
            <button
              onClick={fetchProducts}
              className="mt-4 text-xs text-primary hover:underline"
            >
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-text-main/50">
            {products.length === 0
              ? "No hay productos. Crea el primero."
              : "No se encontraron productos con ese filtro."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-elevated">
                  <th className="w-14 p-4"></th>
                  <th className="text-left p-4 font-medium text-text-main/50">
                    Nombre
                  </th>
                  <th className="text-left p-4 font-medium text-text-main/50">
                    Marca
                  </th>
                  <th className="text-left p-4 font-medium text-text-main/50">
                    Tipo
                  </th>
                  <th className="text-right p-4 font-medium text-text-main/50">
                    Precio
                  </th>
                  <th className="text-right p-4 font-medium text-text-main/50">
                    Stock
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
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border-subtle hover:bg-surface-elevated transition-colors"
                  >
                    <td className="p-4">
                      <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-surface-elevated shrink-0">
                        {p.images && p.images.length > 0 ? (
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaImage className="w-4 h-4 text-text-main/20" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-text-main">
                      {p.name}
                    </td>
                    <td className="p-4 text-text-main/60">{p.brand}</td>
                    <td className="p-4">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          p.productType === "Infrarrojo"
                            ? "bg-primary/15 text-primary"
                            : "bg-warm-700/20 text-warm-300"
                        }`}
                      >
                        {p.productType}
                      </span>
                    </td>
                    <td className="p-4 text-right text-text-main/60">
                      {p.price != null ? `$${p.price.toFixed(2)}` : "—"}
                    </td>
                    <td className="p-4 text-right text-text-main/60">
                      {p.stock != null ? p.stock : "—"}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`w-2.5 h-2.5 rounded-full inline-block ${
                          p.isActive ? "bg-success" : "bg-text-main/30"
                        }`}
                      />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/productos/${p.id}/editar`}
                          className="p-2 text-text-main/30 hover:text-primary transition-colors"
                        >
                          <FaEdit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={deleting === p.id}
                          className="p-2 text-text-main/30 hover:text-error transition-colors disabled:opacity-50"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
