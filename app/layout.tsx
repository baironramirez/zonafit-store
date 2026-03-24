import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "ZonaFit Store",
  description: "Tienda ZonaFit",
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
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
