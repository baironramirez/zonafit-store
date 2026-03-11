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

  // Safeguard against undefined product
  if (!product) return null;

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

  // Handle potential undefined precio
  const displayPrice = product.precio ? product.precio.toLocaleString("es-AR") : "0";

  return (
    <div className="group h-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 transition-all duration-300 flex flex-col">
      {/* Imagen Container */}
      <div className="relative overflow-hidden h-64 bg-neutral-800 flex items-center justify-center">
        {product.imagen && product.imagen.trim() ? (
          <img
            src={product.imagen}
            alt={product.nombre}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-800">
            <div className="text-center text-neutral-500">
              <div className="text-4xl mb-2">💪</div>
              <p className="text-xs font-medium uppercase tracking-wider">
                Sin Imagen
              </p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-80" />
      </div>

      {/* Contenido */}
      <div className="p-6 flex flex-col flex-grow relative z-10 -mt-2">
        {/* Nombre del producto */}
        <h3 className="font-bold text-lg text-white mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors duration-200">
          {product.nombre}
        </h3>

        {/* Espacio flexible */}
        <div className="flex-grow"></div>

        {/* Precio */}
        <div className="mt-4 mb-6">
          <p className="text-2xl font-black text-white">
            ${displayPrice}
          </p>
        </div>

        {/* Botón */}
        <button
          onClick={handleAdd}
          className={`w-full py-4 px-4 rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-300 ${
            isAdded
              ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20"
              : "bg-white text-black hover:bg-orange-400 hover:text-black"
          }`}
        >
          {isAdded ? "✓ Agregado" : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}
