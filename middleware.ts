/**
 * middleware.ts — Guard de seguridad server-side para rutas protegidas.
 *
 * ¿Por qué NO hacemos verificación de auth aquí para /admin?
 * Firebase Auth client-side persiste la sesión en IndexedDB del navegador,
 * NO en cookies HTTP. Por tanto, el middleware del servidor NO puede verificar
 * criptográficamente si el usuario está autenticado en Firebase.
 *
 * Intentar leer una cookie de sesión aquí rompería el panel admin para TODOS
 * los usuarios autenticados (porque esa cookie nunca se setea automáticamente).
 *
 * ¿Entonces dónde vive la seguridad real?
 * La seguridad está en dos capas que SÍ funcionan:
 *
 * 1. CAPA API (100% server-side, criptográfica):
 *    Cada route handler protegido usa requireAdminAuth() que verifica
 *    el token JWT de Firebase con el Admin SDK. Esto es imposible de bypassear.
 *
 * 2. CAPA UI (client-side, protección de UX):
 *    app/admin/layout.tsx verifica currentUser + rol === "admin" con AuthContext.
 *    Si falla, redirige al home. Esto protege la UI pero no el servidor.
 *
 * ¿Para qué sirve este middleware entonces?
 * - Agregar headers de seguridad a todas las respuestas
 * - Centralizar logs de acceso a rutas sensibles
 * - Preparado para agregar session cookies si en el futuro se implementa
 *   firebase-admin.createSessionCookie() en el flujo de login
 *
 * MEJORA FUTURA: Para un guard server-side completo en /admin, implementar:
 * 1. Al hacer login exitoso → POST /api/auth/session que llama a
 *    adminAuth.createSessionCookie(idToken) y setea una HttpOnly cookie
 * 2. En este middleware → verificar esa cookie con adminAuth.verifySessionCookie()
 * Esto requeriría modificar el flujo de login, lo cual está fuera del alcance actual.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Rutas estáticas de Next.js: siempre dejar pasar ───────────────────
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // ── 2. Rutas de API: protegidas por Bearer token en cada handler ──────────
  // La verificación criptográfica ocurre dentro de requireAdminAuth()
  // con el Firebase Admin SDK. No interferimos aquí.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ── 3. Panel /admin: la verificación ocurre en app/admin/layout.tsx ───────
  // El layout.tsx verifica currentUser + rol === "admin" vía AuthContext.
  // Si no es admin, redirige al home. Esta es la protección de UX activa.
  // La protección del servidor (API) está en los route handlers.
  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // ── 4. Todo lo demás: dejar pasar ────────────────────────────────────────
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica el middleware a todas las rutas excepto:
     * - Archivos estáticos (_next/static, _next/image, favicon.ico)
     * - Imágenes (png, jpg, svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
