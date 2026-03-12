"use client";

import Link from "next/link";
import { ArrowRight, ArrowLeft, Heart, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import ProductCard, { ProductoData } from "@/components/ProductCard";

export default function Home() {
  const [productos, setProductos] = useState<ProductoData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real products from Firebase
  useEffect(() => {
    fetch("/api/productos")
      .then((res) => res.json())
      .then((data) => {
        let fetchedProducts = [];
        if (Array.isArray(data)) {
          fetchedProducts = data;
        } else if (data.productos) {
          fetchedProducts = data.productos;
        }
        // Grab only the first 4 for the 'Novedades' section
        setProductos(fetchedProducts.slice(0, 4));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-white text-black selection:bg-black selection:text-white">
      
      {/* 1. MASSIVE HERO BANNER (Gymshark Style) */}
      <section className="relative h-screen w-full flex items-end pb-16 lg:pb-24 overflow-hidden">
        {/* Aggressive Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop"
            alt="Atletas entrenando duro"
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle gradient so white text pops */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Content Aligned Left */}
        <div className="relative z-10 px-6 max-w-[1400px] w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-3xl"
          >
            <h1 className="text-[3.5rem] md:text-[6rem] lg:text-[7.5rem] font-black leading-[0.85] tracking-tighter uppercase text-white mb-2 italic">
              OVERCOME<br />EVERYTHING.
            </h1>
            <p className="text-lg md:text-2xl text-white font-bold uppercase tracking-wide mb-2 mt-4">
              NUEVA COLECCIÓN: RENDIMIENTO ÉLITE
            </p>
            <p className="text-sm md:text-lg text-gray-200 mb-8 max-w-xl font-medium">
              Suplementos diseñados para los que no se rinden. Rompe tus límites hoy.
            </p>

            {/* Shopping Links (Gymshark underlined style) */}
            <div className="flex gap-6 items-center">
              <Link
                href="/productos"
                className="text-white font-bold uppercase tracking-widest text-sm pb-1 border-b-2 border-transparent hover:border-white transition-all"
              >
                Comprar Novedades
              </Link>
              <Link
                href="/productos"
                className="text-white font-bold uppercase tracking-widest text-sm pb-1 border-b-2 border-transparent hover:border-white transition-all"
              >
                Ver Catálogo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. DYNAMIC 'JUST DROPPED' SECTION (Firestore Data) */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black">
              NOVEDADES
            </h2>
            <Link 
              href="/productos" 
              className="hidden md:inline-flex text-black font-bold uppercase tracking-widest border-b-2 border-black pb-1 hover:text-gray-500 hover:border-gray-500 transition-colors text-sm"
            >
              Ver Todo
            </Link>
          </div>

          {loading ? (
             <div className="w-full flex justify-center py-20">
               <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {productos.map((producto) => (
                <div key={producto.id} className="group relative">
                  <ProductCard producto={producto} />
                  {/* Gymshark puts a subtle heart/wishlist icon over the images occasionally, ProductCard handles itself but wrapping allows scaling */}
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 text-center md:hidden">
            <Link 
              href="/productos" 
              className="inline-flex text-black font-bold uppercase tracking-widest border-b-2 border-black pb-1 text-sm"
            >
              Ver Todo
            </Link>
          </div>
        </div>
      </section>

      {/* 3. MINIMALIST NEWSLETTER (Kept Clean) */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-4xl font-black mb-4 uppercase tracking-tight text-black">
            Únete a la Familia
          </h2>
          <p className="text-gray-600 font-medium text-[15px] mb-8">
            Sé el primero en saber sobre nuevos drops, exclusivas y rutinas de los atletas Zinc.
          </p>

          <form className="flex flex-col sm:flex-row max-w-xl mx-auto border border-gray-300">
            <input
              type="email"
              placeholder="Dirección de correo electrónico"
              className="flex-1 px-6 py-4 bg-white text-black placeholder-gray-400 focus:outline-none text-sm font-medium"
              required
            />
            <button
              type="submit"
              className="px-8 py-4 bg-black text-white font-bold uppercase tracking-widest transition-colors hover:bg-gray-800"
            >
              Suscribir
            </button>
          </form>
        </div>
      </section>

    </main>
  );
}
