import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./src/lib/firebase-admin";

const ADMIN_HOSTNAME = "admin.pauhenriques.com";

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

  // If accessing via admin subdomain, rewrite to /admin routes
  if (isAdminHost && !pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Protect /admin/* routes — require authenticated admin
  if (pathname.startsWith("/admin")) {
    const decoded = await verifySession(request);

    if (!decoded) {
      const loginUrl = new URL("/sign-in", request.url);
      loginUrl.searchParams.set("redirect_uri", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check admin custom claim
    if (!decoded.admin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.next();
  }

  // Protect authenticated user routes
  // Exclude /checkout/3ds-return — the ACS iframe redirects here after challenge
  // and it won't have the user's session cookie
  const protectedPaths = ["/checkout", "/mi-cuenta", "/mis-pedidos"];
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (pathname.startsWith("/checkout/3ds-return")) {
      return NextResponse.next();
    }

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
  matcher: ["/checkout/:path*", "/admin/:path*", "/mi-cuenta", "/mis-pedidos"],
};
