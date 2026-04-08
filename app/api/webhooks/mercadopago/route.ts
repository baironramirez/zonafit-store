import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { processOrderUpdate } from "@/lib/orders";
import { client } from "@/lib/mercadopago";
import { Payment } from "mercadopago";
import crypto from "crypto";

/**
 * LOGGING PROFESIONAL ESTRUCTURADO
 */
function logEvent(level: 'info' | 'warn' | 'error', event: string, payload: any = {}) {
  const logMessage = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    ...payload
  });
  console[level](logMessage);
}

// Mapping moved to @/lib/orders.ts
import { mapPaymentStatus } from "@/lib/orders";

/**
 * Firm Verification using timingSafeEqual to prevent Timing Attacks
 * Follows MercadoPago documentation exactly:
 * Template: id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
 * - data.id comes ONLY from query params
 * - If data.id is not present in query, that part is OMITTED from the manifest
 * - If data.id is alphanumeric, it must be lowercased
 */
function verifySignatureSafe(req: Request): "valid" | "invalid" | "skip" {
  const secret = process.env.MP_WEBHOOK_SECRET;
  
  // Detectar si es IPN (Legacy) o Webhook (V2)
  const url = new URL(req.url);
  const isWebhook = url.searchParams.has("data.id");
  const isIPN = url.searchParams.has("topic") || (url.searchParams.has("id") && !isWebhook);

  if (!secret) {
    logEvent('warn', 'webhook_security_warning', { message: "MP_WEBHOOK_SECRET not configured" });
    return "skip"; 
  }

  // Si es IPN, Mercado Pago no soporta la verificación de firma con Secret Key según documentación oficial.
  if (isIPN && !isWebhook) {
    logEvent('info', 'webhook_ipn_detected', { message: "IPN detected, skipping signature verification", url: req.url });
    return "skip";
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) {
    // Si no es un webhook explícito de MP, pero tiene parámetros, podríamos saltarlo.
    // Pero si tiene x-signature y x-request-id, intentamos validar.
    if (!xSignature) return "skip";
    
    logEvent('warn', 'webhook_security_error', { type: "missing_headers", url: req.url });
    return "invalid";
  }

  // Parse x-signature header: "ts=xxx,v1=yyy"
  const parts: Record<string, string> = {};
  xSignature.split(",").forEach((part) => {
    const [key, value] = part.split("=");
    if (key && value) parts[key.trim()] = value.trim();
  });

  const ts = parts["ts"];
  const v1 = parts["v1"];

  if (!ts || !v1) {
    logEvent('warn', 'webhook_security_error', { type: "invalid_signature_format", header: xSignature });
    return "invalid";
  }

  // MP docs: El ID para el manifest viene de 'data.id'
  let dataId = url.searchParams.get("data.id") || "";

  // MP docs: if data.id is alphanumeric, convert to lowercase  
  if (dataId && /^[a-zA-Z0-9]+$/.test(dataId)) {
    dataId = dataId.toLowerCase();
  }

  // Build manifest string: id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
  let manifest = "";
  if (dataId) {
    manifest += `id:${dataId};`;
  }
  manifest += `request-id:${xRequestId};ts:${ts};`;

  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    const generatedBuffer = Buffer.from(hmac);
    const receivedBuffer = Buffer.from(v1.toLowerCase());

    if (generatedBuffer.length !== receivedBuffer.length) {
      logEvent('error', 'webhook_security_error', {
        type: "signature_length_mismatch",
        manifest_used: manifest,
        url_received: req.url
      });
      return "invalid";
    }

    const isValid = crypto.timingSafeEqual(generatedBuffer, receivedBuffer);

    if (!isValid) {
      logEvent('error', 'webhook_security_error', {
        type: "signature_mismatch",
        expected: v1,
        generated: hmac,
        manifest_used: manifest,
        url_received: req.url
      });
      return "invalid";
    } 
    
    return "valid";
  } catch (error) {
    logEvent('error', 'webhook_security_error', { type: "buffer_comparison_failed", error: (error as Error).message });
    return "invalid";
  }
}

