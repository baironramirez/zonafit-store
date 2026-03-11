"use client";

import { useEffect, useState } from "react";

export default function AdminProductos() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const res = await fetch("/api/admin/productos/list");
    const data = await res.json();

    setProducts(data);
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
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
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
              <div className="p-6">
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
                  <p className="text-sm text-gray-600">
                    Stock: {product.stock}
                  </p>
                </div>

                {product.descripcion && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.descripcion}
                  </p>
                )}

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => toggleProduct(product.id, product.activo)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      product.activo
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {product.activo ? "Desactivar" : "Activar"}
                  </button>

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      product.activo
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {product.activo ? "Activo" : "Inactivo"}
                  </span>
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
    </main>
  );

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
}
