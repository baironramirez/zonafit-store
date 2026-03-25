import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const VALID_STATES = ["pendiente", "pagado", "enviado", "entregado", "rechazado", "reembolsado"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { estado } = body;

    if (!estado || !VALID_STATES.includes(estado)) {
      return NextResponse.json(
        { error: `Estado inválido. Valores permitidos: ${VALID_STATES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify order exists
    const orderRef = doc(db, "orders", id);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Build update payload
    const updatePayload: Record<string, any> = {
      estado,
      ultimaActualizacion: new Date().toISOString(),
    };

    // Add timestamps for specific status changes
    if (estado === "enviado") {
      updatePayload.fechaEnvio = new Date().toISOString();
    } else if (estado === "entregado") {
      updatePayload.fechaEntrega = new Date().toISOString();
    }

    await updateDoc(orderRef, updatePayload);

    return NextResponse.json({
      success: true,
      orderId: id,
      nuevoEstado: estado,
    });
  } catch (error: any) {
    console.error("Error actualizando pedido:", error?.message || error);
    return NextResponse.json(
      { error: "Error actualizando pedido" },
      { status: 500 }
    );
  }
}
