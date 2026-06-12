/**
 * API Route: POST /api/auth/login
 *
 * ¿Por qué este endpoint existe?
 * Este endpoint fue un placeholder temporal. La autenticación real de administradores
 * se gestiona completamente mediante Firebase Auth (Google + Email/Password) y
 * los custom claims asignados por el Admin SDK.
 * Este endpoint ya no tiene una función válida, pero se conserva devolviendo 404
 * para no romper referencias en el middleware que pudiera existir. La validación
 * de sesión admin ocurre en middleware.ts verificando el token de Firebase.
 */

import { NextResponse } from "next/server";

export async function POST() {
  // El flujo de login admin ahora pasa completamente por Firebase Auth + custom claims.
  // No se utiliza este endpoint; la sesión se maneja en el cliente con el SDK de Firebase.
  return NextResponse.json(
    { error: "Endpoint no disponible. Usa Firebase Authentication." },
    { status: 404 }
  );
}
