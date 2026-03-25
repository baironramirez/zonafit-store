"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import {
  ChevronLeft, Package, Clock, CheckCircle2, Truck, PackageCheck,
  XCircle, ChevronDown, ChevronUp, Eye, RefreshCw
} from "lucide-react";

interface OrderItem {
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
}

interface Order {
  id: string;
  cliente: {
    correo: string;
    nombre: string;
    cedula?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    departamento?: string;
    codigoPostal?: string;
  };
  items: OrderItem[];
  subtotal?: number;
  descuento?: number;
  cuponUsado?: string;
  total: number;
  estado: string;
  fecha: Timestamp | any;
  // MercadoPago fields
  mpPaymentId?: string;
  mpStatus?: string;
  mpStatusDetail?: string;
  mpPaymentMethod?: string;
  mpTransactionAmount?: number;
  fechaPago?: string;
  fechaEnvio?: string;
  fechaEntrega?: string;
}

const ESTADOS = ["todos", "pendiente", "pagado", "enviado", "entregado", "rechazado", "reembolsado"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pendiente: { label: "Pendiente", color: "text-orange-600", bg: "bg-orange-50 border-orange-200", icon: <Clock className="w-4 h-4" /> },
  pagado: { label: "Pagado", color: "text-green-600", bg: "bg-green-50 border-green-200", icon: <CheckCircle2 className="w-4 h-4" /> },
  enviado: { label: "Enviado", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: <Truck className="w-4 h-4" /> },
  entregado: { label: "Entregado", color: "text-gray-600", bg: "bg-gray-50 border-gray-200", icon: <PackageCheck className="w-4 h-4" /> },
  rechazado: { label: "Rechazado", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: <XCircle className="w-4 h-4" /> },
  reembolsado: { label: "Reembolsado", color: "text-purple-600", bg: "bg-purple-50 border-purple-200", icon: <RefreshCw className="w-4 h-4" /> },
};

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  async function fetchOrders() {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));
      const data: Order[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Order);
      });

      // Sort by date descending
      data.sort((a, b) => {
        const dateA = a.fecha?.seconds || 0;
        const dateB = b.fecha?.seconds || 0;
        return dateB - dateA;
      });

      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdatingOrder(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: newStatus }),
      });

      if (res.ok) {
        // Update local state
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, estado: newStatus } : o))
        );
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Error al actualizar el pedido");
    } finally {
      setUpdatingOrder(null);
    }
  }

  const filteredOrders = filtroEstado === "todos"
    ? orders
    : orders.filter((o) => o.estado === filtroEstado);

  // Stats
  const stats = {
    total: orders.length,
    pendientes: orders.filter((o) => o.estado === "pendiente").length,
    pagados: orders.filter((o) => o.estado === "pagado").length,
    enviados: orders.filter((o) => o.estado === "enviado").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex justify-center items-center pt-24">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-medium text-gray-500 uppercase tracking-widest text-sm">Cargando Pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-black pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-all mb-6">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Centro de Mando
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-black mb-1">
                Gestión de <span className="text-orange-500">Pedidos</span>
              </h1>
              <p className="text-gray-500 font-medium text-sm">
                {orders.length} pedidos en total
              </p>
            </div>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-black text-black rounded-lg text-sm font-bold uppercase tracking-wider transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Actualizar
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: stats.total, color: "text-black" },
            { label: "Pendientes", value: stats.pendientes, color: "text-orange-500" },
            { label: "Pagados", value: stats.pagados, color: "text-green-600" },
            { label: "Enviados", value: stats.enviados, color: "text-blue-600" },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {ESTADOS.map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                filtroEstado === estado
                  ? "bg-black text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-black hover:text-black"
              }`}
            >
              {estado === "todos" ? "Todos" : STATUS_CONFIG[estado]?.label || estado}
              {estado !== "todos" && (
                <span className="ml-2 opacity-60">
                  ({orders.filter((o) => o.estado === estado).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No hay pedidos con este filtro.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const statusConfig = STATUS_CONFIG[order.estado] || STATUS_CONFIG.pendiente;

              const orderDate = order.fecha?.seconds
                ? new Date(order.fecha.seconds * 1000).toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Fecha desconocida";

              return (
                <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Order Row */}
                  <div
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 flex items-center justify-center rounded-lg border ${statusConfig.bg} ${statusConfig.color} flex-shrink-0`}>
                        {statusConfig.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="font-bold text-black truncate">
                          {order.cliente?.nombre || "Sin nombre"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400 font-medium">{orderDate}</p>
                        <p className="text-xs text-gray-400">{order.items?.length || 0} items</p>
                      </div>
                      <p className="font-black text-black text-lg whitespace-nowrap">
                        ${order.total?.toLocaleString("es-CO") || "0"}
                      </p>

                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusConfig.bg} ${statusConfig.color} whitespace-nowrap`}>
                        {statusConfig.label}
                      </span>

                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Items */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Productos</h4>
                          <div className="space-y-3">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {item.imagen ? (
                                    <img src={item.imagen} alt={item.nombre} className="w-full h-full object-contain p-0.5" />
                                  ) : (
                                    <Package className="w-4 h-4 text-gray-300" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-black truncate">{item.nombre}</p>
                                  <p className="text-xs text-gray-400">
                                    {item.cantidad}x ${item.precio?.toLocaleString("es-CO") || "0"}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {order.cuponUsado && (
                            <p className="text-xs text-green-600 font-bold mt-3">
                              🏷️ Cupón: {order.cuponUsado} (-${order.descuento?.toLocaleString("es-CO") || "0"})
                            </p>
                          )}
                        </div>

                        {/* Client Info */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Cliente</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="text-gray-400">Nombre:</span> <span className="font-medium text-black">{order.cliente?.nombre}</span></p>
                            <p><span className="text-gray-400">Email:</span> <span className="font-medium text-black">{order.cliente?.correo}</span></p>
                            <p><span className="text-gray-400">Teléfono:</span> <span className="font-medium text-black">{order.cliente?.telefono || "—"}</span></p>
                            <p><span className="text-gray-400">Cédula:</span> <span className="font-medium text-black">{order.cliente?.cedula || "—"}</span></p>
                            <p><span className="text-gray-400">Dirección:</span> <span className="font-medium text-black">{order.cliente?.direccion || "—"}</span></p>
                            <p><span className="text-gray-400">Ciudad:</span> <span className="font-medium text-black">{order.cliente?.ciudad || "—"}, {order.cliente?.departamento || ""}</span></p>
                          </div>
                        </div>

                        {/* Payment & Actions */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Pago & Estado</h4>
                          <div className="space-y-2 text-sm mb-6">
                            {order.mpPaymentId && (
                              <>
                                <p><span className="text-gray-400">ID Pago MP:</span> <span className="font-mono text-xs text-black">{order.mpPaymentId}</span></p>
                                <p><span className="text-gray-400">Estado MP:</span> <span className="font-medium text-black">{order.mpStatus || "—"}</span></p>
                                <p><span className="text-gray-400">Detalle:</span> <span className="font-medium text-black">{order.mpStatusDetail || "—"}</span></p>
                                <p><span className="text-gray-400">Método:</span> <span className="font-medium text-black">{order.mpPaymentMethod || "—"}</span></p>
                              </>
                            )}
                            {!order.mpPaymentId && (
                              <p className="text-gray-400 italic">Sin datos de pago MP</p>
                            )}
                            {order.fechaPago && (
                              <p><span className="text-gray-400">Pagado:</span> <span className="font-medium text-green-600">{new Date(order.fechaPago).toLocaleString("es-CO")}</span></p>
                            )}
                            {order.fechaEnvio && (
                              <p><span className="text-gray-400">Enviado:</span> <span className="font-medium text-blue-600">{new Date(order.fechaEnvio).toLocaleString("es-CO")}</span></p>
                            )}
                          </div>

                          {/* Change Status */}
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Cambiar Estado</h4>
                          <div className="flex flex-wrap gap-2">
                            {["pendiente", "pagado", "enviado", "entregado", "rechazado"].map((estado) => {
                              const config = STATUS_CONFIG[estado];
                              const isCurrent = order.estado === estado;
                              return (
                                <button
                                  key={estado}
                                  disabled={isCurrent || updatingOrder === order.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`¿Cambiar estado a "${config.label}"?`)) {
                                      handleStatusChange(order.id, estado);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                                    isCurrent
                                      ? `${config.bg} ${config.color} cursor-default`
                                      : "bg-white border-gray-200 text-gray-500 hover:border-black hover:text-black"
                                  } disabled:opacity-50`}
                                >
                                  {updatingOrder === order.id ? "..." : config.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
