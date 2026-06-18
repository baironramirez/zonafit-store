"use client";

/**
 * HeroClient.tsx — Componente Cliente del Hero Banner.
 *
 * ¿Por qué este componente es Client y no el Server Component padre?
 * El carrusel necesita estado (currentBannerIndex) y el auto-rotate usa
 * useEffect/setInterval — APIs exclusivas del cliente.
 *
 * ¿Por qué recibe las URLs como props y no las fetcha él mismo?
 * Porque el Server Component padre (page.tsx) ya las leyó en el SSR.
 * Al recibir las URLs como props, el HTML inicial ya contiene la primera
 * imagen del banner, lo que permite al navegador emitir el preload antes
 * de ejecutar cualquier JS — esto es lo que reduce el LCP.
 */

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import type { HomeSettings } from "@/lib/settings";

// Solo las props que el hero necesita del SSR
type HeroClientProps = Pick<
  HomeSettings,
  | "heroBannerUrls"
  | "heroMobileBannersUrls"
  | "heroTitle"
  | "heroSubtitle"
  | "heroDesc"
  | "heroBtn1"
  | "heroBtn2"
  | "heroBtn1Cat"
  | "heroBtn2Cat"
  | "autoRotateBanner"
  | "bannerInterval"
>;

export default function HeroClient({
  heroBannerUrls,
  heroMobileBannersUrls,
  heroTitle,
  heroSubtitle,
  heroDesc,
  heroBtn1,
  heroBtn2,
  heroBtn1Cat,
  heroBtn2Cat,
  autoRotateBanner,
  bannerInterval,
}: HeroClientProps) {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Array efectivo de banners para cada viewport
  const desktopBanners = heroBannerUrls;
  const mobileBanners =
    heroMobileBannersUrls.length > 0 ? heroMobileBannersUrls : heroBannerUrls;

  const maxLen = Math.max(desktopBanners.length, mobileBanners.length);

  // Avanzar al siguiente banner (circular)
  const nextBanner = useCallback(() => {
    setCurrentBannerIndex((prev) => (prev + 1) % maxLen);
  }, [maxLen]);

  const prevBanner = useCallback(() => {
    setCurrentBannerIndex((prev) => (prev - 1 + maxLen) % maxLen);
  }, [maxLen]);

  // Auto-rotate con el intervalo configurado en Firestore
  useEffect(() => {
    if (!autoRotateBanner || maxLen <= 1) return;
    const intervalId = setInterval(nextBanner, bannerInterval * 1000);
    return () => clearInterval(intervalId);
  }, [autoRotateBanner, bannerInterval, maxLen, nextBanner]);

  return (
    <section className="relative h-[70vh] w-full flex items-end pb-16 lg:pb-24 overflow-hidden">

      {/* ── Carrusel Desktop ─────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 bg-black hidden md:block">
        {desktopBanners.map((url, index) => {
          const isActive = index === currentBannerIndex % desktopBanners.length;
          return (
            <motion.div
              key={url}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: isActive ? 1 : 0 }}
              transition={{ duration: 1 }}
            >
              <Image
                src={url}
                alt={`Banner Desktop ${index + 1}`}
                fill
                // priority + fetchPriority="high" solo en la primera imagen:
                // esto genera el <link rel="preload" fetchpriority="high"> en el <head>
                // que es exactamente lo que PageSpeed exige para el LCP
                priority={index === 0}
                fetchPriority={index === 0 ? "high" : "auto"}
                className="object-cover object-center"
                sizes="100vw"
              />
            </motion.div>
          );
        })}
        {desktopBanners.length === 0 && (
          <div className="absolute w-full h-full bg-black" />
        )}
      </div>

      {/* ── Carrusel Mobile ──────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 bg-black md:hidden">
        {mobileBanners.map((url, index) => {
          const isActive = index === currentBannerIndex % mobileBanners.length;
          return (
            <motion.div
              key={`mob-${url}`}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: isActive ? 1 : 0 }}
              transition={{ duration: 1 }}
            >
              <Image
                src={url}
                alt={`Banner Mobile ${index + 1}`}
                fill
                // La primera imagen móvil es el LCP en dispositivos móviles.
                // fetchPriority="high" le indica al navegador que la descargue
                // con máxima prioridad, reduciendo el Resource Load Delay.
                priority={index === 0}
                fetchPriority={index === 0 ? "high" : "auto"}
                className="object-cover object-center"
                sizes="100vw"
              />
            </motion.div>
          );
        })}
        {mobileBanners.length === 0 && (
          <div className="absolute w-full h-full bg-black" />
        )}
      </div>

      {/* ── Overlay de contraste ─────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/15 to-transparent pointer-events-none" />

      {/* ── Botones de navegación manual del carrusel ────────────── */}
      {maxLen > 1 && (
        <>
          <button
            onClick={prevBanner}
            aria-label="Banner anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/70 text-white transition-colors rounded-full"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={nextBanner}
            aria-label="Siguiente banner"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/70 text-white transition-colors rounded-full"
          >
            <ArrowRight size={18} />
          </button>

          {/* Indicadores de posición */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {Array.from({ length: maxLen }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBannerIndex(i)}
                aria-label={`Ir al banner ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentBannerIndex % maxLen
                    ? "bg-white scale-125"
                    : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Contenido textual del hero ───────────────────────────── */}
      <div className="relative z-10 px-6 max-w-[1400px] w-full mx-auto">
        <motion.div
          // Reducimos el delay de 0.2s a 0s — el texto debe ser visible
          // lo antes posible para no introducir Element Render Delay adicional
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0 }}
          className="max-w-3xl"
        >
          <h1 className="text-[2.5rem] sm:text-[3.5rem] md:text-[4.8rem] lg:text-[6rem] font-black leading-[0.9] sm:leading-[0.85] tracking-tighter uppercase text-white mb-2 italic whitespace-pre-line">
            {heroTitle}
          </h1>

          <p className="text-sm sm:text-base md:text-xl text-white font-bold uppercase tracking-wide mb-2 mt-4">
            {heroSubtitle}
          </p>

          <p className="text-xs md:text-base text-gray-200 mb-8 max-w-xl font-medium">
            {heroDesc}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-center">
            {heroBtn1 && (
              <Link
                href={
                  heroBtn1Cat
                    ? `/productos?cat=${encodeURIComponent(heroBtn1Cat)}`
                    : "/productos"
                }
                className="w-full sm:w-auto text-center px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors"
              >
                {heroBtn1}
              </Link>
            )}

            {heroBtn2 && (
              <Link
                href={
                  heroBtn2Cat
                    ? `/productos?cat=${encodeURIComponent(heroBtn2Cat)}`
                    : "/productos"
                }
                className="w-full sm:w-auto text-center px-8 py-4 bg-transparent border-2 border-white text-white font-black uppercase tracking-widest text-sm hover:bg-white/10 transition-colors"
              >
                {heroBtn2}
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
