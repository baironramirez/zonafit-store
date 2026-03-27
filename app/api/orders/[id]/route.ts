import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, runTransaction, collection, query, where, getDocs, getDoc, updateDoc, increment } from "firebase/firestore";

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

    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, "orders", id);
        const orderSnap = await transaction.get(orderRef);

        if (!orderSnap.exists()) {
          throw new Error("ORDER_NOT_FOUND");
        }

        const orderData = orderSnap.data();
        const currentStatus = orderData.estado;

        // 1. Validaciones Anti-Downgrade
        const currentPriority = STATUS_PRIORITY[currentStatus] ?? 0;
        const newPriority = STATUS_PRIORITY[estado] ?? 0;

        // Un admin no debería poder retroceder el estado manualmente
        if (newPriority < currentPriority) {
          throw new Error(`STATUS_DOWNGRADE_INVALID: No se puede cambiar de '${currentStatus}' a '${estado}'.`);
        }

        if (currentStatus === estado) {
          return; // Nada que actualizar
        }

        // 2. Preparar payload de la orden
        const updatePayload: Record<string, any> = {
          estado,
          ultimaActualizacion: new Date().toISOString(),
        };

        if (estado === "enviado") {
          updatePayload.fechaEnvio = new Date().toISOString();
        } else if (estado === "entregado") {
          updatePayload.fechaEntrega = new Date().toISOString();
        }

        // 3. Lógica de Reintegro de Inventario
        const isTerminal = estado === "rechazado" || estado === "reembolsado";
        const wasTerminal = currentStatus === "rechazado" || currentStatus === "reembolsado";

        // Si la orden cambia a estado terminal, devolvermos los ítems al inventario
        if (isTerminal && !wasTerminal) {
          const items = orderData.items || [];
          const productDocs = new Map();
          const productRefs = new Map();

          // Fase Lectura
          for (const item of items) {
            if (!productRefs.has(item.productoId)) {
              const pRef = doc(db, "products", item.productoId);
              const pSnap = await transaction.get(pRef);
              if (pSnap.exists()) {
                productRefs.set(item.productoId, pRef);
                productDocs.set(item.productoId, pSnap.data());
              }
            }
          }

          // Fase Lógica
          for (const item of items) {
            const pData = productDocs.get(item.productoId);
            if (!pData) continue;

            if (item.varianteId) {
              const variants = pData.variantes || [];
              const vIndex = variants.findIndex((v: any) => v.id === item.varianteId);
              if (vIndex !== -1) {
                variants[vIndex].stock += item.cantidad;
                pData.variantes = variants;
              }
            } else {
              pData.stock = (pData.stock || 0) + item.cantidad;
            }

            // Reactivamos el producto si estaba oculto por falta de stock
            pData.activo = true; 
            productDocs.set(item.productoId, pData);
          }

          // Fase Escritura de Productos
          for (const [pId, pData] of productDocs.entries()) {
            transaction.update(productRefs.get(pId), pData);
          }
        }

        // Fase Escritura Final: Orden
        transaction.update(orderRef, updatePayload);
      });

      // 🔟 Acreditar cupón cuando la orden pasa a "pagado" o "entregado"
      // Se ejecuta FUERA de la transacción para no bloquear el flujo de inventario
      if ((estado === "pagado" || estado === "entregado")) {
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
          // No bloqueamos el cambio de estado si falla el cupón
          console.error(`⚠️ Error acreditando cupón para orden ${id}:`, couponError.message);
        }
      }

      return NextResponse.json({
        success: true,
        orderId: id,
        nuevoEstado: estado,
      });

    } catch (txError: any) {
      if (txError.message === "ORDER_NOT_FOUND") {
        return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
      } else if (txError.message.startsWith("STATUS_DOWNGRADE_INVALID")) {
        return NextResponse.json({ error: txError.message.split(": ")[1] }, { status: 400 });
      }
      throw txError; // Redirigir al catch global
    }

  } catch (error: any) {
    console.error("Error actualizando pedido:", error?.message || error);
    return NextResponse.json(
      { error: "Error en el servidor al actualizar el pedido." },
      { status: 500 }
    );
  }
}
