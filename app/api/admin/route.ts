import { NextResponse } from "next/server";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const docRef = await addDoc(collection(db, "products"), {
      ...body,
      createdAt: new Date(),
    });

    return NextResponse.json({
      id: docRef.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error creando producto" },
      { status: 500 },
    );
  }
}
