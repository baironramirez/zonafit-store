import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/emails';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, email } = body;

    // Validación básica
    if (!type || !email) {
      return NextResponse.json({ error: 'Faltan parámetros de correo (type o email)' }, { status: 400 });
    }

    if (type === 'welcome') {
      const result = await sendWelcomeEmail(email);
      if (!result.success) {
        return NextResponse.json({ error: 'Fallo al enviar correo desde Resend' }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Correo de bienvenida enviado.' });
    }

    return NextResponse.json({ error: 'Tipo de correo no soportado' }, { status: 400 });
  } catch (error) {
    console.error('Error general en POST /api/emails:', error);
    return NextResponse.json({ error: 'Error procesando solicitud de correo' }, { status: 500 });
  }
}
