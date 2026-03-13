"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ProductoData, Variante } from "@/components/ProductCard";
import { ArrowLeft, Check, Heart, Share, Star } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [producto, setProducto] = useState<ProductoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<Variante | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    fetch("/api/productos")
      .then((res) => res.json())
      .then((data) => {
        let allProducts: ProductoData[] = [];
        if (Array.isArray(data)) {
          allProducts = data;
        } else if (data.productos) {
          allProducts = data.productos;
        }

        const found = allProducts.find(p => p.id === id);
        if (found) {
          setProducto(found);
          // Auto-select first variant if exists
          if (found.variantes && found.variantes.length > 0) {
            setSelectedVariant(found.variantes[0]);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching product details:", err);
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = () => {
    if (producto) {

      // If product has variants but none is selected (shouldn't happen due to auto-select, but fallback)
      if (producto.variantes && producto.variantes.length > 0 && !selectedVariant) {
        alert("Por favor selecciona una opción antes de agregar a la bolsa.");
        return;
      }

      const finalPrice = selectedVariant ? selectedVariant.precio : producto.precio;
      const finalName = selectedVariant
        ? `${producto.nombre} - ${selectedVariant.nombre}`
        : producto.nombre;

      addToCart({
        id: selectedVariant ? `${producto.id}-${selectedVariant.id}` : producto.id,
        nombre: finalName,
        precio: finalPrice,
        imagen: producto.imagen,
        cantidad: 1
      } as any);

      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex justify-center items-center pt-24">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-100 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-bold text-black uppercase tracking-widest text-sm">CARGANDO...</p>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center pt-24">
        <p className="text-2xl font-black uppercase mb-4">PRODUCTO NO ENCONTRADO</p>
        <Link href="/productos" className="border-b-2 border-black font-bold uppercase tracking-widest text-sm pb-1">
          Volver al Catálogo
        </Link>
      </div>
    );
  }

  const defaultImage = producto.imagen || "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=800&auto=format&fit=crop";

  // Determine Display Price
  let displayPrice = producto.precio;
  if (selectedVariant) {
    displayPrice = selectedVariant.precio;
  } else if (producto.variantes && producto.variantes.length > 0) {
    displayPrice = Math.min(...producto.variantes.map(v => v.precio));
  }

  return (
    <main className="min-h-screen bg-white text-black pt-20 md:pt-24 selection:bg-black selection:text-white">

      {/* Breadcrumb / Back Navigation */}
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center border-b border-gray-100 mb-6 hidden md:flex">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider hover:text-gray-500 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
      </div>

      <div className="max-w-[1400px] mx-auto px-0 md:px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 md:gap-12">

          {/* LADO IZQUIERDO: GALERÍA DE IMÁGENES (Gymshark Scroll Style) */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-4 lg:grid-cols-2">
              {/* Multiplying the same image to simulate the Gymshark gallery feel */}
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className="aspect-[3/4] md:aspect-[4/5] bg-gray-50 relative overflow-hidden flex items-center justify-center">
                  <img
                    src={defaultImage}
                    alt={`${producto.nombre} view ${index}`}
                    className="w-full h-full object-contain filter contrast-125 mix-blend-multiply p-8"
                  />
                  {/* Faux text overlay on image 1 for that sick Gymshark typographic vibe */}
                  {index === 1 && (
                    <div className="absolute top-6 left-6 text-black font-black uppercase tracking-tighter leading-none text-2xl opacity-20 pointer-events-none">
                      PREMIUM<br />QUALITY<br />FORMULA
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE DETALLES FIJOS (Sticky) */}
          <div className="lg:col-span-5 xl:col-span-4 px-6 md:px-0 mt-8 lg:mt-0">
            <div className="sticky top-28">

              {/* Header Info */}
              <div className="mb-6">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">
                  {producto.categoria}
                </p>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black mb-4 leading-none">
                  {producto.nombre}
                </h1>
                <p className="text-2xl font-bold text-black border-b border-gray-100 pb-6">
                  {producto.variantes && producto.variantes.length > 0 && !selectedVariant && "Desde "}
                  ${displayPrice.toLocaleString("es-AR")}
                </p>
              </div>

              {/* Dynamic Variants Selector */}
              {producto.variantes && producto.variantes.length > 0 && (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold uppercase tracking-wider text-gray-800">
                      Selecciona una Opción: <span className="text-gray-500 font-medium">{selectedVariant?.nombre}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {producto.variantes.map((variante: Variante) => (
                      <button
                        key={variante.id}
                        onClick={() => setSelectedVariant(variante)}
                        className={`py-4 px-2 text-xs md:text-sm font-bold uppercase tracking-widest border transition-all ${selectedVariant?.id === variante.id
                            ? "bg-black text-white border-black"
                            : "bg-white text-black border-gray-300 hover:border-black"
                          }`}
                      >
                        {variante.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Acciones principales */}
              <div className="space-y-4 mb-10 mt-6">
                <button
                  onClick={handleAddToCart}
                  className={`w-full py-5 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] ${isAdded ? "bg-orange-500 text-white" : "bg-black text-white hover:scale-[1.02]"
                    }`}
                >
                  {isAdded ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                      <Check className="w-5 h-5" /> AGREGADO AL CARRITO
                    </motion.div>
                  ) : (
                    "AGREGAR A LA BOLSA"
                  )}
                </button>

                <button className="w-full py-4 flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-sm border border-black hover:bg-gray-50 transition-colors">
                  <Heart className="w-4 h-4" /> Agregar a Lista de Deseos
                </button>
              </div>

              {/* Descripción (Acordeones mockups minimalistas) */}
              <div className="border-t border-gray-200">
                <div className="py-5 border-b border-gray-200">
                  <h3 className="text-sm font-black uppercase tracking-widest text-black mb-2">Descripción del Producto</h3>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">
                    {producto.descripcion || "Diseñado meticulosamente para atletas que exigen lo mejor. Esta fórmula probada clínicamente aporta los nutrientes vitales para maximizar tu recuperación, destruir tus métricas pasadas y mantener de forma sostenible tu pico de rendimiento."}
                  </p>
                </div>

                <div className="py-5 border-b border-gray-200 flex justify-between items-center cursor-pointer group">
                  <h3 className="text-sm font-black uppercase tracking-widest text-black group-hover:text-gray-500">Materiales & Cuidado</h3>
                  <span className="text-2xl font-light leading-none">+</span>
                </div>

                <div className="py-5 border-b border-gray-200 flex justify-between items-center cursor-pointer group">
                  <h3 className="text-sm font-black uppercase tracking-widest text-black group-hover:text-gray-500">Envíos & Devoluciones</h3>
                  <span className="text-2xl font-light leading-none">+</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
