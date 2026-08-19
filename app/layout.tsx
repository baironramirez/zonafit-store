import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import Navbar from "@/components/layout/Navbar";
import CartDrawer from "@/components/cart/CartDrawer";
import Footer from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
// next/script es la forma correcta de cargar scripts de terceros en Next.js:
// maneja deduplicación, orden de carga y no bloquea el rendering inicial
import Script from "next/script";

// ID de seguimiento de Google Ads para ZonaFit Store
const GA_MEASUREMENT_ID = "AW-18397686872";
// Metadatos SEO completos: ahora que tenemos dominio propio, aprovechamos para
// configurar Open Graph y canonical URL correctamente para motores de búsqueda.
export const metadata: Metadata = {
  title: "ZonaFit Store | Suplementación y Accesorios Fitness",
  description: "Tienda oficial de ZonaFit - Los mejores suplementos deportivos, proteínas, creatina y accesorios en Colombia. Envíos a todo el país.",
  metadataBase: new URL('https://zonafitgym.com'),
  openGraph: {
    title: "ZonaFit Store | Suplementación y Accesorios Fitness",
    description: "Los mejores suplementos deportivos y accesorios en Colombia.",
    url: 'https://zonafitgym.com',
    siteName: 'ZonaFit Store',
    locale: 'es_CO',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Script de inicialización del dataLayer como script nativo:
            Al usar dangerouslySetInnerHTML, Next.js lo incluye en el HTML
            del servidor (SSR), así Google puede detectarlo al escanear la página.
            El script externo de gtag.js se carga asíncronamente para no bloquear LCP */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `,
          }}
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <Navbar />
              <CartDrawer />
              {children}
              <Footer />
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
