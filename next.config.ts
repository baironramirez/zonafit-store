/**
 * next.config.ts — Configuración central de Next.js
 *
 * ¿Por qué agregamos Security Headers aquí?
 * Los headers HTTP de seguridad son la primera línea de defensa del navegador.
 * Se configuran en next.config.ts para que apliquen a TODAS las respuestas
 * del servidor, tanto páginas como rutas de API, sin necesidad de agregarlos
 * manualmente en cada route handler.
 *
 * Referencias:
 * - https://nextjs.org/docs/app/api-reference/next-config-js/headers
 * - https://securityheaders.com/
 * - https://owasp.org/www-project-secure-headers/
 */

import type { NextConfig } from "next";

// Dominio de producción — único origen autorizado para hacer requests cross-origin
const PRODUCTION_DOMAIN = "https://zonafitgym.com";

// Subdominios de Vercel autorizados (preview y desarrollo)
const VERCEL_PREVIEW_PATTERN = "https://*.vercel.app";

const nextConfig: NextConfig = {
  transpilePackages: ["jose", "jwks-rsa", "firebase-admin"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },

  /**
   * Headers de seguridad HTTP aplicados a todas las rutas.
   *
   * ¿Por qué cada uno?
   * - Content-Security-Policy: Bloquea XSS diciéndole al navegador de dónde
   *   puede cargar scripts, estilos, imágenes, etc. Es la defensa más poderosa.
   * - X-Frame-Options: Previene clickjacking (embeber nuestra app en un iframe malicioso).
   * - X-Content-Type-Options: Impide que el navegador "adivine" el tipo de archivo
   *   (MIME sniffing), lo que puede ejecutar un archivo de texto como script.
   * - Referrer-Policy: Controla qué información de la URL se envía al navegar
   *   hacia otros sitios (no filtramos params internos de URLs).
   * - Permissions-Policy: Deshabilita explícitamente APIs del navegador que
   *   no usamos (cámara, micrófono, geolocalización) para reducir superficie de ataque.
   * - Strict-Transport-Security: Fuerza HTTPS por 1 año e incluye subdominios.
   *   Impide ataques de downgrade a HTTP.
   * - X-XSS-Protection: Header legacy para navegadores antiguos.
   */
  async headers() {
    return [
      {
        // Aplica los headers de seguridad a TODAS las rutas
        source: "/(.*)",
        headers: [
          // ── Prevención de XSS ──────────────────────────────────────────────
          {
            key: "Content-Security-Policy",
            value: [
              // Solo scripts de nuestro dominio y los SDKs necesarios
              `default-src 'self'`,
              // Scripts: dominio propio + Firebase + MercadoPago (necesarios para el checkout)
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.googleapis.com https://http2.mlstatic.com https://sdk.mercadopago.com`,
              // Estilos: dominio propio + Google Fonts + inline styles (Next.js los usa)
              `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
              // Fuentes: Google Fonts
              `font-src 'self' https://fonts.gstatic.com`,
              // Imágenes: dominio propio + Firebase Storage + data URIs
              `img-src 'self' data: blob: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com`,
              // Conexiones de red: Firebase, MercadoPago, API Colombia (selector de departamentos/ciudades)
              // api-colombia.com se usa en el carrito para listar departamentos y ciudades de Colombia
              `connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.mercadopago.com wss://*.firebaseio.com https://api-colombia.com`,
              // Frames: MercadoPago requiere iframes para el checkout
              `frame-src https://sdk.mercadopago.com https://*.mercadopago.com`,
              // Workers: Firebase usa service workers internamente
              `worker-src 'self' blob:`,
              // Objetos y embeds: bloqueados por defecto
              `object-src 'none'`,
              // Base URI: solo nuestra propia app
              `base-uri 'self'`,
              // Form actions: solo nuestro propio dominio
              `form-action 'self'`,
            ].join("; "),
          },

          // ── Prevención de Clickjacking ─────────────────────────────────────
          {
            key: "X-Frame-Options",
            // DENY: Nunca se puede embeber en un iframe, ni desde el mismo origen
            value: "DENY",
          },

          // ── Prevención de MIME Sniffing ────────────────────────────────────
          {
            key: "X-Content-Type-Options",
            // nosniff: El navegador NO intentará adivinar el Content-Type
            value: "nosniff",
          },

          // ── Control de Referrer ────────────────────────────────────────────
          {
            key: "Referrer-Policy",
            // strict-origin-when-cross-origin: Envía solo el origen (sin path ni params)
            // cuando se navega a otro sitio. Protege parámetros internos.
            value: "strict-origin-when-cross-origin",
          },

          // ── Deshabilitar APIs no usadas ────────────────────────────────────
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",        // No usamos cámara
              "microphone=()",    // No usamos micrófono
              "geolocation=()",   // No usamos geolocalización
              "payment=(self)",   // Permitido solo para el checkout propio
              "usb=()",           // No usamos USB
              "bluetooth=()",     // No usamos Bluetooth
            ].join(", "),
          },

          // ── Forzar HTTPS ───────────────────────────────────────────────────
          {
            key: "Strict-Transport-Security",
            // max-age=31536000: 1 año en segundos
            // includeSubDomains: aplica también a subdominios
            // preload: permite ser incluido en la lista de preload de navegadores
            value: "max-age=31536000; includeSubDomains; preload",
          },

          // ── XSS Protection (legacy, para navegadores viejos) ──────────────
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },

      /**
       * CORS — Control de acceso cross-origin para las rutas de API.
       *
       * ¿Por qué configuramos CORS aquí y no en cada route?
       * - Centralizamos la política en un solo lugar
       * - El preflight OPTIONS es manejado automáticamente
       * - Es más difícil olvidar aplicarlo en una ruta nueva
       *
       * ¿Qué orígenes aceptamos?
       * - zonafitgym.com (producción)
       * - *.vercel.app (previews de Vercel para testing)
       * - localhost (desarrollo local)
       *
       * NOTA: MercadoPago y Firebase llaman directamente a sus propias APIs,
       * no a las nuestras, así que no necesitan estar en esta lista de CORS.
       * El webhook de MP viene del servidor de MP (no del browser), por eso
       * se excluye del CORS (es server-to-server, no browser-to-server).
       */
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            // Solo aceptamos requests desde nuestro propio dominio de producción
            // En desarrollo, Next.js no aplica CORS (same-origin)
            value: PRODUCTION_DOMAIN,
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PATCH, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            // Authorization: para los Bearer tokens de Firebase Auth
            // Content-Type: para los JSON bodies
            // x-signature, x-request-id: para los webhooks de MercadoPago
            value: "Authorization, Content-Type, x-signature, x-request-id",
          },
          {
            key: "Access-Control-Max-Age",
            // Cache del preflight por 24 horas para reducir overhead
            value: "86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
