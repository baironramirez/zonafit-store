"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Package, PlusCircle, Settings, Users, LogOut, TrendingUp, DollarSign, Activity, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface DashboardStats {
  ventasMes: number;
  ventasMesAnterior: number;
  ordenesActivas: number;
  ordenesActivasAnterior: number;
  nuevosClientes: number;
  nuevosClientesAnterior: number;
  tasaConversion: number;
  tasaConversionAnterior: number;
}

function calcTrend(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const pct = Math.round(((current - previous) / previous) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      // Fetch all orders
      const ordersSnap = await getDocs(collection(db, "orders"));
      const allOrders: any[] = [];
      ordersSnap.forEach((doc) => allOrders.push({ id: doc.id, ...doc.data() }));

      // Helper: get date from order
      const getDate = (order: any): Date | null => {
        if (order.fecha?.seconds) return new Date(order.fecha.seconds * 1000);
        if (order.fecha?.toDate) return order.fecha.toDate();
        if (typeof order.fecha === "string") return new Date(order.fecha);
        return null;
      };

      // This month orders
      const thisMonthOrders = allOrders.filter((o) => {
        const d = getDate(o);
        return d && d >= startOfMonth;
      });

      // Last month orders
      const lastMonthOrders = allOrders.filter((o) => {
        const d = getDate(o);
        return d && d >= startOfLastMonth && d <= endOfLastMonth;
      });

      // Ventas del mes (solo pagados/enviados/entregados)
      const paidStatuses = ["pagado", "enviado", "entregado"];
      const ventasMes = thisMonthOrders
        .filter((o) => paidStatuses.includes(o.estado))
        .reduce((acc, o) => acc + (o.total || 0), 0);

      const ventasMesAnterior = lastMonthOrders
        .filter((o) => paidStatuses.includes(o.estado))
        .reduce((acc, o) => acc + (o.total || 0), 0);

      // Órdenes activas (pendiente + pagado + enviado)
      const activeStatuses = ["pendiente", "pagado", "enviado"];
      const ordenesActivas = allOrders.filter((o) => activeStatuses.includes(o.estado)).length;

      const ordenesActivasAnterior = lastMonthOrders.filter((o) => activeStatuses.includes(o.estado)).length;

      // Nuevos clientes este mes (emails únicos en órdenes de este mes)
      const thisMonthEmails = new Set(
        thisMonthOrders.map((o) => o.cliente?.correo?.toLowerCase()).filter(Boolean)
      );
      const lastMonthEmails = new Set(
        lastMonthOrders.map((o) => o.cliente?.correo?.toLowerCase()).filter(Boolean)
      );

      // Tasa de conversión: órdenes pagadas / total órdenes este mes
      const thisMonthPaid = thisMonthOrders.filter((o) => paidStatuses.includes(o.estado)).length;
      const thisMonthTotal = thisMonthOrders.length;
      const tasaConversion = thisMonthTotal > 0 ? (thisMonthPaid / thisMonthTotal) * 100 : 0;

      const lastMonthPaid = lastMonthOrders.filter((o) => paidStatuses.includes(o.estado)).length;
      const lastMonthTotal = lastMonthOrders.length;
      const tasaConversionAnterior = lastMonthTotal > 0 ? (lastMonthPaid / lastMonthTotal) * 100 : 0;

      setStats({
        ventasMes,
        ventasMesAnterior,
        ordenesActivas,
        ordenesActivasAnterior,
        nuevosClientes: thisMonthEmails.size,
        nuevosClientesAnterior: lastMonthEmails.size,
        tasaConversion,
        tasaConversionAnterior,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    document.cookie = "zonafit_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/admin/login");
    router.refresh();
  };

  // Format currency
  function formatMoney(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toLocaleString("es-CO")}`;
  }

  const statCards = stats
    ? [
        {
          title: "Ventas del Mes",
          value: formatMoney(stats.ventasMes),
          icon: <DollarSign className="w-5 h-5 text-green-600" />,
          trend: calcTrend(stats.ventasMes, stats.ventasMesAnterior),
        },
        {
          title: "Órdenes Activas",
          value: String(stats.ordenesActivas),
          icon: <Activity className="w-5 h-5 text-orange-500" />,
          trend: calcTrend(stats.ordenesActivas, stats.ordenesActivasAnterior),
        },
        {
          title: "Nuevos Clientes",
          value: String(stats.nuevosClientes),
          icon: <Users className="w-5 h-5 text-blue-600" />,
          trend: calcTrend(stats.nuevosClientes, stats.nuevosClientesAnterior),
        },
        {
          title: "Tasa de Conversión",
          value: `${stats.tasaConversion.toFixed(1)}%`,
          icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
          trend: calcTrend(stats.tasaConversion, stats.tasaConversionAnterior),
        },
      ]
    : [];

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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            // Skeleton loaders
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                  <div className="w-9 h-9 bg-gray-100 rounded-lg"></div>
                </div>
                <div className="h-7 w-20 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : (
            statCards.map((stat, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.title}</p>
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                    {stat.icon}
                  </div>
                </div>
                <div className="flex items-end gap-3">
                  <h3 className="text-2xl font-black text-black">{stat.value}</h3>
                  <span className={`text-xs font-bold mb-1 ${stat.trend.startsWith('+') ? 'text-green-600' : stat.trend.startsWith('-') ? 'text-red-500' : 'text-gray-400'}`}>
                    {stat.trend}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Acciones Principales */}
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 px-2">Gestión de Tienda</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

          {/* Tarjeta de Pedidos */}
          <Link href="/admin/pedidos" className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/10 transition-all">
            <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:border-orange-500 transition-colors">
              <ClipboardList className="w-6 h-6 text-orange-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-black uppercase tracking-wide mb-2">Pedidos</h3>
            <p className="text-sm text-gray-500 font-medium">Gestiona órdenes, actualiza estados de pago y controla los envíos.</p>
          </Link>

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

          {/* Tarjeta Ajustes */}
          <Link href="/admin/ajustes" className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all">
            <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:border-blue-500 transition-colors">
              <Settings className="w-6 h-6 text-black group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-black uppercase tracking-wide mb-2">Configuración</h3>
            <p className="text-sm text-gray-500 font-medium">Ajustes visuales, imágenes de banners y variables globales de la tienda.</p>
          </Link>

          {/* Tarjeta Afiliados */}
          <Link href="/admin/cupones" className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/10 transition-all">
            <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center mb-6 group-hover:bg-green-500 group-hover:border-green-500 transition-colors">
              <Users className="w-6 h-6 text-black group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-black uppercase tracking-wide mb-2">Afiliados</h3>
            <p className="text-sm text-gray-500 font-medium">Gestiona códigos de descuento, trackea usos y liquida comisiones a los atletas.</p>
          </Link>

        </div>
      </div>
    </main>
  );
}
