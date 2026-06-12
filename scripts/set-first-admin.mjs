/**
 * Script de bootstrap para asignar el primer admin.
 * USO: node scripts/set-first-admin.mjs <UID_DEL_USUARIO>
 *
 * ¿Por qué es necesario?
 * El endpoint /api/admin/set-claims verifica que el CALLER sea admin antes de
 * permitir cambios. El primer admin no puede asignarse a sí mismo desde el panel
 * porque nadie tiene el claim todavía. Este script rompe ese "huevo y gallina"
 * ejecutándose directamente con el Admin SDK desde tu máquina local.
 *
 * SEGURIDAD: Ejecutar solo UNA vez para el primer admin. Después, usar el panel.
 * BORRAR este script o agregarlo al .gitignore una vez usado.
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Verificar que las variables estén configuradas
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey ||
    clientEmail.includes("REEMPLAZAR") || privateKey.includes("REEMPLAZAR")) {
  console.error("❌ Error: Las variables FIREBASE_ADMIN_* no están configuradas.");
  console.error("   Completa el .env.local con las credenciales del service account primero.");
  process.exit(1);
}

// Obtener el UID del argumento de línea de comandos
const uid = process.argv[2];
if (!uid) {
  console.error("❌ Error: Debes proporcionar el UID del usuario.");
  console.error("   Uso: node scripts/set-first-admin.mjs <UID>");
  console.error("\n   Para encontrar tu UID:");
  console.error("   Firebase Console → Authentication → Users → copia el UID de tu cuenta");
  process.exit(1);
}

// Inicializar Admin SDK
const app = initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
});

const auth = getAuth(app);
const db = getFirestore(app);

try {
  // Verificar que el usuario existe en Firebase Auth
  const user = await auth.getUser(uid);
  console.log(`\n✅ Usuario encontrado en Auth: ${user.email}`);

  // 1. Asignar el custom claim de admin en Firebase Auth
  await auth.setCustomUserClaims(uid, { admin: true, rol: "admin" });
  console.log(`🔐 Custom claims asignados correctamente en Auth (admin: true, rol: "admin")`);

  // 2. Actualizar el rol en la base de datos de Firestore
  // Usamos merge: true para no sobreescribir otros datos existentes (como nombre, email, etc.)
  const userDocRef = db.collection("users").doc(uid);
  await userDocRef.set({
    rol: "admin",
    email: user.email // nos aseguramos de que el email esté por si acaso
  }, { merge: true });
  console.log(`🗄️ Documento de usuario actualizado en Firestore (rol: "admin")`);

  console.log(`\n🎉 Listo! El usuario ya es Admin en Auth y Firestore.`);
  console.log(`   Por favor, cierra sesión y vuelve a iniciarla en la app para`);
  console.log(`   que el nuevo token con el claim sea emitido.`);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
