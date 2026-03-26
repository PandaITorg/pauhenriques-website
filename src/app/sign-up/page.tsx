"use client";

// Forzar renderizado dinámico — esta página usa Firebase Auth que requiere el browser
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  AuthError,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase-auth";
import { z } from "zod";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator";
import { createUserProfile } from "@/app/actions/auth";
import { useAuth } from "@/context/AuthContext";
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
} from "react-icons/fa";

// ===== ZOD SCHEMA =====
const SignUpSchema = z
  .object({
    nombre: z
      .string()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(50, "El nombre es demasiado largo"),
    apellido: z
      .string()
      .min(2, "El apellido debe tener al menos 2 caracteres")
      .max(50, "El apellido es demasiado largo"),
    email: z.string().email("Ingresa un correo electrónico válido"),
    telefono: z.string().optional(),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
      .regex(/[0-9]/, "Debe contener al menos un número")
      .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar los términos y condiciones",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof SignUpSchema>;
type FormErrors = Partial<Record<keyof SignUpFormData, string>>;

// ===== FIREBASE ERROR MESSAGES =====
function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    "auth/email-already-in-use":
      "Ya existe una cuenta con este correo. ¿Quieres iniciar sesión?",
    "auth/weak-password": "La contraseña es demasiado débil.",
    "auth/invalid-email": "El correo electrónico no es válido.",
    "auth/network-request-failed": "Error de conexión. Verifica tu internet.",
  };
  return messages[code] || "Error al crear la cuenta. Intenta de nuevo.";
}

const inputBase =
  "w-full pl-10 pr-4 py-3 bg-input-bg border rounded-xl text-sm text-text-main placeholder:text-text-main/35 outline-none transition-all duration-200";
const inputBaseNoIcon =
  "w-full px-4 py-3 bg-input-bg border rounded-xl text-sm text-text-main placeholder:text-text-main/35 outline-none transition-all duration-200";
const inputNormal =
  "border-border-default focus:border-primary focus:ring-2 focus:ring-primary/20";
const inputError =
  "border-error shadow-[0_0_0_3px_rgba(199,92,74,0.12)] bg-error-light";

