"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useEffect } from "react";
import { ShoppingCart, User, Search, Heart, X, Menu, ChevronRight } from "lucide-react";
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
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isMarcaOpen, setIsMarcaOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);

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
          if (data.categorias && Array.isArray(data.categorias)) {
            setCategorias(data.categorias);
          }
          if (data.marcas && Array.isArray(data.marcas)) {
            setMarcas(data.marcas);
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

  // Bloquear scroll cuando los modales están abiertos
  useEffect(() => {
    if (isSearchOpen || isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSearchOpen, isMobileMenuOpen]);

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
            
            {/* Hamburger Menu Icon (Mobile Only) */}
            <button 
              className="md:hidden text-black p-1 hover:text-gray-500 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6 stroke-[1.5]" />
            </button>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              {/* Dropdown Categorías */}
              <div
                className="relative"
                onMouseEnter={() => setIsCatOpen(true)}
                onMouseLeave={() => setIsCatOpen(false)}
              >
                <Link
                  href="/productos"
                  className="text-[13px] font-bold text-black hover:text-gray-500 transition-colors uppercase tracking-widest"
                >
                  Categorias
                </Link>
                <div className={`absolute left-0 top-full pt-2 z-[60] transition-all duration-200 ${isCatOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                  <div className="bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden min-w-[200px] py-2">
                    <Link
                      href="/productos"
                      onClick={() => setIsCatOpen(false)}
                      className="block px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-black hover:bg-gray-50 transition-colors"
                    >
                      Ver Todo
                    </Link>
                    {categorias.map((cat, idx) => (
                      <Link
                        key={idx}
                        href={`/productos?cat=${encodeURIComponent(cat)}`}
                        onClick={() => setIsCatOpen(false)}
                        className="block px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dropdown Marcas */}
              <div
                className="relative"
                onMouseEnter={() => setIsMarcaOpen(true)}
                onMouseLeave={() => setIsMarcaOpen(false)}
              >
                <span
                  className="text-[13px] font-bold text-black hover:text-gray-500 transition-colors uppercase tracking-widest cursor-pointer"
                >
                  Marcas
                </span>
                <div className={`absolute left-0 top-full pt-2 z-[60] transition-all duration-200 ${isMarcaOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                  <div className="bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden min-w-[220px] py-2 max-h-[400px] overflow-y-auto">
                    <Link
                      href="/productos"
                      onClick={() => setIsMarcaOpen(false)}
                      className="block px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-black hover:bg-gray-50 transition-colors"
                    >
                      Todas las Marcas
                    </Link>
                    {marcas.map((m, idx) => (
                      <Link
                        key={idx}
                        href={`/productos?marca=${encodeURIComponent(m)}`}
                        onClick={() => setIsMarcaOpen(false)}
                        className="block px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
                      >
                        {m}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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

            {/* User Icon Mobile (Hidden on sm, shown in drawer instead) */}
            <div className="hidden sm:block">
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

                  <div className={`absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 shadow-2xl transition-all duration-200 rounded-xl overflow-hidden flex flex-col pt-2 pb-2 z-[60] ${isUserMenuOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
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
            </div>

            {/* Cart Always Visible */}

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
      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          
          {/* Main Drawer Panel */}
          <div className="absolute top-0 left-0 bottom-0 w-[85vw] max-w-sm bg-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col h-full overflow-hidden">
            {/* Drawer Header */}
            <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100">
              <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="relative w-8 h-8">
                  <Image src="/images/logo-icon.png" alt="ZonaFit Icon" fill className="object-contain" />
                </div>
                <div className="relative h-6 w-24">
                  <Image src="/images/logo-text.png" alt="ZonaFit Text" fill className="object-contain" />
                </div>
              </Link>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
              {/* Categorías */}
              <div className="mb-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-2">Categorías</h3>
                <div className="flex flex-col space-y-2">
                  <Link
                    href="/productos"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl bg-gray-50 text-sm font-bold uppercase tracking-wider text-black flex justify-between items-center"
                  >
                    Todos los productos <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                  {categorias.map((cat, idx) => (
                    <Link
                      key={idx}
                      href={`/productos?cat=${encodeURIComponent(cat)}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold uppercase tracking-wider text-black flex justify-between items-center transition-colors"
                    >
                      {cat} <ChevronRight className="w-4 h-4 text-gray-300" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Marcas */}
              <div className="mb-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-2">Marcas</h3>
                <div className="flex flex-col space-y-2">
                  {marcas.map((marca, idx) => (
                    <Link
                      key={idx}
                      href={`/productos?marca=${encodeURIComponent(marca)}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold uppercase tracking-wider text-black flex justify-between items-center transition-colors"
                    >
                      {marca} <ChevronRight className="w-4 h-4 text-gray-300" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer (User & Faves) */}
            <div className="border-t border-gray-100 p-6 bg-gray-50 flex flex-col gap-4">
              <Link 
                href="/favoritos" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 font-bold uppercase tracking-widest text-xs"
              >
                <div className="relative">
                  <Heart className="w-5 h-5 stroke-[2] text-black" />
                  {totalFavorites > 0 && (
                    <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full leading-none">
                      {totalFavorites}
                    </span>
                  )}
                </div>
                Favoritos
              </Link>
              
              {currentUser ? (
                <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-900 text-white">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Mi Cuenta</p>
                    <p className="text-sm font-bold truncate">{userProfile?.email || currentUser.email}</p>
                  </div>
                  {userProfile?.rol === "admin" && (
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-xs font-bold uppercase tracking-widest border-b border-gray-100">
                      Panel Admin
                    </Link>
                  )}
                  <Link href="/pedidos" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-xs font-bold uppercase tracking-widest border-b border-gray-100">
                    Mis Pedidos
                  </Link>
                  <button 
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-600 text-left"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full bg-black text-white p-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors"
                >
                  <User className="w-4 h-4" /> Iniciar Sesión / Registro
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.nav>
  );
}
