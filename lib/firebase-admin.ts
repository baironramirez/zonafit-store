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
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminFirestoreInstance: Firestore | null = null;

/**
 * Obtiene de forma perezosa (lazy) la instancia del Firebase Auth Admin.
 * 
 * ¿Por qué esta estructura?
 * 1. Previene fallos de inicialización (crash) a nivel de módulo en Vercel.
 *    Si una variable de entorno está ausente o mal formateada, el error ocurre
 *    dentro del try/catch de la ruta API, retornando un JSON legible en vez de
 *    un error 500 HTML crudo de Vercel.
 * 2. Realiza limpieza automática de claves privadas mal copiadas (ej. con comillas extras).
 */
export function getAdminAuth(): Auth {
  if (adminAuthInstance) {
    return adminAuthInstance;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    const missing = [];
    if (!projectId) missing.push("FIREBASE_ADMIN_PROJECT_ID");
    if (!clientEmail) missing.push("FIREBASE_ADMIN_CLIENT_EMAIL");
    if (!privateKey) missing.push("FIREBASE_ADMIN_PRIVATE_KEY");
    throw new Error(`Faltan variables de entorno esenciales del Firebase Admin SDK: ${missing.join(", ")}. Por favor configúralas en Vercel Dashboard.`);
  }

  // Limpieza robusta de la clave privada:
  // 1. Quitar comillas dobles o simples al inicio y final si fueron añadidas por error al copiar
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
    privateKey = privateKey.slice(1, -1);
  }

  // 2. Reemplazar los saltos de línea escapados (\n) por saltos de línea reales
  privateKey = privateKey.replace(/\\n/g, "\n");

  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error("La clave privada FIREBASE_ADMIN_PRIVATE_KEY no tiene el formato PEM correcto. Debe comenzar con '-----BEGIN PRIVATE KEY-----'.");
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0];
  } else {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (err: any) {
      throw new Error(`Error al inicializar Firebase Admin App: ${err.message || err}`);
    }
  }

  adminAuthInstance = getAuth(adminApp);
  return adminAuthInstance;
}

/**
 * Obtiene la instancia de Firestore Admin de forma perezosa.
 *
 * ¿Por qué usamos Admin y no el SDK cliente desde el servidor?
 * El SDK cliente necesita autenticación de usuario (Firebase Auth token).
 * El Admin SDK tiene permisos directos con la service account — ideal para
 * Server Components donde no hay sesión de usuario activa.
 */
export function getAdminFirestore(): Firestore {
  if (adminFirestoreInstance) {
    return adminFirestoreInstance;
  }

  // Reutilizamos la misma lógica de inicialización del Admin App
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    const missing = [];
    if (!projectId) missing.push("FIREBASE_ADMIN_PROJECT_ID");
    if (!clientEmail) missing.push("FIREBASE_ADMIN_CLIENT_EMAIL");
    if (!privateKey) missing.push("FIREBASE_ADMIN_PRIVATE_KEY");
    throw new Error(`Faltan variables de entorno del Firebase Admin SDK: ${missing.join(", ")}`);
  }

  if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
  if (privateKey.startsWith("'") && privateKey.endsWith("'")) privateKey = privateKey.slice(1, -1);
  privateKey = privateKey.replace(/\\n/g, "\n");

  if (getApps().length > 0) {
    adminApp = getApps()[0];
  } else {
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  adminFirestoreInstance = getFirestore(adminApp);
  return adminFirestoreInstance;
}
