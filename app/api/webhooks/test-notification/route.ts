import { NextResponse } from "next/server";

/**
 * Endpoint de prueba para verificar que las notificaciones WhatsApp funcionan.
 *
 * ¿Por qué un endpoint separado?
 * - Permite aislar el problema: si falla aquí, es la API de CallMeBot.
 *   Si funciona aquí pero no en el webhook, es un problema de flujo/datos.
 * - Devuelve la respuesta completa de CallMeBot para debugging.
 * - Solo funciona en entornos de desarrollo/preview (no producción).
 */
export async function GET(req: Request) {
  // Bloquear en producción para evitar spam accidental
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json(
      { error: "Test endpoint disabled in production" },
      { status: 403 }
    );
  }

  const phone = process.env.WHATSAPP_ADMIN_PHONE;
  const apikey = process.env.WHATSAPP_CALLMEBOT_APIKEY;

  // 1️⃣ Verificar que las variables de entorno existen
  if (!phone || !apikey) {
    return NextResponse.json({
      success: false,
      error: "Variables de entorno faltantes",
      debug: {
        WHATSAPP_ADMIN_PHONE: phone ? "✅ configurada" : "❌ NO configurada",
        WHATSAPP_CALLMEBOT_APIKEY: apikey ? "✅ configurada" : "❌ NO configurada",
      },
    }, { status: 500 });
  }

  // 2️⃣ Construir mensaje de prueba
  const testMessage = [
    "🧪 *PRUEBA DE NOTIFICACIÓN - ZonaFit*",
    "",
    "✅ Si ves este mensaje, las notificaciones funcionan correctamente.",
    "",
    `📅 Fecha: ${new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })}`,
    `📱 Enviado a: ${phone}`,
    `🌐 Entorno: ${process.env.VERCEL_ENV || "local"}`,
  ].join("\n");

  const encodedMessage = encodeURIComponent(testMessage);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedMessage}&apikey=${apikey}`;

  // 3️⃣ Enviar y capturar la respuesta completa para debugging
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(15000),
    });

    const responseText = await response.text();
    const elapsed = Date.now() - startTime;

    return NextResponse.json({
      success: response.ok,
      message: response.ok
        ? "✅ Mensaje enviado. Debería llegar a WhatsApp en segundos."
        : "❌ CallMeBot respondió con error.",
      debug: {
        httpStatus: response.status,
        callmebotResponse: responseText,
        elapsedMs: elapsed,
        phone,
        apikey: `${apikey.substring(0, 3)}****`,
        url_sent: url.replace(apikey, `${apikey.substring(0, 3)}****`),
        env: process.env.VERCEL_ENV || "local",
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      debug: {
        type: error.name,
        phone,
        env: process.env.VERCEL_ENV || "local",
      },
    }, { status: 500 });
  }
}
