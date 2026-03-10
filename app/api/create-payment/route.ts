import { NextResponse } from "next/server";
import { client } from "../../../lib/mercadopago";
import { Preference } from "mercadopago";

export async function POST(req: Request) {
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
}
