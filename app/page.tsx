/**
 * app/page.tsx — Home Page (Server Component).
 *
 * ¿Por qué quitamos "use client"?
 * Al ser un Server Component, Next.js ejecuta este código en el servidor antes
 * de enviar cualquier HTML al navegador. Esto nos permite:
 *
 * 1. Leer los settings de Firestore (banner URLs) en el servidor.
 * 2. Incluir la URL del banner en el HTML inicial que recibe el navegador.
 * 3. El navegador puede emitir el preload de la imagen LCP *inmediatamente*,
 *    sin esperar que React se hidrate ni que el cliente haga fetch a Firestore.
 *
 * Este es el cambio fundamental para pasar de un LCP alto (~4-6s) a uno
 * dentro del rango "Good" (~1.5-2.5s) según Core Web Vitals.
 *
 * Arquitectura:
 * - page.tsx (Server): lee settings, renderiza SEO metadata, pasa props
 * - HeroClient.tsx (Client): carrusel, animaciones, estado del banner
 * - ProductsSection.tsx (Client): fetch de productos, newsletter
 */

import type { Metadata } from "next";
import HeroClient from "@/components/home/HeroClient";
import ProductsSection from "@/components/home/ProductsSection";
import { getHomeSettings } from "@/lib/settings";

// Metadata estática de SEO para la home — generada en el servidor
export const metadata: Metadata = {
  title: "ZonaFit — Suplementos de Alto Rendimiento",
  description:
    "Suplementos diseñados para los que no se rinden. Proteínas, pre-entrenos y más. Rendimiento élite para atletas exigentes.",
};

export default async function Home() {
  // Fetch de settings en el servidor con caché de 60 segundos.
  // Al ser async/await en un Server Component, Next.js espera estos datos
  // antes de enviar el HTML — las URLs de los banners van en el HTML inicial.
  const settings = await getHomeSettings();

  return (
    <main className="pt-22 min-h-screen bg-white text-black selection:bg-black selection:text-white">

      {/*
       * Hero Banner — renderizado en el servidor con las URLs ya conocidas.
       * HeroClient recibe las URLs como props y las usa directamente en su
       * render inicial, sin necesidad de hacer fetch. El primer <Image>
       * tendrá fetchPriority="high" lo que genera el preload correcto.
       */}
      <HeroClient
        heroBannerUrls={settings.heroBannerUrls}
        heroMobileBannersUrls={settings.heroMobileBannersUrls}
        heroTitle={settings.heroTitle}
        heroSubtitle={settings.heroSubtitle}
        heroDesc={settings.heroDesc}
        heroBtn1={settings.heroBtn1}
        heroBtn2={settings.heroBtn2}
        heroBtn1Cat={settings.heroBtn1Cat}
        heroBtn2Cat={settings.heroBtn2Cat}
        autoRotateBanner={settings.autoRotateBanner}
        bannerInterval={settings.bannerInterval}
      />

      {/*
       * Sección de productos y newsletter — Client Component.
       * Recibe los IDs de productos y bloques extra del SSR para saber
       * qué cargar, pero el fetch real de datos de productos ocurre en el
       * cliente (después del LCP), lo que no penaliza la métrica principal.
       */}
      <ProductsSection
        featuredProductIds={settings.featuredProductIds}
        extraBlocks={settings.extraBlocks}
      />

    </main>
  );
}
