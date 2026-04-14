/**
 * Servicio de notificaciones para el admin.
 *
 * ¿Por qué un servicio aislado?
 * - Principio de responsabilidad única: el webhook orquesta, este módulo solo notifica.
 * - Si mañana migramos a WhatsApp Business API oficial o Firebase Cloud Messaging,
 *   solo cambiamos este archivo sin tocar nada más.
 * - Fire-and-forget: una falla aquí NUNCA debe bloquear el procesamiento del pedido.
 */

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────

interface OrderNotificationData {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  total: number;
  paymentMethod: string;
  status: string; // estado interno: pagado, pendiente, rechazado, reembolsado
  items: Array<{
    nombre?: string;
    title?: string;
    cantidad: number;
    variante?: string;
  }>;
}

// ──────────────────────────────────────────────
// Mapeo de estados a emojis/etiquetas para el mensaje
// ──────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { emoji: string; label: string }> = {
  pagado:      { emoji: "✅", label: "PAGO APROBADO" },
  pendiente:   { emoji: "⏳", label: "PAGO PENDIENTE" },
  rechazado:   { emoji: "❌", label: "PAGO RECHAZADO" },
  reembolsado: { emoji: "↩️", label: "REEMBOLSO" },
};

// ──────────────────────────────────────────────
// Formateo del mensaje
// ──────────────────────────────────────────────

function formatOrderMessage(data: OrderNotificationData): string {
  const statusInfo = STATUS_CONFIG[data.status] || { emoji: "📋", label: data.status.toUpperCase() };

  // Formatear total como moneda colombiana
  const totalFormatted = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(data.total);

  // Construir lista de productos
  const productList = data.items
    .map((item) => {
      const name = item.nombre || item.title || "Producto";
      const variant = item.variante ? ` (${item.variante})` : "";
      return `  • ${name}${variant} x${item.cantidad}`;
    })
    .join("\n");

  // Construir mensaje limpio y legible en WhatsApp
  const lines = [
    `${statusInfo.emoji} *${statusInfo.label} - ZonaFit*`,
    ``,
    `👤 Cliente: ${data.customerName}`,
  ];

  if (data.customerPhone) {
    lines.push(`📱 Tel: ${data.customerPhone}`);
  }

  lines.push(
    `💰 Total: ${totalFormatted}`,
    `💳 Método: ${data.paymentMethod || "N/A"}`,
    ``,
    `📦 Productos:`,
    productList,
    ``,
    `🔗 Ver pedido: ${process.env.NEXT_PUBLIC_BASE_URL || "https://zonafit-store.vercel.app"}/admin/pedidos`,
  );

  return lines.join("\n");
}

// ──────────────────────────────────────────────
// Envío vía CallMeBot (WhatsApp)
// ──────────────────────────────────────────────

async function sendWhatsAppMessage(message: string): Promise<boolean> {
  const phone = process.env.WHATSAPP_ADMIN_PHONE;
  const apikey = process.env.WHATSAPP_CALLMEBOT_APIKEY;

  if (!phone || !apikey) {
    console.warn(
      JSON.stringify({
        event: "notification_skipped",
        reason: "WHATSAPP_ADMIN_PHONE o WHATSAPP_CALLMEBOT_APIKEY no configurados",
        timestamp: new Date().toISOString(),
      })
    );
    return false;
  }

  // CallMeBot requiere el texto URL-encoded
  const encodedMessage = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedMessage}&apikey=${apikey}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      // Timeout de 10 segundos para no bloquear el webhook
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      console.info(
        JSON.stringify({
          event: "notification_sent",
          channel: "whatsapp_callmebot",
          phone,
          timestamp: new Date().toISOString(),
        })
      );
      return true;
    } else {
      console.error(
        JSON.stringify({
          event: "notification_failed",
          channel: "whatsapp_callmebot",
          status: response.status,
          statusText: response.statusText,
          timestamp: new Date().toISOString(),
        })
      );
      return false;
    }
  } catch (error: any) {
    // Silenciar errores para no afectar el flujo del webhook
    console.error(
      JSON.stringify({
        event: "notification_error",
        channel: "whatsapp_callmebot",
        message: error?.message || "Unknown error",
        timestamp: new Date().toISOString(),
      })
    );
    return false;
  }
}

// ──────────────────────────────────────────────
// API pública del servicio
// ──────────────────────────────────────────────

/**
 * Envía una notificación al admin sobre un cambio de estado en un pedido.
 *
 * ¿Por qué async/await y no fire-and-forget?
 * En Vercel serverless, el runtime mata el proceso al enviar la response HTTP.
 * Si el fetch a CallMeBot no se await-ea, la función se corta antes de completar
 * el envío y el mensaje nunca llega. La latencia extra (~500ms) es aceptable
 * porque MercadoPago tolera respuestas de hasta 10s en webhooks.
 *
 * Los errores se capturan internamente: si CallMeBot falla, el webhook sigue OK.
 */
export async function sendOrderNotification(data: OrderNotificationData): Promise<void> {
  try {
    const message = formatOrderMessage(data);
    await sendWhatsAppMessage(message);
  } catch {
    // Errores ya logueados dentro de sendWhatsAppMessage.
    // Aquí solo prevenimos que un error no capturado rompa el webhook.
  }
}
