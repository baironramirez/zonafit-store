"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, loading, currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser || userProfile?.rol !== "admin") {
        // Redirigir al inicio si no es admin
        router.push("/");
      }
    }
  }, [currentUser, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex justify-center items-center pt-24">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-bold text-black uppercase tracking-widest text-sm">Validando Credenciales...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || userProfile?.rol !== "admin") {
    return null; // El router.push ya fue activado
  }

  return <>{children}</>;
}
