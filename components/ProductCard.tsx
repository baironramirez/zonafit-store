"use client";

import { useCart } from "../context/CartContext";
import { useState } from "react";

type Product = {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
};

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  function handleAdd() {
    addToCart({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      cantidad: 1,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  }

  return (
    <div className="group h-full bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col">
      {/* Imagen Container */}
      <div className="relative overflow-hidden h-48 bg-white flex items-start justify-center">
        {product.imagen && product.imagen.trim() ? (
          <img
            src={product.imagen}
            alt={product.nombre}
            className="max-w-full max-h-full object-contain pt-2 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
            <div className="text-center">
              <div className="text-5xl mb-3">💪</div>
              <p className="text-sm text-gray-600 font-medium">
                Imagen no disponible
              </p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
      </div>

      {/* Contenido */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Nombre del producto */}
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors duration-200">
          {product.nombre}
        </h3>

        {/* Espacio flexible */}
        <div className="flex-grow"></div>

        {/* Precio */}
        <div className="mb-4 pt-3 border-t border-gray-200">
          <p className="text-2xl font-bold text-gray-900">
            ${product.precio.toLocaleString("es-AR")}
          </p>
        </div>

        {/* Botón */}
        <button
          onClick={handleAdd}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 ${
            isAdded
              ? "bg-green-500 shadow-lg scale-105"
              : "bg-orange-500 hover:bg-orange-600 active:scale-95"
          }`}
        >
          {isAdded ? "✓ Agregado" : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}
