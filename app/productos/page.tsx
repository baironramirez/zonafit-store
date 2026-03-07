import ProductCard from "../../components/ProductCard";

export default function ProductosPage() {
  return (
    <main>
      <h1>Productos ZonaFit</h1>

      <ProductCard nombre="Proteína Whey" precio={95000} />
      <ProductCard nombre="Creatina" precio={80000} />
    </main>
  );
}
