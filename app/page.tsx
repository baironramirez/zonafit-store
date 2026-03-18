"use client";

import Link from "next/link";
import { ArrowRight, ArrowLeft, Heart, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import ProductCard, { ProductoData } from "@/components/ProductCard";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

export default function Home() {
  const [productos, setProductos] = useState<ProductoData[]>([]);
  const [loading, setLoading] = useState(true);

  // Hero Banner State
  const [heroBanners, setHeroBanners] = useState<string[]>([]);
  const [heroMobileBanners, setHeroMobileBanners] = useState<string[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [autoRotateBanner, setAutoRotateBanner] = useState(false);
  const [bannerInterval, setBannerInterval] = useState(5);
  const [heroTitle, setHeroTitle] = useState<string>("OVERCOME\nEVERYTHING.");
  const [heroSubtitle, setHeroSubtitle] = useState<string>("RENDIMIENTO ÉLITE");
  const [heroDesc, setHeroDesc] = useState<string>("Suplementos diseñados para los que no se rinden. Rompe tus límites hoy.");
  const [heroBtn1, setHeroBtn1] = useState<string>("Comprar Novedades");
  const [heroBtn2, setHeroBtn2] = useState<string>("Ver Catálogo");
  const [heroBtn1Cat, setHeroBtn1Cat] = useState<string>("");
  const [heroBtn2Cat, setHeroBtn2Cat] = useState<string>("");

  // Fetch Settings (Banners and Features) and then Products
  useEffect(() => {
    async function loadHomeData() {
      try {
        const docSnap = await getDoc(doc(db, "settings", "home"));
        let pIds: string[] = [];
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          if (data.heroBannerUrls && Array.isArray(data.heroBannerUrls)) {
            setHeroBanners(data.heroBannerUrls);
          } else if (data.heroBannerUrl) {
            setHeroBanners([data.heroBannerUrl]); // Legacy fallback
          }

          if (data.heroMobileBannersUrls && Array.isArray(data.heroMobileBannersUrls)) {
            setHeroMobileBanners(data.heroMobileBannersUrls);
          }
          
          if (data.heroTitle) setHeroTitle(data.heroTitle);
          if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle);
          if (data.heroDesc) setHeroDesc(data.heroDesc);
          if (data.heroBtn1) setHeroBtn1(data.heroBtn1);
          if (data.heroBtn2) setHeroBtn2(data.heroBtn2);
          if (data.heroBtn1Cat) setHeroBtn1Cat(data.heroBtn1Cat);
          if (data.heroBtn2Cat) setHeroBtn2Cat(data.heroBtn2Cat);
          
          if (data.autoRotateBanner !== undefined) setAutoRotateBanner(data.autoRotateBanner);
          if (data.bannerInterval !== undefined) setBannerInterval(data.bannerInterval);
          if (data.featuredProductIds && Array.isArray(data.featuredProductIds) && data.featuredProductIds.length > 0) {
            pIds = data.featuredProductIds;
          }
        }

        // Fetch Products based on featured IDs or completely
        if (pIds.length > 0) {
          // Use Promise.all to fetch individually to bypass any 'in' query limitations or indexing issues
          const productPromises = pIds.map(id => getDoc(doc(db, "productos", id)));
          const docSnaps = await Promise.all(productPromises);
          const prods: ProductoData[] = [];
          
          docSnaps.forEach((d) => {
            if (d.exists()) {
              prods.push({ id: d.id, ...d.data() } as ProductoData);
            }
          });
          setProductos(prods);
          setLoading(false);
        } else {
          // Fallback to fetch latest 4 products via existing API
          const res = await fetch("/api/productos");
          const data = await res.json();
          let fetchedProducts = [];
          if (Array.isArray(data)) {
            fetchedProducts = data;
          } else if (data.productos) {
            fetchedProducts = data.productos;
          }
          setProductos(fetchedProducts.slice(0, 4));
          setLoading(false);
        }

      } catch (err) {
        console.error("Error loading home data:", err);
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  // Effect for Auto-Carousel
  useEffect(() => {
    // Determine max length to rotate through
    const maxLen = Math.max(heroBanners.length, heroMobileBanners.length);
    if (!autoRotateBanner || maxLen <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => prevIndex + 1);
    }, bannerInterval * 1000);

    return () => clearInterval(intervalId);
  }, [autoRotateBanner, heroBanners.length, heroMobileBanners.length, bannerInterval]);

  return (
    <main className="pt-22 min-h-screen bg-white text-black selection:bg-black selection:text-white">

      {/* 1. MASSIVE HERO BANNER */}
      <section className="relative h-[70vh] w-full flex items-end pb-16 lg:pb-24 overflow-hidden">

        {/* Background Images Carousel - Desktop */}
        <div className="absolute inset-0 z-0 bg-black hidden md:block">
          {heroBanners.map((bannerUrl, index) => {
            const isActive = heroBanners.length > 0 ? index === (currentBannerIndex % heroBanners.length) : false;
            return (
              <motion.img
                key={bannerUrl}
                src={bannerUrl}
                alt={`Banner Desktop ${index + 1}`}
                className="absolute w-full h-full object-cover object-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 1 }}
              />
            );
          })}
          {/* Loading Skeleton or Empty state if no banners and finished loading */}
          {loading && (
             <div className="absolute w-full h-full bg-gray-900 animate-pulse" />
          )}
          {!loading && heroBanners.length === 0 && (
             <div className="absolute w-full h-full bg-black" />
          )}
        </div>

        {/* Background Images Carousel - Mobile */}
        <div className="absolute inset-0 z-0 bg-black md:hidden">
          {(heroMobileBanners.length > 0 ? heroMobileBanners : heroBanners).map((bannerUrl, index) => {
            const activeArray = heroMobileBanners.length > 0 ? heroMobileBanners : heroBanners;
            const isActive = activeArray.length > 0 ? index === (currentBannerIndex % activeArray.length) : false;
            return (
              <motion.img
                key={`mob-${bannerUrl}`}
                src={bannerUrl}
                alt={`Banner Mobile ${index + 1}`}
                className="absolute w-full h-full object-cover object-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 1 }}
              />
            );
          })}
          {loading && (
             <div className="absolute w-full h-full bg-gray-900 animate-pulse" />
          )}
          {!loading && heroBanners.length === 0 && heroMobileBanners.length === 0 && (
             <div className="absolute w-full h-full bg-black" />
          )}
        </div>

          {/* Dark overlay to improve contrast with navbar */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 pointer-events-none" />
        {/* Content */}
        <div className="relative z-10 px-6 max-w-[1400px] w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
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
                  href={heroBtn1Cat ? `/productos?cat=${encodeURIComponent(heroBtn1Cat)}` : "/productos"}
                  className="w-full sm:w-auto text-center px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors"
                >
                  {heroBtn1}
                </Link>
              )}

              {heroBtn2 && (
                <Link
                  href={heroBtn2Cat ? `/productos?cat=${encodeURIComponent(heroBtn2Cat)}` : "/productos"}
                  className="w-full sm:w-auto text-center px-8 py-4 bg-transparent border-2 border-white text-white font-black uppercase tracking-widest text-sm hover:bg-white/10 transition-colors"
                >
                  {heroBtn2}
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. DYNAMIC 'JUST DROPPED' SECTION */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black">
              NOVEDADES ÉLITE
            </h2>

            <Link
              href="/productos"
              className="hidden md:inline-flex text-black font-bold uppercase tracking-widest border-b-2 border-black pb-1 hover:text-gray-500 hover:border-gray-500 transition-colors text-sm"
            >
              Ver Todo
            </Link>
          </div>

          {loading ? (
            <div className="w-full flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {productos.map((producto) => (
                <div key={producto.id} className="group relative">
                  <ProductCard producto={producto} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 text-center md:hidden">
            <Link
              href="/productos"
              className="inline-flex text-black font-bold uppercase tracking-widest border-b-2 border-black pb-1 text-sm"
            >
              Ver Todo
            </Link>
          </div>
        </div>
      </section>

      {/* 3. NEWSLETTER */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-4xl font-black mb-4 uppercase tracking-tight text-black">
            Únete a la Familia
          </h2>

          <p className="text-gray-600 font-medium text-[15px] mb-8">
            Sé el primero en saber sobre nuevos productos y rutinas de los atletas Zinc.
          </p>

          <form className="flex flex-col sm:flex-row max-w-xl mx-auto border border-gray-300">
            <input
              type="email"
              placeholder="Dirección de correo electrónico"
              className="flex-1 px-6 py-4 bg-white text-black placeholder-gray-400 focus:outline-none text-sm font-medium"
              required
            />

            <button
              type="submit"
              className="px-8 py-4 bg-black text-white font-bold uppercase tracking-widest transition-colors hover:bg-gray-800"
            >
              Suscribir
            </button>
          </form>
        </div>
      </section>

    </main>
  );
}
