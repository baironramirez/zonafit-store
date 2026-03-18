"use client";

import { useEffect, useState } from "react";
import { X, Save, Edit2, UploadCloud, Plus, Trash2 } from "lucide-react";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";
import { Variante } from "@/components/ProductCard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AdminProductos() {
  const [products, setProducts] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Multi-image state for edit modal
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  // Temporary state for adding a new variant in edit mode
  const [newVarNombre, setNewVarNombre] = useState("");
  const [newVarPrecio, setNewVarPrecio] = useState(0);
  const [newVarStock, setNewVarStock] = useState(0);

  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    fetchProducts();
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const docRef = doc(db, "settings", "home");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.categorias) setCategorias(data.categorias);
        else setCategorias(["Proteínas", "Pre-Entrenos", "Creatina", "Vitaminas"]);

        if (data.marcas) setMarcas(data.marcas);
        else setMarcas(["Optimum Nutrition", "Dymatize", "MuscleTech", "BSN", "Cellucor"]);
      } else {
        setCategorias(["Proteínas", "Pre-Entrenos", "Creatina", "Vitaminas"]);
        setMarcas(["Optimum Nutrition", "Dymatize", "MuscleTech", "BSN", "Cellucor"]);
      }
    } catch (e) {
      setCategorias(["Proteínas", "Pre-Entrenos", "Creatina", "Vitaminas"]);
      setMarcas(["Optimum Nutrition", "Dymatize", "MuscleTech", "BSN", "Cellucor"]);
    } finally {
      setLoadingConfig(false);
    }
  }

  async function fetchProducts() {
    const res = await fetch("/api/admin/productos/list");
    const data = await res.json();
    setProducts(data);
  }

  function openEditModal(product: any) {
    // Ensure variantes array exists even if old product
    setEditingProduct({ ...product, variantes: product.variantes || [] });
    // Cargar imágenes existentes: preferir array `imagenes`, fallback a `imagen` único
    const imgs = product.imagenes && product.imagenes.length > 0
      ? [...product.imagenes]
      : product.imagen ? [product.imagen] : [];
    setExistingImageUrls(imgs);
    setRemovedImageUrls([]);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setIsEditing(true);
    setNewVarNombre("");
    setNewVarPrecio(0);
    setNewVarStock(0);
  }

  function closeEditModal() {
    setIsEditing(false);
    setEditingProduct(null);
    setExistingImageUrls([]);
    setRemovedImageUrls([]);
    setNewImageFiles([]);
    setNewImagePreviews([]);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 🗑️ Eliminar imágenes removidas de Firebase Storage
      for (const url of removedImageUrls) {
        try {
          const decodedUrl = decodeURIComponent(url);
          const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/);
          if (pathMatch && pathMatch[1]) {
            const oldRef = ref(storage, pathMatch[1]);
            await deleteObject(oldRef);
            console.log("Imagen eliminada:", pathMatch[1]);
          }
        } catch (delErr) {
          console.warn("No se pudo eliminar imagen:", delErr);
        }
      }

      // 📤 Subir nuevas imágenes
      const uploadedUrls: string[] = [];
      for (const file of newImageFiles) {
        const imageRef = ref(storage, `products/${Date.now()}-${file.name}`);
        await uploadBytes(imageRef, file);
        const url = await getDownloadURL(imageRef);
        uploadedUrls.push(url);
      }

      // Combinar: existentes (no removidas) + nuevas subidas
      const finalImagenes = [...existingImageUrls, ...uploadedUrls];
      const finalImageUrl = finalImagenes[0] || "";

      // Sincronizar precio base con el mínimo de variantes si existen
      let precioFinal = editingProduct.precio;
      if (editingProduct.variantes && editingProduct.variantes.length > 0) {
        precioFinal = Math.min(...editingProduct.variantes.map((v: any) => v.precio));
      }

      const res = await fetch("/api/admin/productos/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editingProduct,
          imagen: finalImageUrl,
          imagenes: finalImagenes,
          precio: precioFinal,
        }),
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

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setEditingProduct({ ...editingProduct, [name]: name === 'precio' || name === 'stock' ? Number(value) : value });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const totalCurrent = existingImageUrls.length + newImageFiles.length;
      const remaining = 4 - totalCurrent;
      const filesToAdd = Array.from(e.target.files).slice(0, remaining);

      if (filesToAdd.length === 0) {
        alert("Máximo 4 imágenes permitidas.");
        return;
      }

      setNewImageFiles((prev) => [...prev, ...filesToAdd]);

      filesToAdd.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setNewImagePreviews((prev) => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    e.target.value = "";
  }

  function removeExistingImage(index: number) {
    const urlToRemove = existingImageUrls[index];
    setRemovedImageUrls((prev) => [...prev, urlToRemove]);
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewImage(index: number) {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  /* --- VARIANT HANDLERS (EDIT MODAL) --- */
  const handleVarianteChange = (id: string, field: keyof Variante, value: string | number) => {
    const updatedVariantes = editingProduct.variantes.map((v: Variante) => {
      if (v.id === id) {
        return { ...v, [field]: value };
      }
      return v;
    });
    setEditingProduct({ ...editingProduct, variantes: updatedVariantes });
  };

  const removeVarianteEdit = (id: string) => {
    const updatedVariantes = editingProduct.variantes.filter((v: Variante) => v.id !== id);
    setEditingProduct({ ...editingProduct, variantes: updatedVariantes });
  };

  const handleAddNewVarianteEdit = () => {
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

    setEditingProduct({
      ...editingProduct,
      variantes: [...editingProduct.variantes, nuevaVariante]
    });

    setNewVarNombre("");
    setNewVarPrecio(0);
    setNewVarStock(0);
  };

  return (
    <main className="min-h-screen bg-gray-50 text-black py-12 px-6 pt-24">
      <div className="max-w-7xl mx-auto">

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Volver al Panel
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Gestión de inventario
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
                  <p className="text-sm text-orange-600 font-medium mb-1">
                    Categoría: {product.categoria}
                  </p>
                )}

                {product.marca && (
                  <p className="text-xs text-blue-600 font-bold mb-2 uppercase tracking-tight">
                    Marca: {product.marca}
                  </p>
                )}

                <div className="mb-3">
                  {product.variantes && product.variantes.length > 0 ? (
                    <div className="space-y-1 mt-2">
                      <p className="text-xs font-bold uppercase text-gray-400">
                        Variantes ({product.variantes.length})
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        Desde $
                        {Math.min(
                          ...product.variantes.map((v: any) => v.precio)
                        ).toLocaleString("es-AR")}
                      </p>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-2xl font-bold text-gray-900">
                        ${product.precio?.toLocaleString("es-AR")}
                      </p>
                      <p className="text-sm text-gray-600 border border-gray-200 px-2 py-1 rounded">
                        Stock: {product.stock}
                      </p>
                    </div>
                  )}
                </div>

                {product.descripcion && (
                  <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                    {product.descripcion}
                  </p>
                )}

                <div className="mt-auto flex justify-between items-center bg-gray-50 -mx-6 -mb-6 p-4 border-t border-gray-100">
                  <div className="flex gap-2 w-full justify-between">
                    <button
                      onClick={() => openEditModal(product)}
                      className="flex items-center justify-center gap-2 flex-1 rounded-md font-bold uppercase tracking-wider text-xs border border-gray-300 bg-white text-black hover:bg-black hover:text-white transition-colors duration-200 py-2 shadow-sm"
                    >
                      <Edit2 className="w-4 h-4" /> Configurar
                    </button>

                    <button
                      onClick={() => toggleProduct(product.id, product.activo)}
                      className={`flex-1 flex justify-center items-center py-2 rounded-md font-bold uppercase tracking-wider text-xs transition-colors duration-200 ${product.activo
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                    >
                      {product.activo ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative my-auto">

            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-xl shrink-0">
              <h2 className="text-2xl font-black uppercase tracking-tight text-black">⚙️ Configurar Producto</h2>
              <button
                onClick={closeEditModal}
                className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 md:p-8 flex-1">
              <form id="editProductForm" onSubmit={handleEditSubmit} className="space-y-10">
                {/* 1. Base Info */}
                <div>
                  <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest border-b border-gray-100 pb-2 mb-4">
                    1. Datos Generales
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* NOMBRE */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={editingProduct.nombre || ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all rounded-lg"
                        required
                      />
                    </div>

                    {/* CATEGORÍA */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                        Categoría
                      </label>

                      <div className="relative">
                        <select
                          name="categoria"
                          value={editingProduct.categoria || ""}
                          onChange={handleInputChange}
                          disabled={loadingConfig}
                          className="appearance-none w-full px-4 py-3 bg-gray-50 border border-gray-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all rounded-lg pr-10"
                        >
                          <option value="" disabled>
                            {loadingConfig ? "Cargando..." : "Seleccionar Categoría"}
                          </option>
                          {categorias.map((cat, idx) => (
                            <option key={idx} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>

                        {/* Flecha */}
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* MARCA */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                        Marca
                      </label>

                      <div className="relative">
                        <select
                          name="marca"
                          value={editingProduct.marca || ""}
                          onChange={handleInputChange}
                          disabled={loadingConfig}
                          className="appearance-none w-full px-4 py-3 bg-gray-50 border border-gray-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all rounded-lg pr-10"
                        >
                          <option value="" disabled>
                            {loadingConfig ? "Cargando..." : "Seleccionar Marca"}
                          </option>
                          {marcas.map((m, idx) => (
                            <option key={idx} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>

                        {/* Flecha */}
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
                {/* 2. Variantes & Precios */}
                <div>
                  <div className="flex justify-between items-end border-b border-gray-100 pb-2 mb-4">
                    <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest">2. Variantes, Tamaños y Precios</h3>
                  </div>

                  {editingProduct.variantes && editingProduct.variantes.length > 0 ? (
                    <div className="space-y-4 mb-6">
                      {editingProduct.variantes.map((v: Variante) => (
                        <div key={v.id} className="flex flex-col md:flex-row gap-3 items-end bg-gray-50 p-4 border border-gray-200 rounded-lg">
                          <div className="w-full md:flex-1">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Nombre Variante</label>
                            <input
                              type="text"
                              value={v.nombre}
                              onChange={(e) => handleVarianteChange(v.id, "nombre", e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 focus:outline-none focus:border-black text-sm font-bold"
                            />
                          </div>
                          <div className="w-full md:w-32">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Precio ($)</label>
                            <input
                              type="number"
                              value={v.precio}
                              onChange={(e) => handleVarianteChange(v.id, "precio", Number(e.target.value))}
                              className="w-full px-3 py-2 bg-white border border-gray-200 focus:outline-none focus:border-black text-sm font-bold"
                            />
                          </div>
                          <div className="w-full md:w-24">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Stock</label>
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) => handleVarianteChange(v.id, "stock", Number(e.target.value))}
                              className="w-full px-3 py-2 bg-white border border-gray-200 focus:outline-none focus:border-black text-sm font-bold"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVarianteEdit(v.id)}
                            className="bg-red-50 text-red-500 p-2 border border-red-200 rounded hover:bg-red-500 hover:text-white transition-colors h-[38px] w-full md:w-auto flex justify-center items-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Precio Único ($)</label>
                        <input
                          type="number"
                          name="precio"
                          value={editingProduct.precio || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white border border-gray-200 text-black font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Stock Único</label>
                        <input
                          type="number"
                          name="stock"
                          value={editingProduct.stock || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white border border-gray-200 text-black font-bold focus:outline-none focus:ring-2 focus:ring-black transition-all rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {/* Add variant inside edit */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                    <div className="md:col-span-12 mb-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-black">Añadir Otra Variante</p>
                    </div>
                    <div className="md:col-span-6">
                      <input
                        type="text"
                        placeholder="Nueva variante (Ej: Sabor Chocolate)"
                        value={newVarNombre}
                        onChange={(e) => setNewVarNombre(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 focus:outline-none focus:border-black text-sm font-medium"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        placeholder="Precio"
                        min="0"
                        value={newVarPrecio}
                        onChange={(e) => setNewVarPrecio(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-gray-300 focus:outline-none focus:border-black text-sm font-medium"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        placeholder="Stock"
                        min="0"
                        value={newVarStock}
                        onChange={(e) => setNewVarStock(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-gray-300 focus:outline-none focus:border-black text-sm font-medium"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddNewVarianteEdit}
                        className="w-full bg-black text-white py-2 border border-black hover:bg-white hover:text-black font-bold uppercase text-[10px] tracking-widest flex justify-center items-center gap-1 h-[38px] transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Añadir
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Media & Description */}
                <div>
                  <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest border-b border-gray-100 pb-2 mb-4">3. Contenido Visual y Descripción</h3>

                  <div className="space-y-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                      Imágenes del Producto ({existingImageUrls.length + newImagePreviews.length}/4)
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border border-gray-200 p-4 rounded-lg bg-gray-50">
                      {/* Imágenes existentes (ya en Firebase) */}
                      {existingImageUrls.map((url, idx) => (
                        <div key={`existing-${idx}`} className="relative aspect-square border border-gray-200 bg-white rounded-lg overflow-hidden group">
                          <img src={url} alt={`Imagen ${idx + 1}`} className="w-full h-full object-contain p-1" />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(idx)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {idx === 0 && existingImageUrls.length + newImagePreviews.length > 1 && (
                            <span className="absolute bottom-1 left-1 bg-black text-white text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded">
                              Principal
                            </span>
                          )}
                        </div>
                      ))}

                      {/* Nuevas imágenes (aún no subidas) */}
                      {newImagePreviews.map((url, idx) => (
                        <div key={`new-${idx}`} className="relative aspect-square border-2 border-orange-300 bg-white rounded-lg overflow-hidden group">
                          <img src={url} alt={`Nueva ${idx + 1}`} className="w-full h-full object-contain p-1" />
                          <button
                            type="button"
                            onClick={() => removeNewImage(idx)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 left-1 bg-orange-500 text-white text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded">
                            Nueva
                          </span>
                        </div>
                      ))}

                      {/* Botón agregar si hay espacio */}
                      {(existingImageUrls.length + newImagePreviews.length) < 4 && (
                        <label className="aspect-square flex flex-col items-center justify-center border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-100 hover:border-black transition-colors">
                          <UploadCloud className="w-6 h-6 text-gray-400 mb-1" />
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center px-2">Agregar Foto</p>
                          <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                        </label>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">La primera imagen será la principal. Borde naranja = pendiente de subir al guardar.</p>

                    <div>
                      <textarea
                        name="descripcion"
                        placeholder="Descripción detallada del producto..."
                        value={editingProduct.descripcion || ""}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-black font-medium focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all rounded-lg resize-none"
                      />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="p-4 md:p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3 bg-gray-50 rounded-b-xl shrink-0">
              <button
                type="button"
                onClick={closeEditModal}
                className="w-full sm:w-auto px-6 py-4 font-bold uppercase tracking-widest text-black bg-white border border-gray-200 hover:bg-gray-100 transition-colors rounded-lg text-sm"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="editProductForm"
                disabled={isSaving}
                className="w-full sm:w-auto px-10 py-4 bg-black hover:bg-orange-500 text-white font-black uppercase tracking-widest transition-colors flex justify-center items-center gap-2 rounded-lg disabled:opacity-50 text-sm shadow-lg"
              >
                {isSaving ? "GUARDANDO..." : <><Save className="w-5 h-5" /> ACTUALIZAR INVENTARIO</>}
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
