import { NextRequest, NextResponse } from "next/server";
import { dbAdmin, auth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * Disponibilidad de slug para /plan-novios/registrar.
 *
 * Vive acá y no en el cliente porque las reglas de Firestore ya no permiten
 * consultar `planNovios` por slug: la lectura quedó restringida al dueño del
 * plan (antes era pública y exponía balance, goalAmount y userEmail de todos).
 * La comprobación necesita mirar planes ajenos, así que la hace el Admin SDK.
 *
 * Responde solo `{ available: boolean }` — nunca datos del plan que ocupa el
 * slug. Exige sesión: solo alguien registrado llega a crear un plan, y eso evita
 * que la ruta sirva para enumerar slugs desde afuera.
 */
export async function GET(request: NextRequest) {
  try {
    if (!dbAdmin || !auth) {
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }

    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    try {
      await auth.verifySessionCookie(sessionCookie, true);
    } catch {
      return NextResponse.json({ error: "Sesion invalida" }, { status: 401 });
    }

    const slug = request.nextUrl.searchParams.get("slug")?.trim();
    if (!slug) {
      return NextResponse.json({ error: "Slug requerido" }, { status: 400 });
    }

    const snapshot = await dbAdmin
      .collection("planNovios")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    return NextResponse.json({ available: snapshot.empty });
  } catch (error) {
    console.error("[plan-novios/slug-available] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
