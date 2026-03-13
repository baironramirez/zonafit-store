"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { ShoppingCart, Package, User, Search, Heart } from "lucide-react";

export default function Navbar() {
  const { cart } = useCart();
  const { currentUser, userProfile, loading, logout } = useAuth();
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
      className={`fixed top-0 left-0 right-0 z-50 w-full px-6 flex items-center transition-all duration-300 ${isScrolled
        ? "bg-white/95 backdrop-blur-md border-b border-gray-200 py-3"
        : "bg-transparent py-5"
        }`}
    >
      {/* 3-Column Grid for Gymshark Minimalist Layout */}
      <div className="w-full max-w-[1400px] mx-auto grid grid-cols-3 items-center">

        {/* LEFT COLUMN: Main Navigation Links */}
        <div className="flex items-center justify-start gap-4 md:gap-8">
          <Link
            href="/productos"
            className="text-[13px] font-bold text-black hover:text-gray-500 transition-colors uppercase tracking-widest"
          >
            Productos
          </Link>
          <Link
            href="/productos"
            className="hidden md:block text-[13px] font-bold text-black hover:text-gray-500 transition-colors uppercase tracking-widest"
          >

          </Link>
        </div>

        {/* CENTER COLUMN: Absolute Center Logo */}
        <div className="flex items-center justify-center">
          <Link href="/" className="flex flex-col sm:flex-row items-center gap-2 hover:opacity-70 transition-opacity">
            <div className="relative w-9 h-9 md:w-10 md:h-10">
              <Image
                src="/images/logo-icon.png"
                alt="ZonaFit Icon"
                fill
                className="object-contain"
              />
            </div>
            <div className="relative h-7 w-28 md:h-8 md:w-36 hidden sm:block">
              <Image
                src="/images/logo-text.png"
                alt="ZonaFit Text"
                fill
                className="object-contain"
              />
            </div>
          </Link>
        </div>

        {/* RIGHT COLUMN: Utility Icons */}
        <div className="flex justify-end gap-3 md:gap-5 items-center">
          <button className="text-black hover:text-gray-500 transition-colors hidden sm:block">
            <Search className="w-5 h-5 stroke-[1.5]" />
          </button>

          <button className="text-black hover:text-gray-500 transition-colors hidden sm:block">
            <Heart className="w-5 h-5 stroke-[1.5]" />
          </button>

          {/* Dinámica de Usuario basado en Firebase Auth */}
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
          ) : currentUser ? (
            <div className="relative group cursor-pointer flex items-center">
              <User className="w-5 h-5 stroke-[1.5] text-black" />
              {/* Dropdown flotante Gymshark Style */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 rounded-xl overflow-hidden flex flex-col pt-2 pb-2">
                <div className="px-4 py-3 border-b border-gray-100 mb-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sesión Activa</p>
                  <p className="text-xs font-bold text-black truncate">{userProfile?.email || currentUser.email}</p>
                </div>
                
                {userProfile?.rol === "admin" && (
                  <Link href="/admin" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-black hover:bg-gray-50 transition-colors">
                    Panel Admin
                  </Link>
                )}
                
                <Link href="/pedidos" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-black hover:bg-gray-50 transition-colors">
                  Mis Pedidos
                </Link>
                
                <button 
                  onClick={() => logout()}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 text-left transition-colors mt-1 border-t border-gray-100"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-black hover:text-gray-500 transition-colors"
            >
              <User className="w-5 h-5 stroke-[1.5]" />
            </Link>
          )}

          <Link
            href="/carrito"
            className="relative text-black hover:text-gray-500 transition-colors flex items-center"
          >
            <ShoppingCart className="w-5 h-5 stroke-[1.5]" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-black text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full leading-none">
                {totalItems}
              </span>
            )}
          </Link>
        </div>

      </div>
    </motion.nav>
  );
}
