"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useEffect } from "react";
import { ShoppingCart, User, Search, Heart, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Navbar() {
  const { cart } = useCart();
  const { currentUser, userProfile, loading, logout } = useAuth();
  const { favorites } = useFavorites();
  const router = useRouter();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [promoActive, setPromoActive] = useState(false);
  const [promoText, setPromoText] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  // Fetch Promo Settings
  useEffect(() => {
    getDoc(doc(db, "settings", "home"))
      .then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.promoActive) {
            setPromoActive(true);
            setPromoText(data.promoText || "");
          }
        }
      })
      .catch((err) => console.error("Error fetching promo settings:", err));
  }, []);

  const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);
  const totalFavorites = favorites.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/productos?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${isScrolled
        ? "bg-white/95 backdrop-blur-md shadow-sm"
        : "bg-transparent"
        }`}
    >
      {/* Promo Bar (Top) */}
      {promoActive && (
        <div className="w-full bg-black text-white text-center py-2 px-4">
          <p className="text-[11px] md:text-xs font-bold uppercase tracking-widest">{promoText}</p>
        </div>
      )}

      {/* Main Nav content */}
      <div className={`px-6 flex items-center transition-all duration-300 ${isScrolled ? "py-3 border-b border-gray-200" : "py-5"}`}>
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
          <div className="relative flex items-center">
            {isSearchOpen ? (
              <form onSubmit={handleSearchSubmit} className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-lg w-48 sm:w-64 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar..." 
                  className="bg-transparent border-none outline-none text-xs w-full text-black font-medium"
                  autoFocus
                />
                <button type="button" onClick={() => setIsSearchOpen(false)} className="ml-2 text-gray-400 hover:text-black">
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button onClick={() => setIsSearchOpen(true)} className="text-black hover:text-gray-500 transition-colors hidden sm:block p-1">
                <Search className="w-5 h-5 stroke-[1.5]" />
              </button>
            )}
          </div>

          <Link href="/favoritos" className="relative text-black hover:text-gray-500 transition-colors hidden sm:block p-1">
            <Heart className="w-5 h-5 stroke-[1.5]" />
            {totalFavorites > 0 && (
              <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full leading-none shadow-sm">
                {totalFavorites}
              </span>
            )}
          </Link>

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
      </div>
    </motion.nav>
  );
}
