"use client";

import { useEffect, useState } from "react";
import { X, Save, Edit2, UploadCloud } from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AdminProductos() {
  const [products, setProducts] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const res = await fetch("/api/admin/productos/list");
    const data = await res.json();
    setProducts(data);
  }

  function openEditModal(product: any) {
    setEditingProduct({ ...product });
    setImageFile(null);
    setPreviewUrl(product.imagen || null);
    setIsEditing(true);
  }

  function closeEditModal() {
    setIsEditing(false);
    setEditingProduct(null);
    setImageFile(null);
    setPreviewUrl(null);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      let finalImageUrl = editingProduct.imagen;

      // Si subieron una nueva imagen, reemplazarla en storage
      if (imageFile) {
        const imageRef = ref(
          storage,
          `products/${Date.now()}-${imageFile.name}`,
        );
        await uploadBytes(imageRef, imageFile);
        finalImageUrl = await getDownloadURL(imageRef);
      }

      const res = await fetch("/api/admin/productos/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...editingProduct, imagen: finalImageUrl }),
      });

      if (res.ok) {
        await fetchProducts();
        closeEditModal();
      } else {
        alert("Error al actualizar el producto");
      }
    } catch (error) {
      console.error(error);
      alert("Error en el servidor");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleProduct(id: string, activo: boolean) {
    await fetch("/api/admin/productos/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        activo: !activo,
      }),
    });

    fetchProducts();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setEditingProduct({ ...editingProduct, [name]: value });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Gestión de productos
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product: any) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
            >
              {/* Imagen del producto */}
              {product.imagen && (
                <div className="h-48 bg-gray-200">
                  <img
                    src={product.imagen}
                    alt={product.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Información del producto */}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {product.nombre}
                </h3>

                {product.categoria && (
                  <p className="text-sm text-orange-600 font-medium mb-2">
                    Categoría: {product.categoria}
                  </p>
                )}

                <div className="flex justify-between items-center mb-3">
                  <p className="text-2xl font-bold text-gray-900">
                    ${product.precio?.toLocaleString("es-AR")}
                  </p>
                  <p className="text-sm text-gray-600 border border-gray-200 px-2 py-1 rounded">
                    Stock: {product.stock}
                  </p>
                </div>

                {product.descripcion && (
                  <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                    {product.descripcion}
                  </p>
                )}

                <div className="mt-auto flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleProduct(product.id, product.activo)}
                      className={`px-3 py-1.5 rounded-md font-medium text-sm transition-colors duration-200 ${
                        product.activo
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {product.activo ? "Ocultar" : "Mostrar"}
                    </button>
                    
                    <button
                      onClick={() => openEditModal(product)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md font-medium text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black transition-colors duration-200"
                    >
                      <Edit2 className="w-4 h-4" /> Editar
                    </button>
                  </div>

                  <span
                    className={`w-2 h-2 rounded-full ${
                      product.activo ? "bg-green-500" : "bg-red-500"
                    }`}
                    title={product.activo ? "Activo" : "Inactivo"}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No hay productos registrados
            </p>
          </div>
        )}
      </div>

      {/* MODAL DE EDICIÓN */}
      {isEditing && editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
              <h2 className="text-2xl font-black uppercase tracking-tight text-black">Editar Producto</h2>
              <button 
                onClick={closeEditModal}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={editingProduct.nombre || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Categoría</label>
                  <input
                    type="text"
                    name="categoria"
                    value={editingProduct.categoria || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Precio ($)</label>
                  <input
                    type="number"
                    name="precio"
                    value={editingProduct.precio || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Stock</label>
                  <input
                    type="number"
                    name="stock"
                    value={editingProduct.stock || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all rounded-lg"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Fotografía del Suplemento</label>
                  
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="flex-1 w-full">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border border-gray-200 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="mb-2 text-sm text-gray-500 font-medium">Click para subir foto nueva</p>
                            <p className="text-xs text-gray-400">PNG, JPG hasta 5MB</p>
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
                      <div className="w-full md:w-32 h-32 relative rounded-xl overflow-hidden border border-gray-200 bg-white flex-shrink-0">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Descripción</label>
                  <textarea
                    name="descripcion"
                    value={editingProduct.descripcion || ""}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all rounded-lg resize-none"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-6 py-3 font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:bg-gray-50 transition-colors rounded-lg"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 bg-black hover:bg-orange-500 text-white font-bold uppercase tracking-widest transition-colors flex items-center gap-2 rounded-lg disabled:opacity-50"
                >
                  {isSaving ? "Guardando..." : <><Save className="w-4 h-4" /> Guardar Cambios</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
