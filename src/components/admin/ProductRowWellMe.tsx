"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaEdit, FaTrash, FaCheck, FaTimes, FaImage } from "react-icons/fa";
import Switch from "@/components/ui/Switch";
import { useToastStore } from "@/stores/toast.store";

export interface WellMeRowData {
  id: string;
  name: string;
  brand: string;
  price?: number;
  stock?: number;
  images?: string[];
  isActive: boolean;
}

interface Props {
  product: WellMeRowData;
  onUpdated: (next: WellMeRowData) => void;
  onDelete: () => void;
  deleting?: boolean;
}

export default function ProductRowWellMe({
  product,
  onUpdated,
  onDelete,
  deleting,
}: Props) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draft, setDraft] = useState<WellMeRowData>(product);
  const [saving, setSaving] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const startEdit = () => {
    setDraft(product);
    setMode("edit");
  };

  const cancelEdit = () => {
    setDraft(product);
    setMode("view");
  };

  const nameInvalid = draft.name.trim().length === 0;
  const priceInvalid =
    draft.price === undefined ||
    Number.isNaN(draft.price) ||
    draft.price < 0;
  const stockInvalid =
    draft.stock === undefined ||
    !Number.isInteger(draft.stock) ||
    draft.stock < 0;
  const canSave = !nameInvalid && !priceInvalid && !stockInvalid && !saving;

  const persist = async (
    patch: Partial<WellMeRowData>,
    optimisticNext: WellMeRowData,
  ): Promise<boolean> => {
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      addToast({
        type: "error",
        message: body.error ?? "No se pudo guardar",
      });
      return false;
    }
    onUpdated(optimisticNext);
    return true;
  };

  const handleToggleActive = async (next: boolean) => {
    if (togglingActive) return;
    setTogglingActive(true);
    const ok = await persist({ isActive: next }, { ...product, isActive: next });
    if (ok) {
      addToast({
        type: "success",
        message: next ? "Producto activado" : "Producto desactivado",
      });
    }
    setTogglingActive(false);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const patch: Partial<WellMeRowData> = {};
    if (draft.name !== product.name) patch.name = draft.name.trim();
    if (draft.brand !== product.brand) patch.brand = draft.brand;
    if (draft.price !== product.price) patch.price = draft.price;
    if (draft.stock !== product.stock) patch.stock = draft.stock;

    if (Object.keys(patch).length === 0) {
      setMode("view");
      setSaving(false);
      return;
    }

    const next: WellMeRowData = { ...product, ...patch };
    const ok = await persist(patch, next);
    if (ok) {
      addToast({ type: "success", message: "Producto actualizado" });
      setMode("view");
    }
    setSaving(false);
  };

  const inputBase =
    "w-full px-2 py-1 bg-input-bg border rounded-md text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors";
  const inputOk = "border-border-default";
  const inputErr = "border-error/60";

  return (
    <tr className="border-b border-border-subtle hover:bg-surface-elevated transition-colors align-middle">
      <td className="p-4">
        <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-surface-elevated shrink-0">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.name}
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
        {mode === "edit" ? (
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className={`${inputBase} ${nameInvalid ? inputErr : inputOk}`}
            disabled={saving}
          />
        ) : (
          product.name
        )}
      </td>

      <td className="p-4 text-text-main/60">
        {mode === "edit" ? (
          <input
            type="text"
            value={draft.brand}
            onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
            className={`${inputBase} ${inputOk}`}
            disabled={saving}
          />
        ) : (
          product.brand
        )}
      </td>

      <td className="p-4 text-right text-text-main/60">
        {mode === "edit" ? (
          <input
            type="number"
            min={0}
            step={0.01}
            value={draft.price ?? 0}
            onChange={(e) =>
              setDraft({ ...draft, price: parseFloat(e.target.value) })
            }
            className={`${inputBase} text-right ${priceInvalid ? inputErr : inputOk}`}
            disabled={saving}
          />
        ) : product.price != null ? (
          `$${product.price.toFixed(2)}`
        ) : (
          "—"
        )}
      </td>

      <td className="p-4 text-right text-text-main/60">
        {mode === "edit" ? (
          <input
            type="number"
            min={0}
            step={1}
            value={draft.stock ?? 0}
            onChange={(e) =>
              setDraft({ ...draft, stock: parseInt(e.target.value, 10) })
            }
            className={`${inputBase} text-right ${stockInvalid ? inputErr : inputOk}`}
            disabled={saving}
          />
        ) : product.stock != null ? (
          product.stock
        ) : (
          "—"
        )}
      </td>

      <td className="p-4">
        <div className="flex justify-center">
          <Switch
            size="sm"
            checked={product.isActive}
            onCheckedChange={handleToggleActive}
            disabled={togglingActive}
            ariaLabel={product.isActive ? "Desactivar producto" : "Activar producto"}
          />
        </div>
      </td>

      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {mode === "view" ? (
            <>
              <button
                onClick={startEdit}
                title="Edición rápida"
                className="p-2 text-text-main/30 hover:text-primary transition-colors"
              >
                <FaEdit className="w-4 h-4" />
              </button>
              <Link
                href={`/admin/productos/${product.id}/editar`}
                title="Editar detalle completo"
                className="p-2 text-text-main/30 hover:text-primary transition-colors text-xs underline-offset-2 hover:underline"
              >
                Detalle
              </Link>
              <button
                onClick={onDelete}
                disabled={deleting}
                title="Eliminar"
                className="p-2 text-text-main/30 hover:text-error transition-colors disabled:opacity-50"
              >
                <FaTrash className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={!canSave}
                title="Guardar"
                className="p-2 text-success hover:text-success/80 transition-colors disabled:opacity-40"
              >
                <FaCheck className="w-4 h-4" />
              </button>
              <button
                onClick={cancelEdit}
                disabled={saving}
                title="Cancelar"
                className="p-2 text-text-main/40 hover:text-error transition-colors disabled:opacity-40"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
