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
 * Verificación de firma HMAC
 */
function verifySignatureSafe(req: Request, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    logEvent('warn', 'webhook_security_warning', { message: "MP_WEBHOOK_SECRET not configured" });
    return true;
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) {
    logEvent('warn', 'webhook_security_error', { type: "missing_headers" });
    return false;
  }

  const parts: Record<string, string> = {};
  xSignature.split(",").forEach((part) => {
    const [key, value] = part.split("=");
    if (key && value) parts[key.trim()] = value.trim();
  });

  const ts = parts["ts"];
  const v1 = parts["v1"];

  if (!ts || !v1) {
    logEvent('warn', 'webhook_security_error', { type: "invalid_signature_format" });
    return false;
  }

  // ✅ FIX: resolver dataId correctamente
  let dataId = "";
  try {
    const url = new URL(req.url);
    dataId =
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      "";
  } catch { }

  if (!dataId) {
    try {
      const parsed = JSON.parse(rawBody);
      dataId = parsed?.data?.id || "";
    } catch { }
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const hmac = crypto.createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  try {
    // ✅ FIX: usar encoding HEX
    const generatedBuffer = Buffer.from(hmac, "hex");
    const receivedBuffer = Buffer.from(v1, "hex");

    if (generatedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    const isValid = crypto.timingSafeEqual(generatedBuffer, receivedBuffer);

    if (!isValid) {
      logEvent('error', 'webhook_security_error', {
        type: "signature_mismatch",
        expected: v1,
        generated: hmac,
        manifest
      });
    } else {
      logEvent('info', 'webhook_signature_verified', { dataId });
    }

    return isValid;
  } catch (error) {
    logEvent('error', 'webhook_security_error', {
      type: "buffer_error",
      error: (error as Error).message
    });
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
    } catch {
      logEvent('error', 'webhook_data_error', { type: "invalid_json" });
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType = body.type || body.topic;

    // ✅ FIX: filtrar ANTES de verificar firma
    if (eventType !== "payment") {
      logEvent('info', 'webhook_ignored', { reason: "non_payment_event", eventType });
      return NextResponse.json({ received: true });
    }

    logEvent('info', 'webhook_payload', {
      type: body.type,
      action: body.action,
      dataId: body.data?.id
    });

    // ✅ Verificar firma SOLO para payment
    if (!verifySignatureSafe(req, bodyText)) {
      logEvent('error', 'webhook_security_error', { type: "unauthorized_request" });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      logEvent('error', 'webhook_data_error', { type: "missing_payment_id" });
      return NextResponse.json({ received: true });
    }

    // 3️⃣ Fetch MP Data
    let paymentData;
    try {
      const payment = new Payment(client);
      paymentData = await payment.get({ id: paymentId });
    } catch (error: any) {
      logEvent('error', 'webhook_api_error', { paymentId, message: error.message });
      return NextResponse.json({ received: true });
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
      return NextResponse.json({ received: true });
    }

    const orderDocRef = doc(db, "orders", externalRef);
    const orderSnap = await getDoc(orderDocRef);

    if (!orderSnap.exists()) {
      return NextResponse.json({ received: true });
    }

    const orderData = orderSnap.data();

    if (Math.abs(mpTransactionAmount - (orderData.total || 0)) > 0.05) {
      return NextResponse.json({ received: true });
    }

    const newInternalStatus = mapPaymentStatus(mpStatus);

    if (
      orderData.mpPaymentId === paymentId.toString() &&
      orderData.mpStatus === mpStatus &&
      orderData.estado === newInternalStatus
    ) {
      return NextResponse.json({ received: true });
    }

    const statusPriority: Record<string, number> = {
      pendiente: 0,
      pagado: 1,
      enviado: 2,
      entregado: 3,
      rechazado: 4,
      reembolsado: 4,
    };

    const isDowngrade =
      (statusPriority[newInternalStatus] ?? 0) <
      (statusPriority[orderData.estado] ?? 0);

    const updatePayload: Record<string, any> = {
      mpPaymentId: paymentId.toString(),
      mpStatus,
      mpStatusDetail,
      mpPaymentMethod,
      mpTransactionAmount,
      mpLastWebhookAt: new Date().toISOString(),
    };

    if (!isDowngrade) {
      updatePayload.estado = newInternalStatus;
      if (newInternalStatus === "pagado" && !orderData.fechaPago) {
        updatePayload.fechaPago = new Date().toISOString();
      }
    }

    await updateDoc(orderDocRef, updatePayload);

    logEvent('info', 'webhook_processed_successfully', {
      orderId: externalRef,
      paymentId
    });

    return NextResponse.json({ received: true });

  } catch (error: any) {
    logEvent('error', 'webhook_fatal_error', { message: error?.message });
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "mercadopago-webhook-pro" });
}