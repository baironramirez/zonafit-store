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
