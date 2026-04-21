"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Mail, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Password Reset Error:", err);
      if (err.code === "auth/user-not-found") {
        // Por seguridad muchas veces no se debe revelar que el usuario no existe,
        // pero en tiendas pequeñas a veces es mejor dar feedback.
        setError("No hay ninguna cuenta registrada con este correo.");
      } else if (err.code === "auth/invalid-email") {
        setError("El formato del correo es inválido.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Demasiados intentos. Inténtalo más tarde.");
      } else {
        setError("Ocurrió un error al intentar enviar el correo de recuperación.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-black flex flex-col items-center justify-center pt-32 pb-12 px-6 selection:bg-black selection:text-white relative">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link href="/login" className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-black uppercase tracking-widest transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Volver al login
        </Link>

        {isSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white border-2 border-gray-100 rounded-3xl p-8 shadow-2xl shadow-gray-200/50 text-center"
          >
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-black mb-3">
              CORREO ENVIADO
            </h2>
            <p className="text-gray-500 font-medium text-sm mb-8">
              Si el correo <strong>{email}</strong> está registrado, pronto recibirás un enlace para forjar una nueva contraseña militar. Revisa tu bandeja de SPAM si no lo ves.
            </p>
            <Link 
              href="/login"
              className="block w-full py-5 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.4)] transition-all duration-300"
            >
              VOLVER AL LOGIN
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Header Text */}
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-3 leading-none truncate">
                RECUPERAR <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">ACCESO</span>
              </h1>
              <p className="text-gray-500 font-medium text-sm">
                Ingresa tu correo militar y te enviaremos las coordenadas para restablecer tu contraseña.
              </p>
            </div>

            {/* Reset Box */}
            <div className="bg-white border-2 border-gray-100 rounded-3xl p-8 shadow-2xl shadow-gray-200/50">
              <form onSubmit={handleReset} className="space-y-6">

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
                  {isLoading ? "PROCESANDO..." : "ENVIAR CORREO"}
                </button>
              </form>
            </div>
          </>
        )}

      </motion.div>
    </main>
  );
}
