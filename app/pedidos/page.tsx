"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Package, Clock, CheckCircle2, ChevronRight, ShoppingBag } from "lucide-react";

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
    // ...other fields we don't strictly need to display here
  };
  items: OrderItem[];
  total: number;
  estado: string; // "pendiente", "completado", etc.
  fecha: Timestamp | any; 
}

export default function PedidosPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

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
              const isCompleted = order.estado.toLowerCase() === "completado" || order.estado.toLowerCase() === "aprobado";
              
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
                        <div className="w-16 h-16 bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-5 h-5 text-gray-300" />
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
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-orange-500" />
                      )}
                      <span className="font-bold uppercase tracking-widest text-sm text-black">
                        {order.estado || "Pendiente"}
                      </span>
                    </div>

                    {/* Fictional link for future tracking/invoice features */}
                    <button className="text-gray-400 hover:text-black flex items-center gap-1 text-sm font-bold uppercase tracking-widest transition-colors">
                      Ver Detalles <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
