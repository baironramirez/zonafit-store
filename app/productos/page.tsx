"use client";

import { useEffect, useState } from "react";
import { fetchProducts } from "../../services/apiProducts";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";

const CATEGORIES = [
  { id: "all", name: "Todos" },
  { id: "proteinas", name: "Proteínas" },
  { id: "preentrenos", name: "Pre-Entrenos" },
  { id: "creatina", name: "Creatina" },
  { id: "vitaminas", name: "Vitaminas & Salud" },
];

export default function ProductosPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Filter products by category (assumes product has a category field, otherwise shows all for now)
  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(p => p.categoria?.toLowerCase() === activeCategory);

  // Animation variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white selection:bg-orange-500 selection:text-black pt-24">
      {/* Header Section with Background Image */}
      <div className="relative overflow-hidden bg-neutral-900 py-20 border-b border-neutral-800">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1579722820308-d74e571900a9?q=80&w=2070&auto=format&fit=crop"
            alt="Supplements Header"
            className="w-full h-full object-cover opacity-20 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent" />
        </div>

        <div className="container relative z-10 px-6 mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black mb-4 uppercase tracking-tight"
          >
            Nutrición de <span className="text-orange-500">Élite</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto"
          >
            Descubre nuestra selección premium de suplementos diseñados para llevar tu rendimiento deportivo al siguiente nivel.
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
        {/* Sidebar / Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-32">
            <h3 className="text-xl font-bold mb-6 text-white border-b border-neutral-800 pb-4">Categorías</h3>
            <div className="flex flex-col gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-left px-4 py-3 rounded-xl font-medium transition-all ${
                    activeCategory === cat.id 
                      ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20" 
                      : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
            <h2 className="text-2xl font-bold text-white">
              {filteredProducts.length} Suplemento{filteredProducts.length !== 1 ? "s" : ""}
            </h2>
            <div className="text-sm font-medium text-orange-500 bg-orange-500/10 px-4 py-2 rounded-full border border-orange-500/20">
              Stock Premium
            </div>
          </div>

          {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {[1, 2, 3, 4, 5, 6].map((skeleton) => (
                 <div key={skeleton} className="h-96 bg-neutral-900 animate-pulse rounded-2xl border border-neutral-800" />
               ))}
             </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-neutral-900 rounded-3xl border border-neutral-800"
            >
              <div className="text-6xl mb-4 opacity-50">🧪</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Categoría en Restock
              </h2>
              <p className="text-neutral-400 max-w-md mx-auto">
                Actualmente no tenemos suplementos en esta categoría. Estamos reabasteciendo nuestro almacén con lo mejor del mercado.
              </p>
              <button 
                onClick={() => setActiveCategory("all")}
                className="mt-8 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors"
              >
                Ver Todo el Catálogo
              </button>
            </motion.div>
          ) : (
            <motion.div 
              variants={containerVars}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredProducts.map((product: any) => (
                <motion.div variants={itemVars as any} key={product.id}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer / Contact Banner */}
      <div className="mt-12 bg-orange-600 text-black py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1546483875-ad9014c88eba?q=80&w=2082&auto=format&fit=crop')] opacity-10 mix-blend-multiply bg-cover bg-center" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h3 className="text-3xl md:text-4xl font-black mb-4">
            ¿Buscas compras por mayor o asesoría?
          </h3>
          <p className="text-black/80 font-medium text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Contáctanos para compras mayoristas, equipo para gimnasios o asesoramiento personalizado sobre qué suplemento elegir.
          </p>
          <button className="bg-black text-white hover:bg-neutral-900 font-bold py-4 px-10 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
            Hablar con un Experto
          </button>
        </div>
      </div>
    </main>
  );
}
