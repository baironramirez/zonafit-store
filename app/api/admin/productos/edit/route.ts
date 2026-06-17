import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";
import { requireAdminAuth } from "@/lib/auth-helpers";

export async function PUT(req: NextRequest) {
  try {
    // 1. Verificar que el caller es un admin autenticado antes de editar
    const { error } = await requireAdminAuth(req);
    if (error) return error;
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    const productRef = doc(db, "products", id);
    
    // Parse numeric values before updating
    if (updateData.precio) updateData.precio = Number(updateData.precio);
    if (updateData.stock) updateData.stock = Number(updateData.stock);

    if (updateData.variantes && Array.isArray(updateData.variantes)) {
      updateData.variantes = updateData.variantes.map((v: any) => ({
        ...v,
        precio: Number(v.precio),
        stock: Number(v.stock)
      }));
    }

    await updateDoc(productRef, {
      ...updateData,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Error updating product" },
      { status: 500 },
    );
  }
}
