"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { z } from "zod";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaShoppingBag,
  FaMapMarkerAlt,
  FaCreditCard,
  FaSignOutAlt,
  FaCheck,
  FaExclamationCircle,
} from "react-icons/fa";
import SavedAddresses from "@/components/checkout/SavedAddresses";
import SavedCards from "@/components/checkout/SavedCards";
import NuveiPaymentForm from "@/components/checkout/NuveiPaymentForm";

interface UserProfile {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  photoURL: string | null;
  provider: string;
}

const profileSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  telefono: z
    .string()
    .regex(/^[\d+\-\s()]*$/, "Formato de teléfono inválido")
    .optional()
    .or(z.literal("")),
});

type ProfileErrors = Partial<Record<keyof z.infer<typeof profileSchema>, string>>;

const TABS = [
  { key: "perfil" as const, label: "Datos personales", icon: <FaUser className="w-3.5 h-3.5" /> },
  { key: "direcciones" as const, label: "Direcciones", icon: <FaMapMarkerAlt className="w-3.5 h-3.5" /> },
  { key: "tarjetas" as const, label: "Tarjetas", icon: <FaCreditCard className="w-3.5 h-3.5" /> },
];

const inputClass =
  "w-full py-3 px-4 bg-input-bg border border-border-default rounded-xl text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200";

