"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { SavedAddress } from "@/types/address";
import { ShippingAddress } from "@/types/order";
import {
  getAddresses,
  createAddress,
  deleteAddress,
} from "@/services/firestore/addressService";
import { FaCheck, FaPlus, FaTrash } from "react-icons/fa";
import { shippingAddressSchema } from "@/lib/schemas/shipping";

interface SavedAddressesProps {
  onSelect: (address: ShippingAddress) => void;
  selectedAddress: ShippingAddress | null;
}

const EMPTY_FORM: Omit<SavedAddress, "id"> = {
  label: "",
  fullName: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Ecuador",
  isDefault: false,
};

export default function SavedAddresses({
  onSelect,
  selectedAddress,
}: SavedAddressesProps) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    loadAddresses();
  }, [user]);

  async function loadAddresses() {
    if (!user) return;
    setLoading(true);
    try {
      const list = await getAddresses(user.uid);
      setAddresses(list);
      if (!selectedAddress && list.length > 0) {
        const def = list.find((a) => a.isDefault) || list[0];
        onSelect(toShipping(def));
      }
      if (list.length === 0) setShowForm(true);
    } catch (err) {
      console.error("Error loading addresses:", err);
    } finally {
      setLoading(false);
    }
  }

  function toShipping(addr: SavedAddress): ShippingAddress {
    return {
      fullName: addr.fullName,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      province: addr.province,
      postalCode: addr.postalCode,
      country: addr.country,
    };
  }

  function isSelected(addr: SavedAddress) {
    return (
      selectedAddress?.address === addr.address &&
      selectedAddress?.fullName === addr.fullName &&
      selectedAddress?.phone === addr.phone
    );
  }

  const isFormFilled =
    form.fullName && form.phone && form.address && form.city && form.province;

  function validateForm(): ShippingAddress | null {
    const result = shippingAddressSchema.safeParse(form);
    if (result.success) {
      setFieldErrors({});
      return result.data;
    }
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      if (!errors[field]) errors[field] = issue.message;
    }
    setFieldErrors(errors);
    return null;
  }

  async function handleSave() {
    if (!user) return;
    const validated = validateForm();
    if (!validated) return;
    setSaving(true);
    try {
      const isFirst = addresses.length === 0;
      await createAddress(user.uid, {
        ...form,
        phone: validated.phone,
        isDefault: isFirst || form.isDefault,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadAddresses();
    } catch (err) {
      console.error("Error saving address:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!user) return;
    try {
      await deleteAddress(user.uid, id);
      await loadAddresses();
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  }

  function handleUseWithoutSaving() {
    const validated = validateForm();
    if (!validated) return;
    onSelect(validated);
    setShowForm(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="simple-spinner" />
      </div>
    );
  }

  const inputClass =
    "w-full p-2.5 bg-input-bg border border-border-default rounded-lg text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-colors";

  return (
    <div className="space-y-4">
      {/* Saved addresses list */}
      {addresses.length > 0 && !showForm && (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              onClick={() => onSelect(toShipping(addr))}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                isSelected(addr)
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border-default hover:border-border-strong"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-text-main">
                      {addr.label || "Dirección"}
                    </span>
                    {addr.isDefault && (
                      <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                        Principal
                      </span>
                    )}
                    {isSelected(addr) && (
                      <FaCheck className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-text-main/70">{addr.fullName}</p>
                  <p className="text-sm text-text-main/50">
                    {addr.address}, {addr.city}, {addr.province}
                  </p>
                  <p className="text-sm text-text-main/50">{addr.phone}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(addr.id);
                  }}
                  className="text-text-main/30 hover:text-error p-1 transition-colors"
                  title="Eliminar dirección"
                >
                  <FaTrash className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new address button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border-default rounded-lg text-sm text-text-main/50 hover:border-primary hover:text-primary transition-colors"
        >
          <FaPlus className="w-3 h-3" />
          Agregar nueva dirección
        </button>
      )}

      {/* New address form */}
      {showForm && (
        <div className="border border-border-subtle rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-sm text-text-main">
            Nueva dirección
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-main/60 mb-1">
                Etiqueta (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Casa, Oficina"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-main/60 mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => {
                  setForm({ ...form, fullName: e.target.value });
                  setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                }}
                className={`${inputClass} ${fieldErrors.fullName ? "border-error" : ""}`}
              />
              {fieldErrors.fullName && (
                <p className="text-xs text-error mt-1">{fieldErrors.fullName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-main/60 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              placeholder="0991234567"
              value={form.phone}
              onChange={(e) => {
                setForm({ ...form, phone: e.target.value });
                setFieldErrors((prev) => ({ ...prev, phone: "" }));
              }}
              className={`${inputClass} ${fieldErrors.phone ? "border-error" : ""}`}
            />
            {fieldErrors.phone && (
              <p className="text-xs text-error mt-1">{fieldErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-main/60 mb-1">
              Dirección *
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => {
                setForm({ ...form, address: e.target.value });
                setFieldErrors((prev) => ({ ...prev, address: "" }));
              }}
              className={`${inputClass} ${fieldErrors.address ? "border-error" : ""}`}
            />
            {fieldErrors.address && (
              <p className="text-xs text-error mt-1">{fieldErrors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-main/60 mb-1">
                Ciudad *
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => {
                  setForm({ ...form, city: e.target.value });
                  setFieldErrors((prev) => ({ ...prev, city: "" }));
                }}
                className={`${inputClass} ${fieldErrors.city ? "border-error" : ""}`}
              />
              {fieldErrors.city && (
                <p className="text-xs text-error mt-1">{fieldErrors.city}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-main/60 mb-1">
                Provincia *
              </label>
              <input
                type="text"
                value={form.province}
                onChange={(e) => {
                  setForm({ ...form, province: e.target.value });
                  setFieldErrors((prev) => ({ ...prev, province: "" }));
                }}
                className={`${inputClass} ${fieldErrors.province ? "border-error" : ""}`}
              />
              {fieldErrors.province && (
                <p className="text-xs text-error mt-1">{fieldErrors.province}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-main/60 mb-1">
                Código Postal
              </label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => {
                  setForm({ ...form, postalCode: e.target.value });
                  setFieldErrors((prev) => ({ ...prev, postalCode: "" }));
                }}
                className={`${inputClass} ${fieldErrors.postalCode ? "border-error" : ""}`}
              />
              {fieldErrors.postalCode && (
                <p className="text-xs text-error mt-1">{fieldErrors.postalCode}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="save-default"
              checked={form.isDefault}
              onChange={(e) =>
                setForm({ ...form, isDefault: e.target.checked })
              }
              className="rounded border-border-default accent-primary"
            />
            <label htmlFor="save-default" className="text-sm text-text-main/60">
              Establecer como dirección principal
            </label>
          </div>

          <div className="flex gap-3">
            {addresses.length > 0 && (
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-border-default text-text-main/60 font-medium py-2.5 rounded-lg hover:bg-surface-elevated transition-colors text-sm"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleUseWithoutSaving}
              disabled={!isFormFilled}
              className="flex-1 border border-primary text-primary font-medium py-2.5 rounded-lg hover:bg-primary/10 transition-colors text-sm disabled:opacity-50"
            >
              Usar sin guardar
            </button>
            <button
              onClick={handleSave}
              disabled={!isFormFilled || saving}
              className="flex-1 bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-lg transition-colors text-sm disabled:bg-surface-elevated disabled:text-text-main/30"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
