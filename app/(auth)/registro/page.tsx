"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { UserPlus, Mail, KeyRound, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Provision their Profile in Firestore dynamically setting rol: 'cliente'
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        rol: "cliente", // Explicit declaration of the role
        createdAt: new Date().toISOString()
      });

      // 2.5 Disparar correo de bienvenida y blindarlo con await
      // Al no poner await, el navegador puede cancelar la petición fetch 
      // tan pronto ejecuta el router.push, lo que sucede muy rápido en producción.
      await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "welcome", email: user.email })
      }).catch(err => console.error("Error disparando el correo de bienvenida:", err));

      // 3. Redirect back to homepage
      router.push("/");
    } catch (err: any) {
      console.error("Register Error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado en nuestro sistema.");
      } else if (err.code === "auth/invalid-email") {
        setError("El formato del correo es inválido.");
      } else {
        setError("Ocurrió un error al registrar la cuenta.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6 selection:bg-black selection:text-white relative">



      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md pt-12 md:pt-0"
      >

        {/* Header Text */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-3 leading-none truncate">
            ÚNETE A LA <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">COMUNIDAD</span>
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Crea tu perfil y accede a suplementación élite.
          </p>
        </div>

        {/* Register Box */}
        <div className="bg-white border-2 border-gray-100 rounded-3xl p-8 shadow-2xl shadow-gray-200/50">
          <form onSubmit={handleRegister} className="space-y-5">

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-black text-black uppercase tracking-widest pl-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-black font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                  placeholder="atleta@zonafit.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-black text-black uppercase tracking-widest pl-1">
                Crear Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-black font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-black text-black uppercase tracking-widest pl-1">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-black font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-red-800">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.4)] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 mt-4"
            >
              {isLoading ? "REGISTRANDO ATLETA..." : "FORJAR MI CUENTA"}
            </button>
          </form>
        </div>

        {/* Footer actions */}
        <div className="text-center mt-8">
          <span className="text-gray-500 font-medium text-sm">¿Ya tienes una cuenta? </span>
          <Link href="/login" className="text-black font-black uppercase tracking-widest text-sm border-b-2 border-black pb-0.5 hover:text-gray-600 hover:border-gray-600 transition-colors">
            INICIAR SESIÓN AQUÍ
          </Link>
        </div>

      </motion.div>
    </main>
  );
}
