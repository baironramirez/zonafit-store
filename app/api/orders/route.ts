import { NextResponse } from "next/server";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const order = {
      ...body,
      estado: "pendiente",
      fecha: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "orders"), order);

    return NextResponse.json({
      success: true,
      orderId: docRef.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error creando pedido" },
      { status: 500 },
    );
  }
}
