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
    <main className="min-h-screen bg-neutral-950 text-white selection:bg-orange-500 selection:text-black py-12 px-6 pt-24">
      <div className="max-w-3xl mx-auto">
        
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Volver al Panel
        </Link>
        
        <h1 className="text-3xl font-black text-white mb-8">
          Crear <span className="text-orange-500">Nuevo Suplemento</span>
        </h1>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Nombre del producto *
              </label>
              <input
                type="text"
                placeholder="Ej: Whey Protein Isolate 5lbs"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors placeholder-neutral-600 text-white"
                required
              />
            </div>

            {/* Precio y Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Precio (ARS) *
                </label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  onChange={(e) => setPrecio(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors placeholder-neutral-600 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Stock *
                </label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors placeholder-neutral-600 text-white"
                  required
                />
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Categoría
              </label>
              <input
                type="text"
                placeholder="Ej: Proteínas, Pre-Entrenos, Creatina"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors placeholder-neutral-600 text-white"
              />
            </div>

            {/* Configuración de Imagen */}
            <div className="pt-4 border-t border-neutral-800">
              <label className="block text-sm font-medium text-neutral-300 mb-4">
                Fotografía del Suplemento
              </label>
              
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-neutral-800 border-dashed rounded-xl cursor-pointer bg-neutral-950 hover:bg-neutral-900 hover:border-orange-500/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 text-neutral-500 mb-2" />
                        <p className="mb-2 text-sm text-neutral-400 font-medium">Click para subir foto</p>
                        <p className="text-xs text-neutral-500">PNG, JPG hasta 5MB</p>
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
                  <div className="w-full md:w-32 h-32 relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Descripción */}
            <div className="pt-4 border-t border-neutral-800">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Descripción
              </label>
              <textarea
                placeholder="Ingredientes clave, modo de uso, tabla nutricional..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors resize-vertical placeholder-neutral-600 text-white"
              />
            </div>

            {/* Botón Guardar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 text-black py-4 px-6 rounded-xl font-bold hover:bg-orange-400 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
            >
              {isLoading ? "Subiendo producto a Firestore..." : "Publicar Suplemento"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
