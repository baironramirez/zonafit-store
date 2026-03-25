import { NextResponse } from "next/server";
import { client } from "@/lib/mercadopago";
import { Payment } from "mercadopago";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import crypto from "crypto";

/**
 * MercadoPago Webhook Handler
 * 
 * Handles payment notifications (IPN) from MercadoPago.
 * Verifies HMAC signature, checks idempotency, and updates order status in Firestore.
 * 
 * Configured events: payment, point_integration_wh (fraud alerts)
 */

// Map MercadoPago payment status to our internal order status
function mapPaymentStatus(mpStatus: string): string {
  switch (mpStatus) {
    case "approved":
      return "pagado";
    case "rejected":
    case "cancelled":
      return "rechazado";
    case "refunded":
    case "charged_back":
      return "reembolsado";
    case "pending":
    case "in_process":
    case "in_mediation":
    default:
      return "pendiente";
  }
}

// Verify MercadoPago webhook signature (HMAC-SHA256)
function verifySignature(req: Request, body: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[Webhook] MP_WEBHOOK_SECRET not configured, skipping signature verification");
    return true; // Allow in development
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) {
    console.warn("[Webhook] Missing x-signature or x-request-id headers");
    return false;
  }

  // Parse x-signature header: "ts=...,v1=..."
  const parts: Record<string, string> = {};
  xSignature.split(",").forEach((part) => {
    const [key, value] = part.split("=");
    if (key && value) parts[key.trim()] = value.trim();
  });

  const ts = parts["ts"];
  const v1 = parts["v1"];

  if (!ts || !v1) {
    console.warn("[Webhook] Invalid x-signature format");
    return false;
  }

  // Get data_id from URL query params
  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") || "";

  // Build the manifest string as per MercadoPago docs
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  // Create HMAC-SHA256
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(manifest);
  const generatedHash = hmac.digest("hex");

  const isValid = generatedHash === v1;

  if (!isValid) {
    console.error("[Webhook] Signature verification FAILED");
    console.error("[Webhook] Expected:", v1);
    console.error("[Webhook] Generated:", generatedHash);
  }

  return isValid;
}

export async function POST(req: Request) {
  console.log("[Webhook] ========== Incoming MercadoPago Webhook ==========");

  try {
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);

    console.log("[Webhook] Type:", body.type);
    console.log("[Webhook] Action:", body.action);
    console.log("[Webhook] Data ID:", body.data?.id);

    // 1️⃣ Verify signature
    if (!verifySignature(req, bodyText)) {
      console.error("[Webhook] ❌ Signature verification failed - rejecting");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    console.log("[Webhook] ✅ Signature verified");

    // 2️⃣ Only process payment notifications
    if (body.type !== "payment") {
      console.log("[Webhook] ℹ️ Ignoring non-payment notification:", body.type);
      return NextResponse.json({ received: true, ignored: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      console.error("[Webhook] ❌ No payment ID in notification");
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    // 3️⃣ Fetch full payment details from MercadoPago API
    console.log("[Webhook] 🔍 Fetching payment details for ID:", paymentId);
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    const mpStatus = paymentData.status || "unknown";
    const externalRef = paymentData.external_reference;
    const mpStatusDetail = paymentData.status_detail || "";
    const mpPaymentMethod = paymentData.payment_method_id || "";
    const mpTransactionAmount = paymentData.transaction_amount || 0;

    console.log("[Webhook] Payment Status:", mpStatus);
    console.log("[Webhook] Status Detail:", mpStatusDetail);
    console.log("[Webhook] External Reference (orderId):", externalRef);
    console.log("[Webhook] Amount:", mpTransactionAmount);

    if (!externalRef) {
      console.warn("[Webhook] ⚠️ Payment has no external_reference, cannot match to order");
      return NextResponse.json({ received: true, warning: "No external_reference" });
    }

    // 4️⃣ Find the order in Firestore by document ID (external_reference = orderId)
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("__name__", "==", externalRef));
    // __name__ won't work directly, let's use getDocs approach
    const { doc: firestoreDoc, getDoc: firestoreGetDoc } = await import("firebase/firestore");
    const orderDocRef = firestoreDoc(db, "orders", externalRef);
    const orderSnap = await firestoreGetDoc(orderDocRef);

    if (!orderSnap.exists()) {
      console.error("[Webhook] ❌ Order not found in Firestore:", externalRef);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderSnap.data();
    console.log("[Webhook] 📦 Order found. Current status:", orderData.estado);

    // 5️⃣ Idempotency check - don't process the same payment twice
    if (orderData.mpPaymentId === paymentId.toString() && orderData.mpStatus === mpStatus) {
      console.log("[Webhook] ℹ️ Payment already processed (idempotent), skipping");
      return NextResponse.json({ received: true, duplicate: true });
    }

    // 6️⃣ Don't downgrade order status (e.g., don't go from "enviado" back to "pagado")
    const statusPriority: Record<string, number> = {
      pendiente: 0,
      rechazado: 1,
      reembolsado: 1,
      pagado: 2,
      enviado: 3,
      entregado: 4,
    };

    const newInternalStatus = mapPaymentStatus(mpStatus);
    const currentPriority = statusPriority[orderData.estado] ?? 0;
    const newPriority = statusPriority[newInternalStatus] ?? 0;

    // Allow update if: new status has higher priority, OR it's a rejection/refund
    const shouldUpdateStatus = newPriority > currentPriority || 
      newInternalStatus === "rechazado" || 
      newInternalStatus === "reembolsado";

    // 7️⃣ Update order in Firestore
    const updatePayload: Record<string, any> = {
      mpPaymentId: paymentId.toString(),
      mpStatus: mpStatus,
      mpStatusDetail: mpStatusDetail,
      mpPaymentMethod: mpPaymentMethod,
      mpTransactionAmount: mpTransactionAmount,
      mpLastWebhookAt: new Date().toISOString(),
    };

    if (shouldUpdateStatus) {
      updatePayload.estado = newInternalStatus;
      if (newInternalStatus === "pagado") {
        updatePayload.fechaPago = new Date().toISOString();
      }
      console.log("[Webhook] ✅ Updating order status:", orderData.estado, "→", newInternalStatus);
    } else {
      console.log("[Webhook] ℹ️ Keeping current status:", orderData.estado, "(not downgrading to", newInternalStatus, ")");
    }

    await updateDoc(orderDocRef, updatePayload);
    console.log("[Webhook] ✅ Order updated successfully");
    console.log("[Webhook] ========== Webhook Processing Complete ==========");

    return NextResponse.json({ received: true, status: newInternalStatus });

  } catch (error: any) {
    console.error("[Webhook] ❌ Error processing webhook:", error?.message || error);
    console.error("[Webhook] Stack:", error?.stack);

    // Always return 200 to MercadoPago to avoid retries on our errors
    // (only return non-200 for auth failures)
    return NextResponse.json({ error: "Internal processing error" }, { status: 200 });
  }
}

// MercadoPago may also send GET requests for verification
export async function GET() {
  return NextResponse.json({ status: "ok", service: "mercadopago-webhook" });
}
