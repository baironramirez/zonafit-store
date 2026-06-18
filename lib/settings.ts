/**
 * lib/settings.ts — Capa de acceso a configuración de la home desde el servidor.
 *
 * ¿Por qué este archivo existe?
 * La home page necesita conocer las URLs de los banners en el momento del SSR
 * (Server Side Rendering) para que el navegador pueda emitir el preload de la
 * imagen LCP en el HTML inicial, antes de que cualquier JS se ejecute.
 *
 * ¿Por qué unstable_cache?
 * Los settings de la home no cambian en cada request. Cachear 60 segundos en el
 * servidor evita una llamada a Firestore por cada visita, reduciendo la latencia
 * del SSR sin sacrificar frescura de los datos.
 *
 * ¿Por qué Firebase Admin y no el SDK cliente?
 * El SDK cliente requiere un token de usuario autenticado. En un Server Component
 * no existe sesión del navegador — el Admin SDK usa la service account directamente.
 */

import { unstable_cache } from "next/cache";
import { getAdminFirestore } from "@/lib/firebase-admin";

// Tipado de los datos que esperamos de Firestore para la home
export interface HomeSettings {
  heroBannerUrls: string[];
  heroMobileBannersUrls: string[];
  heroTitle: string;
  heroSubtitle: string;
  heroDesc: string;
  heroBtn1: string;
  heroBtn2: string;
  heroBtn1Cat: string;
  heroBtn2Cat: string;
  autoRotateBanner: boolean;
  bannerInterval: number;
  featuredProductIds: string[];
  extraBlocks: any[];
}

// Valores por defecto para cuando Firestore no tenga datos aún
const DEFAULT_HOME_SETTINGS: HomeSettings = {
  heroBannerUrls: [],
  heroMobileBannersUrls: [],
  heroTitle: "OVERCOME\nEVERYTHING.",
  heroSubtitle: "RENDIMIENTO ÉLITE",
  heroDesc: "Suplementos diseñados para los que no se rinden. Rompe tus límites hoy.",
  heroBtn1: "Comprar Novedades",
  heroBtn2: "Ver Catálogo",
  heroBtn1Cat: "",
  heroBtn2Cat: "",
  autoRotateBanner: false,
  bannerInterval: 5,
  featuredProductIds: [],
  extraBlocks: [],
};

/**
 * getHomeSettings — Lee la configuración de la home desde Firestore.
 *
 * Cacheada en el servidor por 60 segundos para evitar un round-trip a
 * Firestore en cada request. El tag 'home-settings' permite invalidar
 * manualmente el caché si en el futuro lo necesitamos (on-demand revalidation).
 */
export const getHomeSettings = unstable_cache(
  async (): Promise<HomeSettings> => {
    try {
      const db = getAdminFirestore();
      const docSnap = await db.collection("settings").doc("home").get();

      if (!docSnap.exists) {
        return DEFAULT_HOME_SETTINGS;
      }

      const data = docSnap.data()!;

      // Normalizamos los campos con fallback a los valores por defecto
      // para evitar errores si Firestore tiene datos parciales
      return {
        heroBannerUrls:
          Array.isArray(data.heroBannerUrls)
            ? data.heroBannerUrls
            : data.heroBannerUrl
            ? [data.heroBannerUrl]
            : [],
        heroMobileBannersUrls: Array.isArray(data.heroMobileBannersUrls)
          ? data.heroMobileBannersUrls
          : [],
        heroTitle: data.heroTitle ?? DEFAULT_HOME_SETTINGS.heroTitle,
        heroSubtitle: data.heroSubtitle ?? DEFAULT_HOME_SETTINGS.heroSubtitle,
        heroDesc: data.heroDesc ?? DEFAULT_HOME_SETTINGS.heroDesc,
        heroBtn1: data.heroBtn1 ?? DEFAULT_HOME_SETTINGS.heroBtn1,
        heroBtn2: data.heroBtn2 ?? DEFAULT_HOME_SETTINGS.heroBtn2,
        heroBtn1Cat: data.heroBtn1Cat ?? "",
        heroBtn2Cat: data.heroBtn2Cat ?? "",
        autoRotateBanner: data.autoRotateBanner ?? false,
        bannerInterval: data.bannerInterval ?? 5,
        featuredProductIds: Array.isArray(data.featuredProductIds)
          ? data.featuredProductIds
          : [],
        extraBlocks: Array.isArray(data.extraBlocks) ? data.extraBlocks : [],
      };
    } catch (err) {
      // Si Firestore falla (ej. en desarrollo sin credenciales), devolvemos
      // los valores por defecto para no bloquear el renderizado
      console.error("[settings] Error al leer settings/home desde Admin SDK:", err);
      return DEFAULT_HOME_SETTINGS;
    }
  },
  ["home-settings"],
  {
    // Revalida cada 60 segundos — los banners no cambian en cada request
    revalidate: 60,
    tags: ["home-settings"],
  }
);
