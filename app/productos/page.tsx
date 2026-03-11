"use client";

import { useEffect, useState } from "react";
import ProductCard, { ProductoData } from "@/components/ProductCard";
import { motion } from "framer-motion";

export default function ProductosPage() {
  const [productos, setProductos] = useState<ProductoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("Todos");

  useEffect(() => {
    fetch("/api/productos")
      .then((res) => res.json())
      .then((data) => {
        if (data.productos) {
          setProductos(data.productos);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setLoading(false);
      });
  }, []);

  const categorias = ["Todos", "Proteínas", "Pre-Entrenos", "Creatina", "Vitaminas"];

  const productosFiltrados = filtroCategoria === "Todos" 
    ? productos 
    : productos.filter(p => p.categoria.toLowerCase().includes(filtroCategoria.toLowerCase()));

  // Animaciones Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex justify-center items-center pt-24">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-medium text-gray-500 uppercase tracking-widest text-sm">Cargando Catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black selection:bg-orange-500 selection:text-white pt-24">
      {/* Header Compacto Minimalista */}
      <div className="bg-gray-50 border-b border-gray-200 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-black mb-4">
            Catálogo de <span className="text-orange-500">Rendimiento</span>
          </h1>
          <p className="text-gray-600 font-medium text-lg max-w-2xl">
            Herramientas diseñadas para maximizar tus resultados físicos. Sin compromisos.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar de Filtros Minimalista */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-32">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-4 border-b border-gray-200">
                Líneas de Producto
              </h2>
              <div className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
                {categorias.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFiltroCategoria(cat)}
                    className={`whitespace-nowrap px-4 py-3 text-left rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${
                      filtroCategoria === cat 
                        ? "bg-black text-white" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-black"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid de Productos C/ Animación */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
              <p className="text-gray-500 font-medium">
                Mostrando <span className="text-black font-bold">{productosFiltrados.length}</span> suplementos
              </p>
            </div>

            {productosFiltrados.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-200">
                <p className="text-gray-500 text-lg mb-4">No encontramos suplementos en esta categoría.</p>
                <button 
                  onClick={() => setFiltroCategoria("Todos")}
                  className="text-black font-bold underline hover:text-orange-500 uppercase tracking-widest text-sm"
                >
                  Ver todos los productos
                </button>
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8"
              >
                {productosFiltrados.map((producto) => (
                  <motion.div variants={itemVariants as any} key={producto.id}>
                    <ProductCard producto={producto} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

        </div>
      </div>

      {/* Footer Banner Minimalista */}
      <section className="bg-black text-white py-16 mt-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest mb-4">¿Compras por Mayor?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto font-medium">
            Contacta a nuestro equipo de ventas para acceder a la lista de precios mayoristas para gimnasios y preparadores físicos.
          </p>
          <button className="bg-white text-black px-8 py-3 font-bold uppercase tracking-widest text-sm hover:bg-orange-500 hover:text-white transition-colors">
            Solicitar Presupuesto
          </button>
        </div>
      </section>
    </main>
  );
}