export async function POST(req: Request) {
  logEvent('info', 'webhook_received', { url: req.url });

  try {
    const bodyText = await req.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      logEvent('error', 'webhook_data_error', { type: "invalid_json" });
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    logEvent('info', 'webhook_payload', { type: body.type, action: body.action, dataId: body.data?.id });

    // 1️⃣ Verify signature
    const sigStatus = verifySignatureSafe(req);
    if (sigStatus === "invalid") {
      logEvent('error', 'webhook_security_error', { type: "unauthorized_request" });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const url = new URL(req.url);
    const eventType = body.type || url.searchParams.get("type") || url.searchParams.get("topic");
    const resourceId = body.data?.id || url.searchParams.get("data.id") || url.searchParams.get("id");

    // 2️⃣ Filter Events
    // MercadoPago envía 'payment' o 'merchant_order'. 
    // Para simplificar, nos enfocamos en 'payment', pero permitimos que 'merchant_order' pase sin error (solo loggeamos).
    if (eventType !== "payment" && eventType !== "merchant_order") {
      logEvent('info', 'webhook_ignored', { reason: "unsupported_event_type", type: eventType });
      return NextResponse.json({ received: true });
    }

    if (!resourceId) {
      logEvent('error', 'webhook_data_error', { type: "missing_resource_id", eventType });
      return NextResponse.json({ received: true }); 
    }

    if (eventType === "merchant_order") {
       logEvent('info', 'webhook_merchant_order_received', { resourceId });
       // Por ahora no procesamos merchant_orders directamente, pero podrías consultar la orden 
       // para ver si todos sus pagos están aprobados.
       return NextResponse.json({ received: true });
    }

    const paymentId = resourceId;

    // 3️⃣ Fetch MP Data
    let paymentData;
    try {
      const payment = new Payment(client);
      paymentData = await payment.get({ id: paymentId });
    } catch (error: any) {
      logEvent('error', 'webhook_api_error', { type: "mercadopago_api_failure", paymentId, message: error.message });
      return NextResponse.json({ received: true }); // MercadoPago reintentará u omitiremos sabiamente
    }

    const mpStatus = paymentData.status || "unknown";
    const externalRef = paymentData.external_reference;
    const mpStatusDetail = paymentData.status_detail || "";
    const mpPaymentMethod = paymentData.payment_method_id || "";
    const mpTransactionAmount = paymentData.transaction_amount || 0;
    const mpCurrency = paymentData.currency_id || "COP";

    logEvent('info', 'webhook_payment_fetched', {
      paymentId,
      status: mpStatus,
      externalRef,
      amount: mpTransactionAmount,
      currency: mpCurrency
    });

    if (!externalRef) {
      logEvent('warn', 'webhook_data_warning', { type: "no_external_reference", paymentId });
      return NextResponse.json({ received: true });
    }

    // 4️⃣ Firestore Fetch Directo (Optimizado)
    const orderDocRef = doc(db, "orders", externalRef);
    const orderSnap = await getDoc(orderDocRef);

    if (!orderSnap.exists()) {
      logEvent('error', 'webhook_data_error', { type: "order_not_found", orderId: externalRef });
      return NextResponse.json({ received: true });
    }

    const orderData = orderSnap.data();

    // 5️⃣ Validaciones Estratégicas de Negocio (Monto y Moneda)
    if (mpCurrency !== "COP") {
      logEvent('warn', 'webhook_business_rule_warning', {
        type: "currency_mismatch",
        orderId: externalRef,
        expected: "COP",
        received: mpCurrency
      });
    }

    // Comparamos monto (tolerancia de centavos por flotantes)
    if (Math.abs(mpTransactionAmount - (orderData.total || 0)) > 0.05) {
      logEvent('error', 'webhook_business_rule_error', {
        type: "amount_mismatch",
        orderId: externalRef,
        expected: orderData.total,
        received: mpTransactionAmount
      });
      return NextResponse.json({ received: true, error: "amount_mismatch" }); // 200 para evitar loops infinitos
    }

    const newInternalStatus = mapPaymentStatus(mpStatus);

    // 6️⃣ Usar Función Unificada con Transacción e Idempotencia (Maneja Stock)
    try {
      const updateResult = await processOrderUpdate({
        orderId: externalRef,
        paymentId: paymentId.toString(),
        mpStatus,
        mpStatusDetail,
        mpPaymentMethod,
        mpTransactionAmount,
        logEvent,
      });

      logEvent('info', 'webhook_processed_successfully', { 
        orderId: externalRef, 
        paymentId, 
        status: updateResult.newStatus, 
        duplicate: updateResult.duplicate,
        restoredStock: updateResult.restoredStock
      });

      return NextResponse.json({ 
        received: true, 
        status: updateResult.newStatus,
        duplicate: updateResult.duplicate 
      });

    } catch (error: any) {
      logEvent('error', 'webhook_process_failed', { orderId: externalRef, message: error.message });
      return NextResponse.json({ received: true, error: error.message }, { status: 200 });
    }

  } catch (error: any) {
    logEvent('error', 'webhook_fatal_error', { message: error?.message || "Unknown error", stack: error?.stack });
    return NextResponse.json({ received: true, error: "Internal processing error softly handled" }, { status: 200 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("id");
  const force = url.searchParams.get("force") === "true";

  if (!orderId) {
    return NextResponse.json({ status: "ok", service: "mercadopago-webhook-pro" });
  }

  // Manual Trigger Logic (Useful for debugging/syncing)
  try {
    const { db } = await import("@/lib/firebase");
    const orderSnap = await getDoc(doc(db, "orders", orderId));

    if (!orderSnap.exists()) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderSnap.data();
    if (!orderData.mpPaymentId) {
      return NextResponse.json({ error: "Order has no mpPaymentId to sync" }, { status: 400 });
    }

    const payment = new Payment(client);
    const paymentData = await payment.get({ id: orderData.mpPaymentId });

    const result = await processOrderUpdate({
      orderId,
      paymentId: orderData.mpPaymentId,
      mpStatus: paymentData.status!,
      mpStatusDetail: paymentData.status_detail,
      mpPaymentMethod: paymentData.payment_method_id,
      mpTransactionAmount: paymentData.transaction_amount,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
