import { NextResponse } from "next/server";
import { getProducts } from "../../../services/productService";

export async function GET() {
  try {
    const products = await getProducts();

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: "Error obteniendo productos" },
      { status: 500 },
    );
  }
}
