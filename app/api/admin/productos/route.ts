/**
 * POST /api/admin/productos
 *
 * Crea un producto en Firestore (variante del endpoint /api/admin).
 *
 * ¿Por qué este endpoint existe duplicado?
 * Fue creado como ruta alternativa pero hace exactamente lo mismo.
 * Se mantiene para compatibilidad con el panel, pero ahora también
 * requiere autenticación de admin para cerrar la misma brecha de seguridad.
 */
import { NextRequest, NextResponse } from "next/server";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
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
