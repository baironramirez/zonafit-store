import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";
import { requireAdminAuth } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  // 1. Verificar que el caller es un admin autenticado antes de proceder
  const { error } = await requireAdminAuth(req);
  if (error) return error;
  const { id, activo } = await req.json();

  const productRef = doc(db, "products", id);

  await updateDoc(productRef, {
    activo,
  });

  return NextResponse.json({ success: true });
}
