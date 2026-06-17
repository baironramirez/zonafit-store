import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";
import { requireAdminAuth } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  // 1. Verificar que el caller es un admin autenticado antes de listar
  const { error } = await requireAdminAuth(req);
  if (error) return error;
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
