import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // In a real app, these should be securely stored in process.env
    // For this demonstration, we are hardcoding a master user constraint
    const MOCK_ADMIN_EMAIL = "admin@zonafit.com";
    const MOCK_ADMIN_PASSWORD = "admin";

    if (email === MOCK_ADMIN_EMAIL && password === MOCK_ADMIN_PASSWORD) {
      // Create a response
      const response = NextResponse.json(
        { success: true },
        { status: 200 }
      );

      // Set an HttpOnly cookie that expires in 1 day
      response.cookies.set({
        name: "zonafit_admin_session",
        value: "authenticated_true",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { error: "Correo o contraseña incorrectos" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}
