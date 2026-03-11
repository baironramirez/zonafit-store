"use client";

import { motion } from "framer-motion";
import { ArrowRight, Flame, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/link"; // We will use generic img tags for unsplash for now to avoid next config issues

const features = [
  {
    icon: <Zap className="w-8 h-8 text-orange-500" />,
    title: "Potencia Máxima",
    description: "Fórmulas avanzadas para llevar tu rendimiento al límite cada día.",
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-orange-500" />,
    title: "Calidad Certificada",
    description: "Marcas líderes mundiales, ingredientes seleccionados y pureza garantizada.",
  },
  {
    icon: <Flame className="w-8 h-8 text-orange-500" />,
    title: "Resultados Reales",
    description: "Recuperación más rápida y ganancia muscular eficiente sin excusas.",
  },
];

const categories = [
  {
    title: "Proteínas",
    image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=800&auto=format&fit=crop",
    link: "/productos?categoria=proteinas"
  },
  {
    title: "Pre-Entrenos",
    image: "https://images.unsplash.com/photo-1554284126-aa88f22d8b74?q=80&w=800&auto=format&fit=crop",
    link: "/productos?categoria=preentrenos"
  },
  {
    title: "Creatina",
    image: "https://images.unsplash.com/photo-1579722822165-276686a11124?q=80&w=800&auto=format&fit=crop",
    link: "/productos?categoria=creatina"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-orange-500 selection:text-black">
      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=2070&auto=format&fit=crop"
            alt="Supplements Background"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/60 to-transparent" />
        </div>

        <div className="container relative z-10 px-6 mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm font-medium text-orange-500 rounded-full bg-orange-500/10 border border-orange-500/20">
              <Zap className="w-4 h-4" />
              <span>Nuevos Pre-Entrenos Extremos</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              DESATA TU <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                VERDADERO PODER
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-neutral-400 mb-8 max-w-xl">
              La ciencia de la nutrición deportiva en tus manos. 
              Suplementos premium para quienes buscan romper sus propias marcas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/productos">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-lg flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
                >
                  Ver Suplementos
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link href="#categorias">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-transparent border border-neutral-700 hover:border-neutral-500 text-white font-medium rounded-lg flex items-center justify-center transition-colors w-full sm:w-auto"
                >
                  Nuestros Pilares
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 bg-neutral-950 border-y border-neutral-900">
        <div className="container px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center text-center space-y-4"
              >
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-neutral-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section id="categorias" className="py-32 bg-neutral-950">
        <div className="container px-6 mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Nutrición de <span className="text-orange-500">Élite</span></h2>
              <p className="text-neutral-400 max-w-2xl">Encuentra la fórmula perfecta para tu objetivo. Construcción muscular, energía bestial y recuperación total.</p>
            </div>
            <Link href="/productos" className="hidden md:flex items-center gap-2 text-orange-500 hover:text-orange-400 font-medium transition-colors">
              Todo el stock <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat, index) => (
              <Link href={cat.link} key={index}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -10 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer border border-neutral-900"
                >
                  <img 
                    src={cat.image} 
                    alt={cat.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300" />
                  
                  <div className="absolute bottom-0 left-0 p-8 w-full flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-white group-hover:text-orange-500 transition-colors">
                      {cat.title}
                    </h3>
                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-orange-500 group-hover:border-orange-500 group-hover:text-black transition-all">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
          
          <div className="mt-8 flex justify-center md:hidden">
            <Link href="/productos" className="flex items-center gap-2 text-orange-500 hover:text-orange-400 font-medium transition-colors">
              Ver todo el catálogo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-orange-600 z-0" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1546483875-ad9014c88eba?q=80&w=2082&auto=format&fit=crop')] opacity-10 mix-blend-multiply bg-cover bg-center" />
        
        <div className="container relative z-10 px-6 mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-black text-black">Unete a la Cultura del Esfuerzo</h2>
            <p className="text-black/80 text-xl font-medium">Suscríbete para recibir lanzamientos exclusivos, guías de suplementación y un 15% de descuento en tu primer pedido.</p>
            
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Tu correo electrónico" 
                className="flex-1 px-6 py-4 rounded-xl bg-black/10 border border-black/20 text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-black/50 font-medium"
              />
              <button 
                type="submit"
                className="px-8 py-4 bg-black text-white font-bold rounded-xl hover:bg-neutral-900 transition-colors"
              >
                Suscribirme
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
