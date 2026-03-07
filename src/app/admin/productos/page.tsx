"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  productType: string;
  price?: number;
  stock?: number;
  isActive: boolean;
}

export default function AdminProductosPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Esta accion no se puede deshacer.`)) {
      return;
    }
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Error deleting product:", err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="flex items-center gap-2 bg-primary text-white font-medium px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors text-sm"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Nuevo Producto
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="simple-spinner mx-auto" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay productos. Crea el primero.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left p-4 font-medium text-gray-500">
                    Nombre
                  </th>
                  <th className="text-left p-4 font-medium text-gray-500">
                    Marca
                  </th>
                  <th className="text-left p-4 font-medium text-gray-500">
                    Tipo
                  </th>
                  <th className="text-right p-4 font-medium text-gray-500">
                    Precio
                  </th>
                  <th className="text-right p-4 font-medium text-gray-500">
                    Stock
                  </th>
                  <th className="text-center p-4 font-medium text-gray-500">
                    Estado
                  </th>
                  <th className="text-right p-4 font-medium text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="p-4 font-medium text-gray-900">{p.name}</td>
                    <td className="p-4 text-gray-600">{p.brand}</td>
                    <td className="p-4">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          p.productType === "Infrarrojo"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        }`}
                      >
                        {p.productType}
                      </span>
                    </td>
                    <td className="p-4 text-right text-gray-600">
                      {p.price != null ? `$${p.price.toFixed(2)}` : "—"}
                    </td>
                    <td className="p-4 text-right text-gray-600">
                      {p.stock != null ? p.stock : "—"}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`w-2.5 h-2.5 rounded-full inline-block ${
                          p.isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/productos/${p.id}/editar`}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <FaEdit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={deleting === p.id}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
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
  );
}
