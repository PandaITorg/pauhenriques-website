import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/firebase-admin";
import { getRoleFromClaims } from "@/lib/auth/roles";

const ADMIN_HOSTNAME = "admin.pauhenriques.com";

// Paths que NO se reescriben aunque el host sea admin.pauhenriques.com.
// Necesario para que el flow de auth funcione en el subdominio admin —
// el middleware redirige a /sign-in cuando no hay sesión, y esa página
// solo existe en la app pública (no hay /admin/sign-in).
const NON_REWRITABLE_PATHS = ["/sign-in", "/sign-up"];

async function verifySession(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value || "";
  if (!sessionCookie || !auth) return null;
  try {
    return await auth.verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Detect admin subdomain via X-Forwarded-Host or Host header
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const isAdminHost = host.startsWith(ADMIN_HOSTNAME);

  // DEBUG TEMPORAL: headers visibles para diagnosticar admin.pauhenriques.com.
  // Quitar después de confirmar que el subdominio admin funciona.
  const debugHeaders = {
    "x-mw-pathname": pathname,
    "x-mw-host": host || "(empty)",
    "x-mw-is-admin-host": String(isAdminHost),
    "x-mw-x-forwarded-host": request.headers.get("x-forwarded-host") || "(none)",
    "x-mw-raw-host": request.headers.get("host") || "(none)",
  };

  // If accessing via admin subdomain, rewrite to /admin routes (excepto
  // paths de auth que viven en la app pública).
  const isNonRewritable = NON_REWRITABLE_PATHS.some((p) =>
    pathname.startsWith(p),
  );
  if (isAdminHost && !pathname.startsWith("/admin") && !isNonRewritable) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    const res = NextResponse.rewrite(url);
    Object.entries(debugHeaders).forEach(([k, v]) => res.headers.set(k, v));
    res.headers.set("x-mw-action", "rewrite-to-admin");
    return res;
  }

  // Block /admin/* on public domain — panel solo accesible vía admin.pauhenriques.com.
  // Excepción: localhost/127.0.0.1 en desarrollo (sin subdominio real).
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  if (!isAdminHost && !isLocalhost && pathname.startsWith("/admin")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Protect /admin/* routes — require authenticated admin
  if (pathname.startsWith("/admin")) {
    const decoded = await verifySession(request);

    if (!decoded) {
      const loginUrl = new URL("/sign-in", request.url);
      loginUrl.searchParams.set("redirect_uri", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check role claim (admin | staff | cursos). Legacy { admin: true } → role='admin'.
    const role = getRoleFromClaims(decoded as unknown as Record<string, unknown>);
    if (!role) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.next();
  }

  // Protect authenticated user routes
  const protectedPaths = ["/checkout", "/mi-cuenta", "/mis-pedidos", "/plan-novios/registrar", "/plan-novios/mi-plan"];
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    const decoded = await verifySession(request);

    if (!decoded) {
      const loginUrl = new URL("/sign-in", request.url);
      loginUrl.searchParams.set("redirect_uri", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Corre en TODAS las páginas — necesario para que el rewrite del
    // subdominio admin (admin.pauhenriques.com → /admin/*) funcione
    // incluso en path "/".
    //
    // Patrón estándar de Next.js: excluye /api y /_next. El middleware
    // tiene early returns para hosts no-admin y paths no protegidos.
    "/((?!api|_next).*)",
  ],
};
