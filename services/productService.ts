import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Product } from "../types/product";

export async function getProducts(): Promise<Product[]> {
  const querySnapshot = await getDocs(collection(db, "products"));

  const products: Product[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();

    if (data.activo === true) {
      products.push({
        id: doc.id,
        ...(data as Omit<Product, "id">),
      });
    }
  });

  return products;
}
