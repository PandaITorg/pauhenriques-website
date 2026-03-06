"use client";

// Forzar renderizado dinámico — esta página usa Firebase Auth que requiere el browser
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
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
import Image from "next/image";
import marcoSuperior from "@/assets/marco-superior.svg";
import marcoInferior from "@/assets/marco-inferior.svg";

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

// ===== PAGE COMPONENT =====
export default function SignUpPage() {
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
      const authError = error as AuthError;
      setGlobalError(getFirebaseErrorMessage(authError.code || ""));
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras verifica auth
  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "radial-gradient(ellipse at 60% 40%, #b89a73 0%, #c1c4a7 50%, #a4ac85 100%)",
        }}
      >
        <div className="simple-spinner" />
      </div>
    );
  }

  return (
    <main
      className="min-h-screen relative flex items-center justify-center px-4 py-10 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 60% 40%, #b89a73 0%, #c1c4a7 50%, #a4ac85 100%)",
      }}
    >
      {/* Shimmer rays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[
          { width: "24px", left: "25%", rotate: "-12deg", delay: "0s" },
          { width: "32px", left: "75%", rotate: "-12deg", delay: "5s" },
          { width: "16px", left: "50%", rotate: "12deg", delay: "2s" },
        ].map((ray, i) => (
          <div
            key={i}
            className="absolute h-[200%] -top-1/2 opacity-[0.05]"
            style={{
              width: ray.width,
              left: ray.left,
              transform: `rotate(${ray.rotate})`,
              background: "linear-gradient(to bottom, white, transparent)",
              animation: "shimmer 20s linear infinite",
              animationDelay: ray.delay,
            }}
          />
        ))}
      </div>

      {/* Plant frame SVGs */}
      <Image
        src={marcoSuperior}
        alt=""
        aria-hidden="true"
        className="absolute top-0 left-0 w-full h-auto z-1 pointer-events-none opacity-50"
        priority
      />
      <Image
        src={marcoInferior}
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-full h-auto z-1 pointer-events-none opacity-50"
        priority
      />

      {/* Form Card */}
      <div
        className="relative z-2 w-full max-w-120 rounded-2xl px-9 py-10"
        style={{
          background: "rgba(52, 61, 42, 0.82)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(166, 138, 99, 0.25)",
          boxShadow:
            "0 24px 64px rgba(0,0,0,0.35), 0 0 0 1px rgba(166,138,99,0.1)",
          animation: "fadeInUp 0.6s ease-out forwards",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-2">
          <p className="font-dancing-script text-[28px] text-primary font-bold">
            Pau Henriques
          </p>
          <p className="text-[11px] text-tertiary tracking-[2px] uppercase mt-0.5">
            Vive sin tóxicos
          </p>
        </div>

        <div className="h-px bg-[rgba(166,138,99,0.2)] my-4" />

        <h1 className="text-[22px] font-bold text-text-main text-center mt-4 mb-1.5">
          Crea tu cuenta
        </h1>
        <p className="text-[13px] text-[rgba(193,196,167,0.65)] text-center mb-6 leading-relaxed">
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
        <div className="flex items-center gap-3 my-4.5">
          <div className="flex-1 h-px bg-[rgba(166,138,99,0.2)]" />
          <span className="text-[12px] text-[rgba(193,196,167,0.4)] whitespace-nowrap">
            o crea tu cuenta con email
          </span>
          <div className="flex-1 h-px bg-[rgba(166,138,99,0.2)]" />
        </div>

        {/* Global Error */}
        {globalError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-[rgba(229,115,115,0.12)] border border-[rgba(229,115,115,0.3)] text-[13px] text-red-300">
            {globalError}
            {globalError.includes("iniciar sesión") && (
              <Link
                href={`/sign-in?redirect_uri=${redirectUri}`}
                className="ml-1 underline font-medium"
              >
                Ir a iniciar sesión
              </Link>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Nombre + Apellido */}
          <div className="grid grid-cols-2 gap-3 mb-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-[#c4a882] uppercase tracking-[0.8px] mb-1.5">
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="María"
                autoComplete="given-name"
                className={`w-full px-4 py-3 rounded-xl text-[14px] text-text-main outline-none transition-all duration-200 ${
                  errors.nombre
                    ? "border-[1.5px] border-red-400 shadow-[0_0_0_3px_rgba(229,115,115,0.12)] bg-[rgba(229,115,115,0.08)]"
                    : "border-[1.5px] border-[rgba(166,138,99,0.35)] bg-[rgba(193,160,110,0.18)] focus:border-primary focus:shadow-[0_0_0_3px_rgba(166,138,99,0.2)] focus:bg-[rgba(193,160,110,0.25)]"
                }`}
                style={{ fontFamily: "inherit" }}
              />
              {errors.nombre && (
                <p className="mt-1 text-[11px] text-red-400">
                  ⚠ {errors.nombre}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#c4a882] uppercase tracking-[0.8px] mb-1.5">
                Apellido
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                placeholder="García"
                autoComplete="family-name"
                className={`w-full px-4 py-3 rounded-xl text-[14px] text-text-main outline-none transition-all duration-200 ${
                  errors.apellido
                    ? "border-[1.5px] border-red-400 shadow-[0_0_0_3px_rgba(229,115,115,0.12)] bg-[rgba(229,115,115,0.08)]"
                    : "border-[1.5px] border-[rgba(166,138,99,0.35)] bg-[rgba(193,160,110,0.18)] focus:border-primary focus:shadow-[0_0_0_3px_rgba(166,138,99,0.2)] focus:bg-[rgba(193,160,110,0.25)]"
                }`}
                style={{ fontFamily: "inherit" }}
              />
              {errors.apellido && (
                <p className="mt-1 text-[11px] text-red-400">
                  ⚠ {errors.apellido}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="mb-3.5">
            <label className="block text-[11px] font-semibold text-[#c4a882] uppercase tracking-[0.8px] mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              autoComplete="email"
              className={`w-full px-4 py-3 rounded-xl text-[14px] text-text-main outline-none transition-all duration-200 ${
                errors.email
                  ? "border-[1.5px] border-red-400 shadow-[0_0_0_3px_rgba(229,115,115,0.12)] bg-[rgba(229,115,115,0.08)]"
                  : "border-[1.5px] border-[rgba(166,138,99,0.35)] bg-[rgba(193,160,110,0.18)] focus:border-primary focus:shadow-[0_0_0_3px_rgba(166,138,99,0.2)] focus:bg-[rgba(193,160,110,0.25)]"
              }`}
              style={{ fontFamily: "inherit" }}
            />
            {errors.email && (
              <p className="mt-1.5 text-[11px] text-red-400 flex items-center gap-1">
                ⚠ {errors.email}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div className="mb-3.5">
            <label className="block text-[11px] font-semibold text-[#c4a882] uppercase tracking-[0.8px] mb-1.5">
              Teléfono{" "}
              <span className="text-[rgba(193,196,167,0.35)] font-normal normal-case tracking-normal">
                (opcional)
              </span>
            </label>
            <div className="flex gap-2">
              <div className="flex items-center justify-center w-20 shrink-0 px-2 py-3 rounded-xl text-[14px] text-text-main border-[1.5px] border-[rgba(166,138,99,0.35)] bg-[rgba(193,160,110,0.18)] text-center">
                +593
              </div>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="99 123 4567"
                autoComplete="tel"
                className="flex-1 px-4 py-3 rounded-xl text-[14px] text-text-main outline-none transition-all duration-200 border-[1.5px] border-[rgba(166,138,99,0.35)] bg-[rgba(193,160,110,0.18)] focus:border-primary focus:shadow-[0_0_0_3px_rgba(166,138,99,0.2)] focus:bg-[rgba(193,160,110,0.25)]"
                style={{ fontFamily: "inherit" }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-3.5">
            <label className="block text-[11px] font-semibold text-[#c4a882] uppercase tracking-[0.8px] mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className={`w-full px-4 py-3 pr-11 rounded-xl text-[14px] text-text-main outline-none transition-all duration-200 ${
                  errors.password
                    ? "border-[1.5px] border-red-400 shadow-[0_0_0_3px_rgba(229,115,115,0.12)] bg-[rgba(229,115,115,0.08)]"
                    : "border-[1.5px] border-[rgba(166,138,99,0.35)] bg-[rgba(193,160,110,0.18)] focus:border-primary focus:shadow-[0_0_0_3px_rgba(166,138,99,0.2)] focus:bg-[rgba(193,160,110,0.25)]"
                }`}
                style={{ fontFamily: "inherit" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgba(193,196,167,0.4)] hover:text-primary transition-colors text-sm"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-[11px] text-red-400 flex items-center gap-1">
                ⚠ {errors.password}
              </p>
            )}
            {/* Indicador de fortaleza */}
            <PasswordStrengthIndicator password={formData.password} />
          </div>

          {/* Confirm Password */}
          <div className="mb-3.5">
            <label className="block text-[11px] font-semibold text-[#c4a882] uppercase tracking-[0.8px] mb-1.5">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                className={`w-full px-4 py-3 pr-11 rounded-xl text-[14px] text-text-main outline-none transition-all duration-200 ${
                  errors.confirmPassword
                    ? "border-[1.5px] border-red-400 shadow-[0_0_0_3px_rgba(229,115,115,0.12)] bg-[rgba(229,115,115,0.08)]"
                    : "border-[1.5px] border-[rgba(166,138,99,0.35)] bg-[rgba(193,160,110,0.18)] focus:border-primary focus:shadow-[0_0_0_3px_rgba(166,138,99,0.2)] focus:bg-[rgba(193,160,110,0.25)]"
                }`}
                style={{ fontFamily: "inherit" }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgba(193,196,167,0.4)] hover:text-primary transition-colors text-sm"
                aria-label={
                  showConfirmPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                {showConfirmPassword ? "🙈" : "👁"}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-[11px] text-red-400 flex items-center gap-1">
                ⚠ {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Terms (GDPR — unchecked by default) */}
          <div className="flex items-start gap-2.5 mb-3.5">
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
              className="text-[12px] text-[rgba(193,196,167,0.55)] leading-relaxed cursor-pointer"
            >
              Acepto los{" "}
              <Link
                href="/terminos-servicio"
                target="_blank"
                className="text-primary hover:underline"
              >
                Términos de Servicio
              </Link>{" "}
              y la{" "}
              <Link
                href="/politica-privacidad"
                target="_blank"
                className="text-primary hover:underline"
              >
                Política de Privacidad
              </Link>
              . Entiendo que mis datos serán tratados de forma segura.
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="-mt-2 mb-3 text-[11px] text-red-400 flex items-center gap-1">
              ⚠ {errors.acceptTerms}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 mt-2 bg-primary text-white rounded-xl text-[15px] font-semibold transition-all duration-200 hover:bg-[#b89a73] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(166,138,99,0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
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
        <p className="text-center mt-5 text-[13px] text-[rgba(193,196,167,0.5)]">
          ¿Ya tienes cuenta?{" "}
          <Link
            href={`/sign-in${redirectUri !== "/tienda" ? `?redirect_uri=${redirectUri}` : ""}`}
            className="text-primary font-medium hover:underline"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
