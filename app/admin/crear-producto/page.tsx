"use client";

import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useState } from "react";
import { ArrowLeft, UploadCloud } from "lucide-react";
import Link from "next/link";

export default function CrearProducto() {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState(0);
  const [stock, setStock] = useState(0);
  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setIsLoading(true);

    try {
      let imageUrl = "";

      if (imageFile) {
        const imageRef = ref(
          storage,
          `products/${Date.now()}-${imageFile.name}`,
        );
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const res = await fetch("/api/admin/productos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          precio,
          stock,
          categoria,
          descripcion,
          imagen: imageUrl,
          activo: true,
        }),
      });

      if (res.ok) {
        alert("Producto creado exitosamente");
        // Limpiar formulario
        setNombre("");
        setPrecio(0);
        setStock(0);
        setCategoria("");
        setDescripcion("");
        setImageFile(null);
        setPreviewUrl(null);
      } else {
        alert("Error al crear el producto");
      }
    } catch (error) {
      alert("Error al crear el producto");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-black selection:bg-orange-500 selection:text-white py-12 px-6 pt-24">
      <div className="max-w-3xl mx-auto">
        
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Volver al Panel
        </Link>
        
        <h1 className="text-4xl font-black uppercase tracking-tight text-black mb-8">
          Crear <span className="text-orange-500">Suplemento</span>
        </h1>

        <div className="bg-white border border-gray-200 rounded-none p-8 md:p-12 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
                Nombre del producto *
              </label>
              <input
                type="text"
                placeholder="Ej: Whey Protein Isolate 5lbs"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder-gray-400 text-black font-medium"
                required
              />
            </div>

            {/* Precio y Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
                  Precio (ARS) *
                </label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  onChange={(e) => setPrecio(Number(e.target.value))}
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder-gray-400 text-black font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
                  Stock Inicial *
                </label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder-gray-400 text-black font-bold"
                  required
                />
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
                Categoría principal
              </label>
              <input
                type="text"
                placeholder="Ej: Proteínas, Pre-Entrenos, Creatina"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder-gray-400 text-black font-medium"
              />
            </div>

            {/* Configuración de Imagen */}
            <div className="pt-8 border-t border-gray-100">
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">
                Fotografía Oficial
              </label>
              
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-200 border-dashed cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-black transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-600 font-bold uppercase tracking-wide">Subir Archivo Gráfico</p>
                        <p className="text-xs text-gray-400 font-medium">PNG ó JPG (hasta 5MB)</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </div>

                {previewUrl && (
                  <div className="w-full md:w-40 h-40 relative overflow-hidden border border-gray-200 bg-white flex-shrink-0 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-contain p-2 mix-blend-multiply"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Descripción */}
            <div className="pt-8 border-t border-gray-100">
              <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
                Descripción Detallada
              </label>
              <textarea
                placeholder="Tabla nutricional, beneficios, modo de preparación..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={5}
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none placeholder-gray-400 text-black font-medium leading-relaxed"
              />
            </div>

            {/* Botón Guardar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-5 px-8 font-black uppercase tracking-widest hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 group flex justify-center items-center gap-3"
            >
              {isLoading ? (
                "SINCRONIZANDO..."
              ) : (
                <>
                   PUBLICAR EN CATÁLOGO
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
