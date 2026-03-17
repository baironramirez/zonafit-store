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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
              Categorias
            </Link>

            <Link
              href="/marcas"
              className="text-[13px] font-bold text-black hover:text-gray-500 transition-colors uppercase tracking-widest"
            >
              Marcas
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
            <button onClick={() => setIsSearchOpen(true)} className="text-black hover:text-gray-500 transition-colors hidden sm:block p-1">
              <Search className="w-5 h-5 stroke-[1.5]" />
            </button>
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
              <div 
                className="relative flex items-center"
                onMouseEnter={() => setIsUserMenuOpen(true)}
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="text-black hover:text-gray-500 transition-colors p-1"
                >
                  <User className="w-5 h-5 stroke-[1.5]" />
                </button>
                
                {/* Dropdown flotante Gymshark Style */}
                <div className={`absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 shadow-2xl transition-all duration-200 rounded-xl overflow-hidden flex flex-col pt-2 pb-2 z-[60] ${
                  isUserMenuOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
                }`}>
                  <div className="px-4 py-3 border-b border-gray-100 mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sesión Activa</p>
                    <p className="text-xs font-bold text-black truncate">{userProfile?.email || currentUser.email}</p>
                  </div>

                  {userProfile?.rol === "admin" && (
                    <Link href="/admin" onClick={() => setIsUserMenuOpen(false)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-black hover:bg-gray-50 transition-colors">
                      Panel Admin
                    </Link>
                  )}

                  <Link href="/pedidos" onClick={() => setIsUserMenuOpen(false)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-black hover:bg-gray-50 transition-colors">
                    Mis Pedidos
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
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

      {/* Full-Screen Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 md:pt-32 px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-black">Búsqueda</h2>
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="w-6 h-6 stroke-[2]" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="¡Busca más de 130 suplementos!"
                  className="w-full pl-14 pr-6 py-5 bg-white border-2 border-gray-100 focus:border-black rounded-xl text-lg text-black font-medium transition-colors outline-none placeholder:text-gray-400"
                  autoFocus
                />
              </form>
              
              <div className="mt-6 text-sm font-bold text-gray-400 px-2 cursor-default">
                Presiona <span className="text-black border-b border-gray-300 pb-0.5">Enter</span> para buscar
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.nav>
  );
}
