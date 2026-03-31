"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Package, Clock, CheckCircle2, ChevronRight, ShoppingBag, ChevronDown, ChevronUp, MapPin, CreditCard, Truck, PackageCheck, XCircle, RefreshCw } from "lucide-react";

export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendiente: { label: "Pendiente", color: "text-orange-500", icon: <Clock className="w-5 h-5" /> },
  pagado: { label: "Pagado", color: "text-green-500", icon: <CheckCircle2 className="w-5 h-5" /> },
  enviado: { label: "Enviado", color: "text-blue-500", icon: <Truck className="w-5 h-5" /> },
  entregado: { label: "Entregado", color: "text-gray-600", icon: <PackageCheck className="w-5 h-5" /> },
  rechazado: { label: "Rechazado", color: "text-red-500", icon: <XCircle className="w-5 h-5" /> },
  reembolsado: { label: "Reembolsado", color: "text-purple-500", icon: <RefreshCw className="w-5 h-5" /> },
};

interface OrderItem {
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string; // We might not have the image saved directly in early orders, but we can display a placeholder if needed.
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
  estado: string; // "pendiente", "completado", etc.
  fecha: Timestamp | any; 
  // MP info
  mpPaymentId?: string;
  mpStatus?: string;
  mpStatusDetail?: string;
  mpPaymentMethod?: string;
  fechaPago?: string;
  fechaEnvio?: string;
  guiaEnvio?: string;
}

export default function PedidosPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    // If auth is done loading and there is no user, kick them out
    if (!loading && !currentUser) {
      router.push("/login");
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    async function fetchOrders() {
      if (!currentUser?.email) return;

      try {
        setIsLoadingOrders(true);
        // We query by email as defined in our schema
        const q = query(
          collection(db, "orders"),
          where("cliente.correo", "==", currentUser.email)
        );

        const querySnapshot = await getDocs(q);
        const fetchedOrders: Order[] = [];
        
        querySnapshot.forEach((doc) => {
          fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
        });

        // Sort descending locally to avoid requiring a composite index in Firebase
        fetchedOrders.sort((a, b) => {
          const dateA = a.fecha?.seconds || 0;
          const dateB = b.fecha?.seconds || 0;
          return dateB - dateA;
        });

        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoadingOrders(false);
      }
    }

    if (currentUser && !loading) {
      fetchOrders();
    }
  }, [currentUser, loading]);

  if (loading || (isLoadingOrders && currentUser)) {
    return (
      <main className="min-h-screen bg-white text-black pt-32 pb-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          <p className="font-bold uppercase tracking-widest text-sm text-gray-500">Cargando tu historial...</p>
        </div>
      </main>
    );
  }

  // Prevent flash of content before redirect
  if (!currentUser) return null;

  return (
    <main className="min-h-screen bg-gray-50 text-black pt-32 pb-24">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-black flex items-center gap-4">
            Mis Pedidos
          </h1>
          <p className="text-gray-500 font-medium text-lg mt-2">
            Revisa el estado de tus compras y tu historial de suplementos.
          </p>
        </div>

        {/* Content */}
        {orders.length === 0 ? (
          // Empty State minimalista (Gymshark style)
          <div className="text-center py-24 bg-white border border-gray-200 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-6">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-black mb-3">
              Sin Historial
            </h2>
            <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto">
              Aún no has realizado ninguna compra con nosotros. Es momento de equiparte para tu próximo entrenamiento.
            </p>
            <Link
              href="/productos"
              className="inline-block bg-black text-white font-bold uppercase tracking-widest py-4 px-10 hover:bg-orange-500 transition-colors duration-200"
            >
              Explorar Tienda
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              // Convert Timestamp to readable date
              const orderDate = order.fecha?.seconds 
                ? new Date(order.fecha.seconds * 1000).toLocaleDateString("es-AR", {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : "Fecha desconocida";

              // Determine status style
              const statusConfig = STATUS_CONFIG[order.estado] || STATUS_CONFIG.pendiente;
              
              return (
                <div key={order.id} className="bg-white border border-gray-200 p-6 md:p-8 hover:border-gray-300 transition-colors">
                  
                  {/* Order Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                        Orden #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="font-bold text-black text-lg">
                        {orderDate}
                      </p>
                    </div>

                    <div className="flex flex-col md:items-end gap-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        Total
                      </p>
                      <p className="font-black text-xl text-black">
                        ${order.total.toLocaleString("es-AR")}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-4 mb-6">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 rounded-lg overflow-hidden">
                          {item.imagen ? (
                            <img
                              src={item.imagen}
                              alt={item.nombre}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold uppercase tracking-wider text-sm text-black">
                            {item.nombre}
                          </p>
                          <p className="text-gray-500 text-sm font-medium">
                            Cant: {item.cantidad} x ${item.precio.toLocaleString("es-AR")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-black text-sm">
                            ${(item.precio * item.cantidad).toLocaleString("es-AR")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer (Status) */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className={`flex items-center gap-2 ${statusConfig.color}`}>
                      {statusConfig.icon}
                      <span className="font-bold uppercase tracking-widest text-sm">
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Botón Ver Detalles (Toggling state) */}
                    <button 
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="text-gray-400 hover:text-black flex items-center gap-1 text-sm font-bold uppercase tracking-widest transition-colors"
                    >
                      {expandedOrder === order.id ? "Ocultar Detalles" : "Ver Detalles"} 
                      {expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Expanded Details Section */}
                  {expandedOrder === order.id && (
                    <div className="mt-6 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Detalles de Envío */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Datos de Envío
                          </h4>
                          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 space-y-2">
                            <p><strong className="text-black">Dirección:</strong> {order.cliente.direccion || "No especificada"}</p>
                            <p><strong className="text-black">Ciudad:</strong> {order.cliente.ciudad || "—"}, {order.cliente.departamento || "—"}</p>
                            <p><strong className="text-black">Cód. Postal:</strong> {order.cliente.codigoPostal || "—"}</p>
                            {order.guiaEnvio && (
                              <p className="bg-blue-50 border border-blue-100 px-3 py-2 rounded mt-2">
                                <strong className="text-blue-800">Guía de Envío:</strong> <span className="font-mono text-blue-900">{order.guiaEnvio}</span>
                              </p>
                            )}
                            <p className="pt-2 mt-2 border-t border-gray-200">
                              <strong className="text-black">Recibe:</strong> {order.cliente.nombre} <br/>
                              <strong className="text-black">Teléfono:</strong> {order.cliente.telefono || "—"}
                            </p>
                          </div>
                        </div>

                        {/* Detalles de Pago y Costos */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Información de Pago
                          </h4>
                          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 space-y-2">
                            <p><strong className="text-black">Método:</strong> {order.mpPaymentMethod ? order.mpPaymentMethod.toUpperCase() : "MercadoPago"}</p>
                            <p><strong className="text-black">Estado del Pago:</strong> {order.mpStatus || "Pendiente de confirmación"}</p>
                            
                            <div className="pt-2 mt-2 border-t border-gray-200 space-y-1">
                              <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>${(order.subtotal || order.total).toLocaleString("es-AR")}</span>
                              </div>
                              {order.cuponUsado && (
                                <div className="flex justify-between text-green-600">
                                  <span>Descuento ({order.cuponUsado})</span>
                                  <span>-${(order.descuento || 0).toLocaleString("es-AR")}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-black pt-1 border-t border-gray-100 mt-1">
                                <span>Total Pagado</span>
                                <span>${order.total.toLocaleString("es-AR")}</span>
                              </div>
                            </div>
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
