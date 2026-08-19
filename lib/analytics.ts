/**
 * lib/analytics.ts — Servicio centralizado de analítica y medición de conversiones.
 *
 * ¿Por qué esta arquitectura? (Clean Architecture / Separation of Concerns)
 * 1. Desacopla la lógica de negocio y componentes visuales de la API específica de Google Ads / GTAG.
 * 2. Si en el futuro cambiamos de plataforma o agregamos Meta Pixel / TikTok Pixel,
 *    solo modificamos este adaptador sin tocar las páginas o flujos de checkout.
 * 3. Provee validaciones defensivas (SSR safe, deduplicación de conversiones para no duplicar métricas).
 */

export const GA_TRACKING_ID = "AW-18397686872";

// Si Google Ads te provee un Conversion Label específico (ej: "AW-18397686872/AbCdEfGh123"),
// se puede configurar aquí o mediante variable de entorno NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL
export const DEFAULT_PURCHASE_CONVERSION_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL || "";

export interface PurchaseConversionData {
  orderId: string;
  value: number;
  currency?: string;
  conversionLabel?: string;
  email?: string;
  phone?: string;
  isNewCustomer?: boolean;
}

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Registra la conversión de compra en Google Ads.
 *
 * @param data Información de la transacción (ID de orden, monto, moneda, datos del cliente)
 * @returns boolean indicando si se disparó el evento
 */
export function trackGoogleAdsPurchase(data: PurchaseConversionData): boolean {
  if (typeof window === "undefined" || !window.gtag) {
    console.warn("[Analytics] gtag no está disponible en el entorno actual.");
    return false;
  }

  const {
    orderId,
    value,
    currency = "COP",
    conversionLabel = DEFAULT_PURCHASE_CONVERSION_LABEL,
    email,
    phone,
    isNewCustomer,
  } = data;

  // Evitar reportar la misma conversión dos veces si el usuario recarga la página
  const deduplicationKey = `gads_conversion_sent_${orderId}`;
  if (sessionStorage.getItem(deduplicationKey)) {
    console.log(`[Analytics] Conversión para la orden ${orderId} ya fue enviada previamente.`);
    return false;
  }

  // 1. Conversiones mejoradas (Enhanced Conversions):
  // Si se envían datos del usuario (email / teléfono), Google Ads los utiliza para mejorar
  // la precisión de la atribución de conversiones de manera segura.
  if (email || phone) {
    const enhancedData: Record<string, any> = {};
    if (email) enhancedData.email = email.trim().toLowerCase();
    if (phone) enhancedData.phone_number = phone.trim();

    window.gtag("set", "user_data", enhancedData);
  }

  // 2. Destino de la conversión:
  // Si hay un label específico (ej: AW-18397686872/ABC123xyz), se usa send_to completo.
  // Si no, se envía al tag base AW-18397686872.
  const sendToTarget = conversionLabel
    ? conversionLabel.includes("/")
      ? conversionLabel
      : `${GA_TRACKING_ID}/${conversionLabel}`
    : GA_TRACKING_ID;

  // 3. Disparo del evento de conversión
  const conversionPayload: Record<string, any> = {
    send_to: sendToTarget,
    value: Number(value) || 0,
    currency: currency,
    transaction_id: orderId,
  };

  if (isNewCustomer !== undefined) {
    conversionPayload.new_customer = isNewCustomer;
  }

  window.gtag("event", "conversion", conversionPayload);

  // Marcamos como enviada para evitar duplicidad
  sessionStorage.setItem(deduplicationKey, "true");
  console.log(`[Analytics] Conversión de compra enviada exitosamente para la orden: ${orderId}`, conversionPayload);

  return true;
}
