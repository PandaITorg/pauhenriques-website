import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './src/lib/firebase-admin'; // RUTA CORREGIDA

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')?.value || '';

  // Rutas que queremos proteger
  if (request.nextUrl.pathname.startsWith('/checkout')) {
    try {
      // Verificar la cookie de sesión con Firebase Admin
      await auth.verifySessionCookie(sessionCookie, true /** checkRevoked */);
      // Si la cookie es válida, permitir el acceso
      return NextResponse.next();
    } catch (error) {
      // Si la cookie es inválida o no existe, redirigir a la página de login
      console.log('Middleware: Sesión inválida, redirigiendo a /sign-in');
      const loginUrl = new URL('/sign-in', request.url);
      // Opcional: añadir un parámetro para redirigir de vuelta tras el login
      loginUrl.searchParams.set('redirect_uri', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Para todas las demás rutas, no hacer nada
  return NextResponse.next();
}

// Especificamos las rutas que activarán este middleware
export const config = {
  matcher: ['/checkout/:path*'],
};
