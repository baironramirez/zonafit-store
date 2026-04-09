import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { Plus, Heart } from "lucide-react";
import { useState } from "react";

export interface Variante {
  id: string; // E.g., Date.now.toString()
  nombre: string; // E.g., "Sabor Fresa 2LBs"
  precio: number;
  stock: number;
}

export interface ProductoData {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  marca?: string;
  imagen: string;
  imagenes?: string[];
  descripcion: string;
  activo: boolean;
  variantes?: Variante[];
}

export default function ProductCard({ producto }: { producto: ProductoData }) {
  const { addToCart } = useCart();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const [isHovered, setIsHovered] = useState(false);

  // Use fallback values if producto properties are missing
  const nombre = producto?.nombre || "Producto sin nombre";
  const precio = producto?.precio || 0;
  const imagen = producto?.imagen || "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=800&auto=format&fit=crop";
  const categoria = producto?.categoria || "Sin categoría";
  const marca = producto?.marca;

  // Calculamos el stock basado en si tiene variantes o no
  const hasVariants = producto?.variantes && producto.variantes.length > 0;
  
  // Buscamos la primera variante que sí tenga stock (si todas están en 0, cae a la primera)
  const availableVariant = hasVariants 
    ? producto.variantes!.find((v) => v.stock > 0) || producto.variantes![0] 
    : null;

  // Calculamos el stock TOTAL para el badge "Agotado"
  const totalStock = hasVariants
    ? producto.variantes!.reduce((acc, v) => acc + v.stock, 0)
    : producto?.stock || 0;
    
  const isOutOfStock = totalStock <= 0 || !producto?.activo;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    if (producto && !isOutOfStock) {
      const finalPrice = availableVariant ? availableVariant.precio : precio;
      const finalName = availableVariant ? `${producto.nombre} - ${availableVariant.nombre}` : producto.nombre;
      const finalId = availableVariant ? `${producto.id}-${availableVariant.id}` : producto.id;
      const finalStock = availableVariant ? availableVariant.stock : totalStock;

      addToCart({
        id: finalId,
        productoId: producto.id,
        varianteId: availableVariant ? availableVariant.id : undefined,
        nombre: finalName,
        precio: finalPrice,
        maxStock: finalStock,
        imagen: producto.imagen,
        cantidad: 1
      });
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!producto) return;
    if (isFavorite(producto.id)) {
      removeFromFavorites(producto.id);
    } else {
      addToFavorites(producto);
    }
  };

  return (
    <Link 
      href={`/productos/${producto?.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-gray-100 to-gray-50 p-6 flex items-center justify-center">
        {/* Placeholder for real product images, with a subtle gray background */}
        <img
          src={imagen}
          alt={nombre}
          className="w-full h-full object-contain filter contrast-125 mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-out"
        />
        {/* Heart Icon for Favorites */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm hover:scale-110 transition-transform"
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${isFavorite(producto?.id) ? 'fill-orange-500 text-orange-500' : 'text-gray-400 hover:text-orange-500'}`} 
          />
        </button>
        
        {/* Quick Add Button overlay (Mobile: Always visible Orange FAB, Desktop: Hover only) */}
        <div className={`absolute bottom-3 right-3 md:bottom-4 md:left-0 md:right-0 md:px-4 transition-all duration-300 md:opacity-0 md:translate-y-4 ${isHovered || isOutOfStock ? 'md:opacity-100 md:translate-y-0' : ''} opacity-100 translate-y-0 z-20`}>
          <button 
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-10 h-10 md:w-full md:h-auto md:py-3 rounded-full md:rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg ${
              isOutOfStock 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed hidden md:flex' 
                : 'bg-orange-500 md:bg-black text-white hover:bg-orange-600 md:hover:bg-orange-500'
            }`}
            aria-label={isOutOfStock ? "Agotado" : "Agregar al carrito"}
          >
            {isOutOfStock ? (
              <span className="hidden md:inline">Agotado</span>
            ) : (
              <>
                <Plus className="w-5 h-5 md:w-4 md:h-4 stroke-[3] md:stroke-[2]" /> 
                <span className="hidden md:inline">Agregar</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex gap-2 items-center mb-1">
              <p className="text-xs font-bold text-orange-500 uppercase tracking-wider">
                {categoria}
              </p>
              {marca && (
                <>
                  <span className="text-gray-300 text-xs">•</span>
                  <span
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/productos?marca=${encodeURIComponent(marca)}`; }}
                    className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 rounded-sm hover:bg-black hover:text-white transition-colors cursor-pointer"
                  >
                    {marca}
                  </span>
                </>
              )}
            </div>
            
            <h3 className="font-bold text-black text-base md:text-lg leading-tight group-hover:text-orange-500 transition-colors line-clamp-2">
              {nombre}
            </h3>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between overflow-hidden">
          <div className="text-black font-black whitespace-nowrap">
            {producto?.variantes && producto.variantes.length > 0 ? (
              (() => {
                const prices = producto.variantes.map(v => v.precio);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                
                const isRange = minPrice !== maxPrice;
                const fontSize = isRange ? "text-base md:text-lg" : "text-lg md:text-xl";
                
                if (!isRange) {
                  return <span className={fontSize}>${minPrice.toLocaleString("es-AR")}</span>;
                }
                return (
                  <span className={fontSize}>
                    ${minPrice.toLocaleString("es-AR")} - ${maxPrice.toLocaleString("es-AR")}
                  </span>
                );
              })()
            ) : (
              <span className="text-lg md:text-xl">${precio.toLocaleString("es-AR")}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
