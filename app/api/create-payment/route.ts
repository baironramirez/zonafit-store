import { NextResponse } from "next/server";
import { client } from "../../../lib/mercadopago";
import { Preference } from "mercadopago";

export async function POST(req: Request) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "MP_ACCESS_TOKEN no configurado" },
        { status: 500 },
      );
    }

    const body = await req.json();

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: body.items,
        back_urls: {
          success: "http://localhost:3000/success",
          failure: "http://localhost:3000/failure",
        },
        auto_return: "approved",
      },
    });

    return NextResponse.json({
      id: response.id,
    });
  } catch (error) {
    console.error("Error en create-payment:", error);
    return NextResponse.json(
      {
        error: "Error creando preferencia de pago",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
