/**
 * middleware.ts — Guard de seguridad server-side para rutas protegidas.
 *
 * ¿Por qué un middleware en el servidor y no solo en el cliente?
 * La verificación client-side (layout.tsx con AuthContext) es necesaria para
 * la UX, pero no es suficiente para seguridad. Un atacante puede deshabilitar
 * JS o manipular el estado del cliente. El middleware corre en el servidor ANTES
 * de que se envíe cualquier HTML al navegador, garantizando que nadie acceda
 * al panel admin sin autenticación válida.
 *
 * ¿Qué hace este middleware?
 * 1. Para rutas /admin: verifica que exista una cookie de sesión válida.
 *    Si no existe, redirige al login inmediatamente.
 * 2. Para las rutas de API de admin: deja pasar (son protegidas por
 *    requireAdminAuth dentro del handler que verifica el Bearer token).
 * 3. Para todo lo demás: deja pasar sin restricción.
 *
 * Limitación conocida:
 * Firebase Auth en modo client-side no genera session cookies automáticamente.
 * El guard aquí verifica la cookie "firebase_session" que el cliente establece
 * vía document.cookie al iniciar sesión (o su ausencia para redirigir al login).
 * La verificación criptográfica del token ocurre dentro de cada API route
 * con el Admin SDK — eso es donde ocurre la seguridad real.
 *
 * Para una verificación 100% server-side, se necesitaría un flujo de
 * session cookie con firebase-admin.createSessionCookie() — lo documentamos
 * como mejora futura si la app escala a requerir SSR con auth garantizado.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Rutas de API de admin: protegidas por Bearer token en el handler ──
  // No interferimos aquí porque la verificación criptográfica del token
  // ocurre dentro del handler con Firebase Admin SDK (requireAdminAuth).
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ── 2. Rutas del panel /admin: verificar presencia de sesión ─────────────
  if (pathname.startsWith("/admin")) {
    // Verificar si existe alguna cookie de sesión de Firebase Auth
    // El cliente la establece al hacer login exitoso
    const sessionCookie =
      request.cookies.get("firebase_session")?.value ||
      request.cookies.get("__session")?.value;

    // Si no hay cookie de sesión, redirigir al login
    // Nota: esta es una guarda de UX rápida. La verificación criptográfica
    // real ocurre en el layout.tsx con el Admin SDK (o en las API routes).
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      // Guardamos la URL original para redirigir después del login
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ── 3. Todo lo demás: dejar pasar ────────────────────────────────────────
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Aplica el middleware a /admin y sus subrutas
    "/admin/:path*",
    // Aplica también a las API routes para poder agregar headers de seguridad
    // si en el futuro se necesitan (actualmente pasan sin restricción)
    "/api/:path*",
  ],
};
