"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaShoppingBag,
  FaMapMarkerAlt,
  FaCreditCard,
  FaSignOutAlt,
  FaCheck,
} from "react-icons/fa";
import SavedAddresses from "@/components/checkout/SavedAddresses";
import SavedCards from "@/components/checkout/SavedCards";

interface UserProfile {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  photoURL: string | null;
  provider: string;
}

export default function MiCuentaPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "perfil" | "direcciones" | "tarjetas"
  >("perfil");

  // Edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in?redirect=/mi-cuenta");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function fetchProfile() {
      try {
        const docSnap = await getDoc(doc(db, "users", user!.uid));
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(data);
          setForm({
            nombre: data.nombre || "",
            apellido: data.apellido || "",
            telefono: data.telefono || "",
          });
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchProfile();
  }, [user]);

  async function handleSave() {
    if (!user || !form.nombre || !form.apellido) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        nombre: form.nombre,
        apellido: form.apellido,
        telefono: form.telefono,
        updatedAt: new Date(),
      });
      setProfile((prev) =>
        prev ? { ...prev, ...form } : prev,
      );
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  if (loading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="simple-spinner" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="Avatar"
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {(profile?.nombre?.[0] || user.email?.[0] || "U").toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {profile
                  ? `${profile.nombre} ${profile.apellido}`
                  : user.displayName || "Mi Cuenta"}
              </h1>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("perfil")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "perfil"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaUser className="w-3.5 h-3.5" />
            Datos personales
          </button>
          <button
            onClick={() => setActiveTab("direcciones")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "direcciones"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaMapMarkerAlt className="w-3.5 h-3.5" />
            Direcciones
          </button>
          <button
            onClick={() => setActiveTab("tarjetas")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "tarjetas"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaCreditCard className="w-3.5 h-3.5" />
            Tarjetas
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "perfil" && (
          <div className="space-y-6">
            {/* Profile info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  Informacion Personal
                </h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Editar
                  </button>
                )}
              </div>

              {loadingProfile ? (
                <div className="flex justify-center py-8">
                  <div className="simple-spinner" />
                </div>
              ) : editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={form.nombre}
                        onChange={(e) =>
                          setForm({ ...form, nombre: e.target.value })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        value={form.apellido}
                        onChange={(e) =>
                          setForm({ ...form, apellido: e.target.value })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Telefono
                    </label>
                    <input
                      type="tel"
                      value={form.telefono}
                      onChange={(e) =>
                        setForm({ ...form, telefono: e.target.value })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email || ""}
                      disabled
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      El email no se puede cambiar
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setEditing(false);
                        setForm({
                          nombre: profile?.nombre || "",
                          apellido: profile?.apellido || "",
                          telefono: profile?.telefono || "",
                        });
                      }}
                      className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || !form.nombre || !form.apellido}
                      className="flex-1 bg-background hover:bg-bosque-profundo-400 text-white font-medium py-2.5 rounded-lg transition-colors text-sm disabled:bg-gray-400"
                    >
                      {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {saved && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg text-sm">
                      <FaCheck className="w-3.5 h-3.5" />
                      Datos actualizados correctamente
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <FaUser className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Nombre</p>
                        <p className="text-sm font-medium text-gray-900">
                          {profile?.nombre} {profile?.apellido}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaEnvelope className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaPhone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Telefono</p>
                        <p className="text-sm font-medium text-gray-900">
                          {profile?.telefono || "No registrado"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/mis-pedidos"
                className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FaShoppingBag className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Mis Pedidos
                  </p>
                  <p className="text-xs text-gray-500">
                    Ver historial de compras
                  </p>
                </div>
              </Link>

              <button
                onClick={handleSignOut}
                className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <FaSignOutAlt className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Cerrar Sesion
                  </p>
                  <p className="text-xs text-gray-500">
                    Salir de tu cuenta
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {activeTab === "direcciones" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              Mis Direcciones
            </h2>
            <SavedAddresses
              onSelect={() => {}}
              selectedAddress={null}
            />
          </div>
        )}

        {activeTab === "tarjetas" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              Mis Tarjetas
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Tarjetas guardadas para pagos rapidos. Puedes eliminar las que ya
              no uses.
            </p>
            <SavedCards
              onSelectCard={() => {}}
              selectedToken={null}
              onAddNewCard={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
