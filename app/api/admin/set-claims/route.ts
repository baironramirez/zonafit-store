/**
 * API Route: POST /api/admin/set-claims
 *
 * ¿Por qué existe este endpoint?
 * El panel de admin cambia el `rol` del usuario en Firestore, pero las reglas
 * de Firebase Storage verifican el custom claim `request.auth.token.admin`.
 * Los custom claims solo se pueden escribir desde el servidor con el Admin SDK.
 * Este endpoint cierra ese puente: cuando el admin cambia un rol a "admin",
 * este endpoint también escribe/quita el claim en Firebase Auth de forma automática.
 *
 * Flujo completo:
 * 1. Admin abre /admin/usuarios y cambia el rol de un usuario
 * 2. El componente llama a este endpoint con { uid, rol }
 * 3. Este endpoint actualiza el custom claim en Firebase Auth (Admin SDK)
 * 4. El frontend también actualiza el campo `rol` en Firestore (como antes)
 * 5. La próxima vez que el usuario haga login, su token tendrá el claim actualizado
 *
 * Seguridad:
 * - Solo el admin actual puede llamar este endpoint (verificamos el token del caller)
 * - El endpoint nunca expone las credenciales del service account
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

// Roles válidos para prevenir inyección de claims arbitrarios
const VALID_ROLES = ["admin", "cliente", "atleta", "delivery"] as const;
type ValidRole = typeof VALID_ROLES[number];

export async function POST(req: NextRequest) {
  try {
    const adminAuth = getAdminAuth();

    // ── 1. Verificar que el caller es un admin autenticado ──────────────────
    // El frontend envía el ID token del usuario actualmente logueado en el header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado: token faltante" },
        { status: 401 }
      );
    }

    const callerToken = authHeader.split("Bearer ")[1];
    const callerClaims = await adminAuth.verifyIdToken(callerToken);

    // Solo un admin puede asignar claims (el custom claim debe ya existir en el primer admin)
    if (callerClaims.admin !== true) {
      return NextResponse.json(
        { error: "Acceso denegado: se requiere rol de admin" },
        { status: 403 }
      );
    }

    // ── 2. Validar el body del request ─────────────────────────────────────
    const body = await req.json();
    const { uid, rol } = body as { uid: string; rol: ValidRole };

    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "UID inválido" }, { status: 400 });
    }

    if (!VALID_ROLES.includes(rol)) {
      return NextResponse.json(
        { error: `Rol inválido. Válidos: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    // ── 3. Asignar custom claims en Firebase Auth ──────────────────────────
    // El claim `admin` es booleano: true solo para admins, false para el resto.
    // Esto es lo que verifican las reglas de Storage.
    await adminAuth.setCustomUserClaims(uid, {
      admin: rol === "admin",
      rol,  // También guardamos el rol completo como claim (útil para reglas futuras)
    });

    console.info(
      JSON.stringify({
        event: "custom_claim_updated",
        targetUid: uid,
        newRol: rol,
        adminClaim: rol === "admin",
        callerUid: callerClaims.uid,
        timestamp: new Date().toISOString(),
      })
    );

    return NextResponse.json({
      success: true,
      message: `Custom claims actualizados correctamente para UID: ${uid}`,
      claims: { admin: rol === "admin", rol },
    });

  } catch (error: any) {
    console.error("Error en set-claims:", error);
    return NextResponse.json(
      {
        error: "Error interno al actualizar claims",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
