"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Image as ImageIcon, Save, ArrowLeft, Loader2, UploadCloud, Type, Megaphone, Trash2, ChevronLeft, ChevronRight, X, LayoutDashboard, Grid, ShoppingBag, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { ProductoData } from "@/components/shop/ProductCard";

export default function AjustesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("promo");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentBanners, setCurrentBanners] = useState<string[]>([]);
  const [currentMobileBanners, setCurrentMobileBanners] = useState<string[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [galleryMobile, setGalleryMobile] = useState<string[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [autoRotateBanner, setAutoRotateBanner] = useState<boolean>(true);
  const [bannerInterval, setBannerInterval] = useState<number>(5);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Nuevos estados para textos dinámicos
  const [heroTitle, setHeroTitle] = useState<string>("OVERCOME\nEVERYTHING.");
  const [heroSubtitle, setHeroSubtitle] = useState<string>("RENDIMIENTO ÉLITE");
  const [heroDesc, setHeroDesc] = useState<string>("Suplementos diseñados para los que no se rinden. Rompe tus límites hoy.");
  const [heroBtn1, setHeroBtn1] = useState<string>("Comprar Novedades");
  const [heroBtn2, setHeroBtn2] = useState<string>("Ver Catálogo");
  const [heroBtn1Cat, setHeroBtn1Cat] = useState<string>("");
  const [heroBtn2Cat, setHeroBtn2Cat] = useState<string>("");

  // Barra Promocional
  const [promoActive, setPromoActive] = useState<boolean>(false);
  const [promoText, setPromoText] = useState<string>("🚚 Envío GRATIS en pedidos superiores a $150.000 COP");
  // Productos Destacados y Categorías
  const [productos, setProductos] = useState<ProductoData[]>([]);
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState<string>("");
  const [marcas, setMarcas] = useState<string[]>([]);
  const [newMarca, setNewMarca] = useState<string>("");
  const [extraBlocks, setExtraBlocks] = useState<any[]>([]);

  // Redes Sociales
  const [whatsappUrl, setWhatsappUrl] = useState<string>("");
  const [instagramUrl, setInstagramUrl] = useState<string>("");
  const [tiktokUrl, setTiktokUrl] = useState<string>("");
  const [facebookUrl, setFacebookUrl] = useState<string>("");

  // Enlaces del Footer
  const [faqUrl, setFaqUrl] = useState<string>("");
  const [enviosUrl, setEnviosUrl] = useState<string>("");
  const [contactoUrl, setContactoUrl] = useState<string>("");

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
          if (data.heroMobileBannersUrls && Array.isArray(data.heroMobileBannersUrls)) {
            setCurrentMobileBanners(data.heroMobileBannersUrls);
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
          if (data.promoActive !== undefined) setPromoActive(data.promoActive);
          if (data.promoText) setPromoText(data.promoText);
          if (data.featuredProductIds && Array.isArray(data.featuredProductIds)) {
            setFeaturedProductIds(data.featuredProductIds);
          } else {
            setFeaturedProductIds([]);
          }
          if (data.categorias && Array.isArray(data.categorias)) {
            setCategorias(data.categorias);
          } else {
            setCategorias(["Proteínas", "Pre-Entrenos", "Creatina", "Vitaminas"]);
          }
          if (data.marcas && Array.isArray(data.marcas)) {
            setMarcas(data.marcas);
          } else {
            setMarcas(["Optimum Nutrition", "Dymatize", "MuscleTech", "BSN", "Cellucor"]);
          }
          if (data.extraBlocks && Array.isArray(data.extraBlocks)) {
            setExtraBlocks(data.extraBlocks);
          } else {
            setExtraBlocks([]);
          }
          if (data.whatsappUrl) setWhatsappUrl(data.whatsappUrl);
          if (data.instagramUrl) setInstagramUrl(data.instagramUrl);
          if (data.tiktokUrl) setTiktokUrl(data.tiktokUrl);
          if (data.facebookUrl) setFacebookUrl(data.facebookUrl);
          if (data.faqUrl) setFaqUrl(data.faqUrl);
          if (data.enviosUrl) setEnviosUrl(data.enviosUrl);
          if (data.contactoUrl) setContactoUrl(data.contactoUrl);
        } else {
          setCategorias(["Proteínas", "Pre-Entrenos", "Creatina", "Vitaminas"]);
          setMarcas(["Optimum Nutrition", "Dymatize", "MuscleTech", "BSN", "Cellucor"]);
          setExtraBlocks([]);
        }

        // Fetch galleries from storage
        const listRef = ref(storage, "banners");
        const res = await listAll(listRef);
        const urls = await Promise.all(res.items.map((itemRef) => getDownloadURL(itemRef)));
        setGallery(urls);

        const listRefMobile = ref(storage, "banners_movil");
        const resMobile = await listAll(listRefMobile);
        const urlsMobile = await Promise.all(resMobile.items.map((itemRef) => getDownloadURL(itemRef)));
        setGalleryMobile(urlsMobile);
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchProductos() {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
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

  // Protección contra cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const toggleBannerSelection = (url: string) => {
    setHasChanges(true);
    setCurrentBanners((prev) =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const toggleMobileBannerSelection = (url: string) => {
    setHasChanges(true);
    setCurrentMobileBanners((prev) =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleDeleteImage = async (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que deseas eliminar esta imagen de forma permanente?")) return;
    setSaving(true);
    try {
      const imageRef = ref(storage, url);
      await deleteObject(imageRef);
      setGallery(prev => prev.filter(u => u !== url));
      setGalleryMobile(prev => prev.filter(u => u !== url));
      setCurrentBanners(prev => prev.filter(u => u !== url));
      setCurrentMobileBanners(prev => prev.filter(u => u !== url));
      setHasChanges(true);
    } catch (error) {
      console.error("Error al eliminar la imagen:", error);
      alert("Error al eliminar la imagen. Puede que ya se haya borrado.");
    } finally {
      setSaving(false);
    }
  };

  const moveBanner = (url: string, direction: 'left' | 'right', isMobile: boolean) => {
    setHasChanges(true);
    const setState = isMobile ? setCurrentMobileBanners : setCurrentBanners;
    setState(prev => {
      const arr = [...prev];
      const index = arr.indexOf(url);
      if (index === -1) return prev;
      
      const newIndex = direction === 'left' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= arr.length) return prev;
      
      // Swap elements
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  };

  const toggleProductSelection = (id: string) => {
    setHasChanges(true);
    setFeaturedProductIds((prev) => {
      const currentIds = Array.isArray(prev) ? prev : [];
      if (currentIds.includes(id)) {
        return currentIds.filter(pId => pId !== id);
      }
      if (currentIds.length >= 4) {
        alert("Solo puedes seleccionar un máximo de 4 productos destacados.");
        return currentIds;
      }
      return [...currentIds, id];
    });
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (categorias.includes(newCategory.trim())) {
      alert("La categoría ya existe.");
      return;
    }
    setHasChanges(true);
    setCategorias([...categorias, newCategory.trim()]);
    setNewCategory("");
  };

  const removeCategory = (cat: string) => {
    setHasChanges(true);
    setCategorias(categorias.filter((c) => c !== cat));
  };

  const handleAddMarca = () => {
    if (!newMarca.trim()) return;
    if (marcas.includes(newMarca.trim())) {
      alert("La marca ya existe.");
      return;
    }
    setHasChanges(true);
    setMarcas([...marcas, newMarca.trim()]);
    setNewMarca("");
  };

  const removeMarca = (marca: string) => {
    setHasChanges(true);
    setMarcas(marcas.filter((m) => m !== marca));
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

  const handleMobileFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSaving(true);
      try {
        const fileRef = ref(storage, `banners_movil/heroMobileBanner_${Date.now()}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        setGalleryMobile(prev => [url, ...prev]);
        setCurrentMobileBanners(prev => [...prev, url]);
        setHasChanges(true);
      } catch (error) {
        console.error("Error uploading mobile banner:", error);
        alert("Error al subir la imagen móvil.");
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
        heroMobileBannersUrls: currentMobileBanners,
        autoRotateBanner,
        bannerInterval,
        heroTitle,
        heroSubtitle,
        heroDesc,
        heroBtn1,
        heroBtn2,
        heroBtn1Cat,
        heroBtn2Cat,
        promoActive,
        promoText,
        featuredProductIds,
        categorias,
        marcas,
        extraBlocks,
        whatsappUrl,
        instagramUrl,
        tiktokUrl,
        facebookUrl,
        faqUrl,
        enviosUrl,
        contactoUrl
      }, { merge: true });
      alert("¡Ajustes guardados correctamente!");
      setHasChanges(false);
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
          <>
            {/* Tab Navigation */}
            <div className="flex overflow-x-auto gap-2 mb-6 scrollbar-hide pb-2">
              {[
                { id: 'promo', label: 'Barra Promocional', icon: <Megaphone className="w-4 h-4" /> },
                { id: 'hero', label: 'Banner & Destacados', icon: <ImageIcon className="w-4 h-4" /> },
                { id: 'extra', label: 'Bloques Adicionales', icon: <LayoutDashboard className="w-4 h-4" /> },
                { id: 'catalog', label: 'Categorías y Marcas', icon: <ShoppingBag className="w-4 h-4" /> },
                { id: 'social', label: 'Redes Sociales', icon: <LinkIcon className="w-4 h-4" /> },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap shadow-sm border ${
                    activeTab === t.id 
                    ? 'bg-black text-white border-black shadow-md' 
                    : 'bg-white border-gray-200 text-gray-500 hover:text-black hover:border-black hover:bg-gray-50'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              
              {/* TAB SOCIAL */}
              {activeTab === 'social' && (
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                      <LinkIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold uppercase tracking-wide">Redes Sociales</h2>
                      <p className="text-sm text-gray-500">Configura los enlaces para el Footer y botón de WhatsApp.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">WhatsApp</label>
                      <input
                        type="url"
                        value={whatsappUrl}
                        onChange={(e) => { setWhatsappUrl(e.target.value); setHasChanges(true); }}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                        placeholder="https://wa.me/..."
                      />
                      <p className="text-xs text-gray-400 mt-1">Ej: https://wa.me/573001234567</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Instagram</label>
                      <input
                        type="url"
                        value={instagramUrl}
                        onChange={(e) => { setInstagramUrl(e.target.value); setHasChanges(true); }}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">TikTok</label>
                      <input
                        type="url"
                        value={tiktokUrl}
                        onChange={(e) => { setTiktokUrl(e.target.value); setHasChanges(true); }}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                        placeholder="https://tiktok.com/@..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Facebook</label>
                      <input
                        type="url"
                        value={facebookUrl}
                        onChange={(e) => { setFacebookUrl(e.target.value); setHasChanges(true); }}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-10 mb-6 pb-6 border-b border-gray-100">
                    <div className="p-3 bg-gray-100 text-gray-600 rounded-xl">
                      <LinkIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold uppercase tracking-wide">Enlaces de Ayuda</h2>
                      <p className="text-sm text-gray-500">Configura hacia dónde redirigen los links del footer.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">FAQ (Preguntas Frecuentes)</label>
                      <input
                        type="url"
                        value={faqUrl}
                        onChange={(e) => { setFaqUrl(e.target.value); setHasChanges(true); }}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                        placeholder="/faq o https://wa.me/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Envíos y Devoluciones</label>
                      <input
                        type="url"
                        value={enviosUrl}
                        onChange={(e) => { setEnviosUrl(e.target.value); setHasChanges(true); }}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                        placeholder="/envios o https://wa.me/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Contacto</label>
                      <input
                        type="url"
                        value={contactoUrl}
                        onChange={(e) => { setContactoUrl(e.target.value); setHasChanges(true); }}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                        placeholder="/contacto o https://wa.me/..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB HERO */}
              {activeTab === 'hero' && (
                <>
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
                      onClick={() => { setAutoRotateBanner(!autoRotateBanner); setHasChanges(true); }}
                      className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${autoRotateBanner ? 'bg-blue-500' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-[2px] left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-transform ${autoRotateBanner ? 'translate-x-full border-white' : ''}`}></div>
                    </div>
                    <div>
                      <label onClick={() => { setAutoRotateBanner(!autoRotateBanner); setHasChanges(true); }} className="text-sm font-bold uppercase tracking-widest text-black cursor-pointer select-none block">
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
                        onChange={(e) => { setBannerInterval(Number(e.target.value)); setHasChanges(true); }}
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
                    Subir Imagen Desktop
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={saving}
                    />
                  </label>
                </div>

                {/* Gallery Selection Desktop */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Galería de Imágenes (Desktop)</h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x pr-8">
                    {gallery.map((url, i) => {
                      const isSelected = currentBanners.includes(url);
                      return (
                        <div
                          key={i}
                          onClick={() => toggleBannerSelection(url)}
                          className={`group relative w-[260px] md:w-[300px] shrink-0 snap-start aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-md' : 'border-transparent hover:border-gray-300 hover:shadow-sm'
                            }`}
                        >
                          <img src={url} alt={`Banner ${i}`} className="w-full h-full object-cover" />
                          <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-blue-500/10' : 'bg-black/20 group-hover:bg-black/10'}`} />

                          {/* Delete Button */}
                          <button
                            onClick={(e) => handleDeleteImage(url, e)}
                            className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10 shadow-md opacity-0 group-hover:opacity-100"
                            title="Eliminar permanente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

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
                            <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md pointer-events-none">
                              Marco {currentBanners.indexOf(url) + 1}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Banners Ordering */}
                  {currentBanners.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-blue-800 mb-3">Orden de Visualización</h4>
                      <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                        {currentBanners.map((url, i) => (
                           <div key={url} className="relative w-32 md:w-40 shrink-0 snap-start aspect-video rounded-lg overflow-hidden border border-blue-200 shadow-sm group">
                             <img src={url} className="w-full h-full object-cover" />
                             <button
                               onClick={(e) => { e.stopPropagation(); toggleBannerSelection(url); }}
                               className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full z-10 transition-all opacity-0 group-hover:opacity-100 shadow-md"
                               title="Quitar de visualización"
                             >
                               <X className="w-3 h-3" />
                             </button>
                             <div className="absolute inset-0 bg-black/40 flex items-center justify-between px-2">
                               <button onClick={(e) => { e.stopPropagation(); moveBanner(url, 'left', false); }} className="p-1 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed" disabled={i === 0}>
                                 <ChevronLeft className="w-5 h-5" />
                               </button>
                               <span className="text-white text-xs font-bold drop-shadow-md">{i + 1}</span>
                               <button onClick={(e) => { e.stopPropagation(); moveBanner(url, 'right', false); }} className="p-1 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed" disabled={i === currentBanners.length - 1}>
                                 <ChevronRight className="w-5 h-5" />
                               </button>
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Gallery Selection Mobile */}
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Galería de Imágenes (Móvil)</h3>
                      <p className="text-xs text-gray-500">Selecciona las imágenes que se mostrarán en la versión de teléfono (Formato vertical 9:16).</p>
                    </div>
                    
                    <label className="shrink-0 cursor-pointer bg-white border border-gray-300 text-black px-4 py-2 rounded-lg font-bold uppercase tracking-wide hover:bg-gray-50 transition-colors flex items-center gap-2 text-xs shadow-sm">
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                      Subir Imagen Móvil
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleMobileFileChange}
                        disabled={saving}
                      />
                    </label>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x pr-8">
                    {galleryMobile.map((url, i) => {
                      const isSelected = currentMobileBanners.includes(url);
                      return (
                        <div
                          key={`mob-${i}`}
                          onClick={() => toggleMobileBannerSelection(url)}
                          className={`group relative w-[140px] md:w-[160px] shrink-0 snap-start aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${isSelected ? 'border-orange-500 ring-2 ring-orange-500/50 shadow-md' : 'border-transparent hover:border-gray-300 hover:shadow-sm'
                            }`}
                        >
                          <img src={url} alt={`Banner Mobile ${i}`} className="w-full h-full object-cover" />
                          <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-orange-500/10' : 'bg-black/20 group-hover:bg-black/10'}`} />

                          {/* Delete Button */}
                          <button
                            onClick={(e) => handleDeleteImage(url, e)}
                            className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10 shadow-md opacity-0 group-hover:opacity-100"
                            title="Eliminar permanente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Selected Check Indicator */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}

                          {/* Order Number if Auto-Rotate is active and selected */}
                          {isSelected && autoRotateBanner && (
                            <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md pointer-events-none">
                              Marco {currentMobileBanners.indexOf(url) + 1}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile Banners Ordering */}
                  {currentMobileBanners.length > 0 && (
                    <div className="mt-4 p-4 bg-orange-50/50 border border-orange-100 rounded-xl">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-orange-800 mb-3">Orden de Visualización Móvil</h4>
                      <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                        {currentMobileBanners.map((url, i) => (
                           <div key={`ord-${url}`} className="relative w-24 md:w-28 shrink-0 snap-start aspect-[3/4] rounded-lg overflow-hidden border border-orange-200 shadow-sm group">
                             <img src={url} className="w-full h-full object-cover" />
                             <button
                               onClick={(e) => { e.stopPropagation(); toggleMobileBannerSelection(url); }}
                               className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full z-10 transition-all opacity-0 group-hover:opacity-100 shadow-md"
                               title="Quitar de visualización"
                             >
                               <X className="w-3 h-3" />
                             </button>
                             <div className="absolute inset-x-0 bottom-0 py-2 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between px-2 h-1/2">
                               <button onClick={(e) => { e.stopPropagation(); moveBanner(url, 'left', true); }} className="p-1.5 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed" disabled={i === 0}>
                                 <ChevronLeft className="w-4 h-4" />
                               </button>
                               <span className="text-white text-xs font-bold drop-shadow-md mb-1">{i + 1}</span>
                               <button onClick={(e) => { e.stopPropagation(); moveBanner(url, 'right', true); }} className="p-1.5 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed" disabled={i === currentMobileBanners.length - 1}>
                                 <ChevronRight className="w-4 h-4" />
                               </button>
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                    onChange={(e) => { setHeroTitle(e.target.value); setHasChanges(true); }}
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
                    onChange={(e) => { setHeroSubtitle(e.target.value); setHasChanges(true); }}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Descripción</label>
                  <input
                    type="text"
                    value={heroDesc}
                    onChange={(e) => { setHeroDesc(e.target.value); setHasChanges(true); }}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Botón Primario</label>
                  <input
                    type="text"
                    value={heroBtn1}
                    onChange={(e) => { setHeroBtn1(e.target.value); setHasChanges(true); }}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium mb-3"
                    placeholder="Texto del botón"
                  />
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Categoría destino</label>
                  <select
                    value={heroBtn1Cat}
                    onChange={(e) => { setHeroBtn1Cat(e.target.value); setHasChanges(true); }}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-sm"
                  >
                    <option value="">Todas (sin filtro)</option>
                    {categorias.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Botón Secundario</label>
                  <input
                    type="text"
                    value={heroBtn2}
                    onChange={(e) => { setHeroBtn2(e.target.value); setHasChanges(true); }}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium mb-3"
                    placeholder="Texto del botón"
                  />
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Categoría destino</label>
                  <select
                    value={heroBtn2Cat}
                    onChange={(e) => { setHeroBtn2Cat(e.target.value); setHasChanges(true); }}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-sm"
                  >
                    <option value="">Todas (sin filtro)</option>
                    {categorias.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECCIÓN PRODUCTOS DESTACADOS (Movido aquí a petición del usuario) */}
            <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                <div className="p-3 bg-black text-white rounded-xl">
                  {/* Reuse Package icon or similar */}
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
                      className={`relative bg-white rounded-xl border-2 p-3 cursor-pointer transition-all ${isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
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

            </>
            )}

            {/* TAB PROMO */}
            {activeTab === 'promo' && (
            <div className="p-6 md:p-8">
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
                    onClick={() => { setPromoActive(!promoActive); setHasChanges(true); }}
                    className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${promoActive ? 'bg-orange-500' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-[2px] left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-transform ${promoActive ? 'translate-x-full border-white' : ''}`}></div>
                  </div>
                  <label onClick={() => { setPromoActive(!promoActive); setHasChanges(true); }} className="text-sm font-bold uppercase tracking-widest text-black cursor-pointer select-none">
                    {promoActive ? "Activada" : "Desactivada"}
                  </label>
                </div>

                {promoActive && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Mensaje del Anuncio</label>
                    <input
                      type="text"
                      value={promoText}
                      onChange={(e) => { setPromoText(e.target.value); setHasChanges(true); }}
                      placeholder="Ej: 🚚 Envío GRATIS en pedidos superiores a $150.000 COP"
                      className="w-full px-4 py-3 bg-orange-50/30 rounded-lg border border-orange-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all font-medium text-black"
                    />
                  </div>
                )}
              </div>
            </div>
            )}

            {/* TAB CATALOG */}
            {activeTab === 'catalog' && (
            <>
            {/* SECCIÓN CATEGORÍAS Y MARCAS */}
            <div className="p-6 md:p-8 bg-white">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <Type className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wide">Categorías de la Tienda</h2>
                  <p className="text-sm text-gray-500">Administra las colecciones donde agruparás tus productos al crearlos.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                {categorias.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
                    <span className="text-sm font-bold uppercase tracking-wider text-black">{cat}</span>
                    <button
                      onClick={() => removeCategory(cat)}
                      className="text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-0.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 max-w-sm">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nueva categoría..."
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:border-black focus:ring-1 focus:ring-black outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <button
                  onClick={handleAddCategory}
                  className="bg-black text-white px-6 py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors whitespace-nowrap"
                >
                  Agregar
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Grid className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wide">Marcas de la Tienda</h2>
                  <p className="text-sm text-gray-500">Administra las marcas de los suplementos para filtrarlos mejor.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                {marcas.map((marca, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                    <span className="text-sm font-bold uppercase tracking-wider text-black">{marca}</span>
                    <button
                      onClick={() => removeMarca(marca)}
                      className="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 rounded-full p-0.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 max-w-sm">
                <input
                  type="text"
                  value={newMarca}
                  onChange={(e) => setNewMarca(e.target.value)}
                  placeholder="Nueva marca..."
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium focus:border-black focus:ring-1 focus:ring-black outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMarca()}
                />
                <button
                  onClick={handleAddMarca}
                  className="bg-black text-white px-6 py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors whitespace-nowrap"
                >
                  Agregar
                </button>
              </div>
            </div>
            </>
            )}

            {/* TAB EXTRA BLOCKS */}
            {activeTab === 'extra' && (
            <div className="p-6 md:p-8 bg-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-6 border-b border-gray-100 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-wide">Bloques Adicionales</h2>
                    <p className="text-sm text-gray-500">Agrega más banners o listas de productos debajo de novedades.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    setHasChanges(true);
                    setExtraBlocks([...extraBlocks, { id: Date.now().toString(), type: 'banner', desktopImage: '', mobileImage: '', link: '' }]);
                  }} className="bg-gray-100 hover:bg-gray-200 text-black px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors shadow-sm">
                    + Banner Extra
                  </button>
                  <button onClick={() => {
                    setHasChanges(true);
                    setExtraBlocks([...extraBlocks, { id: Date.now().toString(), type: 'products', title: 'NUEVA COLECCIÓN', category: '', productIds: [] }]);
                  }} className="bg-gray-100 hover:bg-gray-200 text-black px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors shadow-sm">
                    + Productos Extra
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {extraBlocks.map((block, index) => (
                  <div key={block.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 relative shadow-sm">
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button onClick={() => {
                        if (index === 0) return;
                        const newBlocks = [...extraBlocks];
                        [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
                        setExtraBlocks(newBlocks);
                        setHasChanges(true);
                      }} className="p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-50" disabled={index === 0}>
                        <ChevronLeft className="w-4 h-4 rotate-90" />
                      </button>
                      <button onClick={() => {
                        if (index === extraBlocks.length - 1) return;
                        const newBlocks = [...extraBlocks];
                        [newBlocks[index + 1], newBlocks[index]] = [newBlocks[index], newBlocks[index + 1]];
                        setExtraBlocks(newBlocks);
                        setHasChanges(true);
                      }} className="p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-50" disabled={index === extraBlocks.length - 1}>
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </button>
                      <button onClick={() => {
                        if(confirm('¿Seguro quieres borrar este bloque?')) {
                          setExtraBlocks(extraBlocks.filter(b => b.id !== block.id));
                          setHasChanges(true);
                        }
                      }} className="p-1.5 bg-red-50 text-red-500 border border-red-100 rounded hover:bg-red-100 ml-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-bold text-sm uppercase tracking-widest mb-4">
                      {block.type === 'banner' ? `Bloque ${index + 1}: Banner Promocional` : `Bloque ${index + 1}: Carrusel de Productos`}
                    </h3>

                    {block.type === 'banner' ? (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Seleccionar Imagen Desktop (Galería 'banners')</label>
                          <div className="flex gap-3 overflow-x-auto pb-2 snap-x items-center">
                            {gallery.length === 0 && <span className="text-xs text-gray-400">No hay imágenes en la galería.</span>}
                            {gallery.map(url => (
                              <div
                                key={`extra-desk-${url}`}
                                onClick={() => {
                                  const newBlocks = [...extraBlocks];
                                  newBlocks[index].desktopImage = url;
                                  setExtraBlocks(newBlocks);
                                  setHasChanges(true);
                                }}
                                className={`relative w-24 md:w-32 aspect-video shrink-0 snap-start rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${block.desktopImage === url ? 'border-blue-500 shadow-md ring-2 ring-blue-500/50' : 'border-gray-200 hover:border-gray-300'}`}
                              >
                                <img src={url} className="w-full h-full object-cover" alt="Desktop option" />
                                {block.desktopImage === url && (
                                  <div className="absolute top-1 right-1 bg-blue-500 text-white p-0.5 rounded-full shadow-md">
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Seleccionar Imagen Móvil (Galería 'banners_movil')</label>
                          <div className="flex gap-3 overflow-x-auto pb-2 snap-x items-center">
                            {galleryMobile.length === 0 && <span className="text-xs text-gray-400">No hay imágenes en la galería móvil.</span>}
                            {galleryMobile.map(url => (
                              <div
                                key={`extra-mob-${url}`}
                                onClick={() => {
                                  const newBlocks = [...extraBlocks];
                                  newBlocks[index].mobileImage = url;
                                  setExtraBlocks(newBlocks);
                                  setHasChanges(true);
                                }}
                                className={`relative w-16 md:w-20 aspect-[3/4] shrink-0 snap-start rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${block.mobileImage === url ? 'border-orange-500 shadow-md ring-2 ring-orange-500/50' : 'border-gray-200 hover:border-gray-300'}`}
                              >
                                <img src={url} className="w-full h-full object-cover" alt="Mobile option" />
                                {block.mobileImage === url && (
                                  <div className="absolute top-1 right-1 bg-orange-500 text-white p-0.5 rounded-full shadow-md">
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Título del Banner (Opcional)</label>
                          <input type="text" value={block.title || ''} onChange={(e) => {
                            const newBlocks = [...extraBlocks];
                            newBlocks[index].title = e.target.value;
                            setExtraBlocks(newBlocks);
                            setHasChanges(true);
                          }} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-bold uppercase focus:border-black focus:outline-none" placeholder="EJ: NEW COLLECTION" />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Subtítulo (Opcional)</label>
                          <input type="text" value={block.subtitle || ''} onChange={(e) => {
                            const newBlocks = [...extraBlocks];
                            newBlocks[index].subtitle = e.target.value;
                            setExtraBlocks(newBlocks);
                            setHasChanges(true);
                          }} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-black focus:outline-none" placeholder="Descripción corta" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Texto del Botón</label>
                            <input type="text" value={block.buttonText || ''} onChange={(e) => {
                              const newBlocks = [...extraBlocks];
                              newBlocks[index].buttonText = e.target.value;
                              setExtraBlocks(newBlocks);
                              setHasChanges(true);
                            }} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-bold focus:border-black focus:outline-none" placeholder="Ver Todo" />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Categoría al dar clic (Opcional)</label>
                            <select value={block.category || ''} onChange={(e) => {
                              const newBlocks = [...extraBlocks];
                              newBlocks[index].category = e.target.value;
                              if (e.target.value) {
                                newBlocks[index].link = `/productos?cat=${encodeURIComponent(e.target.value)}`;
                              } else {
                                newBlocks[index].link = '';
                              }
                              setExtraBlocks(newBlocks);
                              setHasChanges(true);
                            }} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white outline-none focus:border-black">
                              <option value="">Ninguna</option>
                              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Título de la Sección</label>
                            <input type="text" value={block.title || ''} onChange={(e) => {
                              const newBlocks = [...extraBlocks];
                              newBlocks[index].title = e.target.value;
                              setExtraBlocks(newBlocks);
                              setHasChanges(true);
                            }} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-bold uppercase" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Categoría enlace "Ver Todo" (Opcional)</label>
                            <select value={block.category || ''} onChange={(e) => {
                              const newBlocks = [...extraBlocks];
                              newBlocks[index].category = e.target.value;
                              setExtraBlocks(newBlocks);
                              setHasChanges(true);
                            }} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white font-medium">
                              <option value="">Ninguna</option>
                              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Selecciona hasta 4 productos destacados</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 max-h-[250px] overflow-y-auto p-3 border border-gray-200 rounded-lg bg-white">
                            {productos.map((producto) => {
                              const isSelected = (block.productIds || []).includes(producto.id);
                              return (
                                <div
                                  key={producto.id}
                                  onClick={() => {
                                    const newBlocks = [...extraBlocks];
                                    const currentIds = newBlocks[index].productIds || [];
                                    if (currentIds.includes(producto.id)) {
                                      newBlocks[index].productIds = currentIds.filter((id: string) => id !== producto.id);
                                    } else {
                                      if (currentIds.length >= 4) { alert("Máximo 4 productos por bloque"); return; }
                                      newBlocks[index].productIds = [...currentIds, producto.id];
                                    }
                                    setExtraBlocks(newBlocks);
                                    setHasChanges(true);
                                  }}
                                  className={`relative rounded-lg border-2 p-1.5 cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-100 hover:border-gray-300'}`}
                                >
                                  <div className="aspect-square bg-gray-100 rounded overflow-hidden mb-1">
                                    <img src={producto.imagen || '/images/b1.jpg'} alt={producto.nombre} className="w-full h-full object-cover" />
                                  </div>
                                  <p className="text-[10px] font-bold uppercase truncate text-black">{producto.nombre}</p>
                                  {isSelected && (
                                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
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
                ))}
                
                {extraBlocks.length === 0 && (
                  <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      No has añadido bloques extra.
                    </p>
                    <p className="text-xs text-gray-400">
                      Usa los botones superiores para agregar banners o más colecciones a tu página principal.
                    </p>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
          </>
        )}
      </div>

      {/* Barra de Guardado Flotante (Sticky Footer) */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="max-w-4xl mx-auto px-6 pb-6">
            <div className="bg-black/90 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <p className="text-xs md:text-sm font-bold uppercase tracking-widest">Tienes cambios sin guardar</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (confirm("¿Estás seguro de que deseas descartar todos los cambios?")) {
                      window.location.reload();
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
                >
                  Descartar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? "Guardando..." : "Guardar Ahora"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
