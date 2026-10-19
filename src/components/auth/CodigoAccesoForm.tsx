"use client";

// Entrar al panel con un código de 6 dígitos al correo (sin contraseña). Al canjear el código
// se inicia sesión en Firebase con un token a medida; el useEffect de /sign-in crea la cookie
// y redirige al panel, igual que con contraseña o Google.
import { useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase-auth";

const input =
  "w-full px-4 py-3 bg-input-bg border border-border-default rounded-xl text-sm text-text-main placeholder:text-text-main/35 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const boton =
  "w-full px-4 py-3 bg-primary text-white rounded-xl text-sm font-semibold transition-colors hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed";

export default function CodigoAccesoForm() {
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function pedir(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) return setError("Escribe tu correo del equipo.");
    setCargando(true);
    try {
      const r = await fetch("/api/auth/codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json().catch(() => ({}));
      setAviso(d.mensaje ?? "Si ese correo puede entrar al panel, le llega un código.");
      setEnviado(true);
    } catch {
      setError("No hay conexión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  async function canjear(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const r = await fetch("/api/auth/codigo/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.token) {
        setError(d.error ?? "Código incorrecto o vencido. Pide uno nuevo si hace falta.");
        return;
      }
      await signInWithCustomToken(getClientAuth(), d.token);
    } catch {
      setError("No se pudo entrar. Pide un código nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error-light border border-error/30 text-sm text-error">{error}</div>
      )}
      {!enviado ? (
        <form onSubmit={pedir} noValidate className="space-y-3">
          <label className="block text-xs font-medium text-text-main/70 uppercase tracking-wider">
            Correo del equipo
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="administrador@pauhenriques.com"
            autoComplete="email"
            className={input}
          />
          <button type="submit" disabled={cargando} className={boton}>
            {cargando ? "Enviando..." : "Enviarme un código"}
          </button>
        </form>
      ) : (
        <form onSubmit={canjear} noValidate className="space-y-3">
          <p className="text-sm text-text-main/60">{aviso}</p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="000000"
            aria-label="Código de 6 dígitos"
            className={`${input} text-center text-lg tracking-[0.4em]`}
          />
          <button type="submit" disabled={cargando || codigo.length !== 6} className={boton}>
            {cargando ? "Verificando..." : "Entrar al panel"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEnviado(false);
              setCodigo("");
            }}
            className="w-full text-xs text-text-main/45 hover:text-primary transition-colors"
          >
            Usar otro correo o pedir otro código
          </button>
        </form>
      )}
    </div>
  );
}
