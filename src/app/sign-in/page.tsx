"use client";

// Forzar renderizado dinámico — esta página usa Firebase Auth que requiere el browser
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, sendPasswordResetEmail, AuthError } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase-auth";
import { z } from "zod";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import marcoSuperior from "@/assets/marco-superior.svg";
import marcoInferior from "@/assets/marco-inferior.svg";

// ===== ZOD SCHEMA =====
const SignInSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

type SignInFormData = z.infer<typeof SignInSchema>;
type FormErrors = Partial<Record<keyof SignInFormData, string>>;

// ===== FIREBASE ERROR MESSAGES =====
function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    "auth/user-not-found": "No existe una cuenta con este correo electrónico.",
    "auth/wrong-password": "Contraseña incorrecta. Intenta de nuevo.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/too-many-requests":
      "Demasiados intentos fallidos. Espera unos minutos.",
    "auth/user-disabled": "Esta cuenta ha sido deshabilitada.",
    "auth/network-request-failed": "Error de conexión. Verifica tu internet.",
  };
  return messages[code] || "Error al iniciar sesión. Intenta de nuevo.";
}

// ===== PAGE COMPONENT =====
export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const redirectUri = searchParams.get("redirect_uri") || "/tienda";

  const [formData, setFormData] = useState<SignInFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Si ya está autenticado, redirigir
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectUri);
    }
  }, [user, authLoading, router, redirectUri]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error del campo al escribir
    if (errors[name as keyof SignInFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setGlobalError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");

    // Validar con Zod
    const result = SignInSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SignInFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // 1. Sign in con Firebase
      const userCredential = await signInWithEmailAndPassword(
        getClientAuth(),
        formData.email,
        formData.password,
      );

      // 2. Obtener ID Token
      const idToken = await userCredential.user.getIdToken();

      // 3. Crear session cookie en el servidor
      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!sessionResponse.ok) {
        throw new Error("Error al crear la sesión");
      }

      // 4. Redirigir
      router.push(redirectUri);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "code" in error) {
        setGlobalError(getFirebaseErrorMessage((error as AuthError).code));
      } else if (error instanceof Error) {
        setGlobalError(error.message);
      } else {
        setGlobalError("Error al iniciar sesión. Intenta de nuevo.");
      }
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
          { width: "20px", left: "33%", rotate: "15deg", delay: "8s" },
        ].map((ray, i) => (
          <div
            key={i}
            className="absolute h-[200%] -top-1/2 opacity-[0.05]"
            style={{
              width: ray.width,
              left: ray.left,
              transform: `rotate(${ray.rotate})`,
              background: "linear-gradient(to bottom, white, transparent)",
              animation: `shimmer 20s linear infinite`,
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
        className="relative z-2 w-full max-w-110 rounded-2xl px-9 py-10"
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
          Bienvenida de vuelta
        </h1>
        <p className="text-[13px] text-[rgba(193,196,167,0.65)] text-center mb-6 leading-relaxed">
          Ingresa a tu cuenta para continuar con tu compra
        </p>

        {/* Google Sign In */}
        <GoogleSignInButton
          mode="signin"
          redirectUri={redirectUri}
          onError={setGlobalError}
        />

        {/* Divider */}
        <div className="flex items-center gap-3 my-4.5">
          <div className="flex-1 h-px bg-[rgba(166,138,99,0.2)]" />
          <span className="text-[12px] text-[rgba(193,196,167,0.4)] whitespace-nowrap">
            o ingresa con tu email
          </span>
          <div className="flex-1 h-px bg-[rgba(166,138,99,0.2)]" />
        </div>

        {/* Global Error */}
        {globalError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-[rgba(229,115,115,0.12)] border border-[rgba(229,115,115,0.3)] text-[13px] text-red-300">
            {globalError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
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
                placeholder="••••••••"
                autoComplete="current-password"
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
          </div>

          {/* Forgot password */}
          <div className="text-right -mt-1 mb-3.5">
            <button
              type="button"
              onClick={async () => {
                if (!formData.email) {
                  setErrors({ email: "Ingresa tu email primero" });
                  return;
                }
                try {
                  await sendPasswordResetEmail(getClientAuth(), formData.email);
                  setGlobalError("");
                  alert("Se envió un enlace para restablecer tu contraseña a " + formData.email);
                } catch {
                  setGlobalError("Error al enviar el correo. Verifica tu email.");
                }
              }}
              className="text-[12px] text-[rgba(193,196,167,0.5)] hover:text-primary transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 mt-2 bg-primary text-white rounded-xl text-[15px] font-semibold transition-all duration-200 hover:bg-[#b89a73] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(166,138,99,0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verificando...
              </>
            ) : (
              "Ingresar a mi cuenta"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center mt-5 text-[13px] text-[rgba(193,196,167,0.5)]">
          ¿No tienes cuenta?{" "}
          <Link
            href={`/sign-up${redirectUri !== "/tienda" ? `?redirect_uri=${redirectUri}` : ""}`}
            className="text-primary font-medium hover:underline"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
