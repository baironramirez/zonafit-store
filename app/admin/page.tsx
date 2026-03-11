"use client";

import Link from "next/link";
import { Package, PlusCircle, Settings, Users, LogOut, TrendingUp, DollarSign, Activity } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  const handleLogout = async () => {
    // Para desloguear solo necesitamos limpiar la cookie desde el cliente o forzar que expiren
    document.cookie = "zonafit_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-gray-50 text-black selection:bg-orange-500 selection:text-white pb-12 pt-24">
      {/* Header Admin */}
      <div className="bg-white border-b border-gray-200 px-6 py-8 mb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black mb-1">
              Centro de <span className="text-orange-500">Mando</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm tracking-wide">
              Panel Administrativo de ZonaFit.
            </p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 hover:text-red-600 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        
        {/* Quick Stats Minimalist */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { title: "Ventas del Mes", value: "$4.2M", icon: <DollarSign className="w-5 h-5 text-green-600" />, trend: "+12%" },
            { title: "Órdenes Activas", value: "34", icon: <Activity className="w-5 h-5 text-orange-500" />, trend: "+5%" },
            { title: "Nuevos Clientes", value: "128", icon: <Users className="w-5 h-5 text-blue-600" />, trend: "+22%" },
            { title: "Tasa de Conversión", value: "3.2%", icon: <TrendingUp className="w-5 h-5 text-purple-600" />, trend: "-1%" },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.title}</p>
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  {stat.icon}
                </div>
              </div>
              <div className="flex items-end gap-3">
                <h3 className="text-2xl font-black text-black">{stat.value}</h3>
                <span className={`text-xs font-bold mb-1 ${stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                  {stat.trend}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Acciones Principales */}
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 px-2">Gestión de Tienda</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Tarjeta de Gestión de Productos */}
          <Link href="/admin/productos" className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-black hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center mb-6 group-hover:bg-black group-hover:border-black transition-colors">
              <Package className="w-6 h-6 text-black group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-black uppercase tracking-wide mb-2">Inventario</h3>
            <p className="text-sm text-gray-500 font-medium">Controla el stock, edita precios y gestiona las categorías de tus suplementos.</p>
          </Link>

          {/* Tarjeta de Crear Producto */}
          <Link href="/admin/crear-producto" className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/10 transition-all">
            <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:border-orange-500 transition-colors">
              <PlusCircle className="w-6 h-6 text-orange-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-black uppercase tracking-wide mb-2">Nuevo Suplemento</h3>
            <p className="text-sm text-gray-500 font-medium">Sube fotografías, configura el precio y lanza un nuevo producto al mercado.</p>
          </Link>

          {/* Tarjeta Ajustes (Mockup) */}
          <div className="group bg-gray-50 border border-gray-200 rounded-2xl p-6 opacity-70 cursor-not-allowed">
            <div className="w-12 h-12 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center mb-6">
              <Settings className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-600 uppercase tracking-wide mb-2">Configuración</h3>
            <p className="text-sm text-gray-500 font-medium">Ajustes visuales, métodos de pago y variables globales (Próximamente).</p>
          </div>

        </div>
      </div>
    </main>
  );
}