// ===== PAGE COMPONENT =====
export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="simple-spinner" />
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const redirectUri = searchParams.get("redirect_uri") || "/tienda";

  const [formData, setFormData] = useState<SignUpFormData>({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Si ya está autenticado, redirigir
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectUri);
    }
  }, [user, authLoading, router, redirectUri]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    // Limpiar error del campo al escribir
    if (errors[name as keyof SignUpFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setGlobalError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");

    // Validar con Zod
    const result = SignUpSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SignUpFormData;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // 1. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        getClientAuth(),
        formData.email,
        formData.password,
      );
      const user = userCredential.user;

      // 2. Actualizar displayName en Firebase Auth
      await updateProfile(user, {
        displayName: `${formData.nombre} ${formData.apellido}`.trim(),
      });

      // 3. Obtener ID Token
      const idToken = await user.getIdToken();

      // 4. Crear session cookie en el servidor
      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!sessionResponse.ok) {
        throw new Error("Error al crear la sesión");
      }

      // 5. Crear perfil en Firestore
      await createUserProfile({
        uid: user.uid,
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono || null,
        photoURL: null,
        provider: "email",
      });

      // 6. Redirigir
      router.push(redirectUri);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "code" in error) {
        setGlobalError(getFirebaseErrorMessage((error as AuthError).code));
      } else if (error instanceof Error) {
        setGlobalError(error.message);
      } else {
        setGlobalError("Error al crear la cuenta. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras verifica auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="simple-spinner" />
      </div>
    );
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center px-4 py-16 bg-background overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-100 bg-primary/4 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />

      {/* Form Card */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-surface-card border border-border-subtle p-8 sm:p-10 shadow-[0_24px_64px_rgba(0,0,0,0.25)]">
        {/* Logo */}
        <div className="text-center mb-6">
          <p className="font-dancing-script text-3xl text-primary font-bold">
            Pau Henriques
          </p>
          <p className="text-[11px] text-tertiary tracking-[2px] uppercase mt-1">
            Vive sin tóxicos
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-linear-to-r from-transparent via-border-default to-transparent mb-6" />

        <h1 className="text-xl font-semibold text-text-main text-center mb-1">
          Crea tu cuenta
        </h1>
        <p className="text-sm text-text-main/50 text-center mb-7 leading-relaxed">
          Únete a nuestra comunidad y empieza tu camino hacia una vida sin
          tóxicos
        </p>

        {/* Google Sign Up */}
        <GoogleSignInButton
          mode="signup"
          redirectUri={redirectUri}
          onError={setGlobalError}
        />

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border-default" />
          <span className="text-xs text-text-main/40 whitespace-nowrap">
            o crea tu cuenta con email
          </span>
          <div className="flex-1 h-px bg-border-default" />
        </div>

        {/* Global Error */}
        {globalError && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-error-light border border-error/30 text-sm text-error flex items-center gap-2">
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-error" />
            <span>
              {globalError}
              {globalError.includes("iniciar sesión") && (
                <Link
                  href={`/sign-in?redirect_uri=${redirectUri}`}
                  className="ml-1 underline font-medium"
                >
                  Ir a iniciar sesión
                </Link>
              )}
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Nombre + Apellido */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-text-main/70 uppercase tracking-wider mb-1.5">
                Nombre
              </label>
              <div className="relative">
                <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-main/30" />
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="María"
                  autoComplete="given-name"
                  className={`${inputBase} ${errors.nombre ? inputError : inputNormal}`}
                />
              </div>
              {errors.nombre && (
                <p className="mt-1 text-xs text-error flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-error shrink-0" />
                  {errors.nombre}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-text-main/70 uppercase tracking-wider mb-1.5">
                Apellido
              </label>
              <div className="relative">
                <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-main/30" />
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  placeholder="García"
                  autoComplete="family-name"
                  className={`${inputBase} ${errors.apellido ? inputError : inputNormal}`}
                />
              </div>
              {errors.apellido && (
                <p className="mt-1 text-xs text-error flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-error shrink-0" />
                  {errors.apellido}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-main/70 uppercase tracking-wider mb-1.5">
              Correo electrónico
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-main/30" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                autoComplete="email"
                className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-error flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-error shrink-0" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-main/70 uppercase tracking-wider mb-1.5">
              Teléfono{" "}
              <span className="text-text-main/30 font-normal normal-case tracking-normal">
                (opcional)
              </span>
            </label>
            <div className="flex gap-2">
              <div className="flex items-center justify-center w-20 shrink-0 px-2 py-3 rounded-xl text-sm text-text-main/60 border border-border-default bg-input-bg text-center">
                +593
              </div>
              <div className="relative flex-1">
                <FaPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-main/30" />
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="99 123 4567"
                  autoComplete="tel"
                  className={`${inputBase} ${inputNormal}`}
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-main/70 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-main/30" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className={`${inputBase} pr-11! ${errors.password ? inputError : inputNormal}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-main/30 hover:text-primary transition-colors"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? (
                  <FaEyeSlash className="w-4 h-4" />
                ) : (
                  <FaEye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-error flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-error shrink-0" />
                {errors.password}
              </p>
            )}
            {/* Indicador de fortaleza */}
            <PasswordStrengthIndicator password={formData.password} />
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-main/70 uppercase tracking-wider mb-1.5">
              Confirmar contraseña
            </label>
            <div className="relative">
              <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-main/30" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                className={`${inputBase} pr-11! ${errors.confirmPassword ? inputError : inputNormal}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-main/30 hover:text-primary transition-colors"
                aria-label={
                  showConfirmPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="w-4 h-4" />
                ) : (
                  <FaEye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-error flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-error shrink-0" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Terms (GDPR — unchecked by default) */}
          <div className="flex items-start gap-3 mb-4">
            <input
              type="checkbox"
              name="acceptTerms"
              id="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="w-4 h-4 mt-0.5 shrink-0 accent-primary cursor-pointer"
            />
            <label
              htmlFor="acceptTerms"
              className="text-xs text-text-main/50 leading-relaxed cursor-pointer"
            >
              Acepto los{" "}
              <Link
                href="/terminos-servicio"
                target="_blank"
                className="text-primary hover:text-primary-hover transition-colors"
              >
                Términos de Servicio
              </Link>{" "}
              y la{" "}
              <Link
                href="/politica-privacidad"
                target="_blank"
                className="text-primary hover:text-primary-hover transition-colors"
              >
                Política de Privacidad
              </Link>
              . Entiendo que mis datos serán tratados de forma segura.
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="-mt-2 mb-4 text-xs text-error flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-error shrink-0" />
              {errors.acceptTerms}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-1 bg-primary text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-primary-hover hover:-translate-y-px hover:shadow-glow-primary disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creando tu cuenta...
              </>
            ) : (
              "Crear mi cuenta"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-text-main/45">
          ¿Ya tienes cuenta?{" "}
          <Link
            href={`/sign-in${redirectUri !== "/tienda" ? `?redirect_uri=${redirectUri}` : ""}`}
            className="text-primary font-medium hover:text-primary-hover transition-colors"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
