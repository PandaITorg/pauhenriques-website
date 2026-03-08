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
      // Auto-select default if nothing selected
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

  const isFormValid =
    form.fullName && form.phone && form.address && form.city && form.province;

  async function handleSave() {
    if (!user || !isFormValid) return;
    setSaving(true);
    try {
      const isFirst = addresses.length === 0;
      await createAddress(user.uid, {
        ...form,
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
    if (!isFormValid) return;
    onSelect({
      fullName: form.fullName,
      phone: form.phone,
      address: form.address,
      city: form.city,
      province: form.province,
      postalCode: form.postalCode,
      country: form.country,
    });
    setShowForm(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="simple-spinner" />
      </div>
    );
  }

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
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-text-inverted">
                      {addr.label || "Dirección"}
                    </span>
                    {addr.isDefault && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Principal
                      </span>
                    )}
                    {isSelected(addr) && (
                      <FaCheck className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{addr.fullName}</p>
                  <p className="text-sm text-gray-500">
                    {addr.address}, {addr.city}, {addr.province}
                  </p>
                  <p className="text-sm text-gray-500">{addr.phone}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(addr.id);
                  }}
                  className="text-gray-400 hover:text-red-500 p-1"
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
          className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors"
        >
          <FaPlus className="w-3 h-3" />
          Agregar nueva dirección
        </button>
      )}

      {/* New address form */}
      {showForm && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-sm text-text-inverted">
            Nueva dirección
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Etiqueta (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Casa, Oficina"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) =>
                  setForm({ ...form, fullName: e.target.value })
                }
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Dirección *
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Ciudad *
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Provincia *
              </label>
              <input
                type="text"
                value={form.province}
                onChange={(e) =>
                  setForm({ ...form, province: e.target.value })
                }
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Código Postal
              </label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) =>
                  setForm({ ...form, postalCode: e.target.value })
                }
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
              />
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
              className="rounded border-gray-300"
            />
            <label htmlFor="save-default" className="text-sm text-gray-600">
              Establecer como dirección principal
            </label>
          </div>

          <div className="flex gap-3">
            {addresses.length > 0 && (
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-300 text-text-inverted font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleUseWithoutSaving}
              disabled={!isFormValid}
              className="flex-1 border border-primary text-primary font-medium py-2.5 rounded-lg hover:bg-primary/5 transition-colors text-sm disabled:opacity-50"
            >
              Usar sin guardar
            </button>
            <button
              onClick={handleSave}
              disabled={!isFormValid || saving}
              className="flex-1 bg-background hover:bg-bosque-profundo-400 text-white font-medium py-2.5 rounded-lg transition-colors text-sm disabled:bg-gray-400"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
