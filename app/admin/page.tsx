"use client";

import Link from "next/link";
import { Package, PlusCircle, Settings, ShieldCheck, ArrowRight, Activity, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  const handleLogout = () => {
    // Basic logout clearing the cookie
    document.cookie = "zonafit_admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white selection:bg-orange-500 selection:text-black pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-sm font-medium text-orange-500 rounded-full bg-orange-500/10 border border-orange-500/20">
              <ShieldCheck className="w-4 h-4" />
              <span>Acceso Administrador</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Panel de <span className="text-orange-500">Control</span>
            </h1>
          </div>
          <button 
            onClick={handleLogout}
            className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-medium rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-neutral-800 opacity-20">
              <Activity className="w-32 h-32" />
            </div>
            <h3 className="text-neutral-400 font-medium mb-2">Ventas del Mes</h3>
            <p className="text-3xl font-bold text-white mb-4">+$12,450</p>
            <div className="text-sm text-green-500 font-medium">↑ 14% vs último mes</div>
          </div>
          
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-neutral-800 opacity-20">
              <Package className="w-32 h-32" />
            </div>
            <h3 className="text-neutral-400 font-medium mb-2">Productos Activos</h3>
            <p className="text-3xl font-bold text-white mb-4">124</p>
            <div className="text-sm text-neutral-500 font-medium">10 bajos en stock</div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-neutral-800 opacity-20">
              <Users className="w-32 h-32" />
            </div>
            <h3 className="text-neutral-400 font-medium mb-2">Nuevos Clientes</h3>
            <p className="text-3xl font-bold text-white mb-4">42</p>
            <div className="text-sm text-green-500 font-medium">↑ 5% vs último mes</div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 border-b border-neutral-800 pb-4">Gestión de Tienda</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/productos">
            <div className="group bg-neutral-900 border border-neutral-800 hover:border-orange-500/50 p-8 rounded-2xl transition-all h-full flex flex-col justify-between cursor-pointer">
              <div>
                <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6">
                  <Package className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-orange-500 transition-colors">
                  Catálogo de Productos
                </h3>
                <p className="text-neutral-400">
                  Ver, editar y eliminar los suplementos y artículos actuales en la tienda.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-sm font-bold text-orange-500">
                Gestionar <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
              </div>
            </div>
          </Link>

          <Link href="/admin/crear-producto">
            <div className="group bg-neutral-900 border border-neutral-800 hover:border-orange-500/50 p-8 rounded-2xl transition-all h-full flex flex-col justify-between cursor-pointer">
              <div>
                <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6">
                  <PlusCircle className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-orange-500 transition-colors">
                  Nuevo Producto
                </h3>
                <p className="text-neutral-400">
                  Añade un nuevo suplemento, define precio, stock e imágenes al catálogo.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-sm font-bold text-orange-500">
                Crear <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
              </div>
            </div>
          </Link>

          <div className="group bg-neutral-950 border border-neutral-900 p-8 rounded-2xl h-full flex flex-col justify-between opacity-50 cursor-not-allowed">
            <div>
              <div className="w-14 h-14 bg-neutral-800 rounded-xl flex items-center justify-center mb-6">
                <Settings className="w-7 h-7 text-neutral-500" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-400 mb-3">
                Configuración (Próximamente)
              </h3>
              <p className="text-neutral-500">
                Ajustes globales de envíos, métodos de pago y variables de entorno.
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
