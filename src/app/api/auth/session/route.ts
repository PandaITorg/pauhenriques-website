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

    console.log(
      "[Session API] Received request with idToken:",
      idToken ? "present" : "missing",
    );

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { error: "ID Token requerido" },
        { status: 400 },
      );
    }

    // Verificar el ID Token con Firebase Admin
    console.log("[Session API] Verifying ID token...");
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log(
      "[Session API] Token verified. Decoded token:",
      JSON.stringify(decodedToken, null, 2),
    );

    if (!decodedToken) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Crear session cookie con duración de 5 días
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 días en ms
    console.log("[Session API] Creating session cookie...");
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });
    console.log("[Session API] Session cookie created successfully");

    // Configurar la cookie httpOnly segura
    const response = NextResponse.json({ status: "success" }, { status: 200 });

    response.cookies.set("__session", sessionCookie, {
      maxAge: expiresIn / 1000, // en segundos
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    console.error("Error al crear session cookie:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
