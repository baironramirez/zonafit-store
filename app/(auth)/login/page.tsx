"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Lock, Mail, KeyRound, AlertCircle, ArrowLeft, PackageCheck } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const redirectParam = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // AuthContext detectará el cambio y cargará el perfil
      router.push(redirectParam);
    } catch (err: any) {
      console.error("Login Error:", err);
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

  const isOrderTrackingFlow = redirectParam.includes("pedidos");

  return (
    <main className="min-h-screen bg-white text-black flex flex-col items-center justify-center pt-32 pb-12 px-6 selection:bg-black selection:text-white relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header Text */}
        <div className="text-center mb-10">
          {isOrderTrackingFlow && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-black uppercase rounded-full mb-3 tracking-wide">
              <PackageCheck className="w-3.5 h-3.5" /> Seguimiento de Pedidos
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-3 leading-none truncate">
            INICIA <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-black">SESIÓN</span>
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            {isOrderTrackingFlow
              ? "Ingresa para ver el estado y despacho de tus pedidos."
              : "Control total sobre tus pedidos, guardados y exclusivas."}
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
              <div className="flex items-center justify-between pl-1">
                <label className="text-xs font-black text-black uppercase tracking-widest">
                  Contraseña
                </label>
                <Link href="/recuperar" className="text-xs text-gray-400 hover:text-black font-semibold transition-colors">
                  ¿Olvidaste tu contraseña?
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
              className="w-full py-5 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.4)] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 mt-2 cursor-pointer"
            >
              {isLoading ? "PROCESANDO..." : isOrderTrackingFlow ? "INGRESAR Y VER PEDIDO" : "ENTRAR AL SISTEMA"}
            </button>
          </form>
        </div>

        {/* Footer actions */}
        <div className="text-center mt-8">
          <span className="text-gray-500 font-medium text-sm">¿Aún no tienes cuenta? </span>
          <Link
            href={`/registro?redirect=${encodeURIComponent(redirectParam)}${email ? `&email=${encodeURIComponent(email)}` : ""}`}
            className="text-black font-black uppercase tracking-widest text-sm border-b-2 border-black pb-0.5 hover:text-orange-600 hover:border-orange-600 transition-colors"
          >
            ROMPER LÍMITES (CREAR CUENTA)
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
