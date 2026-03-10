import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";

export async function GET() {
  const snapshot = await getDocs(collection(db, "products"));

  const products: any[] = [];

  snapshot.forEach((doc) => {
    products.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return NextResponse.json(products);
}
