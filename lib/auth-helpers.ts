/**
 * auth-helpers.ts — Utilidades de autenticación centralizadas para las API routes.
 *
 * ¿Por qué este helper existe?
 * Siguiendo Clean Architecture y el principio DRY, centralizamos aquí toda la
 * lógica de verificación de tokens de Firebase Auth para las rutas de API.
 * Esto evita duplicar código en cada route handler y hace más fácil cambiar
 * la lógica de auth en un solo lugar si las reglas cambian.
 *
 * Uso:
 *   import { requireAdminAuth, requireUserAuth } from "@/lib/auth-helpers";
 *   const { error, callerClaims } = await requireAdminAuth(req);
 *   if (error) return error;
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * Resultado de una verificación de autenticación.
 * Si `error` está presente, se debe retornar directamente desde el route handler.
 * Si `callerClaims` está presente, la verificación fue exitosa.
 */
type AuthResult =
  | { error: NextResponse; callerClaims: null }
  | { error: null; callerClaims: DecodedIdToken };

/**
 * Verifica que el request venga de un usuario autenticado con rol de ADMIN.
 *
 * ¿Por qué verificar en el servidor?
 * El custom claim `admin` está firmado por Firebase y es imposible de falsificar
 * sin las credenciales del Admin SDK (que solo existen en el servidor).
 *
 * @param req - El NextRequest entrante con el header Authorization: Bearer <token>
 * @returns AuthResult — si hay error, retornarlo; si no, usar callerClaims.
 */
export async function requireAdminAuth(req: NextRequest): Promise<AuthResult> {
  // 1. Extraer el Bearer token del header Authorization
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        { error: "No autorizado: falta el token de autenticación." },
        { status: 401 }
      ),
      callerClaims: null,
    };
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    // 2. Verificar el token con Firebase Admin SDK (cryptográficamente)
    const adminAuth = getAdminAuth();
    const callerClaims = await adminAuth.verifyIdToken(token);

    // 3. Verificar que el custom claim `admin` sea exactamente true
    // (no solo truthy — debe ser el booleano true para evitar bypass con strings)
    if (callerClaims.admin !== true) {
      return {
        error: NextResponse.json(
          { error: "Acceso denegado: se requiere rol de administrador." },
          { status: 403 }
        ),
        callerClaims: null,
      };
    }

    return { error: null, callerClaims };
  } catch (err: any) {
    // El token expiró, está mal formado o fue revocado
    return {
      error: NextResponse.json(
        { error: "Token inválido o expirado. Por favor vuelve a iniciar sesión." },
        { status: 401 }
      ),
      callerClaims: null,
    };
  }
}

/**
 * Verifica que el request venga de cualquier usuario autenticado (no necesariamente admin).
 * Útil para endpoints que requieren sesión activa pero no privilegios de admin.
 *
 * @param req - El NextRequest con header Authorization: Bearer <token>
 * @returns AuthResult
 */
export async function requireUserAuth(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        { error: "No autorizado: falta el token de autenticación." },
        { status: 401 }
      ),
      callerClaims: null,
    };
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const adminAuth = getAdminAuth();
    const callerClaims = await adminAuth.verifyIdToken(token);
    return { error: null, callerClaims };
  } catch (err: any) {
    return {
      error: NextResponse.json(
        { error: "Token inválido o expirado." },
        { status: 401 }
      ),
      callerClaims: null,
    };
  }
}

/**
 * Verifica el secret del cron job desde el header Authorization (preferido)
 * o como fallback desde el query param `secret` (legacy, menos seguro).
 *
 * ¿Por qué header es más seguro que query param?
 * Los query params aparecen en los logs del servidor de Vercel y en el
 * historial del navegador. Los headers no.
 *
 * @param req - Request del cron job
 * @returns true si el secret es válido, false en caso contrario
 */
export function verifyCronSecret(req: NextRequest): boolean {
  const expectedSecret = process.env.CRON_SECRET;

  // Si no hay secret configurado, bloquear en producción por seguridad
  if (!expectedSecret) {
    const isProduction = process.env.VERCEL_ENV === "production";
    return !isProduction;
  }

  // Primero intentar con el header Authorization (estándar de Vercel Cron)
  const authHeader = req.headers.get("Authorization");
  if (authHeader === `Bearer ${expectedSecret}`) {
    return true;
  }

  // Fallback al query param (legacy — para compatibilidad con llamadas manuales)
  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");
  return querySecret === expectedSecret;
}
