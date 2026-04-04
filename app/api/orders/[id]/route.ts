import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, collection, query, where, getDocs } from "firebase/firestore";
import { processOrderUpdate } from "@/lib/orders";

const STATUS_PRIORITY: Record<string, number> = {
  pendiente: 0,
  pagado: 1,
  enviado: 2,
  entregado: 3,
  rechazado: 4,
  reembolsado: 4,
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { estado } = body;

    if (!estado || STATUS_PRIORITY[estado] === undefined) {
      return NextResponse.json(
        { error: `Estado inválido. Valores permitidos: ${Object.keys(STATUS_PRIORITY).join(", ")}` },
        { status: 400 }
      );
    }

    // 1. Usar la lógica unificada (Maneja Anti-Downgrade y Restauración de Inventario)
    try {
      const result = await processOrderUpdate({
        orderId: id,
        paymentId: "manual-" + Date.now(), // ID ficticio para cambios manuales
        mpStatus: estado === "pagado" ? "approved" : (estado === "rechazado" ? "rejected" : (estado === "reembolsado" ? "refunded" : "pending")),
        mpStatusDetail: "manual_admin_update",
      });

      if (result.isDowngrade) {
        return NextResponse.json({ error: "No se puede retroceder el estado del pedido." }, { status: 400 });
      }

    } catch (orderError: any) {
      if (orderError.message === "ORDER_NOT_FOUND") {
        return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
      }
      throw orderError;
    }

    // 2. Acreditar cupón cuando la orden pasa a "pagado" o "entregado"
    if (estado === "pagado" || estado === "entregado") {
      try {
        const orderRef = doc(db, "orders", id);
        const freshSnap = await getDoc(orderRef);
        const freshData = freshSnap.data();

        if (freshData && freshData.cuponUsado && !freshData.cuponAcreditado) {
          const couponQuery = query(collection(db, "coupons"), where("codigo", "==", freshData.cuponUsado));
          const couponSnap = await getDocs(couponQuery);

          if (!couponSnap.empty) {
            const couponDocRef = couponSnap.docs[0].ref;
            const creditAmount = freshData.subtotal || freshData.total || 0;

            await updateDoc(couponDocRef, {
              usos: increment(1),
              dineroGenerado: increment(creditAmount),
            });

            // Marcar la orden para no acreditar dos veces
            await updateDoc(orderRef, { cuponAcreditado: true });
            console.log(`✅ Cupón ${freshData.cuponUsado} acreditado para orden ${id}, monto: ${creditAmount}`);
          }
        }
      } catch (couponError: any) {
        console.error(`⚠️ Error acreditando cupón para orden ${id}:`, couponError.message);
      }
    }

    return NextResponse.json({
      success: true,
      orderId: id,
      nuevoEstado: estado,
    });

  } catch (error: any) {
    console.error("Error actualizando pedido:", error?.message || error);
    return NextResponse.json(
      { error: "Error en el servidor al actualizar el pedido." },
      { status: 500 }
    );
  }
}
