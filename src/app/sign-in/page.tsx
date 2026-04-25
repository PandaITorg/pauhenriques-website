"use client";

// Forzar renderizado dinámico — esta página usa Firebase Auth que requiere el browser
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, sendPasswordResetEmail, AuthError } from "firebase/auth";
import type { User } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase-auth";
import { z } from "zod";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/context/AuthContext";
import { getRoleFromClaims } from "@/lib/auth/roles";
import { computePostLoginRedirect } from "@/lib/auth/postLoginRedirect";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";

// Resuelve el destino post-login leyendo el role del idToken claims y
// el host actual. Maneja same-origin (router.push) y cross-domain
// (window.location.href) según corresponda.
async function performPostLoginRedirect(
  user: User,
  requestedRedirect: string | null,
  router: ReturnType<typeof useRouter>,
): Promise<void> {
  const tokenResult = await user.getIdTokenResult();
  const role = getRoleFromClaims(
    tokenResult.claims as unknown as Record<string, unknown>,
  );
  const action = computePostLoginRedirect({
    role,
    requestedRedirect,
    currentHostname:
      typeof window !== "undefined" ? window.location.hostname : "",
  });
  if (action.externalUrl) {
    window.location.href = action.externalUrl;
  } else {
    router.push(action.path);
  }
}

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

const inputBase =
  "w-full pl-10 pr-4 py-3 bg-input-bg border rounded-xl text-sm text-text-main placeholder:text-text-main/35 outline-none transition-all duration-200";
const inputNormal =
  "border-border-default focus:border-primary focus:ring-2 focus:ring-primary/20";
const inputError =
  "border-error shadow-[0_0_0_3px_rgba(199,92,74,0.12)] bg-error-light";

// ===== PAGE COMPONENT =====
export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="simple-spinner" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const requestedRedirect = searchParams.get("redirect_uri");
  // Para usar como href en links del <Link href> y para mantener el query
  // si el user va a sign-up. La decisión real del redirect post-login se
  // calcula en performPostLoginRedirect según el rol y el host.
  const redirectUri = requestedRedirect || "/tienda";

  const [formData, setFormData] = useState<SignInFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Si Firebase client ya tiene un user pero no hay session cookie server-side,
  // sincronizar la cookie ANTES de redirigir. Evita loop /sign-in ↔ /admin.
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (!cancelled && res.ok) {
          await performPostLoginRedirect(user, requestedRedirect, router);
        }
      } catch {
        // Si falla la sincronizacion, no hacemos nada; el user puede re-submit
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router, requestedRedirect]);

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

      // 4. Redirigir según rol + host (admin → /admin, corriente → sitio público)
      await performPostLoginRedirect(userCredential.user, requestedRedirect, router);
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
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-surface-card border border-border-subtle p-8 sm:p-10 shadow-[0_24px_64px_rgba(0,0,0,0.25)]">
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
          Bienvenida de vuelta
        </h1>
        <p className="text-sm text-text-main/50 text-center mb-7 leading-relaxed">
          Ingresa a tu cuenta para continuar
        </p>

        {/* Google Sign In */}
        <GoogleSignInButton
          mode="signin"
          redirectUri={requestedRedirect ?? undefined}
          onError={setGlobalError}
        />

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border-default" />
          <span className="text-xs text-text-main/40 whitespace-nowrap">
            o ingresa con tu email
          </span>
          <div className="flex-1 h-px bg-border-default" />
        </div>

        {/* Global Error */}
        {globalError && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-error-light border border-error/30 text-sm text-error flex items-center gap-2">
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-error" />
            {globalError}
          </div>
        )}

        {/* Reset confirmation */}
        {resetSent && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-success-light border border-success/30 text-sm text-success flex items-center gap-2">
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-success" />
            Se envió un enlace para restablecer tu contraseña.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
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

          {/* Password */}
          <div className="mb-3">
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
                placeholder="••••••••"
                autoComplete="current-password"
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
          </div>

          {/* Forgot password */}
          <div className="text-right mb-5">
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
                  setResetSent(true);
                  setTimeout(() => setResetSent(false), 5000);
                } catch {
                  setGlobalError("Error al enviar el correo. Verifica tu email.");
                }
              }}
              className="text-xs text-text-main/45 hover:text-primary transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-primary-hover hover:-translate-y-px hover:shadow-glow-primary disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
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
        <p className="text-center mt-6 text-sm text-text-main/45">
          ¿No tienes cuenta?{" "}
          <Link
            href={`/sign-up${redirectUri !== "/tienda" ? `?redirect_uri=${redirectUri}` : ""}`}
            className="text-primary font-medium hover:text-primary-hover transition-colors"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
