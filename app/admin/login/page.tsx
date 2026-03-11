"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Lock } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Credenciales inválidas");
      }
    } catch (err) {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-orange-500 selection:text-black relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 blur-3xl">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600 rounded-full mix-blend-screen filter" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent" />
            <Zap className="w-8 h-8 text-orange-500 relative z-10" />
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-black text-white tracking-tight">
          Panel de Control
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-400">
          Acceso restringido solo para administradores
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-neutral-900 py-8 px-4 shadow-2xl shadow-black sm:rounded-2xl sm:px-10 border border-neutral-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-sm text-red-400 text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-300">
                Correo Electrónico
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-neutral-800 rounded-xl shadow-sm bg-neutral-950 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors sm:text-sm"
                  placeholder="admin@zonafit.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-neutral-800 rounded-xl shadow-sm bg-neutral-950 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-black bg-orange-500 hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  "Autenticando..."
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Entrar al Sistema
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
