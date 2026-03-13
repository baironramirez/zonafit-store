"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Lock, Mail, KeyRound, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // AuthContext will detect the change and fetch the userProfile
      router.push("/");
    } catch (err: any) {
      console.error("Login Error:", err);
      // Handle Firebase Auth errors gracefully
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Correo electrónico o contraseña incorrectos.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Demasiados intentos. Inténtalo más tarde.");
      } else {
        setError("Ocurrió un error al iniciar sesión.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6 selection:bg-black selection:text-white relative">
      
      {/* Back Button */}
      <div className="absolute top-10 flex w-full max-w-md px-4">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider hover:text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Volver a la tienda
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        
        {/* Header Text */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-3 leading-none truncate">
            INICIA <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">SESIÓN</span>
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Control total sobre tus pedidos, guardados y exclusivas.
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white border-2 border-gray-100 rounded-3xl p-8 shadow-2xl shadow-gray-200/50">
          <form onSubmit={handleLogin} className="space-y-6">
            
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
              <div className="flex justify-between pl-1 pr-1">
                <label className="text-xs font-black text-black uppercase tracking-widest">
                  Contraseña
                </label>
                <Link href="#" className="text-xs font-bold text-gray-400 hover:text-black transition-colors uppercase">
                  ¿Olvidaste?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              className="w-full py-5 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.4)] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 mt-2"
            >
              {isLoading ? "PROCESANDO..." : "ENTRAR AL SISTEMA"}
            </button>
          </form>
        </div>

        {/* Footer actions */}
        <div className="text-center mt-8">
          <span className="text-gray-500 font-medium text-sm">¿Aún no tienes cuenta? </span>
          <Link href="/registro" className="text-black font-black uppercase tracking-widest text-sm border-b-2 border-black pb-0.5 hover:text-gray-600 hover:border-gray-600 transition-colors">
            ROMPER LÍMITES (CREAR CUENTA)
          </Link>
        </div>

      </motion.div>
    </main>
  );
}
