"use client";

/**
 * ProductsSection.tsx — Sección de productos de la home (Client Component).
 *
 * ¿Por qué este componente es Client?
 * Necesita hacer fetch a Firestore para obtener los productos, lo que requiere
 * el SDK de cliente de Firebase con hooks (useState, useEffect).
 *
 * ¿Por qué no lo movemos al servidor también?
 * Los productos pueden cambiar con frecuencia (stock, precios). El Admin SDK
 * en SSR cachearía los datos y mostraría información desactualizada. El SDK
 * cliente usa el caché de Firestore en tiempo real, que es más apropiado aquí.
 *
 * La clave de performance es que este componente NO bloquea el LCP —
 * el hero banner (la imagen del LCP) ya se renderizó en el servidor.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ProductCard, { ProductoData } from "@/components/shop/ProductCard";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, addDoc } from "firebase/firestore";
import type { HomeSettings } from "@/lib/settings";

type ProductsSectionProps = Pick<
  HomeSettings,
  "featuredProductIds" | "extraBlocks"
>;

export default function ProductsSection({
  featuredProductIds: initialFeaturedIds,
  extraBlocks: initialExtraBlocks,
}: ProductsSectionProps) {
  const [productos, setProductos] = useState<ProductoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [extraBlocks, setExtraBlocks] = useState(initialExtraBlocks);
  const [featuredProductIds] = useState(initialFeaturedIds);

  // Newsletter State
  const [email, setEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // Fetch de productos — separado del hero para no bloquear el LCP
  useEffect(() => {
    async function loadProducts() {
      try {
        const pIds = [...featuredProductIds];

        // Recolectar IDs de productos de bloques extra (tipo 'products')
        initialExtraBlocks.forEach((block: any) => {
          if (block.type === "products" && block.productIds) {
            block.productIds.forEach((id: string) => {
              if (!pIds.includes(id)) pIds.push(id);
            });
          }
        });

        if (pIds.length > 0) {
          // Fetch individual por ID — evita limitaciones de queries 'in' en Firestore
          const productPromises = pIds.map((id) =>
            getDoc(doc(db, "products", id))
          );
          const docSnaps = await Promise.all(productPromises);
          const prods: ProductoData[] = [];
          docSnaps.forEach((d) => {
            if (d.exists()) {
              prods.push({ id: d.id, ...d.data() } as ProductoData);
            }
          });
          setProductos(prods);
        } else {
          // Fallback: últimos 4 productos si no hay IDs configurados
          const res = await fetch("/api/productos");
          const data = await res.json();
          const fetchedProducts = Array.isArray(data)
            ? data
            : data.productos ?? [];
          setProductos(fetchedProducts.slice(0, 4));
        }
      } catch (err) {
        console.error("[ProductsSection] Error al cargar productos:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [featuredProductIds, initialExtraBlocks]);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setNewsletterStatus("loading");
    try {
      await addDoc(collection(db, "newsletter"), {
        email: email.trim(),
        createdAt: new Date().toISOString(),
      });
      setNewsletterStatus("success");
      setEmail("");
      setTimeout(() => setNewsletterStatus("idle"), 5000);
    } catch (error) {
      console.error("[ProductsSection] Error newsletter:", error);
      setNewsletterStatus("error");
      setTimeout(() => setNewsletterStatus("idle"), 5000);
    }
  };

  return (
    <>
      {/* ── SECCIÓN NOVEDADES ─────────────────────────────────── */}
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
              <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {productos
                .filter(
                  (p) =>
                    featuredProductIds.length === 0 ||
                    featuredProductIds.includes(p.id)
                )
                .slice(0, 4)
                .map((producto) => (
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

      {/* ── BLOQUES DINÁMICOS ADICIONALES ────────────────────── */}
      {!loading &&
        extraBlocks.map((block, index) => {
          if (block.type === "banner") {
            return (
              <Link
                href={block.link || "#"}
                key={block.id}
                className="block relative h-[50vh] md:h-[60vh] w-full bg-black overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 hidden md:block" />
                <div className="absolute inset-0 bg-black/40 z-10 md:hidden" />

                {(block.title || block.subtitle || block.buttonText) && (
                  <div className="absolute inset-0 z-20 flex flex-col justify-end md:justify-center items-center text-center pb-20 md:pb-0 p-6">
                    {block.title && (
                      <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight md:mb-2 drop-shadow-lg">
                        {block.title.split("\n").map((line: string, i: number) => (
                          <span key={i} className="block">
                            {line}
                          </span>
                        ))}
                      </h2>
                    )}
                    {block.subtitle && (
                      <p className="text-white text-sm md:text-lg font-bold tracking-widest uppercase mb-6 md:mb-8 drop-shadow-md">
                        {block.subtitle}
                      </p>
                    )}
                    {block.buttonText && (
                      <span className="inline-block px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-all shadow-lg group-hover:scale-105">
                        {block.buttonText}
                      </span>
                    )}
                  </div>
                )}

                {/* Imagen Desktop */}
                <div className="absolute inset-0 hidden md:block opacity-90 group-hover:scale-105 transition-transform duration-700">
                  <Image
                    src={block.desktopImage || "/images/b1.jpg"}
                    alt={block.title || `Banner Promocional ${index}`}
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                </div>
                {/* Imagen Mobile */}
                <div className="absolute inset-0 md:hidden opacity-90 group-hover:scale-105 transition-transform duration-700">
                  <Image
                    src={
                      block.mobileImage ||
                      block.desktopImage ||
                      "/images/b1.jpg"
                    }
                    alt={block.title || `Banner Promocional ${index} Móvil`}
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                </div>
              </Link>
            );
          }

          if (block.type === "products") {
            return (
              <section
                key={block.id}
                className="py-20 md:py-28 bg-white border-t border-gray-100"
              >
                <div className="max-w-[1400px] mx-auto px-6">
                  <div className="flex justify-between items-end mb-10">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black">
                      {block.title || "NUEVA COLECCIÓN"}
                    </h2>
                    {block.category && (
                      <Link
                        href={`/productos?cat=${encodeURIComponent(block.category)}`}
                        className="hidden md:inline-flex text-black font-bold uppercase tracking-widest border-b-2 border-black pb-1 hover:text-gray-500 hover:border-gray-500 transition-colors text-sm"
                      >
                        Ver Todo
                      </Link>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {(block.productIds || []).map((id: string) => {
                      const prod = productos.find((p) => p.id === id);
                      if (!prod) return null;
                      return (
                        <div key={prod.id} className="group relative">
                          <ProductCard producto={prod} />
                        </div>
                      );
                    })}
                  </div>

                  {block.category && (
                    <div className="mt-10 text-center md:hidden">
                      <Link
                        href={`/productos?cat=${encodeURIComponent(block.category)}`}
                        className="inline-flex text-black font-bold uppercase tracking-widest border-b-2 border-black pb-1 text-sm"
                      >
                        Ver Todo
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          return null;
        })}

      {/* ── NEWSLETTER ───────────────────────────────────────── */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-4xl font-black mb-4 uppercase tracking-tight text-black">
            Únete a la Familia
          </h2>
          <p className="text-gray-600 font-medium text-[15px] mb-8">
            Sé el primero en saber sobre nuevos productos y rutinas de los
            atletas Zinc.
          </p>

          <form
            onSubmit={handleNewsletterSubmit}
            className="flex flex-col sm:flex-row max-w-xl mx-auto border border-gray-300 relative"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={
                newsletterStatus === "loading" ||
                newsletterStatus === "success"
              }
              placeholder="Dirección de correo electrónico"
              className="flex-1 px-6 py-4 bg-white text-black placeholder-gray-400 focus:outline-none text-sm font-medium disabled:opacity-50"
              required
            />
            <button
              type="submit"
              disabled={
                newsletterStatus === "loading" ||
                newsletterStatus === "success"
              }
              className="px-8 py-4 bg-black text-white font-bold uppercase tracking-widest transition-colors hover:bg-gray-800 disabled:opacity-70 flex items-center justify-center min-w-[160px]"
            >
              {newsletterStatus === "loading" ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : newsletterStatus === "success" ? (
                "¡LISTO!"
              ) : (
                "SUSCRIBIR"
              )}
            </button>
            {newsletterStatus === "success" && (
              <p className="absolute -bottom-8 left-0 right-0 text-green-600 text-xs font-bold uppercase tracking-wide">
                ¡Gracias por unirte a nuestra familia!
              </p>
            )}
            {newsletterStatus === "error" && (
              <p className="absolute -bottom-8 left-0 right-0 text-red-500 text-xs font-bold uppercase tracking-wide">
                Hubo un error. Inténtalo de nuevo.
              </p>
            )}
          </form>
        </div>
      </section>
    </>
  );
}
