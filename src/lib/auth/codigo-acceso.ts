import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Código de un solo uso para entrar al panel (pedir y canjear). Copiado de Well Me (#74):
 * entra cualquier cuenta del equipo, es decir, con rol en sus custom claims.
 */
export const COLECCION = "adminCodigosAcceso";
export const CODIGO_VIGENCIA_MIN = 10;
export const CODIGO_ESPERA_REENVIO_SEG = 60;
export const CODIGO_INTENTOS_MAX = 5;

export type ResultadoCodigo = "ok" | "vencido" | "agotado" | "incorrecto";

/** El código nunca se guarda en claro; el correo va dentro para que la misma cifra en dos buzones no dé la misma huella. */
export function huella(codigo: string, email: string): string {
  return createHash("sha256").update(`${email}:${codigo}`).digest("hex");
}

/** Comparación en tiempo constante (comparar con === filtra información por cuánto tarda). */
export function coincide(huellaGuardada: string, codigo: string, email: string): boolean {
  const a = Buffer.from(huellaGuardada ?? "", "hex");
  const b = Buffer.from(huella(codigo, email), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function normalizarCorreo(valor: unknown): string {
  return String(valor ?? "").trim().toLowerCase();
}

/**
 * Decide qué pasa con un intento: vencido o sin intentos → se quema; incorrecto → suma un
 * intento; correcto → entra.
 */
export function evaluarCodigo(
  guardado: { venceEn: Date; intentos: number },
  esCorrecto: boolean,
  ahora: Date,
): { resultado: ResultadoCodigo; intentos: number } {
  if (guardado.venceEn <= ahora) return { resultado: "vencido", intentos: guardado.intentos };
  const intentos = guardado.intentos + 1;
  if (intentos > CODIGO_INTENTOS_MAX) return { resultado: "agotado", intentos };
  return { resultado: esCorrecto ? "ok" : "incorrecto", intentos };
}
