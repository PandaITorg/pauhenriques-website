import { NextRequest, NextResponse } from "next/server";
import { auth as adminAuth } from "@/lib/firebase-admin";

// Forzar renderizado dinámico — esta ruta no debe ejecutarse en build time
export const dynamic = "force-dynamic";

// POST /api/auth/logout
// Revoca la session cookie y la elimina del cliente
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session")?.value;

    if (sessionCookie) {
      // Verificar y revocar la sesión en Firebase Admin
      try {
        const decodedClaims =
          await adminAuth.verifySessionCookie(sessionCookie);
        await adminAuth.revokeRefreshTokens(decodedClaims.sub);
      } catch {
        // Si la cookie ya es inválida, continuamos con la eliminación
        console.log("Cookie ya inválida, procediendo con logout");
      }
    }

    // Eliminar la cookie del cliente
    const response = NextResponse.json({ status: "success" }, { status: 200 });

    response.cookies.set("__session", "", {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // Host-only (sin domain) — alineado con /api/auth/session.
    });

    return response;
  } catch (error: unknown) {
    console.error("Error al cerrar sesión:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
