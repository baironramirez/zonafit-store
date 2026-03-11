import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import Navbar from "@/components/Navbar";

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
        <CartProvider>
          <Navbar />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
