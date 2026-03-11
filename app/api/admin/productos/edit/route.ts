import { NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";

export async function PUT(req: Request) {
  try {
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
