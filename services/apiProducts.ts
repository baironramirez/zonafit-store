import { Product } from "../types/product";

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("http://localhost:3000/api/productos");

  if (!res.ok) {
    throw new Error("Error cargando productos");
  }

  return res.json();
}
