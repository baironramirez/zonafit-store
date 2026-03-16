"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Image as ImageIcon, Save, ArrowLeft, Loader2, UploadCloud, Type, Megaphone } from "lucide-react";
import Link from "next/link";
import { ProductoData } from "@/components/ProductCard";

export default function AjustesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentBanners, setCurrentBanners] = useState<string[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [autoRotateBanner, setAutoRotateBanner] = useState<boolean>(true);
  const [bannerInterval, setBannerInterval] = useState<number>(5);

  // Nuevos estados para textos dinámicos
  const [heroTitle, setHeroTitle] = useState<string>("OVERCOME\nEVERYTHING.");
  const [heroSubtitle, setHeroSubtitle] = useState<string>("RENDIMIENTO ÉLITE");
  const [heroDesc, setHeroDesc] = useState<string>("Suplementos diseñados para los que no se rinden. Rompe tus límites hoy.");
  const [heroBtn1, setHeroBtn1] = useState<string>("Comprar Novedades");
  const [heroBtn2, setHeroBtn2] = useState<string>("Ver Catálogo");

  // Barra Promocional
  const [promoActive, setPromoActive] = useState<boolean>(false);
  const [promoText, setPromoText] = useState<string>("🚚 Envío GRATIS en pedidos superiores a $150.000 COP");
  // Productos Destacados
  const [productos, setProductos] = useState<ProductoData[]>([]);
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, "settings", "home");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.heroBannerUrls && Array.isArray(data.heroBannerUrls)) {
            setCurrentBanners(data.heroBannerUrls);
            if (data.heroBannerUrls.length > 0) setPreviewUrl(data.heroBannerUrls[0]);
          } else if (data.heroBannerUrl) {
            // Legacy support
            setCurrentBanners([data.heroBannerUrl]);
            setPreviewUrl(data.heroBannerUrl);
          }
          if (data.heroTitle) setHeroTitle(data.heroTitle);
          if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle);
          if (data.heroDesc) setHeroDesc(data.heroDesc);
          if (data.heroBtn1) setHeroBtn1(data.heroBtn1);
          if (data.heroBtn2) setHeroBtn2(data.heroBtn2);
          
          if (data.autoRotateBanner !== undefined) setAutoRotateBanner(data.autoRotateBanner);
          if (data.bannerInterval !== undefined) setBannerInterval(data.bannerInterval);
          if (data.promoActive !== undefined) setPromoActive(data.promoActive);
          if (data.promoText) setPromoText(data.promoText);
          if (data.featuredProductIds && Array.isArray(data.featuredProductIds)) {
            setFeaturedProductIds(data.featuredProductIds);
          }
        }

        // Fetch gallery from storage
        const listRef = ref(storage, "banners");
        const res = await listAll(listRef);
        const urls = await Promise.all(res.items.map((itemRef) => getDownloadURL(itemRef)));
        setGallery(urls);
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    }
    
    async function fetchProductos() {
      try {
        const q = query(collection(db, "productos"), orderBy("fechaCreacion", "desc"));
        const querySnapshot = await getDocs(q);
        const prods: ProductoData[] = [];
        querySnapshot.forEach((doc) => {
          prods.push({ id: doc.id, ...doc.data() } as ProductoData);
        });
        setProductos(prods);
      } catch (error) {
        console.error("Error fetching productos:", error);
      }
    }

    fetchSettings();
    fetchProductos();
  }, []);

  const toggleBannerSelection = (url: string) => {
    setCurrentBanners((prev) => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const toggleProductSelection = (id: string) => {
    setFeaturedProductIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter(pId => pId !== id);
      }
      if (prev.length >= 4) {
        alert("Solo puedes seleccionar un máximo de 4 productos destacados.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      // Auto-upload the file to gallery to improve UX
      setSaving(true);
      try {
        const fileRef = ref(storage, `banners/heroBanner_${Date.now()}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        setGallery(prev => [url, ...prev]);
        setCurrentBanners(prev => [...prev, url]);
        setPreviewUrl(url);
        setBannerFile(null);
      } catch (error) {
        console.error("Error uploading banner:", error);
        alert("Error al subir la imagen.");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to Firestore
      const docRef = doc(db, "settings", "home");
      await setDoc(docRef, { 
        heroBannerUrls: currentBanners,
        autoRotateBanner,
        bannerInterval,
        heroTitle,
        heroSubtitle,
        heroDesc,
        heroBtn1,
        heroBtn2,
        promoActive,
        promoText,
        featuredProductIds
      }, { merge: true });
      alert("¡Ajustes guardados correctamente!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error al guardar los ajustes. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-black selection:bg-blue-500 selection:text-white pb-12 pt-24">
      {/* Header Admin */}
      <div className="bg-white border-b border-gray-200 px-6 py-8 mb-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/admin"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl font-black uppercase tracking-tight text-black">
                Configuración
              </h1>
            </div>
            <p className="text-gray-500 font-medium text-sm tracking-wide ml-12">
              Personaliza el diseño y banners de la tienda.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar Cambios
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wide">Banner Principal (Hero)</h2>
                  <p className="text-sm text-gray-500">Esta imagen se mostrará a pantalla completa en la página de inicio.</p>
                </div>
              </div>

              <div className="space-y-6">
                
                {/* Auto Rotate Controls */}
                <div className="flex flex-col md:flex-row gap-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div 
                      onClick={() => setAutoRotateBanner(!autoRotateBanner)}
                      className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${autoRotateBanner ? 'bg-blue-500' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-[2px] left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-transform ${autoRotateBanner ? 'translate-x-full border-white' : ''}`}></div>
                    </div>
                    <div>
                      <label onClick={() => setAutoRotateBanner(!autoRotateBanner)} className="text-sm font-bold uppercase tracking-widest text-black cursor-pointer select-none block">
                        Rotación Automática
                      </label>
                      <span className="text-xs text-gray-500">Alternar imágenes seleccionadas</span>
                    </div>
                  </div>

                  {autoRotateBanner && (
                    <div className="flex items-center gap-3 md:ml-auto">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Cada</label>
                      <input 
                        type="number" 
                        value={bannerInterval} 
                        onChange={(e) => setBannerInterval(Number(e.target.value))}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-bold focus:border-black focus:ring-1 focus:ring-black outline-none"
                        min="2"
                        max="60"
                      />
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Segundos</label>
                    </div>
                  )}
                </div>

                {/* Upload New Banner Button */}
                <div className="flex justify-start">
                  <label className="cursor-pointer bg-white border border-gray-300 text-black px-6 py-3 rounded-lg font-bold uppercase tracking-wide hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm shadow-sm">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                    Subir Nueva Imagen
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={saving}
                    />
                  </label>
                </div>

                {/* Gallery Selection */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Galería de Imágenes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {gallery.map((url, i) => {
                      const isSelected = currentBanners.includes(url);
                      return (
                        <div 
                          key={i} 
                          onClick={() => toggleBannerSelection(url)}
                          className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                            isSelected ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-md' : 'border-transparent hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <img src={url} alt={`Banner ${i}`} className="w-full h-full object-cover" />
                          <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-blue-500/10' : 'bg-black/20 hover:bg-black/10'}`} />
                          
                          {/* Selected Check Indicator */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          
                          {/* Order Number if Auto-Rotate is active and selected */}
                          {isSelected && autoRotateBanner && (
                            <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md">
                              Marco {currentBanners.indexOf(url) + 1}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Info Note */}
                <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl flex gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <h4 className="font-bold text-orange-800 text-sm mb-1 uppercase tracking-wider">Consejo Pro</h4>
                    <p className="text-sm text-orange-700/80">
                      Usa imágenes horizontales de alta calidad con colores oscuros o saturados, 
                      ya que los textos blancos se superpondrán sobre estas imágenes. Puedes seleccionar varias para que roten solas.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* SECCIÓN TEXTOS DEL BANNER */}
            <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                <div className="p-3 bg-black text-white rounded-xl">
                  <Type className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wide">Textos del Banner</h2>
                  <p className="text-sm text-gray-500">Personaliza el mensaje principal de tu tienda.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Título Principal</label>
                  <textarea
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all resize-none font-bold"
                  />
                  <p className="text-xs text-gray-400 mt-1">Usa saltos de línea para mejor diseño (Ej: OVERCOME \n EVERYTHING).</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Subtítulo (Corto)</label>
                  <input
                    type="text"
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Descripción</label>
                  <input
                    type="text"
                    value={heroDesc}
                    onChange={(e) => setHeroDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Texto Botón Primario</label>
                  <input
                    type="text"
                    value={heroBtn1}
                    onChange={(e) => setHeroBtn1(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Texto Botón Secundario</label>
                  <input
                    type="text"
                    value={heroBtn2}
                    onChange={(e) => setHeroBtn2(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN BARRA PROMOCIONAL */}
            <div className="p-6 md:p-8 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wide">Barra de Anuncios</h2>
                  <p className="text-sm text-gray-500">Muestra promociones en la parte superior de toda la tienda.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => setPromoActive(!promoActive)}
                    className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${promoActive ? 'bg-orange-500' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-[2px] left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-transform ${promoActive ? 'translate-x-full border-white' : ''}`}></div>
                  </div>
                  <label onClick={() => setPromoActive(!promoActive)} className="text-sm font-bold uppercase tracking-widest text-black cursor-pointer select-none">
                    {promoActive ? "Activada" : "Desactivada"}
                  </label>
                </div>

                {promoActive && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Mensaje del Anuncio</label>
                    <input
                      type="text"
                      value={promoText}
                      onChange={(e) => setPromoText(e.target.value)}
                      placeholder="Ej: 🚚 Envío GRATIS en pedidos superiores a $150.000 COP"
                      className="w-full px-4 py-3 bg-orange-50/30 rounded-lg border border-orange-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all font-medium text-black"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN PRODUCTOS DESTACADOS */}
            <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                <div className="p-3 bg-black text-white rounded-xl">
                  {/* Reuse Package icon or similar, since we didn't import Package we'll use ImageIcon as a fallback visual or Import Package later */}
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wide">Productos Destacados</h2>
                  <p className="text-sm text-gray-500">Selecciona hasta 4 productos para mostrar en la pestaña "Novedades Élite". Seleccionados: {featuredProductIds.length}/4</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-2">
                {productos.map((producto) => {
                  const isSelected = featuredProductIds.includes(producto.id);
                  return (
                    <div 
                      key={producto.id}
                      onClick={() => toggleProductSelection(producto.id)}
                      className={`relative bg-white rounded-xl border-2 p-3 cursor-pointer transition-all ${
                        isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                        <img src={producto.imagen || '/images/b1.jpg'} alt={producto.nombre} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs font-bold uppercase truncate">{producto.nombre}</p>
                      
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
        )}
      </div>
    </main>
  );
}
