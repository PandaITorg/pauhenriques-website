"use client";

import ProductForm from "@/components/admin/ProductForm";

export default function NuevoProductoPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo Producto</h1>
      <ProductForm />
    </div>
  );
}
