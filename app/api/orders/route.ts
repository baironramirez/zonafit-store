import { NextResponse } from "next/server";
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, increment } from "firebase/firestore";
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

    // Si se usó un cupón, actualizamos sus métricas
    if (body.cuponUsado) {
      try {
        const q = query(collection(db, "coupons"), where("codigo", "==", body.cuponUsado));
        const qSnap = await getDocs(q);
        
        if (!qSnap.empty) {
          const couponDoc = qSnap.docs[0];
          await updateDoc(couponDoc.ref, {
            usos: increment(1),
            dineroGenerado: increment(body.subtotal || body.total)
          });
        }
      } catch (err) {
        console.error("No se pudo actualizar métricas del cupón:", err);
      }
    }

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
