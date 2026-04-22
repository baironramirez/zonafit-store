"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Tag, DollarSign, Activity, ShoppingBag, Clock, ChevronRight, AlertCircle, TrendingUp } from "lucide-react";

interface AthleteStats {
  totalSales: number;
  totalUses: number;
  pendingCommission: number;
  paidCommission: number;
}

interface AthleteOrder {
  id: string;
  total: number;
  fecha: any;
  cuponUsado: string;
  estado: string;
  cuponAcreditado: boolean;
}

interface AthleteCoupon {
  codigo: string;
  tipoComision: "porcentaje" | "fijo";
  valorComision: number;
}

export default function AtletaDashboard() {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<AthleteStats>({
    totalSales: 0,
    totalUses: 0,
    pendingCommission: 0,
    paidCommission: 0
  });
  const [recentOrders, setRecentOrders] = useState<AthleteOrder[]>([]);
  const [coupons, setCoupons] = useState<AthleteCoupon[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!currentUser || userProfile?.rol !== "atleta")) {
      router.push("/");
    }
  }, [currentUser, userProfile, loading, router]);

  useEffect(() => {
    if (userProfile?.rol === "atleta") {
      fetchAthleteData();
    }
  }, [userProfile]);

  const fetchAthleteData = async () => {
    if (!currentUser) return;
    setIsDataLoading(true);

    try {
      // 1. Obtener los cupones asignados al atleta
      const couponsQuery = query(
        collection(db, "coupons"),
        where("atletaId", "==", currentUser.uid)
      );
      const couponsSnap = await getDocs(couponsQuery);
      const athleteCoupons = couponsSnap.docs.map(doc => doc.data() as any);
      setCoupons(athleteCoupons);

      if (athleteCoupons.length === 0) {
        setIsDataLoading(false);
        return;
      }

      const couponCodes = athleteCoupons.map(c => c.codigo);

      // 2. Obtener órdenes que usaron esos cupones
      // Nota: Firestore permite 'in' con hasta 10 elementos. 
      // Si el atleta tiene más de 10 códigos (raro), habría que paginar.
      const ordersQuery = query(
        collection(db, "orders"),
        where("cuponUsado", "in", couponCodes)
      );
      const ordersSnap = await getDocs(ordersQuery);
      
      const allAthleteOrders = ordersSnap.docs.map(doc => ({
        id: doc.id,
        total: doc.data().total,
        fecha: doc.data().fecha,
        cuponUsado: doc.data().cuponUsado,
        estado: doc.data().estado || 'pendiente',
        cuponAcreditado: doc.data().cuponAcreditado === true
      })) as AthleteOrder[];

      // Ordenar por fecha de forma manual para evitar error de índice compuesto en Firebase
      allAthleteOrders.sort((a, b) => {
        const timeA = a.fecha?.toDate ? a.fecha.toDate().getTime() : 0;
        const timeB = b.fecha?.toDate ? b.fecha.toDate().getTime() : 0;
        return timeB - timeA;
      });

      // Mostrar en la lista todas las órdenes asociadas al cupón para transparencia total
      setRecentOrders(allAthleteOrders);

      // 3. Calcular estadísticas SOLO con las acreditadas (Entregadas)
      const accreditedOrders = allAthleteOrders.filter(o => o.cuponAcreditado);

      let totalSales = 0;
      let totalUses = accreditedOrders.length;
      let totalCommission = 0;

      accreditedOrders.forEach(order => {
        totalSales += order.total;
        const coupon = athleteCoupons.find(c => c.codigo === order.cuponUsado);
        if (coupon) {
          if (coupon.tipoComision === "porcentaje") {
            totalCommission += order.total * (coupon.valorComision / 100);
          } else {
            totalCommission += coupon.valorComision;
          }
        }
      });

      // Dinero ya liquidado (leemos del cupón)
      let paidCommission = 0;
      athleteCoupons.forEach(c => {
        if (c.tipoComision === "porcentaje") {
          paidCommission += (c.dineroLiquidado || 0) * (c.valorComision / 100);
        } else {
          paidCommission += (c.usosLiquidados || 0) * c.valorComision;
        }
      });

      setStats({
        totalSales,
        totalUses,
        pendingCommission: Math.max(0, totalCommission - paidCommission),
        paidCommission
      });

    } catch (error) {
      console.error("Error fetching athlete data:", error);
    } finally {
      setIsDataLoading(false);
    }
  };

  if (loading || isDataLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Cargando Rendimiento...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-12 border-b border-gray-100 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter shadow-sm shadow-orange-200">Atleta Elite</span>
              <h1 className="text-4xl font-black uppercase tracking-tighter">Tu Panel</h1>
            </div>
            <p className="text-gray-500 font-medium tracking-tight">Monitorea el impacto de tu comunidad y tus ganancias en tiempo real.</p>
          </div>
          <button 
            onClick={fetchAthleteData}
            className="text-xs font-bold uppercase tracking-widest bg-gray-50 border border-gray-200 px-6 py-3 hover:bg-black hover:text-white transition-all rounded-xl"
          >
            Actualizar Datos
          </button>
        </div>

        {coupons.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center max-w-xl mx-auto">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold uppercase mb-2">Sin Códigos Asignados</h3>
            <p className="text-gray-500 text-sm">Aún no tienes códigos de descuento vinculados a tu cuenta. Contacta al administrador para comenzar a generar ventas.</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <StatCard 
                title="Ventas Generadas" 
                value={`$${stats.totalSales.toLocaleString("es-AR")}`}
                icon={<TrendingUp className="w-5 h-5 text-green-500" />}
                description="Monto bruto de tus códigos"
              />
              <StatCard 
                title="Usos Directos" 
                value={stats.totalUses}
                icon={<Activity className="w-5 h-5 text-blue-500" />}
                description="Conversiones exitosas"
              />
              <StatCard 
                title="Comisión Pendiente" 
                value={`$${stats.pendingCommission.toLocaleString("es-AR")}`}
                icon={<DollarSign className="w-5 h-5 text-orange-500" />}
                description="Saldo listo para liquidar"
                variant="highlight"
              />
              <StatCard 
                title="Total Cobrado" 
                value={`$${stats.paidCommission.toLocaleString("es-AR")}`}
                icon={<ShoppingBag className="w-5 h-5 text-gray-400" />}
                description="Pagos históricos realizados"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              {/* Recent Activity (Left 2/3) */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Actividad Reciente</h2>
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Últimos 30 días</span>
                </div>

                <div className="space-y-4">
                  {recentOrders.length === 0 ? (
                    <p className="text-gray-400 text-sm italic">No se han registrado ventas recientemente.</p>
                  ) : (
                    recentOrders.map((order) => (
                      <div key={order.id} className="group flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:border-black transition-all shadow-sm shadow-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-black uppercase tracking-tighter">Pedido #{order.id.slice(-6).toUpperCase()}</p>
                              {order.cuponAcreditado ? (
                                <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-widest">Acreditado</span>
                              ) : order.estado === 'enviado' ? (
                                <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-widest">En Tránsito</span>
                              ) : order.estado === 'pagado' ? (
                                <span className="bg-yellow-100 text-yellow-800 text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-widest">Pagado - Preparando</span>
                              ) : order.estado === 'rechazado' || order.estado === 'reembolsado' ? (
                                <span className="bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-widest">Cancelado</span>
                              ) : (
                                <span className="bg-gray-100 text-gray-500 text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-widest">Pendiente de Pago</span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">{order.fecha?.toDate ? new Date(order.fecha.toDate()).toLocaleDateString() : 'Reciente'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${order.cuponAcreditado ? 'text-green-600' : 'text-gray-400 line-through decoration-1'}`}>${order.total.toLocaleString("es-AR")}</p>
                          <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">{order.cuponUsado}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sidebar Info (Right 1/3) */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 sticky top-32">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6">Tus Códigos</h3>
                  <div className="space-y-6">
                    {coupons.map((c, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-lg font-black tracking-tighter">{c.codigo}</span>
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Tu Comisión</p>
                            <p className="text-sm font-bold text-black">{c.tipoComision === "porcentaje" ? `${c.valorComision}%` : `$${c.valorComision.toLocaleString("es-AR")} fijo`}</p>
                          </div>
                          <Tag className="w-8 h-8 text-gray-100" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 bg-black text-white p-6 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest mb-1">Liquidación</p>
                        <p className="text-[11px] leading-relaxed text-gray-400">Los pagos se procesan los primeros 5 días de cada mes. Contacta a soporte para actualizar tu método de pago.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}

      </div>
    </main>
  );
}

function StatCard({ title, value, icon, description, variant }: { title: string, value: string | number, icon: any, description: string, variant?: "highlight" }) {
  return (
    <div className={`p-6 rounded-3xl border transition-all ${variant === 'highlight' ? 'bg-black text-white border-black shadow-xl shadow-gray-200' : 'bg-white text-black border-gray-100 shadow-sm shadow-gray-50 hover:shadow-md'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${variant === 'highlight' ? 'bg-orange-500/20' : 'bg-gray-50'}`}>
          {icon}
        </div>
        <ChevronRight className={`w-4 h-4 ${variant === 'highlight' ? 'text-gray-600' : 'text-gray-200'}`} />
      </div>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${variant === 'highlight' ? 'text-gray-400' : 'text-gray-400'}`}>{title}</p>
      <h3 className="text-2xl font-black mb-2 tracking-tighter">{value}</h3>
      <p className={`text-[11px] font-medium leading-none ${variant === 'highlight' ? 'text-gray-500' : 'text-gray-400'}`}>{description}</p>
    </div>
  );
}
