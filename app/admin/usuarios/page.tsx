"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { ArrowLeft, Search, UserCog, ShieldCheck, Truck, Trophy, User, ShieldAlert, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserData {
  uid: string;
  email: string;
  rol: "admin" | "cliente" | "atleta" | "delivery";
  createdAt?: string;
  nombre?: string;
}

export default function UsuariosAdmin() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    user: UserData | null;
    targetRol: string;
  }>({
    isOpen: false,
    user: null,
    targetRol: ""
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(
        users.filter(u => 
          u.email?.toLowerCase().includes(term) || 
          u.uid.toLowerCase().includes(term) ||
          u.nombre?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(doc => ({
        ...doc.data()
      })) as UserData[];
      
      // Sort by email
      usersData.sort((a, b) => (a.email || "").localeCompare(b.email || ""));
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setLoading(false);
  };

  const handleUpdateRol = async (user: UserData, newRol: string) => {
    // Si el nuevo rol es admin, pedir confirmación extra
    if (newRol === "admin") {
      setConfirmModal({
        isOpen: true,
        user,
        targetRol: newRol
      });
      return;
    }

    // Para otros roles, actualizar directamente
    performUpdate(user.uid, newRol as any);
  };

  const performUpdate = async (uid: string, rol: UserData["rol"]) => {
    setUpdatingUid(uid);
    try {
      await updateDoc(doc(db, "users", uid), { rol });
      setUsers(users.map(u => u.uid === uid ? { ...u, rol } : u));
      // Cerrar modal si estaba abierto
      setConfirmModal({ isOpen: false, user: null, targetRol: "" });
    } catch (error) {
      console.error("Error updating user rol:", error);
      alert("Error al actualizar el rol.");
    } finally {
      setUpdatingUid(null);
    }
  };

  const getRoleBadge = (rol: string) => {
    switch (rol) {
      case "admin":
        return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full"><ShieldCheck className="w-3 h-3" /> Admin</span>;
      case "atleta":
        return <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full"><Trophy className="w-3 h-3" /> Atleta</span>;
      case "delivery":
        return <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full"><Truck className="w-3 h-3" /> Delivery</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full"><User className="w-3 h-3" /> Cliente</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center">
        <Loader2 className="w-12 h-12 text-black animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Accediendo a la Base de Usuarios...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-black selection:bg-orange-500 selection:text-white pb-12 pt-24">
      <div className="max-w-7xl mx-auto px-6">
        
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Volver al Panel
        </Link>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-gray-900 mb-2">
              Gestión de <span className="text-orange-500">Usuarios</span>
            </h1>
            <p className="text-gray-500 font-medium tracking-tight">
              Controla los niveles de acceso y roles de todos los miembros de ZonaFit.
            </p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por email, nombre o UID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 focus:border-black rounded-2xl text-sm font-medium transition-all outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-5 px-8 text-[11px] font-black text-gray-400 uppercase tracking-widest">Información del Usuario</th>
                  <th className="py-5 px-8 text-[11px] font-black text-gray-400 uppercase tracking-widest">Rol Actual</th>
                  <th className="py-5 px-8 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Cambiar Permisos</th>
                  <th className="py-5 px-8 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Registrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-gray-400 font-medium italic">
                      No se encontraron usuarios con ese criterio.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-6 px-8">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-black">{user.nombre || 'Atleta Sin Nombre'}</span>
                          <span className="text-xs text-gray-500 font-medium">{user.email}</span>
                          <span className="text-[9px] text-gray-300 font-mono mt-1 uppercase tracking-tighter">ID: {user.uid}</span>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        {getRoleBadge(user.rol)}
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex justify-center">
                          <select
                            disabled={updatingUid === user.uid}
                            value={user.rol}
                            onChange={(e) => handleUpdateRol(user, e.target.value)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border-2 transition-all outline-none appearance-none cursor-pointer
                              ${updatingUid === user.uid ? 'bg-gray-100 border-gray-100 text-gray-400' : 'bg-white border-gray-100 hover:border-black text-black'}
                            `}
                          >
                            <option value="cliente">Cliente Standard</option>
                            <option value="atleta">Atleta Afiliado</option>
                            <option value="delivery">Personal Delivery</option>
                            <option value="admin">Administrador Master</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-right">
                        <span className="text-xs font-bold text-gray-400 italic">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            ></motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] p-8 md:p-12 w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <ShieldAlert className="w-24 h-24 text-red-50 opacity-50 absolute -top-4 -right-4 rotate-12" />
              </div>

              <div className="relative text-center">
                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <ShieldAlert className="w-10 h-10 text-red-600" />
                </div>

                <h2 className="text-3xl font-black uppercase tracking-tighter text-black mb-4">
                  ¿Autorizar <span className="text-red-600">Admin</span>?
                </h2>
                
                <p className="text-gray-500 font-medium leading-relaxed mb-10">
                  Estás a punto de otorgar permisos totales a <strong>{confirmModal.user?.email}</strong>. Esta cuenta tendrá control absoluto sobre ventas, productos y otros administradores.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    className="py-5 bg-gray-50 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => performUpdate(confirmModal.user!.uid, confirmModal.targetRol as any)}
                    className="py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                  >
                    SÍ, AUTORIZAR
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
