import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Plus } from "lucide-react";
import { useState } from "react";

export interface ProductoData {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  imagen: string;
  descripcion: string;
  activo: boolean;
}

export default function ProductCard({ producto }: { producto: ProductoData }) {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  // Use fallback values if producto properties are missing
  const nombre = producto?.nombre || "Producto sin nombre";
  const precio = producto?.precio || 0;
  const imagen = producto?.imagen || "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=800&auto=format&fit=crop";
  const categoria = producto?.categoria || "Sin categoría";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    if (producto) {
      addToCart({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
        cantidad: 1
      } as any);
    }
  };

  return (
    <Link 
      href={`/productos/${producto?.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-50 border-b border-gray-100 p-6 flex items-center justify-center">
        {/* Placeholder for real product images, with a subtle gray background */}
        <img
          src={imagen}
          alt={nombre}
          className="w-full h-full object-contain filter contrast-125 mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-out"
        />
        
        {/* Quick Add Button overlay */}
        <div className={`absolute bottom-4 left-0 right-0 px-4 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button 
            onClick={handleAddToCart}
            className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-orange-500 transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">
              {categoria}
            </p>
            <h3 className="font-bold text-black text-lg leading-tight group-hover:text-orange-500 transition-colors line-clamp-2">
              {nombre}
            </h3>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xl font-black text-black">
            ${precio.toLocaleString("es-AR")}
          </p>
        </div>
      </div>
    </Link>
  );
}
