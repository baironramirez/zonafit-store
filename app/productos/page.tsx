import { fetchProducts } from "../../services/apiProducts";
import ProductCard from "@/components/ProductCard";

export default async function ProductosPage() {
  const products = await fetchProducts();

  return (
    <main className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Productos ZonaFit
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 max-w-3xl mx-auto">
              Descubre nuestra selección premium de suplementos deportivos y
              artículos fitness
            </p>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏋️‍♂️</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No hay productos disponibles
            </h2>
            <p className="text-gray-600">
              Estamos trabajando para traerte los mejores productos fitness
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {products.length} producto{products.length !== 1 ? "s" : ""}{" "}
                disponible{products.length !== 1 ? "s" : ""}
              </h2>
              <div className="text-sm text-gray-600">
                Mostrando todos los productos
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer Section */}
      <div className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">
            ¿No encuentras lo que buscas?
          </h3>
          <p className="text-gray-300 mb-6">
            Contáctanos para conocer sobre nuevos productos y ofertas especiales
          </p>
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200">
            Contactar
          </button>
        </div>
      </div>
    </main>
  );
}
