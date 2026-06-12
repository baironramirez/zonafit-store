/**
 * API Route: POST /api/auth/recuperar
 * 
 * ¿Por qué existe este endpoint?
 * El cliente de Firebase Auth (en el navegador) envía correos de restablecimiento usando
 * las plantillas y el motor de Firebase por defecto, que a menudo caen en la bandeja de SPAM
 * o no llegan. 
 * Este endpoint en el servidor utiliza el Admin SDK para generar un enlace único de restablecimiento
 * de contraseña y luego envía el correo utilizando Resend con la plantilla personalizada de ZonaFit.
 * Esto asegura una entregabilidad óptima y mantiene la consistencia visual de la marca.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { sendPasswordResetEmail } from "@/lib/emails";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "El correo electrónico es obligatorio." },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuth();

    try {
      // 1. Generar enlace de restauración de contraseña
      // El enlace utilizará la página por defecto de Firebase, y al finalizar redirigirá a nuestro login.
      const resetLink = await adminAuth.generatePasswordResetLink(email, {
        url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://zonafitgym.com"}/login`,
      });

      // 2. Enviar el correo usando Resend con nuestra plantilla premium
      const emailResult = await sendPasswordResetEmail(email, resetLink);

      if (!emailResult.success) {
        console.error("Resend error:", emailResult.error);
        return NextResponse.json(
          { error: "El enlace fue generado, pero falló el envío del correo electrónico." },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Correo de recuperación enviado correctamente.",
      });

    } catch (authError: any) {
      console.error("Error en Firebase Auth Admin:", authError);

      // Mapear errores comunes de Firebase Auth
      if (authError.code === "auth/user-not-found" || authError.message?.includes("user-not-found") || authError.message?.includes("no user record")) {
        return NextResponse.json(
          { error: "No hay ninguna cuenta registrada con este correo." },
          { status: 404 }
        );
      }
      if (authError.code === "auth/invalid-email") {
        return NextResponse.json(
          { error: "El formato del correo electrónico es inválido." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Ocurrió un error al procesar la solicitud de recuperación." },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("Error en endpoint recuperar:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar la solicitud." },
      { status: 500 }
    );
  }
}
