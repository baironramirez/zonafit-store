"use client";

import Link from "next/link";
import { MapPin, Zap, ShieldCheck, Truck, MessageCircle, ArrowRight } from "lucide-react";

/**
 * LocalSeoSection.tsx
 *
 * ¿Por qué este componente?
 * 1. Para posicionar en el #1 de Google en "suplementación facatativa" y "suplementos facatativa",
 *    los motores de búsqueda necesitan contenido semántico, estructurado y visible en el DOM.
 * 2. Transmite máxima confianza a los clientes locales destacando la rapidez de entrega en Facatativá,
 *    la garantía de autenticidad de marcas (Invima) y la asesoría cercana de ZonaFit.
 * 3. Enlaza internamente las categorías más buscadas para distribuir autoridad de enlace (PageRank).
 */
export default function LocalSeoSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white border-t border-b border-white/10 relative overflow-hidden">
      {/* Glow de fondo temático naranja */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-orange-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        
        {/* Cabecera de Autoridad Local */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-black tracking-widest uppercase mb-4">
            <MapPin className="w-3.5 h-3.5" />
            Facatativá & Sabana de Occidente
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-6">
            Líderes en <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">Suplementación Deportiva</span> en Facatativá
          </h2>

          <p className="text-gray-300 text-base md:text-lg leading-relaxed font-normal">
            En <strong>ZonaFit</strong> impulsamos tu máximo rendimiento. Somos tu punto oficial de nutrición deportiva
            con las marcas más reconocidas de proteínas, creatina, pre-entrenos y accesorios fitness.
            Atención personalizada, entregas inmediatas en Facatativá y envíos seguros a toda Colombia.
          </p>
        </div>

        {/* Cuadrícula de 4 Pilares de Confianza Local */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          
          {/* Pilar 1: Entrega Rápida */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-orange-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-black transition-all">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wide text-white mb-2">
              Entregas en Facatativá
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Recibe tus suplementos con rapidez en tu casa o gimnasio en Facatativá, Madrid, Mosquera y Funza.
            </p>
          </div>

          {/* Pilar 2: 100% Original */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-orange-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-black transition-all">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wide text-white mb-2">
              100% Garantizados
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Trabajamos únicamente con suplementación original, sellada y con registro sanitario Invima verificado.
            </p>
          </div>

          {/* Pilar 3: Rendimiento & Variedad */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-orange-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-black transition-all">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wide text-white mb-2">
              Gama Élite
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Proteínas limpias e hipercalóricas, creatinas monohidratadas, aminoácidos esenciales y pre-entrenos potentes.
            </p>
          </div>

          {/* Pilar 4: Asesoría ZonaFit */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-orange-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-black transition-all">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wide text-white mb-2">
              Asesoría Experta
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              ¿No sabes qué suplemento elegir? Nuestro equipo te asesora según tus metas de ganancia o definición muscular.
            </p>
          </div>
        </div>

        {/* Bloque Informativo de Categorías Populares (Internal Linking para SEO) */}
        <div className="p-8 md:p-10 rounded-3xl bg-neutral-900/60 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h4 className="text-xl md:text-2xl font-black uppercase text-white mb-3">
              ¿Buscando suplementación en Facatativá hoy mismo?
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              Explora nuestro catálogo en línea con precios actualizados y disponibilidad inmediata.
              Paga seguro con Mercado Pago, tarjetas de crédito, PSE o Nequi.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              <Link href="/productos?cat=Prote%C3%ADnas" className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-orange-500 hover:text-black transition-colors">
                Proteínas
              </Link>
              <Link href="/productos?cat=Creatina" className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-orange-500 hover:text-black transition-colors">
                Creatina
              </Link>
              <Link href="/productos?cat=Pre-Entrenos" className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-orange-500 hover:text-black transition-colors">
                Pre-Entrenos
              </Link>
              <Link href="/productos?cat=Vitaminas" className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-orange-500 hover:text-black transition-colors">
                Vitaminas
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0">
            <Link
              href="/productos"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-black font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-orange-500/20"
            >
              <span>Ver Catálogo Completo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
