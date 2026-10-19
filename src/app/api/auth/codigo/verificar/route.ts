// Canjea el código por un token a medida: el navegador inicia sesión en Firebase con él y la
// cookie la sigue creando /api/auth/session.
import { NextResponse } from "next/server";
import { auth, dbAdmin } from "@/lib/firebase-admin";
import { getRoleFromClaims } from "@/lib/auth/roles";
import { COLECCION, coincide, evaluarCodigo, normalizarCorreo } from "@/lib/auth/codigo-acceso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rechazo = NextResponse.json(
    { error: "Código incorrecto o vencido. Pide uno nuevo si hace falta." },
    { status: 401 },
  );
  const cuerpo = (await request.json().catch(() => ({}))) as { email?: string; codigo?: string };
  const email = normalizarCorreo(cuerpo.email);
  const codigo = String(cuerpo.codigo ?? "").trim();
  if (!email || !/^[0-9]{6}$/.test(codigo) || !auth || !dbAdmin) return rechazo;

  const ref = dbAdmin.collection(COLECCION).doc(email);
  try {
    const d = (await ref.get()).data();
    if (!d) return rechazo;
    const { resultado, intentos } = evaluarCodigo(
      { venceEn: d.venceEn.toDate(), intentos: d.intentos ?? 0 },
      coincide(d.huella, codigo, email),
      new Date(),
    );
    if (resultado === "vencido" || resultado === "agotado") {
      await ref.delete();
      return rechazo;
    }
    if (resultado === "incorrecto") {
      await ref.update({ intentos });
      return rechazo;
    }
    // Se quema apenas se usa: un código que sirve dos veces no es de un solo uso.
    await ref.delete();

    // El rol se vuelve a comprobar al canjear: en esos minutos se le pudo quitar el acceso.
    const usuario = await auth.getUser(d.uid);
    if (usuario.disabled || !getRoleFromClaims(usuario.customClaims)) return rechazo;
    return NextResponse.json({ token: await auth.createCustomToken(d.uid) });
  } catch (err) {
    console.error("[auth/codigo/verificar]", err);
    return rechazo;
  }
}
