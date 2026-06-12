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
import { readFileSync } from "fs";
import { config } from "dotenv";

// Cargar variables de entorno del .env.local
config({ path: ".env.local" });

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

try {
  // Verificar que el usuario existe
  const user = await auth.getUser(uid);
  console.log(`\n✅ Usuario encontrado: ${user.email}`);

  // Asignar el custom claim de admin
  await auth.setCustomUserClaims(uid, { admin: true, rol: "admin" });

  console.log(`🔐 Custom claims asignados correctamente:`);
  console.log(`   admin: true`);
  console.log(`   rol: "admin"`);
  console.log(`\n🎉 Listo! Cierra sesión y vuelve a iniciarla en la app para`);
  console.log(`   que el nuevo token con el claim sea emitido.`);
  console.log(`\n   Desde ahora, puedes asignar otros admins directamente`);
  console.log(`   desde el panel /admin/usuarios ✨`);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
