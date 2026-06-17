/**
 * config.ts
 *
 * Configuración global del proyecto siguiendo principios de Clean Architecture.
 * Centraliza el acceso a variables de entorno críticas y provee helpers consistentes.
 */

// 🔹 Silenciar advertencias de deprecación (como DEP0169 de url.parse del SDK interno de Firebase)
// para mantener los logs del servidor limpios y legibles.
if (typeof process !== "undefined") {
  (process as any).noDeprecation = true;
}

/**
 * Obtiene la URL base del sitio web de manera robusta.
 *
 * ¿Por qué esta función?
 * 1. En producción (Vercel), el dominio oficial es https://zonafitgym.com. A veces Vercel inyecta
 *    la URL por defecto de Vercel (zonafit-store.vercel.app) en process.env.NEXT_PUBLIC_BASE_URL.
 *    Forzamos https://zonafitgym.com en producción para evitar que los correos, webhooks o
 *    URLs de retorno a Mercado Pago redirijan al dominio interno de Vercel.
 * 2. Si se proporciona un objeto `Request` (por ejemplo, en API routes), intentamos
 *    extraer dinámicamente el host y protocolo de la petición. Esto es muy útil para
 *    entornos de desarrollo locales, ramas de preview, etc.
 * 3. Fallback ordenado a `process.env.NEXT_PUBLIC_BASE_URL` y finalmente a la URL por defecto.
 */
export function getBaseUrl(req?: Request): string {
  // En producción real, siempre preferimos el dominio oficial zonafitgym.com
  if (process.env.VERCEL_ENV === "production") {
    return "https://zonafitgym.com";
  }

  // Si se provee la petición HTTP, resolvemos el host dinámicamente. Esto maneja
  // entornos de preview (ramas git en Vercel) y desarrollo local (localhost) de forma transparente.
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    if (host) {
      // Si estamos en localhost, usualmente no usamos https a menos que esté configurado
      const resolvedProtocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : protocol;
      return `${resolvedProtocol}://${host}`;
    }
  }

  // Fallback a la variable de entorno configurada
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Fallback definitivo
  return "https://zonafitgym.com";
}
