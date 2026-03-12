"use client";

import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useState } from "react";
import { ArrowLeft, UploadCloud, Plus, X } from "lucide-react";
import Link from "next/link";
import { Variante } from "@/components/ProductCard";

export default function CrearProducto() {
  const [nombre, setNombre] = useState("");
  // Default base price and stock
  const [precioBase, setPrecioBase] = useState(0);
  const [stockBase, setStockBase] = useState(0);
  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Variantes State
  const [variantes, setVariantes] = useState<Variante[]>([]);
  
  // Temporary state for the new variant form
  const [newVarNombre, setNewVarNombre] = useState("");
  const [newVarPrecio, setNewVarPrecio] = useState(0);
  const [newVarStock, setNewVarStock] = useState(0);

  const handleAddVariante = () => {
    if (!newVarNombre.trim()) {
      alert("El nombre de la variante es obligatorio.");
      return;
    }
    const nuevaVariante: Variante = {
      id: Date.now().toString(),
      nombre: newVarNombre.trim(),
      precio: newVarPrecio,
      stock: newVarStock
    };
    setVariantes([...variantes, nuevaVariante]);
    // Reset inputs
    setNewVarNombre("");
    setNewVarPrecio(0);
    setNewVarStock(0);
  };

  const removeVariante = (id: string) => {
    setVariantes(variantes.filter(v => v.id !== id));
  };

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

      // Automatically default main price/stock to zero if variants exist 
      // but if we want to show a 'Starts from' price, we can maintain the base.
      const res = await fetch("/api/admin/productos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          precio: precioBase,
          stock: stockBase,
          categoria,
          descripcion,
          imagen: imageUrl,
          activo: true,
          variantes: variantes.length > 0 ? variantes : []
        }),
      });

      if (res.ok) {
        alert("Producto creado exitosamente");
        // Limpiar formulario
        setNombre("");
        setPrecioBase(0);
        setStockBase(0);
        setCategoria("");
        setDescripcion("");
        setVariantes([]);
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
    <main className="min-h-screen bg-gray-50 text-black selection:bg-black selection:text-white py-12 px-6 pt-24">
      <div className="max-w-4xl mx-auto">
        
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Volver al Panel
        </Link>
        
        <h1 className="text-4xl font-black uppercase tracking-tight text-black mb-8">
          Añadir Nuevo <span className="text-orange-500">Producto</span>
        </h1>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
            {/* 1. Información Básica */}
            <div className="space-y-6">
              <h2 className="text-xl font-black uppercase tracking-tight border-b border-gray-100 pb-2">1. Info General</h2>
              
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
                  Nombre del producto *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Whey Protein Isolate"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder-gray-400 text-black font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
                  Categoría
                </label>
                <input
                  type="text"
                  placeholder="Ej: Proteínas, Pre-Entrenos, Indumentaria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder-gray-400 text-black font-medium"
                />
              </div>
            </div>

            {/* 2. Precio y Stock Base (Útil si NO hay variantes) */}
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-gray-100 pb-2">
                <h2 className="text-xl font-black uppercase tracking-tight">2. Base (Sin Variantes)</h2>
                <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">Aplica si el producto es Único</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
                    Precio Base (ARS) *
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={precioBase}
                    onChange={(e) => setPrecioBase(Number(e.target.value))}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder-gray-400 text-black font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
                    Stock Principal *
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={stockBase}
                    onChange={(e) => setStockBase(Number(e.target.value))}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder-gray-400 text-black font-bold"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 3. Variantes (Sabores / Tamaños) */}
            <div className="space-y-6 bg-gray-50 p-6 md:p-8 rounded-xl border border-gray-200">
              <div className="border-b border-gray-200 pb-2 mb-6">
                <h2 className="text-xl font-black uppercase tracking-tight">3. Gestor de Variantes</h2>
                <p className="text-sm text-gray-500 mt-1">Añade Sabores o Tamaños. Si agregas variantes, estas dominarán el precio y peso en la página final.</p>
              </div>

              {/* Lista de Variantes Agregadas */}
              {variantes.length > 0 && (
                <div className="space-y-3 mb-8">
                  {variantes.map((v) => (
                    <div key={v.id} className="flex justify-between items-center bg-white p-4 border border-gray-200 shadow-sm rounded-lg">
                      <div>
                        <p className="font-bold text-black uppercase tracking-wider text-sm">{v.nombre}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">Precio: ${v.precio.toLocaleString("es-AR")} | Stock: {v.stock}</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeVariante(v.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario de Nueva Variante */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Nombre (Ej: Sabor Vainilla 5Lb)
                  </label>
                  <input
                    type="text"
                    value={newVarNombre}
                    onChange={(e) => setNewVarNombre(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Precio</label>
                  <input
                    type="number"
                    min="0"
                    value={newVarPrecio}
                    onChange={(e) => setNewVarPrecio(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newVarStock}
                    onChange={(e) => setNewVarStock(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <button 
                    type="button"
                    onClick={handleAddVariante}
                    className="w-full bg-black text-white py-3 font-bold uppercase tracking-widest hover:bg-orange-500 transition-colors flex items-center justify-center gap-1 text-xs h-[46px]"
                  >
                    <Plus className="w-4 h-4" /> Añadir
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Medios y Descripción */}
            <div className="space-y-6">
              <h2 className="text-xl font-black uppercase tracking-tight border-b border-gray-100 pb-2">4. Medios Visuales</h2>
              
              <div>
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
                    <div className="w-full md:w-40 h-40 relative overflow-hidden border border-gray-200 bg-white flex-shrink-0 flex items-center justify-center rounded-lg shadow-sm">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-contain p-2 mix-blend-multiply"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6">
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
            </div>

            {/* Submit Guardar */}
            <div className="pt-6 border-t border-gray-100">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white py-5 px-8 font-black uppercase tracking-widest hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex justify-center items-center shadow-lg"
              >
                {isLoading ? "PROCESANDO CAMBIOS..." : "PUBLICAR EN CATÁLOGO"}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </main>
  );
}
