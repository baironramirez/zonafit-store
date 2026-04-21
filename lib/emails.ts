import { Resend } from 'resend';

// IMPORTANTE: Hasta que no configures un dominio propio verificado en Resend (ej: zonafit.com), 
// debemos usar el correo base 'onboarding@resend.dev' para el remitente.
const FROM_EMAIL = 'onboarding@resend.dev';

// URL base dinámica: usa la variable de entorno de Vercel para que cada entorno apunte a su dominio correcto
const getBaseUrl = () => process.env.NEXT_PUBLIC_BASE_URL || 'https://zonafit-store.vercel.app';

// Función segura para instanciar en tiempo de ejecución (evita problemas de variables de entorno en compilación Vercel)
const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("ADVERTENCIA: RESEND_API_KEY no está definido en las variables de entorno.");
  }
  return new Resend(process.env.RESEND_API_KEY);
};

/**
 * Plantilla HTML estática reutilizable para correos transaccionales de la marca.
 * Incluye cabecera oscura y diseño premium estilo ZonaFit.
 */
function getEmailLayout(contentHtml: string) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f7; color: #111111; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .header { background-color: #000000; padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
        .content { padding: 40px 30px; }
        .content p { font-size: 16px; line-height: 1.6; color: #444444; }
        .footer { background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee; }
        .btn { display: inline-block; padding: 14px 28px; background-color: #000000; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 6px; margin-top: 20px; text-transform: uppercase; letter-spacing: 1px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ZONAFIT</h1>
        </div>
        <div class="content">
          ${contentHtml}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ZonaFit Store. Todos los derechos reservados.</p>
          <p>Este es un correo automático, por favor no respondas a esta dirección.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Envío del correo de bienvenida para nuevos registros.
 */
export async function sendWelcomeEmail(toEmail: string) {
  try {
    const content = `
      <h2 style="margin-top: 0; font-size: 24px; font-weight: 800; text-transform: uppercase;">¡Bienvenido a la Élite!</h2>
      <p>Hola futuro atleta,</p>
      <p>Tu cuenta en <strong>ZonaFit</strong> ha sido forjada con éxito. A partir de este momento, tienes acceso a la mejor suplementación y equipo para llevar tu entrenamiento al máximo nivel.</p>
      <p>Nuestro enfoque es claro: disciplina, rendimiento y resultados.</p>
      <div style="text-align: center;">
        <a href="${getBaseUrl()}/" class="btn">Explorar Combos y Productos</a>
      </div>
    `;

    const resend = getResendClient();
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: '🔥 Bienvenido a ZonaFit - Tu cuenta ha sido creada',
      html: getEmailLayout(content)
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error enviando correo de bienvenida completo:', error);
    return { success: false, error };
  }
}

/**
 * Envío de recibo y guía cuando un pago sea aprobado.
 */
export async function sendOrderApprovedEmail(toEmail: string, orderData: any) {
  try {

    // Formatear total del pedido
    const totalFormatted = new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(orderData.total || 0);

    // Listado de productos comprados
    const itemsListHtml = (orderData.items || []).map((item: any) => {
      const name = item.nombre || item.title || "Producto";
      const qty = item.cantidad || 1;
      return `<li style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>${qty}x</strong> ${name}</li>`;
    }).join("");

    const orderIdShort = orderData.id ? String(orderData.id).slice(-6).toUpperCase() : 'N/A';

    const content = `
      <h2 style="margin-top: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; color: #111111;">¡PAGO APROBADO! ⚡</h2>
      <p>Tu orden <strong>#${orderIdShort}</strong> está confirmada y hemos comenzado a preparar tu paquete. Tu dedicación pronto tendrá su recompensa.</p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin-top: 0; font-size: 16px; text-transform: uppercase; border-bottom: 2px solid #000; display: inline-block; padding-bottom: 5px;">Detalles de la Orden</h3>
        <ul style="list-style: none; padding: 0; margin: 15px 0;">
          ${itemsListHtml}
        </ul>
        <p style="font-size: 18px; font-weight: bold; text-align: right; margin-bottom: 0;">Total pagado: ${totalFormatted}</p>
      </div>

      <p>Nos encargaremos de empacarlo y pronto recibirás el código de seguimiento de la transportadora a tu WhatsApp y a este medio.</p>
      
      <div style="text-align: center;">
        <a href="${getBaseUrl()}/pedidos" class="btn">Rastrear mi Pedido</a>
      </div>
    `;

    const resend = getResendClient();
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `✅ Pago Confirmado - Orden #${orderIdShort} ZonaFit`,
      html: getEmailLayout(content)
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error enviando correo de confirmación de pedido:', error);
    return { success: false, error };
  }
}
