"use client";

import { useFavorites } from "@/context/FavoritesContext";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";

export default function FavoritosPage() {
  const { favorites } = useFavorites();

  return (
    <main className="min-h-screen bg-white text-black pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-4 border-b border-gray-100 pb-8 mb-8">
          <Link
            href="/"
            className="p-3 bg-gray-50 text-gray-500 rounded-full hover:bg-black hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight flex items-center gap-3">
              Tus Favoritos <Heart className="w-6 h-6 md:w-8 md:h-8 fill-orange-500 text-orange-500 animate-pulse" />
            </h1>
            <p className="text-gray-500 text-sm md:text-base font-medium mt-1">
              Guarda tus suplementos preferidos aquí para el futuro.
            </p>
          </div>
        </div>

        {/* Content */}
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-black mb-4">No tienes favoritos aún</h2>
            <p className="text-gray-500 max-w-md mb-8">
              Explora nuestro catálogo y marca con un corazón los productos que más te gustan.
            </p>
            <Link
              href="/productos"
              className="px-8 py-4 bg-black text-white font-bold uppercase tracking-widest hover:bg-orange-500 transition-colors rounded-xl shadow-lg hover:shadow-orange-500/25"
            >
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex justify-between items-end">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                {favorites.length} {favorites.length === 1 ? 'Producto guardado' : 'Productos guardados'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {favorites.map((producto) => (
                <div key={producto.id} className="relative group">
                  <ProductCard producto={producto} />
                </div>
              ))}
            </div>
          </div>
        )}
        
      </div>
    </main>
  );
}
