import { NextResponse } from "next/server";
import { client } from "@/lib/mercadopago";
import { Payment } from "mercadopago";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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

/**
 * MP Status to Internal Status Mapping
 */
function mapPaymentStatus(mpStatus: string): string {
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

/**
 * Firm Verification using timingSafeEqual to prevent Timing Attacks
 * Follows MercadoPago documentation exactly:
 * Template: id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
 * - data.id comes ONLY from query params
 * - If data.id is not present in query, that part is OMITTED from the manifest
 * - If data.id is alphanumeric, it must be lowercased
 */
function verifySignatureSafe(req: Request, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    logEvent('warn', 'webhook_security_warning', { message: "MP_WEBHOOK_SECRET not configured, skipping signature verification" });
    return true; // Solo para dev inicial. En prod esto debería retornar false.
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) {
    logEvent('warn', 'webhook_security_error', { type: "missing_headers", hasSignature: !!xSignature, hasRequestId: !!xRequestId });
    return false;
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
    return false;
  }

  // data.id MUST come from query params according to MP docs
  const url = new URL(req.url);
  let dataId = url.searchParams.get("data.id") || url.searchParams.get("data_id") || "";

  // MP docs: if data.id is alphanumeric, convert to lowercase  
  if (dataId && /^[a-zA-Z0-9]+$/.test(dataId)) {
    dataId = dataId.toLowerCase();
  }

  // Build manifest string conditionally (MP docs: omit parts that are not present)
  let manifest = "";
  if (dataId) {
    manifest += `id:${dataId};`;
  }
  manifest += `request-id:${xRequestId};ts:${ts};`;
  
  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  logEvent('info', 'webhook_signature_debug', { 
    dataId: dataId || "(empty/omitted)",
    requestId: xRequestId,
    ts,
    manifest,
    generatedHmac: hmac.substring(0, 10) + "...",
    receivedV1: v1.substring(0, 10) + "...",
  });

  // Comparación segura (anti timing-attacks)
  try {
    const generatedBuffer = Buffer.from(hmac);
    const receivedBuffer = Buffer.from(v1);
    
    if (generatedBuffer.length !== receivedBuffer.length) {
      logEvent('error', 'webhook_security_error', { 
        type: "signature_length_mismatch",
        generatedLen: generatedBuffer.length,
        receivedLen: receivedBuffer.length
      });
      return false;
    }
    
    const isValid = crypto.timingSafeEqual(generatedBuffer, receivedBuffer);
    
    if (!isValid) {
      logEvent('error', 'webhook_security_error', { 
        type: "signature_mismatch",
        expected: v1,
        generated: hmac,
        manifest_used: manifest
      });
    }
    return isValid;
  } catch (error) {
    logEvent('error', 'webhook_security_error', { type: "buffer_comparison_failed", error: (error as Error).message });
    return false;
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
    if (!verifySignatureSafe(req, bodyText)) {
      logEvent('error', 'webhook_security_error', { type: "unauthorized_request" });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2️⃣ Filter Events
    if (body.type !== "payment") {
      logEvent('info', 'webhook_ignored', { reason: "non_payment_event", type: body.type });
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      logEvent('error', 'webhook_data_error', { type: "missing_payment_id" });
      return NextResponse.json({ received: true }); // SIEMPRE 200 excepto error de firma
    }

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

    // 6️⃣ Idempotencia Estricta
    if (
      orderData.mpPaymentId === paymentId.toString() && 
      orderData.mpStatus === mpStatus && 
      orderData.estado === newInternalStatus
    ) {
      logEvent('info', 'webhook_duplicate_ignored', { orderId: externalRef, paymentId, status: mpStatus });
      return NextResponse.json({ received: true, duplicate: true });
    }

    // 7️⃣ Lógica de Prioridades Limpia (No Downgrade)
    const statusPriority: Record<string, number> = {
      pendiente: 0,
      pagado: 1,
      enviado: 2,
      entregado: 3,
      rechazado: 4, 
      reembolsado: 4, 
    };

    const currentPriority = statusPriority[orderData.estado] ?? 0;
    const newPriority = statusPriority[newInternalStatus] ?? 0;

    // Actualiza siempre si la nueva prioridad es mayor.
    // O si es la misma prioridad (ej: pagado -> pagado) para refrescar datos MP.
    // PERO bloquea cosas raras como enviado(2) -> pendiente(0).
    const isDowngrade = newPriority < currentPriority;

    // 8️⃣ Guardar en Base de Datos
    const updatePayload: Record<string, any> = {
      mpPaymentId: paymentId.toString(),
      mpStatus: mpStatus,
      mpStatusDetail: mpStatusDetail,
      mpPaymentMethod: mpPaymentMethod,
      mpTransactionAmount: mpTransactionAmount,
      mpLastWebhookAt: new Date().toISOString(),
    };

    if (!isDowngrade) {
      updatePayload.estado = newInternalStatus;
      // No sobrescribir fechaPago si ya existe
      if (newInternalStatus === "pagado" && !orderData.fechaPago) {
        updatePayload.fechaPago = new Date().toISOString();
      }
      logEvent('info', 'webhook_order_updating', { orderId: externalRef, oldStatus: orderData.estado, newStatus: newInternalStatus });
    } else {
      logEvent('warn', 'webhook_status_downgrade_prevented', { 
        orderId: externalRef, 
        attemptedStatus: newInternalStatus, 
        currentStatus: orderData.estado 
      });
    }

    await updateDoc(orderDocRef, updatePayload);
    logEvent('info', 'webhook_processed_successfully', { orderId: externalRef, paymentId });



    return NextResponse.json({ received: true, status: isDowngrade ? orderData.estado : newInternalStatus });

  } catch (error: any) {
    logEvent('error', 'webhook_fatal_error', { message: error?.message || "Unknown error", stack: error?.stack });
    // CRÍTICO: Siempre 200 ante fallas internas para que MP no enloquezca si no es necesario.
    return NextResponse.json({ received: true, error: "Internal processing error softly handled" }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "mercadopago-webhook-pro" });
}
