import { NextResponse } from "next/server";
import { client } from "../../../lib/mercadopago";
import { Preference } from "mercadopago";

export async function POST(req: Request) {
  try {

    // 🔹 validar access token
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "MP_ACCESS_TOKEN no configurado" },
        { status: 500 }
      );
    }

    const body = await req.json();

    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: "Items inválidos o vacíos" },
        { status: 400 }
      );
    }

    // 🔹 transformar items al formato que exige MercadoPago
    const items = body.items.map((item: any) => ({
      id: item.id ?? "item",
      title: item.title ?? "Producto",
      quantity: Number(item.quantity ?? 1),
      unit_price: Math.round(Number(item.unit_price ?? 0)),
      // currency_id se remueve para que MercadoPago use la moneda nativa de la cuenta (evita error "algo anduvo mal")
    }));


    console.log("Items enviados a MercadoPago:", items);

    // 🔹 url base del proyecto
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://example.com";

    const preference = new Preference(client);

    // 🔹 crear preferencia de pago
    const response = await preference.create({
      body: {
        items,

        external_reference: body.orderId ?? null,

        // Webhook URL para recibir notificaciones de pago
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,

        back_urls: {
          success: `${baseUrl}/success`,
          failure: `${baseUrl}/failure`,
          pending: `${baseUrl}/pending`,
        },
        auto_return: "approved",
      },

    });

    console.log("Preferencia creada:", response.id);

    return NextResponse.json({
      id: response.id,
      init_point: response.init_point,
    });

  } catch (error: any) {

    console.error("Error en create-payment:", error);

    return NextResponse.json(
      {
        error: "Error creando preferencia de pago",
        details: error?.message || error,
        mp_details: error?.cause || null,
      },
      { status: 500 }
    );
  }
}