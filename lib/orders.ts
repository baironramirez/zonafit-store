import { doc, getDoc, runTransaction, DocumentReference, updateDoc, increment, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { CartItem } from "@/types/cart";

// Status Mapping
export function mapPaymentStatus(mpStatus: string): string {
  switch (mpStatus) {
    case "approved":
      return "pagado";
    case "pending":
    case "in_process":
    case "in_mediation":
    case "authorized":
      return "pendiente";
    case "rejected":
    case "cancelled":
      return "rechazado";
    case "refunded":
    case "charged_back":
      return "reembolsado";
    default:
      return "pendiente";
  }
}

const STATUS_PRIORITY: Record<string, number> = {
  pendiente: 0,
  pagado: 1,
  enviado: 2,
  entregado: 3,
  rechazado: 4,
  reembolsado: 4,
};

interface UpdateResult {
  isDowngrade: boolean;
  newStatus: string;
  duplicate: boolean;
  restoredStock: boolean;
  error?: string;
}

/**
 * Unified logic to update order status and manage inventory restoration.
 * Can be used by Webhooks, Admin API, or Cron jobs.
 */
export async function processOrderUpdate({
  orderId,
  paymentId,
  mpStatus,
  mpStatusDetail,
  mpPaymentMethod,
  mpTransactionAmount,
  logEvent = (level, event, payload) => console[level](`[${level.toUpperCase()}] ${event}:`, payload),
}: {
  orderId: string;
  paymentId: string;
  mpStatus: string;
  mpStatusDetail?: string;
  mpPaymentMethod?: string;
  mpTransactionAmount?: number;
  logEvent?: (level: 'info' | 'warn' | 'error', event: string, payload?: any) => void;
}): Promise<UpdateResult> {
  const newInternalStatus = mapPaymentStatus(mpStatus);
  const orderDocRef = doc(db, "orders", orderId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderDocRef);
      if (!orderSnap.exists()) {
        throw new Error("ORDER_NOT_FOUND");
      }

      const orderData = orderSnap.data();
      const currentStatus = orderData.estado || "pendiente";

      // 1. Idempotency check 
      if (
        orderData.mpPaymentId === paymentId.toString() &&
        orderData.mpStatus === mpStatus &&
        orderData.estado === newInternalStatus
      ) {
        return { isDowngrade: false, newStatus: newInternalStatus, duplicate: true, restoredStock: false };
      }

      // 2. Priority check (Anti-Downgrade)
      const currentPriority = STATUS_PRIORITY[currentStatus] ?? 0;
      const newPriority = STATUS_PRIORITY[newInternalStatus] ?? 0;
      const isDowngrade = !["rechazado", "reembolsado"].includes(currentStatus) && (newPriority < currentPriority);

      // 3. Inventory Restoration Logic
      // Restore if: 
      // - Transitioning to a failed state (rejected/refunded)
      // - AND we haven't already failed (to avoid double restore)
      // - AND it's not a downgrade (e.g. from delivered to rejected should probably still restore if it was a return, but usually it's from pending to rejected)
      const isFailedState = newInternalStatus === "rechazado" || newInternalStatus === "reembolsado";
      const wasFailedState = currentStatus === "rechazado" || currentStatus === "reembolsado";
      const shouldRestoreStock = isFailedState && !wasFailedState;

      let restoredStock = false;
      const productUpdates = new Map<string, any>();
      const productRefs = new Map<string, DocumentReference>();

      if (shouldRestoreStock && Array.isArray(orderData.items)) {
        logEvent('info', 'order_stock_restore_attempt', { orderId, itemsCount: orderData.items.length });
        
        // Phase: Read
        for (const item of orderData.items as CartItem[]) {
          const productId = item.productoId || item.id;
          if (!productId || productRefs.has(productId)) continue;

          const pRef = doc(db, "products", productId);
          const pSnap = await transaction.get(pRef);
          if (pSnap.exists()) {
            productRefs.set(productId, pRef);
            productUpdates.set(productId, { ...pSnap.data() });
          } else {
            logEvent('warn', 'order_stock_restore_product_missing', { orderId, productId });
          }
        }

        // Phase: Logic
        for (const item of orderData.items as CartItem[]) {
          const productId = item.productoId || item.id;
          if (!productUpdates.has(productId)) continue;

          const pData = productUpdates.get(productId);
          if (item.varianteId) {
            const variants = [...(pData.variantes || [])];
            const vIdx = variants.findIndex((v: any) => v.id === item.varianteId);
            if (vIdx !== -1) {
              variants[vIdx] = { ...variants[vIdx], stock: (variants[vIdx].stock || 0) + item.cantidad };
              pData.variantes = variants;
              restoredStock = true;
            }
          } else {
            pData.stock = (pData.stock || 0) + item.cantidad;
            restoredStock = true;
          }
          
          if (pData.stock > 0 || (pData.variantes && pData.variantes.some((v:any) => v.stock > 0))) {
             pData.activo = true; // Reactive if it has stock again
          }
          productUpdates.set(productId, pData);
        }
      }

      // 4. Build Update Payload
      const updatePayload: Record<string, any> = {
        mpPaymentId: paymentId.toString(),
        mpStatus: mpStatus,
        mpStatusDetail: mpStatusDetail || "",
        mpPaymentMethod: mpPaymentMethod || "",
        mpTransactionAmount: mpTransactionAmount || orderData.mpTransactionAmount || 0,
        mpLastWebhookAt: new Date().toISOString(),
        mpLastUpdateAt: new Date().toISOString(),
      };

      if (!isDowngrade) {
        updatePayload.estado = newInternalStatus;
        if (newInternalStatus === "pagado" && !orderData.fechaPago) {
          updatePayload.fechaPago = new Date().toISOString();
        }
      }

      // 5. Apply Writes
      if (restoredStock) {
        for (const [pId, data] of productUpdates.entries()) {
          transaction.update(productRefs.get(pId)!, data);
        }
      }
      
      transaction.update(orderDocRef, updatePayload);

      return {
        isDowngrade,
        newStatus: isDowngrade ? currentStatus : newInternalStatus,
        duplicate: false,
        restoredStock,
        orderDataForCoupon: {
            cuponUsado: orderData.cuponUsado,
            cuponAcreditado: orderData.cuponAcreditado,
            total: mpTransactionAmount || orderData.total || 0
        }
      };
    });

    // 6. Global Coupon Accreditation Check (Post-Transaction)
    if (
      !result.isDowngrade && 
      !result.duplicate && 
      ["pagado", "entregado"].includes(result.newStatus) &&
      result.orderDataForCoupon && 
      result.orderDataForCoupon.cuponUsado && 
      !result.orderDataForCoupon.cuponAcreditado
    ) {
      try {
        const couponQuery = query(collection(db, "coupons"), where("codigo", "==", result.orderDataForCoupon.cuponUsado));
        const couponSnap = await getDocs(couponQuery);

        if (!couponSnap.empty) {
          const couponDocRef = couponSnap.docs[0].ref;
          const creditAmount = result.orderDataForCoupon.total;

          await updateDoc(couponDocRef, {
            usos: increment(1),
            dineroGenerado: increment(creditAmount),
          });

          // Mark order as credited
          await updateDoc(orderDocRef, { cuponAcreditado: true });
          logEvent('info', 'coupon_accredited', { coupon: result.orderDataForCoupon.cuponUsado, orderId, creditAmount });
        }
      } catch (couponError: any) {
        logEvent('error', 'coupon_accredit_failed', { orderId, message: couponError.message });
      }
    }

    return result;
  } catch (error: any) {
    logEvent('error', 'order_process_failed', { orderId, message: error.message });
    throw error;
  }
}
