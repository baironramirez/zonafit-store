"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { ShoppingCart, Package, User } from "lucide-react";

export default function Navbar() {
  const { cart } = useCart();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 w-full px-6 py-4 flex justify-between items-center transition-all duration-300 ${
        isScrolled 
          ? "bg-white/95 backdrop-blur-md border-b border-gray-200 py-3" 
          : "bg-transparent py-6"
      }`}
    >
      <Link href="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
        <div className="relative w-8 h-8 md:w-10 md:h-10">
          <Image 
            src="/images/logo-icon.png" 
            alt="ZonaFit Icon" 
            fill 
            className="object-contain"
          />
        </div>
        <div className="relative h-6 w-24 md:h-8 md:w-32">
          {/* Removed 'invert' to keep the text block black/original for white background */}
          <Image 
            src="/images/logo-text.png" 
            alt="ZonaFit Text" 
            fill 
            className="object-contain"
          />
        </div>
      </Link>

      <div className="flex gap-4 md:gap-6 items-center">
        <Link 
          href="/productos" 
          className="text-sm font-bold text-black hover:text-orange-500 transition-colors flex items-center gap-2 uppercase tracking-wide"
        >
          <Package className="w-4 h-4" />
          <span className="hidden md:inline">Productos</span>
        </Link>
        
        <Link 
          href="/admin/login" 
          className="relative text-sm font-bold text-black hover:text-orange-500 transition-colors flex items-center gap-2"
        >
          <div className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <User className="w-5 h-5" />
          </div>
        </Link>

        <Link 
          href="/carrito" 
          className="relative text-sm font-bold text-black hover:text-orange-500 transition-colors flex items-center gap-2"
        >
          <div className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ShoppingCart className="w-5 h-5" />
          </div>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full leading-none">
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </motion.nav>
  );
}