export default function MiCuentaPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<"perfil" | "direcciones" | "tarjetas">("perfil");

  // Edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ nombre: "", apellido: "", telefono: "" });
  const [errors, setErrors] = useState<ProfileErrors>({});

  // Cards tab state
  const [showNuveiForm, setShowNuveiForm] = useState(false);
  const [cardKey, setCardKey] = useState(0);

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

  function validateForm(): boolean {
    const result = profileSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: ProfileErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ProfileErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleSave() {
    if (!user || !validateForm()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        nombre: form.nombre,
        apellido: form.apellido,
        telefono: form.telefono,
        updatedAt: new Date(),
      });
      setProfile((prev) => (prev ? { ...prev, ...form } : prev));
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="simple-spinner" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile
    ? `${profile.nombre} ${profile.apellido}`
    : user.displayName || "Mi Cuenta";

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero header with avatar ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/60 via-background to-background" />
        {/* Ambient glow behind avatar */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 pt-12 pb-8 md:pt-20 md:pb-10">
          <div className="flex flex-col items-center text-center">
            {/* Avatar with glow ring */}
            <div className="relative w-20 h-20 mb-4">
              <div className="absolute -inset-1 rounded-full bg-linear-to-br from-primary/40 to-primary/10 blur-sm" />
              <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-primary/30 bg-surface-card flex items-center justify-center">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="Avatar"
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {(profile?.nombre?.[0] || user.email?.[0] || "U").toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-2">
              Mi Cuenta
            </span>
            <h1 className="font-cormorant text-2xl sm:text-3xl md:text-4xl font-semibold text-text-main mb-1">
              {displayName}
            </h1>
            <p className="text-sm text-text-main/50">{user.email}</p>
          </div>
        </div>
      </section>

      {/* ── Separator ── */}
      <div className="h-px max-w-3xl mx-auto bg-linear-to-r from-transparent via-border-default to-transparent" />

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Tabs */}
        <div className="flex border-b border-border-default mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-text-main/50 hover:text-text-main/70"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── TAB: Perfil ─── */}
        {activeTab === "perfil" && (
          <div className="space-y-6">
            <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-text-main">
                  Información Personal
                </h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-sm text-primary hover:text-primary-hover transition-colors"
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
                      <label className="block text-xs font-medium text-text-main/60 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={form.nombre}
                        onChange={(e) => {
                          setForm({ ...form, nombre: e.target.value });
                          if (errors.nombre) setErrors({ ...errors, nombre: undefined });
                        }}
                        className={`${inputClass} ${errors.nombre ? "border-error focus:ring-error/40" : ""}`}
                      />
                      {errors.nombre && (
                        <p className="flex items-center gap-1 text-xs text-error mt-1">
                          <FaExclamationCircle className="w-3 h-3" />
                          {errors.nombre}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-main/60 mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        value={form.apellido}
                        onChange={(e) => {
                          setForm({ ...form, apellido: e.target.value });
                          if (errors.apellido) setErrors({ ...errors, apellido: undefined });
                        }}
                        className={`${inputClass} ${errors.apellido ? "border-error focus:ring-error/40" : ""}`}
                      />
                      {errors.apellido && (
                        <p className="flex items-center gap-1 text-xs text-error mt-1">
                          <FaExclamationCircle className="w-3 h-3" />
                          {errors.apellido}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-main/60 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={form.telefono}
                      onChange={(e) => {
                        setForm({ ...form, telefono: e.target.value });
                        if (errors.telefono) setErrors({ ...errors, telefono: undefined });
                      }}
                      className={`${inputClass} ${errors.telefono ? "border-error focus:ring-error/40" : ""}`}
                    />
                    {errors.telefono && (
                      <p className="flex items-center gap-1 text-xs text-error mt-1">
                        <FaExclamationCircle className="w-3 h-3" />
                        {errors.telefono}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-main/60 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email || ""}
                      disabled
                      className="w-full py-3 px-4 bg-surface-elevated border border-border-subtle rounded-xl text-sm text-text-main/40"
                    />
                    <p className="text-xs text-text-main/30 mt-1">
                      El email no se puede cambiar
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setEditing(false);
                        setErrors({});
                        setForm({
                          nombre: profile?.nombre || "",
                          apellido: profile?.apellido || "",
                          telefono: profile?.telefono || "",
                        });
                      }}
                      className="flex-1 border border-border-default text-text-main/60 font-medium py-2.5 rounded-xl hover:bg-surface-elevated transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-xl transition-all duration-200 text-sm disabled:bg-surface-elevated disabled:text-text-main/30"
                    >
                      {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {saved && (
                    <div className="flex items-center gap-2 text-success bg-success/10 p-3 rounded-lg text-sm">
                      <FaCheck className="w-3.5 h-3.5" />
                      Datos actualizados correctamente
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <FaUser className="w-4 h-4 text-text-main/30" />
                      <div>
                        <p className="text-xs text-text-main/50">Nombre</p>
                        <p className="text-sm font-medium text-text-main">
                          {profile?.nombre} {profile?.apellido}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaEnvelope className="w-4 h-4 text-text-main/30" />
                      <div>
                        <p className="text-xs text-text-main/50">Email</p>
                        <p className="text-sm font-medium text-text-main">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaPhone className="w-4 h-4 text-text-main/30" />
                      <div>
                        <p className="text-xs text-text-main/50">Teléfono</p>
                        <p className="text-sm font-medium text-text-main">
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
                className="bg-surface-card border border-border-subtle rounded-xl p-5 flex items-center gap-4 hover:border-primary/30 hover:shadow-(--shadow-glow-primary) transition-all duration-200"
              >
                <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center">
                  <FaShoppingBag className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-main">
                    Mis Pedidos
                  </p>
                  <p className="text-xs text-text-main/50">
                    Ver historial de compras
                  </p>
                </div>
              </Link>

              <button
                onClick={handleSignOut}
                className="bg-surface-card border border-border-subtle rounded-xl p-5 flex items-center gap-4 hover:border-error/40 transition-colors text-left cursor-pointer"
              >
                <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
                  <FaSignOutAlt className="w-4 h-4 text-error" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-main">
                    Cerrar Sesión
                  </p>
                  <p className="text-xs text-text-main/50">
                    Salir de tu cuenta
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB: Direcciones ─── */}
        {activeTab === "direcciones" && (
          <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text-main mb-5">
              Mis Direcciones
            </h2>
            <SavedAddresses
              onSelect={() => {}}
              selectedAddress={null}
            />
          </div>
        )}

        {/* ─── TAB: Tarjetas ─── */}
        {activeTab === "tarjetas" && (
          <div className="bg-surface-card border border-border-subtle rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text-main mb-2">
              Mis Tarjetas
            </h2>
            <p className="text-sm text-text-main/50 mb-5">
              Tarjetas guardadas para pagos rápidos. Puedes eliminar las que ya
              no uses.
            </p>

            <SavedCards
              key={cardKey}
              onSelectCard={() => {}}
              selectedToken={null}
              onAddNewCard={() => setShowNuveiForm(true)}
            />

            {showNuveiForm && (
              <div className="mt-5 border border-border-subtle rounded-xl p-5">
                <h3 className="text-sm font-semibold text-text-main mb-4">
                  Agregar nueva tarjeta
                </h3>
                <NuveiPaymentForm
                  uid={user.uid}
                  email={user.email || ""}
                  onTokenSuccess={() => {
                    setShowNuveiForm(false);
                    setCardKey((k) => k + 1);
                  }}
                  onTokenError={() => {}}
                />
                <button
                  onClick={() => setShowNuveiForm(false)}
                  className="w-full mt-3 border border-border-default text-text-main/60 font-medium py-2.5 rounded-xl hover:bg-surface-elevated transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
