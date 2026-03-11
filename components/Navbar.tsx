"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { cart } = useCart();

  const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <nav className="w-full bg-black text-white px-6 py-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        ZonaFit Store
      </Link>

      <div className="flex gap-6 items-center">
        <Link href="/productos">Productos</Link>

        <Link href="/carrito" className="relative">
          🛒 Carrito
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-3 bg-red-500 text-xs px-2 py-1 rounded-full">
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}
