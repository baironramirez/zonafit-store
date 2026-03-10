import { NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";

export async function POST(req: Request) {
  const { id, activo } = await req.json();

  const productRef = doc(db, "products", id);

  await updateDoc(productRef, {
    activo,
  });

  return NextResponse.json({ success: true });
}
