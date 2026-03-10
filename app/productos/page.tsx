import { fetchProducts } from "../../services/apiProducts";
import ProductCard from "../../components/ProductCard";

export default async function ProductosPage() {
  const products = await fetchProducts();

  return (
    <main>
      <h1>Productos ZonaFit</h1>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            nombre={product.nombre}
            precio={product.precio}
          />
        ))}
      </div>
    </main>
  );
}
