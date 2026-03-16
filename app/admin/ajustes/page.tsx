"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Image as ImageIcon, Save, ArrowLeft, Loader2, UploadCloud, Type, Megaphone } from "lucide-react";
import Link from "next/link";

export default function AjustesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<string>("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Nuevos estados para textos dinámicos
  const [heroTitle, setHeroTitle] = useState<string>("OVERCOME\nEVERYTHING.");
  const [heroSubtitle, setHeroSubtitle] = useState<string>("RENDIMIENTO ÉLITE");
  const [heroDesc, setHeroDesc] = useState<string>("Suplementos diseñados para los que no se rinden. Rompe tus límites hoy.");
  const [heroBtn1, setHeroBtn1] = useState<string>("Comprar Novedades");
  const [heroBtn2, setHeroBtn2] = useState<string>("Ver Catálogo");

  // Barra Promocional
  const [promoActive, setPromoActive] = useState<boolean>(false);
  const [promoText, setPromoText] = useState<string>("🚚 Envío GRATIS en pedidos superiores a $150.000 COP");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, "settings", "home");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.heroBannerUrl) {
            setCurrentBanner(data.heroBannerUrl);
            setPreviewUrl(data.heroBannerUrl);
          }
          if (data.heroTitle) setHeroTitle(data.heroTitle);
          if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle);
          if (data.heroDesc) setHeroDesc(data.heroDesc);
          if (data.heroBtn1) setHeroBtn1(data.heroBtn1);
          if (data.heroBtn2) setHeroBtn2(data.heroBtn2);
          
          if (data.promoActive !== undefined) setPromoActive(data.promoActive);
          if (data.promoText) setPromoText(data.promoText);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalUrl = currentBanner;

      // Upload new image if selected
      if (bannerFile) {
        const fileRef = ref(storage, `banners/heroBanner_${Date.now()}`);
        await uploadBytes(fileRef, bannerFile);
        finalUrl = await getDownloadURL(fileRef);
      }

      // Save to Firestore
      const docRef = doc(db, "settings", "home");
      await setDoc(docRef, { 
        heroBannerUrl: finalUrl,
        heroTitle,
        heroSubtitle,
        heroDesc,
        heroBtn1,
        heroBtn2,
        promoActive,
        promoText
      }, { merge: true });

      setCurrentBanner(finalUrl);
      setBannerFile(null);
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
                {/* Image Preview */}
                <div className="w-full bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 relative overflow-hidden group h-[300px] md:h-[400px] flex flex-col items-center justify-center">
                  {previewUrl ? (
                    <>
                      <img
                        src={previewUrl}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <label className="cursor-pointer bg-white text-black px-6 py-3 rounded-lg font-bold uppercase tracking-wide hover:scale-105 transition-transform flex items-center gap-2">
                          <UploadCloud className="w-5 h-5" />
                          Cambiar Imagen
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-4 p-8 text-gray-500 hover:text-black transition-colors w-full h-full justify-center">
                      <div className="p-4 bg-white rounded-full shadow-sm">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold uppercase tracking-wide mb-1">Subir Imagen</p>
                        <p className="text-sm">PNG, JPG o WEBP (Recomendado: 1920x1080px)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>

                {/* Info Note */}
                <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl flex gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <h4 className="font-bold text-orange-800 text-sm mb-1 uppercase tracking-wider">Consejo Pro</h4>
                    <p className="text-sm text-orange-700/80">
                      Usa imágenes horizontales de alta calidad con colores oscuros o saturados, 
                      ya que los textos blancos se superpondrán sobre esta imagen.
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
                  <div className="relative inline-block w-12 h-6 rounded-full cursor-pointer">
                    <input
                      type="checkbox"
                      id="promoActive"
                      className="sr-only peer"
                      checked={promoActive}
                      onChange={(e) => setPromoActive(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </div>
                  <label htmlFor="promoActive" className="text-sm font-bold uppercase tracking-widest text-black cursor-pointer">
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
          </div>
        )}
      </div>
    </main>
  );
}
