import { NextResponse } from "next/server";
import { client } from "@/lib/mercadopago";
import { Payment } from "mercadopago";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────

function logEvent(level: 'info' | 'warn' | 'error', event: string, payload: any = {}) {
  console[level](JSON.stringify({ event, timestamp: new Date().toISOString(), ...payload }));
}

function mapPaymentStatus(mpStatus: string): string {
  const map: Record<string, string> = {
    approved: "pagado",
    pending: "pendiente",
    in_process: "pendiente",
    in_mediation: "pendiente",
    authorized: "pendiente",
    rejected: "rechazado",
    cancelled: "rechazado",
    refunded: "reembolsado",
    charged_back: "reembolsado",
  };
  return map[mpStatus] || "pendiente";
}

// ─────────────────────────────────────────────────────────────
// VERIFICACIÓN DE FIRMA HMAC (solo para eventos payment)
// Template: id:[data.id];request-id:[x-request-id];ts:[ts];
// ─────────────────────────────────────────────────────────────

function verifyPaymentSignature(req: Request, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    logEvent('warn', 'webhook_no_secret', { message: "MP_WEBHOOK_SECRET no configurado, saltando verificación" });
    return true;
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) {
    logEvent('warn', 'webhook_security_error', { type: "missing_headers" });
    return false;
  }

  // Parsear "ts=xxx,v1=yyy"
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

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  // Comparación segura contra timing attacks
  try {
    const generatedBuf = Buffer.from(hmac);
    const receivedBuf = Buffer.from(v1);

    if (generatedBuf.length !== receivedBuf.length) {
      logEvent('error', 'webhook_security_error', { type: "signature_mismatch", manifest });
      return false;
    }

    const isValid = crypto.timingSafeEqual(generatedBuf, receivedBuf);

    if (isValid) {
      logEvent('info', 'webhook_signature_verified', { dataId });
    } else {
      logEvent('error', 'webhook_security_error', {
        type: "signature_mismatch",
        manifest,
        expected: v1,
        generated: hmac,
      });
    }

    return isValid;
  } catch (error) {
    logEvent('error', 'webhook_security_error', { type: "comparison_error", error: (error as Error).message });
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// RESOLUCIÓN DE data.id (query params → body fallback)
// ─────────────────────────────────────────────────────────────

function resolveDataId(req: Request, body: any): string {
  const url = new URL(req.url);

  // 1. Query param: data.id
  const fromQuery = url.searchParams.get("data.id")
    || url.searchParams.get("data_id")
    || url.searchParams.get("id")
    || "";

  if (fromQuery) return fromQuery;

  // 2. Body fallback: body.data.id
  if (body?.data?.id != null) return String(body.data.id);

  return "";
}

// ─────────────────────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  logEvent('info', 'webhook_received', { url: req.url });

  try {
    // ── 1. Parsear body ──────────────────────────────────────
    const bodyText = await req.text();
    let body: any;
    try {
      body = JSON.parse(bodyText);
    } catch {
      logEvent('error', 'webhook_parse_error', { type: "invalid_json" });
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType = body.type || body.topic || "unknown";

    // ── 2. Filtro temprano: ignorar eventos que NO son payment ─
    if (eventType !== "payment") {
      logEvent('info', 'webhook_ignored', {
        reason: "non_payment_event",
        eventType,
        action: body.action,
      });
      return NextResponse.json({ received: true, ignored: true });
    }

    // ── 3. Resolver data.id y verificar firma (solo payment) ──
    const dataId = resolveDataId(req, body);

    logEvent('info', 'webhook_payment_event', {
      action: body.action,
      dataId,
    });

    if (!verifyPaymentSignature(req, dataId)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // ── 4. Obtener datos del pago desde MP API ───────────────
    const paymentId = body.data?.id;
    if (!paymentId) {
      logEvent('error', 'webhook_data_error', { type: "missing_payment_id" });
      return NextResponse.json({ received: true });
    }

    let paymentData;
    try {
      const payment = new Payment(client);
      paymentData = await payment.get({ id: paymentId });
    } catch (error: any) {
      logEvent('error', 'webhook_api_error', { type: "mp_api_failure", paymentId, message: error.message });
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
      currency: mpCurrency,
    });

    if (!externalRef) {
      logEvent('warn', 'webhook_data_warning', { type: "no_external_reference", paymentId });
      return NextResponse.json({ received: true });
    }

    // ── 5. Buscar orden en Firestore ─────────────────────────
    const orderDocRef = doc(db, "orders", externalRef);
    const orderSnap = await getDoc(orderDocRef);

    if (!orderSnap.exists()) {
      logEvent('error', 'webhook_data_error', { type: "order_not_found", orderId: externalRef });
      return NextResponse.json({ received: true });
    }

    const orderData = orderSnap.data();

    // ── 6. Validación de moneda ──────────────────────────────
    if (mpCurrency !== "COP") {
      logEvent('warn', 'webhook_business_warning', {
        type: "currency_mismatch",
        orderId: externalRef,
        expected: "COP",
        received: mpCurrency,
      });
    }

    // ── 7. Validación de monto (tolerancia de centavos) ──────
    if (Math.abs(mpTransactionAmount - (orderData.total || 0)) > 0.05) {
      logEvent('error', 'webhook_business_error', {
        type: "amount_mismatch",
        orderId: externalRef,
        expected: orderData.total,
        received: mpTransactionAmount,
      });
      return NextResponse.json({ received: true, error: "amount_mismatch" });
    }

    const newInternalStatus = mapPaymentStatus(mpStatus);

    // ── 8. Idempotencia estricta ─────────────────────────────
    if (
      orderData.mpPaymentId === paymentId.toString() &&
      orderData.mpStatus === mpStatus &&
      orderData.estado === newInternalStatus
    ) {
      logEvent('info', 'webhook_duplicate_ignored', { orderId: externalRef, paymentId });
      return NextResponse.json({ received: true, duplicate: true });
    }

    // ── 9. Anti-downgrade de estados ─────────────────────────
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
    const isDowngrade = newPriority < currentPriority;

    // ── 10. Guardar en Firestore ─────────────────────────────
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
      logEvent('info', 'webhook_order_updating', {
        orderId: externalRef,
        from: orderData.estado,
        to: newInternalStatus,
      });
    } else {
      logEvent('warn', 'webhook_downgrade_prevented', {
        orderId: externalRef,
        attempted: newInternalStatus,
        current: orderData.estado,
      });
    }

    await updateDoc(orderDocRef, updatePayload);
    logEvent('info', 'webhook_processed_ok', { orderId: externalRef, paymentId });

    return NextResponse.json({ received: true, status: isDowngrade ? orderData.estado : newInternalStatus });

  } catch (error: any) {
    logEvent('error', 'webhook_fatal_error', { message: error?.message || "Unknown" });
    // Siempre 200 ante fallas internas para que MP no reintente infinitamente
    return NextResponse.json({ received: true, error: "soft_internal_error" }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "mercadopago-webhook-v2" });
}
