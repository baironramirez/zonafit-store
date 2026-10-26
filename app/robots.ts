import type { MetadataRoute } from "next";

/**
 * robots.ts — Directivas para rastreadores de motores de búsqueda (Googlebot, Bingbot, etc.)
 *
 * ¿Por qué este archivo?
 * 1. Facilita la indexación rápida de las páginas principales de productos y home.
 * 2. Protege rutas privadas de administración y checkout (evita que Google indexe /admin o /carrito).
 * 3. Enlaza formalmente el sitemap oficial para que los crawlers indexen el catálogo sin retrasos.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
          "/carrito",
          "/pedidos",
          "/pedidos/*",
          "/recuperar",
          "/failure",
          "/pending",
          "/success",
        ],
      },
    ],
    sitemap: "https://www.zonafitgym.com/sitemap.xml",
  };
}
