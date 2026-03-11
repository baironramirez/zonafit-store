"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { ShoppingCart, Package } from "lucide-react";

export default function Navbar() {
  const { cart } = useCart();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 w-full px-6 py-4 flex justify-between items-center transition-all duration-300 ${
        isScrolled 
          ? "bg-neutral-950/80 backdrop-blur-md border-b border-white/5 py-4" 
          : "bg-transparent py-6"
      }`}
    >
      <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="relative w-8 h-8 md:w-10 md:h-10">
          <Image 
            src="/images/logo-icon.png" 
            alt="ZonaFit Icon" 
            fill 
            className="object-contain"
          />
        </div>
        <div className="relative h-6 w-24 md:h-8 md:w-32 invert"> {/* Invert to make the black text white for dark mode */}
          <Image 
            src="/images/logo-text.png" 
            alt="ZonaFit Text" 
            fill 
            className="object-contain"
          />
        </div>
      </Link>

      <div className="flex gap-4 md:gap-8 items-center">
        <Link 
          href="/productos" 
          className="text-sm font-medium text-neutral-300 hover:text-white transition-colors flex items-center gap-2"
        >
          <Package className="w-4 h-4" />
          <span className="hidden md:inline">Productos</span>
        </Link>

        <Link 
          href="/carrito" 
          className="relative text-sm font-medium text-neutral-300 hover:text-white transition-colors flex items-center gap-2"
        >
          <div className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-orange-500/10 hover:text-orange-500 transition-colors">
            <ShoppingCart className="w-5 h-5" />
          </div>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-black text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </motion.nav>
  );
}
