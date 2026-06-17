/**
 * POST /api/emails
 *
 * Envía emails transaccionales (ej: bienvenida).
 *
 * ¿Por qué requiere autenticación de usuario?
 * Sin protección, cualquier bot podía hacer POST a este endpoint en bucle
 * y usar nuestra cuenta de Resend para hacer spam a cualquier dirección,
 * agotando el cupo de emails gratuito y dañando la reputación del dominio.
 *
 * ¿Por qué requireUserAuth y no requireAdminAuth?
 * El email de bienvenida se envía cuando un usuario acaba de registrarse,
 * por lo que ya tiene un token válido de Firebase, pero no es admin.
 * Solo verificamos que el token sea válido (usuario autenticado).
 *
 * Seguridad adicional: validamos que el email del body coincida con el
 * email del token para evitar que un usuario envíe emails en nombre de otro.
 */
import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/emails";
import { requireUserAuth } from "@/lib/auth-helpers";

// Regex básica de validación de email (no reemplaza la validación del servidor de correo)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  // 1. El usuario debe estar autenticado para poder enviar emails
  const { error, callerClaims } = await requireUserAuth(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { type, email } = body;

    // 2. Validación de parámetros básicos
    if (!type || !email) {
      return NextResponse.json(
        { error: "Faltan parámetros de correo (type o email)" },
        { status: 400 }
      );
    }

    // 3. Validar formato del email para prevenir envíos a direcciones malformadas
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Formato de email inválido." },
        { status: 400 }
      );
    }

    // 4. El email del body debe coincidir con el email del token autenticado.
    // Previene que un usuario envíe emails de bienvenida a cuentas de terceros.
    if (callerClaims.email && email !== callerClaims.email) {
      return NextResponse.json(
        { error: "El email no coincide con el usuario autenticado." },
        { status: 403 }
      );
    }

    if (type === "welcome") {
      const result = await sendWelcomeEmail(email);
      if (!result.success) {
        return NextResponse.json(
          { error: "Fallo al enviar correo desde Resend" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, message: "Correo de bienvenida enviado." });
    }

    return NextResponse.json(
      { error: "Tipo de correo no soportado" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Error general en POST /api/emails:", err);
    return NextResponse.json(
      { error: "Error procesando solicitud de correo" },
      { status: 500 }
    );
  }
}
