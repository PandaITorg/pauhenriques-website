// Pide un código de un solo uso para entrar al panel. Solo le llega a quien tiene cuenta y rol
// de equipo (custom claims). LA RESPUESTA ES SIEMPRE LA MISMA: si dijera "ese correo no
// existe", serviría para averiguar quién tiene acceso al panel.
import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { auth, dbAdmin } from "@/lib/firebase-admin";
import { getRoleFromClaims } from "@/lib/auth/roles";
import {
  CODIGO_ESPERA_REENVIO_SEG,
  CODIGO_VIGENCIA_MIN,
  COLECCION,
  huella,
  normalizarCorreo,
} from "@/lib/auth/codigo-acceso";
import { sendAdminAccessCode } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const mismaRespuesta = NextResponse.json({
    ok: true,
    mensaje:
      "Si ese correo puede entrar al panel, le llega un código en unos segundos. Revisa también el correo no deseado.",
  });

  const email = normalizarCorreo((await request.json().catch(() => ({})))?.email);
  if (!email.includes("@") || !auth || !dbAdmin) return mismaRespuesta;

  try {
    const usuario = await auth.getUserByEmail(email).catch(() => null);
    if (!usuario || usuario.disabled || !getRoleFromClaims(usuario.customClaims)) return mismaRespuesta;

    const ref = dbAdmin.collection(COLECCION).doc(email);
    const previo = (await ref.get()).data();
    // Freno de reenvío: que nadie le llene el buzón a alguien del equipo pidiendo códigos.
    if (previo?.creadoEn && (Date.now() - previo.creadoEn.toMillis()) / 1000 < CODIGO_ESPERA_REENVIO_SEG) {
      return mismaRespuesta;
    }

    const codigo = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await ref.set({
      huella: huella(codigo, email),
      uid: usuario.uid,
      creadoEn: new Date(),
      venceEn: new Date(Date.now() + CODIGO_VIGENCIA_MIN * 60_000),
      intentos: 0,
    });

    // El fallo queda en el log pero no cambia la respuesta (revelaría que ese correo sí es del equipo).
    await sendAdminAccessCode({ to: email, codigo, vigenciaMin: CODIGO_VIGENCIA_MIN });
  } catch (err) {
    console.error("[auth/codigo]", err);
  }
  return mismaRespuesta;
}
