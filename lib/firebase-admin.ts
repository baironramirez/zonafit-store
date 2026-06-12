/**
 * Firebase Admin SDK - Singleton seguro para entornos serverless (Vercel).
 *
 * ¿Por qué un singleton?
 * En Vercel, cada invocación de una función serverless puede reutilizar el
 * proceso de Node.js (warm start). Si inicializamos la app en cada request,
 * Firebase lanzaría "App named '[DEFAULT]' already exists".
 * El patrón getApps().length === 0 previene esa duplicación.
 *
 * ¿Por qué Admin SDK y no el cliente?
 * El cliente Firebase SDK (browser/Next.js) no tiene permisos para escribir
 * custom claims en Firebase Auth. Solo el Admin SDK con credenciales de
 * service account puede hacerlo. Esto es correcto por seguridad: los custom
 * claims deben asignarse SOLO desde el servidor, nunca desde el cliente.
 */

import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Inicialización lazy y segura del Admin SDK
function getAdminApp(): App {
  if (getApps().length > 0) {
    // Reutilizar la app ya inicializada (warm start de Vercel)
    return getApps()[0];
  }

  // Credenciales de la service account desde variables de entorno
  // NUNCA hardcodear estas credenciales en el código fuente
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // Las private keys en variables de entorno reemplazan \n por \\n al importar
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// Exportar instancia del Auth Admin directamente
export const adminAuth = getAuth(getAdminApp());
