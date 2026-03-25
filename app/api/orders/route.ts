import { NextResponse } from "next/server";
import { collection, serverTimestamp, query, where, getDocs, updateDoc, increment, doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CartItem } from "@/types/cart";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orderId = await runTransaction(db, async (transaction) => {
      // 1. Read all required products first (Firestore requirement: all reads must come before writes)
      const productRefs = new Map();
      const productDocs = new Map();

      for (const item of body.items as CartItem[]) {
        const productId = item.productoId || item.id;
        if (!productId) {
          throw new Error(`El producto "${item.nombre}" no tiene un ID válido en tu carrito.`);
        }

        if (!productRefs.has(productId)) {
          const pRef = doc(db, "products", productId);
          const pSnap = await transaction.get(pRef);
          
          if (!pSnap.exists()) {
            throw new Error(`Producto ${item.nombre} no encontrado en la base de datos.`);
          }
          
          productRefs.set(productId, pRef);
          productDocs.set(productId, pSnap.data());
        }
      }

      // 2. Validate stock and prepare updates
      const productUpdates = new Map();

      for (const item of body.items as CartItem[]) {
        const productId = item.productoId || item.id;
        const pData = productDocs.get(productId);
        let updatedPData = productUpdates.get(productId) || { ...pData };

        if (!updatedPData.activo) {
          throw new Error(`El producto ${item.nombre} ya no está disponible.`);
        }

        if (item.varianteId || item.talla || item.color) {
          // Si tiene varianteId nuevo, o tiene propiedades antiguas de variantes
          let varianteIdTarget = item.varianteId;
          
          const variants = updatedPData.variantes || [];
          
          // Fallback para carritos súper viejos que solo tenían talla/color
          if (!varianteIdTarget && (item.talla || item.color)) {
            const matchedVariant = variants.find((v: any) => 
               (!item.talla || v.talla === item.talla) && 
               (!item.color || v.color === item.color)
            );
            if (matchedVariant) varianteIdTarget = matchedVariant.id;
          }

          if (varianteIdTarget) {
            const variantIndex = variants.findIndex((v: any) => v.id === varianteIdTarget);
            
            if (variantIndex === -1) {
              throw new Error(`Variante no encontrada para ${item.nombre}.`);
            }

            if (variants[variantIndex].stock < item.cantidad) {
              throw new Error(`Stock insuficiente para ${item.nombre}. Solicitaste ${item.cantidad}, pero solo quedan ${variants[variantIndex].stock}.`);
            }

            // Deduct stock
            variants[variantIndex].stock -= item.cantidad;
            updatedPData.variantes = variants;

            // Check if overall product should be deactivated
            const totalStock = variants.reduce((acc: number, v: any) => acc + v.stock, 0);
            if (totalStock <= 0) {
              updatedPData.activo = false;
            }
          } else {
             // Si por alguna razón pensaba que tenía variante pero no se halló ID, tratar como base
             if (updatedPData.stock < item.cantidad) {
                throw new Error(`Stock insuficiente para ${item.nombre}.`);
             }
             updatedPData.stock -= item.cantidad;
             if (updatedPData.stock <= 0) updatedPData.activo = false;
          }
        } else {
          // Handle Base Product Stock
          if (updatedPData.stock < item.cantidad) {
            throw new Error(`Stock insuficiente para ${item.nombre}. Solicitaste ${item.cantidad}, pero solo quedan ${updatedPData.stock}.`);
          }

          updatedPData.stock -= item.cantidad;
          
          if (updatedPData.stock <= 0) {
            updatedPData.activo = false;
          }
        }

        productUpdates.set(productId, updatedPData);
      }

      // 3. Perform Writes
      // Write Product Updates
      for (const [pId, updatedData] of productUpdates.entries()) {
        const pRef = productRefs.get(pId);
        transaction.update(pRef, updatedData);
      }

      // Write New Order
      const newOrderRef = doc(collection(db, "orders"));
      const orderData = {
        ...body,
        estado: "pendiente",
        fecha: serverTimestamp(),
      };
      transaction.set(newOrderRef, orderData);

      return newOrderRef.id;
    });

    // Si se usó un cupón, actualizamos sus métricas (fuera de la transacción principal para no bloquearla si falla algo menor)
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
      orderId: orderId,
    });
  } catch (error: any) {
    console.error("Error en checkout/transacción:", error.message);
    return NextResponse.json(
      { error: error.message || "Error procesando el pedido y validando el inventario." },
      { status: 400 }, // Cambiado a 400 para reflejar errores de validación de negocio
    );
  }
}
