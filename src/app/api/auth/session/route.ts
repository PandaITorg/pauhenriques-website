import { NextRequest, NextResponse } from "next/server";
import { auth as adminAuth } from "@/lib/firebase-admin";

// Forzar renderizado dinámico — esta ruta no debe ejecutarse en build time
export const dynamic = "force-dynamic";

// POST /api/auth/session
// Recibe el ID Token de Firebase y crea una session cookie httpOnly
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { error: "ID Token requerido" },
        { status: 400 },
      );
    }

    // Verificar el ID Token con Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    if (!decodedToken) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Crear session cookie con duración de 5 días
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Configurar la cookie httpOnly segura
    const response = NextResponse.json({ status: "success" }, { status: 200 });

    response.cookies.set("__session", sessionCookie, {
      maxAge: expiresIn / 1000, // en segundos
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // Cookie host-only (sin domain): scoped al subdominio donde se creó.
      // admin.pauhenriques.com y pauhenriques.com tienen sesiones SEPARADAS.
      // Decisión deliberada: evita desfase entre cookie server (compartida)
      // y Firebase Auth client (storage por origin) que causaba navbar
      // "fantasma" + loops en redirect post-login.
    });

    return response;
  } catch (error: unknown) {
    console.error("Error al crear session cookie:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
