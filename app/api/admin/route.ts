/**
 * POST /api/admin
 *
 * Crea un producto en Firestore.
 *
 * ¿Por qué ahora requiere auth?
 * Sin protección, cualquier script externo podía hacer POST a esta ruta
 * y inyectar productos basura o maliciosos en la base de datos.
 * Ahora solo un administrador autenticado (custom claim admin=true) puede usarlo.
 */
import { NextRequest, NextResponse } from "next/server";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { requireAdminAuth } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  // 1. Verificar que el caller es un admin autenticado antes de hacer nada
  const { error } = await requireAdminAuth(req);
  if (error) return error;

  try {
    const body = await req.json();

    const docRef = await addDoc(collection(db, "products"), {
      ...body,
      createdAt: new Date(),
    });

    return NextResponse.json({
      id: docRef.id,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Error creando producto" },
      { status: 500 },
    );
  }
}
