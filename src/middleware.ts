import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge Runtime middleware: NO puede usar firebase-admin (usa node:* APIs y
// eval, prohibidos en Edge). La verificación REAL de sesión y rol la hacen
// los layouts server-side (src/app/admin/layout.tsx, etc.) y las API
// routes — todos corren en Node Runtime y sí pueden usar firebase-admin.
//
// El middleware solo se encarga de:
//   1. Reescribir admin.pauhenriques.com/* → /admin/*
//   2. Bloquear /admin/* desde el dominio público (404)
//   3. Redirigir a /sign-in si no hay cookie de sesión en paths protegidos
//      (chequeo de PRESENCIA solamente, no de validez)

const ADMIN_HOSTNAME = "admin.pauhenriques.com";

// Paths que NO se reescriben aunque el host sea admin.pauhenriques.com.
// /sign-in y /sign-up viven en la app pública — no hay /admin/sign-in.
const NON_REWRITABLE_PATHS = ["/sign-in", "/sign-up"];

const PROTECTED_PATHS = [
  "/checkout",
  "/mi-cuenta",
  "/mis-pedidos",
  "/plan-novios/registrar",
  "/plan-novios/mi-plan",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const isAdminHost = host.startsWith(ADMIN_HOSTNAME);
  const isLocalhost =
    host.startsWith("localhost") || host.startsWith("127.0.0.1");

  // 1) admin subdomain → reescribir a /admin/*
  const isNonRewritable = NON_REWRITABLE_PATHS.some((p) =>
    pathname.startsWith(p),
  );
  if (isAdminHost && !pathname.startsWith("/admin") && !isNonRewritable) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // 2) /admin desde dominio público → 404 (solo accesible vía admin subdomain)
  if (!isAdminHost && !isLocalhost && pathname.startsWith("/admin")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 3) Redirección a sign-in para paths protegidos sin cookie de sesión.
  // La VALIDEZ del cookie la verifican los layouts/server components/APIs.
  const sessionCookie = request.cookies.get("__session")?.value;
  const needsSession =
    pathname.startsWith("/admin") ||
    PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (needsSession && !sessionCookie) {
    const loginUrl = new URL("/sign-in", request.url);
    loginUrl.searchParams.set("redirect_uri", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Patrón estándar Next.js: corre en todas las pages, excluye
    // /api/* y /_next/* (no necesitan middleware).
    "/((?!api|_next).*)",
  ],
};
