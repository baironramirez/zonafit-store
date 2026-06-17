import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { client } from "@/lib/mercadopago";
import { Payment } from "mercadopago";
import { processOrderUpdate } from "@/lib/orders";
import { verifyCronSecret } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/cron/sync-orders
 *
 * CRON Job para sincronizar órdenes pendientes con MercadoPago.
 * Garantiza que si un webhook fue perdido, la orden igual se actualice.
 *
 * ¿Por qué verifyCronSecret en lugar de verificación manual?
 * El helper acepta el secret vía header Authorization (estándar de Vercel Cron)
 * o vía query param (para pruebas manuales). Centralizar la lógica evita
 * divergencias si cambia la política de autenticación del cron.
 */
export async function GET(req: NextRequest) {
  // 1. Verificar que el llamador tiene el CRON_SECRET correcto
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log(`[CRON] Starting sync for pending orders...`);
  
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("estado", "==", "pendiente"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ message: "No pending orders to sync", count: 0 });
    }

    const pendingOrders = querySnapshot.docs.filter(doc => doc.data().mpPaymentId);

    console.log(`[CRON] Found ${pendingOrders.length} pending orders with payment IDs.`);

    const results = await Promise.allSettled(
      pendingOrders.map(async (doc) => {
        const orderId = doc.id;
        const orderData = doc.data();
        const paymentId = orderData.mpPaymentId;

        try {
          const payment = new Payment(client);
          const paymentData = await payment.get({ id: paymentId });

          return await processOrderUpdate({
            orderId,
            paymentId: paymentId.toString(),
            mpStatus: paymentData.status!,
            mpStatusDetail: paymentData.status_detail,
            mpPaymentMethod: paymentData.payment_method_id,
            mpTransactionAmount: paymentData.transaction_amount,
          });
        } catch (error: any) {
          console.error(`[CRON] Failed to sync order ${orderId}:`, error.message);
          throw error;
        }
      })
    );

    const successCount = results.filter(r => r.status === "fulfilled").length;
    const failCount = results.filter(r => r.status === "rejected").length;

    return NextResponse.json({
      message: "Sync complete",
      total: pendingOrders.length,
      success: successCount,
      failed: failCount
    });

  } catch (error: any) {
    console.error(`[CRON] Fatal error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
