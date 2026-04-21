import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { processOrderUpdate } from "@/lib/orders";
import { sendOrderNotification } from "@/lib/notifications";
import { sendOrderApprovedEmail } from "@/lib/emails";
import { client } from "@/lib/mercadopago";
import { Payment } from "mercadopago";
import crypto from "crypto";

/**
 * Logging estructurado para trazabilidad en Vercel
 */
function logEvent(level: 'info' | 'warn' | 'error', event: string, payload: any = {}) {
  const logMessage = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    ...payload
  });
  console[level](logMessage);
}

import { mapPaymentStatus } from "@/lib/orders";

/**
 * Verificación de firma HMAC-SHA256 siguiendo la documentación oficial de MercadoPago.
 * Template: id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
 * - data.id viene SOLO de query params
 * - Si data.id no está presente, se OMITE del manifest
 * - Si data.id es alfanumérico, se convierte a minúsculas
 * 
 * En entornos preview/dev sin MP_WEBHOOK_SECRET configurado, se hace bypass automático.
 * En producción, la clave DEBE estar configurada o se rechaza la petición.
 */
function verifySignatureSafe(req: Request): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    // Bypass automático en entornos de desarrollo/preview sin clave configurada
    const isProduction = process.env.VERCEL_ENV === "production";
    logEvent('warn', 'webhook_security_warning', { message: "MP_WEBHOOK_SECRET not configured", bypass: !isProduction });
    return !isProduction;
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) {
    logEvent('warn', 'webhook_security_error', { type: "missing_headers" });
    return false;
  }

  // Parsear x-signature header: "ts=xxx,v1=yyy"
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

  // data.id SOLO viene de query params (especificación de firma MP)
  const url = new URL(req.url);
  let dataId = url.searchParams.get("data.id") || url.searchParams.get("data_id");

  // Normalizar a minúsculas si es alfanumérico
  if (dataId && /^[a-zA-Z0-9]+$/.test(dataId)) {
    dataId = dataId.toLowerCase();
  }

  // Construir manifest condicionalmente (MP docs: omitir partes no presentes)
  let manifest = "";
  if (dataId) {
    manifest += `id:${dataId};`;
  }
  manifest += `request-id:${xRequestId};ts:${ts};`;

  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  // Comparación segura contra timing-attacks
  try {
    const generatedBuffer = Buffer.from(hmac);
    const receivedBuffer = Buffer.from(v1);

    if (generatedBuffer.length !== receivedBuffer.length) {
      logEvent('error', 'webhook_security_error', { type: "signature_length_mismatch" });
      return false;
    }

    const isValid = crypto.timingSafeEqual(generatedBuffer, receivedBuffer);

    if (!isValid) {
      logEvent('error', 'webhook_security_error', {
        type: "signature_mismatch",
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

    // 1️⃣ Filtrar eventos: solo procesamos pagos
    if (body.type !== "payment") {
      logEvent('info', 'webhook_ignored', { reason: "non_payment_event", type: body.type });
      return NextResponse.json({ received: true });
    }

    // 2️⃣ Verificar firma de seguridad
    if (!verifySignatureSafe(req)) {
      logEvent('error', 'webhook_security_error', { type: "unauthorized_request" });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      logEvent('error', 'webhook_data_error', { type: "missing_payment_id" });
      return NextResponse.json({ received: true });
    }

    // 3️⃣ Consultar datos del pago en MercadoPago
    let paymentData;
    try {
      const payment = new Payment(client);
      paymentData = await payment.get({ id: paymentId });
    } catch (error: any) {
      logEvent('error', 'webhook_api_error', { type: "mercadopago_api_failure", paymentId, message: error.message });
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
      logEvent('warn', 'webhook_data_warning', { type: "no_external_reference", paymentId });
      return NextResponse.json({ received: true });
    }

    // 4️⃣ Buscar orden en Firestore
    const orderDocRef = doc(db, "orders", externalRef);
    const orderSnap = await getDoc(orderDocRef);

    if (!orderSnap.exists()) {
      logEvent('error', 'webhook_data_error', { type: "order_not_found", orderId: externalRef });
      return NextResponse.json({ received: true });
    }

    const orderData = orderSnap.data();

    // 5️⃣ Validaciones de negocio (monto y moneda)
    if (mpCurrency !== "COP") {
      logEvent('warn', 'webhook_business_rule_warning', {
        type: "currency_mismatch",
        orderId: externalRef,
        expected: "COP",
        received: mpCurrency
      });
    }

    if (Math.abs(mpTransactionAmount - (orderData.total || 0)) > 0.05) {
      logEvent('error', 'webhook_business_rule_error', {
        type: "amount_mismatch",
        orderId: externalRef,
        expected: orderData.total,
        received: mpTransactionAmount
      });
      return NextResponse.json({ received: true, error: "amount_mismatch" });
    }

    const newInternalStatus = mapPaymentStatus(mpStatus);

    // 6️⃣ Procesar actualización de orden (transacción + idempotencia + stock)
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

      // 7️⃣ Notificar al admin vía WhatsApp
      // Se usa await porque en Vercel serverless el proceso muere al retornar la response
      // y un fetch sin await nunca se completa. Los errores se capturan internamente.
      if (!updateResult.duplicate) {
        await sendOrderNotification({
          orderId: externalRef,
          customerName: orderData.nombre || orderData.customerName || "Cliente",
          customerPhone: orderData.telefono || orderData.phone || "",
          total: mpTransactionAmount,
          paymentMethod: mpPaymentMethod,
          status: updateResult.newStatus,
          items: orderData.items || [],
        });

        // 8️⃣ Notificar al cliente vía Email si el pago fue aprobado
        // Diagnóstico: logueamos TODOS los campos posibles donde puede estar el email
        const customerEmail = orderData.cliente?.correo || orderData.correo || orderData.email || "";
        logEvent('info', 'email_diagnosis', {
          orderId: externalRef,
          newStatus: updateResult.newStatus,
          customerEmail,
          clienteObj: orderData.cliente ? JSON.stringify(orderData.cliente) : 'NO_EXISTE',
          hasCorreo: !!orderData.correo,
          hasEmail: !!orderData.email,
          hasClienteCorreo: !!orderData.cliente?.correo,
          allTopLevelKeys: Object.keys(orderData),
        });

        if (updateResult.newStatus === "pagado" && customerEmail) {
          logEvent('info', 'email_sending_now', { orderId: externalRef, to: customerEmail });
          const emailResult = await sendOrderApprovedEmail(customerEmail, {
             id: externalRef,
             total: mpTransactionAmount,
             items: orderData.items || []
          });
          logEvent('info', 'email_send_result', { orderId: externalRef, success: emailResult.success, data: emailResult.data });
        } else {
          logEvent('warn', 'email_skipped', {
            orderId: externalRef,
            reason: !customerEmail ? 'NO_EMAIL_FOUND' : `STATUS_IS_${updateResult.newStatus}`,
          });
        }
      }

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

  // Sincronización manual (útil para admin/debugging)
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
