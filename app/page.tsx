"use client";

import Link from "next/link";
import { ArrowRight, Zap, ShieldCheck, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } }
  };

  return (
    <main className="min-h-screen bg-white text-black selection:bg-orange-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image - Lighter overlay for minimalist feel */}
        <div className="absolute inset-0 z-0 bg-white">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
            alt="Atleta entrenando con suplementos"
            className="w-full h-full object-cover object-top opacity-50 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-white/40" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 mt-20 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-black text-white text-xs font-bold tracking-widest uppercase mb-6">
              Nueva Colección de Rendimiento
            </span>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 tracking-tighter uppercase leading-none text-black">
              Desata Tu<br /> 
              <span className="text-orange-500">Poder</span>
            </h1>
            <p className="text-lg md:text-2xl text-gray-800 mb-10 max-w-2xl mx-auto font-medium">
              Suplementación de grado élite para resultados que hablan por sí solos.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/productos"
                className="group relative inline-flex items-center justify-center bg-black text-white px-8 py-4 font-bold uppercase tracking-widest overflow-hidden transition-all hover:bg-orange-500 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Comprar Ahora <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            variants={containerVars}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
          >
            {[
              {
                icon: <Zap className="w-8 h-8 text-black" />,
                title: "Potencia Máxima",
                description: "Fórmulas avanzadas diseñadas clínicamente para el mayor rendimiento."
              },
              {
                icon: <ShieldCheck className="w-8 h-8 text-black" />,
                title: "Calidad Certificada",
                description: "Materias primas importadas con los más altos estándares de pureza."
              },
              {
                icon: <Activity className="w-8 h-8 text-black" />,
                title: "Resultados Reales",
                description: "Miles de atletas confían en nosotros para romper sus récords."
              }
            ].map((feature, index) => (
              <motion.div variants={itemVars} key={index} className="text-center group">
                <div className="w-16 h-16 mx-auto bg-white border border-gray-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:border-black group-hover:shadow-md transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-black uppercase tracking-wide">{feature.title}</h3>
                <p className="text-gray-600 font-medium leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories Grid - Modern Light Style */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-black mb-4">
              Eleva tu <span className="text-orange-500">Nivel</span>
            </h2>
            <p className="text-gray-500 font-medium text-lg max-w-2xl mx-auto">
              Navega por nuestra selección curada para cada fase de tu entrenamiento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/productos" className="group relative h-[500px] overflow-hidden bg-gray-100 flex items-end">
              <img 
                src="https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=2070&auto=format&fit=crop" 
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                alt="Proteínas"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
              <div className="relative z-10 p-8 w-full">
                <p className="text-orange-500 font-bold uppercase tracking-widest mb-2 text-sm">Recuperación Muscular</p>
                <h3 className="text-3xl font-black text-white uppercase tracking-wide">Proteínas</h3>
              </div>
            </Link>

            <Link href="/productos" className="group relative h-[500px] overflow-hidden bg-gray-100 flex items-end">
              <img 
                src="https://images.unsplash.com/photo-1554284126-aa888050901e?q=80&w=2070&auto=format&fit=crop" 
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                alt="Pre-Entrenos"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
              <div className="relative z-10 p-8 w-full">
                <p className="text-orange-500 font-bold uppercase tracking-widest mb-2 text-sm">Energía Explosiva</p>
                <h3 className="text-3xl font-black text-white uppercase tracking-wide">Pre-Entrenos</h3>
              </div>
            </Link>

            <Link href="/productos" className="group relative h-[500px] overflow-hidden bg-gray-100 flex items-end md:col-span-2 lg:col-span-1">
              <img 
                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop" 
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                alt="Creatina"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
              <div className="relative z-10 p-8 w-full">
                <p className="text-orange-500 font-bold uppercase tracking-widest mb-2 text-sm">Fuerza Pura</p>
                <h3 className="text-3xl font-black text-white uppercase tracking-wide">Creatina</h3>
              </div>
            </Link>
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/productos" className="inline-block border-b-2 border-black pb-1 font-bold text-black uppercase tracking-widest hover:text-orange-500 hover:border-orange-500 transition-colors">
              Ver Todo el Catálogo
            </Link>
          </div>
        </div>
      </section>

      {/* Modern Newsletter / CTA - Clean Style */}
      <section className="py-24 bg-gray-100 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-6 uppercase tracking-tight text-black">
            Únete a la Cultura del <span className="text-orange-500">Esfuerzo</span>
          </h2>
          <p className="text-gray-600 font-medium text-lg mb-10">
            Recibe acceso anticipado a restocks de suplementos, protocolos de nutrición y ofertas exclusivas en tu correo.
          </p>
          
          <form className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
            <input 
              type="email" 
              placeholder="TU CORREO ELECTRÓNICO" 
              className="flex-1 px-6 py-4 bg-white border border-gray-300 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black transition-all uppercase text-sm font-bold tracking-wider"
              required
            />
            <button 
              type="submit"
              className="px-8 py-4 bg-black text-white font-bold uppercase tracking-widest hover:bg-orange-500 transition-colors whitespace-nowrap"
            >
              Suscribirme
            </button>
          </form>
          <p className="mt-4 text-xs text-gray-500 font-medium">
            Al suscribirte aceptas nuestros términos y condiciones.
          </p>
        </div>
      </section>
    </main>
  );
}
