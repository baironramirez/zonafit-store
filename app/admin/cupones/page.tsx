"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus, Download, Tag, DollarSign, Activity, Users, X, Pencil, Shield, Clock, Hash } from "lucide-react";

export interface Coupon {
  id: string;
  codigo: string;
  tipoDescuento?: "porcentaje" | "fijo";
  descuento: number;
  tipoComision: "porcentaje" | "fijo";
  valorComision: number;
  activo: boolean;
  usos: number;
  dineroGenerado: number;
  dineroLiquidado?: number;
  usosLiquidados?: number;
  fechaCreacion?: any;
  // New fields
  usoUnicoPorUsuario?: boolean;
  limiteUsos?: number; // 0 = unlimited
  fechaExpiracion?: string; // ISO date string
}

export default function CuponesAdmin() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newCodigo, setNewCodigo] = useState("");
  const [newTipoDescuento, setNewTipoDescuento] = useState<"porcentaje" | "fijo">("porcentaje");
  const [newDescuento, setNewDescuento] = useState<number>(10);
  const [newTipoComision, setNewTipoComision] = useState<"porcentaje" | "fijo">("porcentaje");
  const [newValorComision, setNewValorComision] = useState<number>(10);
  const [newUsoUnico, setNewUsoUnico] = useState(false);
  const [newLimiteUsos, setNewLimiteUsos] = useState<number>(0);
  const [newFechaExpiracion, setNewFechaExpiracion] = useState("");

  // Edit Modal State
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editTipoDescuento, setEditTipoDescuento] = useState<"porcentaje" | "fijo">("porcentaje");
  const [editDescuento, setEditDescuento] = useState<number>(10);
  const [editTipoComision, setEditTipoComision] = useState<"porcentaje" | "fijo">("porcentaje");
  const [editValorComision, setEditValorComision] = useState<number>(10);
  const [editUsoUnico, setEditUsoUnico] = useState(false);
  const [editLimiteUsos, setEditLimiteUsos] = useState<number>(0);
  const [editFechaExpiracion, setEditFechaExpiracion] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "coupons"));
      const cuponesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Coupon[];
      
      cuponesData.sort((a, b) => b.usos - a.usos);
      setCoupons(cuponesData);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    }
    setLoading(false);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodigo.trim()) return;

    const codeExists = coupons.some(c => c.codigo.toUpperCase() === newCodigo.trim().toUpperCase());
    if (codeExists) {
      alert("Este código ya existe.");
      return;
    }

    try {
      const newCoupon: any = {
        codigo: newCodigo.trim().toUpperCase(),
        tipoDescuento: newTipoDescuento,
        descuento: Number(newDescuento),
        tipoComision: newTipoComision,
        valorComision: Number(newValorComision),
        activo: true,
        usos: 0,
        dineroGenerado: 0,
        dineroLiquidado: 0,
        usosLiquidados: 0,
        usoUnicoPorUsuario: newUsoUnico,
        limiteUsos: Number(newLimiteUsos),
        fechaExpiracion: newFechaExpiracion || null,
        fechaCreacion: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "coupons"), newCoupon);
      setCoupons([{ id: docRef.id, ...newCoupon } as Coupon, ...coupons]);
      
      // Reset form
      setNewCodigo("");
      setNewTipoDescuento("porcentaje");
      setNewDescuento(10);
      setNewTipoComision("porcentaje");
      setNewValorComision(10);
      setNewUsoUnico(false);
      setNewLimiteUsos(0);
      setNewFechaExpiracion("");
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating coupon:", error);
      alert("Hubo un error al crear el cupón.");
    }
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setEditTipoDescuento(coupon.tipoDescuento || "porcentaje");
    setEditDescuento(coupon.descuento);
    setEditTipoComision(coupon.tipoComision);
    setEditValorComision(coupon.valorComision);
    setEditUsoUnico(coupon.usoUnicoPorUsuario || false);
    setEditLimiteUsos(coupon.limiteUsos || 0);
    setEditFechaExpiracion(coupon.fechaExpiracion || "");
  };

  const handleEditCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    try {
      const updateData: any = {
        tipoDescuento: editTipoDescuento,
        descuento: Number(editDescuento),
        tipoComision: editTipoComision,
        valorComision: Number(editValorComision),
        usoUnicoPorUsuario: editUsoUnico,
        limiteUsos: Number(editLimiteUsos),
        fechaExpiracion: editFechaExpiracion || null,
      };

      await updateDoc(doc(db, "coupons", editingCoupon.id), updateData);
      setCoupons(coupons.map(c => c.id === editingCoupon.id ? { ...c, ...updateData } : c));
      setEditingCoupon(null);
      alert("Cupón actualizado exitosamente.");
    } catch (error) {
      console.error("Error updating coupon:", error);
      alert("Hubo un error al actualizar el cupón.");
    }
  };

  const toggleStatus = async (coupon: Coupon) => {
    try {
      await updateDoc(doc(db, "coupons", coupon.id), {
        activo: !coupon.activo
      });
      setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, activo: !coupon.activo } : c));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async (id: string, codigo: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente el cupón ${codigo}?`)) return;
    try {
      await deleteDoc(doc(db, "coupons", id));
      setCoupons(coupons.filter(c => c.id !== id));
    } catch (error) {
      console.error("Error deleting coupon:", error);
    }
  };

  const handleLiquidar = async (coupon: Coupon) => {
    if (!confirm(`¿Estás seguro que deseas liquidar las comisiones pendientes del atleta ${coupon.codigo}?`)) return;
    
    try {
      await updateDoc(doc(db, "coupons", coupon.id), {
        dineroLiquidado: coupon.dineroGenerado,
        usosLiquidados: coupon.usos
      });
      setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, dineroLiquidado: c.dineroGenerado, usosLiquidados: c.usos } : c));
      alert(`Liquidación de ${coupon.codigo} registrada exitosamente.`);
    } catch (error) {
      console.error("Error al liquidar:", error);
      alert("Hubo un error al registrar la liquidación.");
    }
  };

  const exportCSV = () => {
    const headers = ["CÓDIGO", "TIPO DESC.", "DESCUENTO", "ACTIVO", "USOS", "TOTAL VENTAS ($)", "TIPO COMISION", "VALOR COMISION", "TOTAL PAGADO ($)", "COMISIÓN PENDIENTE ($)", "USO ÚNICO", "LÍMITE USOS", "EXPIRACIÓN"];
    
    const rows = coupons.map(c => {
      const usosUnpaid = c.usos - (c.usosLiquidados || 0);
      const moneyUnpaid = c.dineroGenerado - (c.dineroLiquidado || 0);
      
      const comisionPendiente = c.tipoComision === "porcentaje" 
        ? Math.max(0, moneyUnpaid) * (c.valorComision / 100)
        : Math.max(0, usosUnpaid) * c.valorComision;
        
      const comisionPagada = c.tipoComision === "porcentaje" 
        ? (c.dineroLiquidado || 0) * (c.valorComision / 100)
        : (c.usosLiquidados || 0) * c.valorComision;

      return [
        c.codigo,
        c.tipoDescuento || "porcentaje",
        c.descuento,
        c.activo ? "SÍ" : "NO",
        c.usos,
        c.dineroGenerado.toFixed(2),
        c.tipoComision.toUpperCase(),
        c.valorComision,
        comisionPagada.toFixed(2),
        comisionPendiente.toFixed(2),
        c.usoUnicoPorUsuario ? "SÍ" : "NO",
        c.limiteUsos || "∞",
        c.fechaExpiracion || "Sin expiración"
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_afiliados_zonafit_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: check if a coupon is expired
  const isExpired = (coupon: Coupon) => {
    if (!coupon.fechaExpiracion) return false;
    return new Date(coupon.fechaExpiracion) < new Date();
  };

  // Helper: check if a coupon has reached its usage limit
  const isLimitReached = (coupon: Coupon) => {
    if (!coupon.limiteUsos || coupon.limiteUsos <= 0) return false;
    return coupon.usos >= coupon.limiteUsos;
  };

  const grandTotalSales = coupons.reduce((acc, c) => acc + c.dineroGenerado, 0);
  const totalCommissionsToPay = coupons.reduce((acc, c) => {
    const usosUnpaid = Math.max(0, c.usos - (c.usosLiquidados || 0));
    const moneyUnpaid = Math.max(0, c.dineroGenerado - (c.dineroLiquidado || 0));
    return acc + (c.tipoComision === "porcentaje" ? moneyUnpaid * (c.valorComision / 100) : usosUnpaid * c.valorComision);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 mb-2">
              Gestor de Afiliados
            </h1>
            <p className="text-gray-500 font-medium">
              Administra códigos de descuento, trackea el rendimiento y calcula las comisiones.
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={exportCSV}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-black font-bold uppercase tracking-widest text-xs px-6 py-4 hover:border-black hover:bg-gray-50 transition-all rounded-xl"
            >
              <Download className="w-4 h-4" /> Exportar CSV
            </button>
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-black text-white font-bold uppercase tracking-widest text-xs px-6 py-4 hover:bg-orange-500 transition-all rounded-xl shadow-lg"
            >
              {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
              {isCreating ? "Cancelar" : "Nuevo Cupón"}
            </button>
          </div>
        </div>

        {/* Totals Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0">
              <Tag className="w-6 h-6 text-black" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Cupones Activos</p>
              <h3 className="text-2xl font-black">{coupons.filter(c => c.activo).length}</h3>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ingresos por Afiliados</p>
              <h3 className="text-2xl font-black text-green-600">${grandTotalSales.toLocaleString("es-AR")}</h3>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0">
              <DollarSign className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Comisiones a Pagar</p>
              <h3 className="text-2xl font-black text-orange-500">${totalCommissionsToPay.toLocaleString("es-AR")}</h3>
            </div>
          </div>
        </div>

        {/* Create Form */}
        {isCreating && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
            <h3 className="text-lg font-black uppercase tracking-widest mb-6">Alta de Nuevo Cupón / Atleta</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-6">
              {/* Row 1: Basic fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Código Promo</label>
                  <input
                    type="text"
                    required
                    value={newCodigo}
                    onChange={e => setNewCodigo(e.target.value.toUpperCase())}
                    placeholder="NOMBRE20"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black font-black uppercase tracking-widest focus:ring-2 focus:ring-black focus:outline-none transition-all"
                  />
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tipo Descuento (Cliente)</label>
                  <select
                    value={newTipoDescuento}
                    onChange={e => setNewTipoDescuento(e.target.value as any)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all appearance-none"
                  >
                    <option value="porcentaje">% de Descuento</option>
                    <option value="fijo">Monto Fijo ($)</option>
                  </select>
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Valor Descuento (Cliente)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={newTipoDescuento === "porcentaje" ? 100 : undefined}
                    value={newDescuento}
                    onChange={e => setNewDescuento(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all"
                  />
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tipo Comisión</label>
                  <select
                    value={newTipoComision}
                    onChange={e => setNewTipoComision(e.target.value as any)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all appearance-none"
                  >
                    <option value="porcentaje">% de la Venta</option>
                    <option value="fijo">Valor Fijo ($)</option>
                  </select>
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Valor Comisión</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newValorComision}
                    onChange={e => setNewValorComision(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all"
                  />
                </div>
              </div>
              
              {/* Row 2: Restrictions */}
              <div className="border-t border-gray-100 pt-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Restricciones (Opcional)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`relative w-12 h-6 rounded-full transition-colors ${newUsoUnico ? 'bg-orange-500' : 'bg-gray-200'}`}
                        onClick={() => setNewUsoUnico(!newUsoUnico)}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${newUsoUnico ? 'translate-x-6' : ''}`} />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-700 group-hover:text-black transition-colors">Uso Único por Usuario</span>
                        <p className="text-[11px] text-gray-400">Cada usuario solo puede usarlo 1 vez</p>
                      </div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Límite Global de Usos</label>
                    <input
                      type="number"
                      min="0"
                      value={newLimiteUsos}
                      onChange={e => setNewLimiteUsos(Number(e.target.value))}
                      placeholder="0 = Ilimitado"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">0 = sin límite</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Fecha de Expiración</label>
                    <input
                      type="date"
                      value={newFechaExpiracion}
                      onChange={e => setNewFechaExpiracion(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Vacío = nunca expira</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="bg-black text-white font-bold uppercase tracking-widest text-xs px-8 py-4 rounded-xl hover:bg-orange-500 transition-colors">
                  Guardar Cupón
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Modal */}
        {editingCoupon && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingCoupon(null)}>
            <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black uppercase tracking-widest">
                  Editar Cupón: <span className="text-orange-500">{editingCoupon.codigo}</span>
                </h3>
                <button onClick={() => setEditingCoupon(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleEditCoupon} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tipo Descuento</label>
                    <select
                      value={editTipoDescuento}
                      onChange={e => setEditTipoDescuento(e.target.value as any)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all appearance-none"
                    >
                      <option value="porcentaje">% de Descuento</option>
                      <option value="fijo">Monto Fijo ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Valor Descuento</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={editTipoDescuento === "porcentaje" ? 100 : undefined}
                      value={editDescuento}
                      onChange={e => setEditDescuento(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tipo Comisión</label>
                    <select
                      value={editTipoComision}
                      onChange={e => setEditTipoComision(e.target.value as any)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all appearance-none"
                    >
                      <option value="porcentaje">% de la Venta</option>
                      <option value="fijo">Valor Fijo ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Valor Comisión</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editValorComision}
                      onChange={e => setEditValorComision(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Restrictions */}
                <div className="border-t border-gray-100 pt-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Restricciones</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`relative w-12 h-6 rounded-full transition-colors ${editUsoUnico ? 'bg-orange-500' : 'bg-gray-200'}`}
                          onClick={() => setEditUsoUnico(!editUsoUnico)}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editUsoUnico ? 'translate-x-6' : ''}`} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-gray-700">Uso Único por Usuario</span>
                          <p className="text-[11px] text-gray-400">1 uso por usuario</p>
                        </div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Límite Global</label>
                      <input
                        type="number"
                        min="0"
                        value={editLimiteUsos}
                        onChange={e => setEditLimiteUsos(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">0 = sin límite</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Expiración</label>
                      <input
                        type="date"
                        value={editFechaExpiracion}
                        onChange={e => setEditFechaExpiracion(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black font-bold focus:ring-2 focus:ring-black focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingCoupon(null)} className="px-6 py-3 bg-gray-100 text-gray-600 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-gray-200 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-8 py-3 bg-black text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-orange-500 transition-colors">
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Código</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Descuento</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Métrica Ventas</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest bg-orange-50">Liquidación a Atleta</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Restricciones</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Estado</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No hay cupones registrados.</p>
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => {
                    const usosUnpaid = Math.max(0, coupon.usos - (coupon.usosLiquidados || 0));
                    const moneyUnpaid = Math.max(0, coupon.dineroGenerado - (coupon.dineroLiquidado || 0));
                    
                    const comisionPendiente = coupon.tipoComision === "porcentaje" 
                      ? moneyUnpaid * (coupon.valorComision / 100)
                      : usosUnpaid * coupon.valorComision;

                    const expired = isExpired(coupon);
                    const limitReached = isLimitReached(coupon);

                    return (
                      <tr key={coupon.id} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${expired ? 'opacity-60' : ''}`}>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-gray-400" />
                            <span className="font-black text-sm uppercase tracking-widest">{coupon.codigo}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                            - {coupon.tipoDescuento === "fijo" ? `$${coupon.descuento.toLocaleString("es-AR")}` : `${coupon.descuento}%`}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-black text-sm">${coupon.dineroGenerado.toLocaleString("es-AR")} Total</span>
                            <span className="text-xs text-gray-500 font-medium">
                              {coupon.usos} usos{coupon.limiteUsos && coupon.limiteUsos > 0 ? ` / ${coupon.limiteUsos}` : ''} totales
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 bg-orange-50/30">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-orange-600">
                                PENDIENTE: ${comisionPendiente.toLocaleString("es-AR")}
                              </span>
                              {comisionPendiente > 0 && (
                                <button
                                  onClick={() => handleLiquidar(coupon)}
                                  className="bg-green-500 text-white text-[9px] px-2 py-0.5 rounded uppercase font-black hover:bg-green-600 transition-colors"
                                  title="Marcar pendiente como pagado"
                                >
                                  Liquidar
                                </button>
                              )}
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-orange-400 font-bold">
                              Tarifa: {coupon.tipoComision === "porcentaje" ? `${coupon.valorComision}%` : `$${coupon.valorComision}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1.5">
                            {coupon.usoUnicoPorUsuario && (
                              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" title="Un solo uso por usuario">
                                <Shield className="w-3 h-3" /> Único
                              </span>
                            )}
                            {coupon.limiteUsos && coupon.limiteUsos > 0 ? (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${limitReached ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'}`} title={`Límite: ${coupon.limiteUsos} usos`}>
                                <Hash className="w-3 h-3" /> {coupon.usos}/{coupon.limiteUsos}
                              </span>
                            ) : null}
                            {coupon.fechaExpiracion ? (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${expired ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`} title={`Expira: ${coupon.fechaExpiracion}`}>
                                <Clock className="w-3 h-3" /> {expired ? 'Expirado' : new Date(coupon.fechaExpiracion).toLocaleDateString('es-AR')}
                              </span>
                            ) : null}
                            {!coupon.usoUnicoPorUsuario && (!coupon.limiteUsos || coupon.limiteUsos <= 0) && !coupon.fechaExpiracion && (
                              <span className="text-[10px] text-gray-300 font-medium">Sin restricciones</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => toggleStatus(coupon)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${
                              coupon.activo 
                                ? "bg-green-100 text-green-700 hover:bg-green-200" 
                                : "bg-red-100 text-red-600 hover:bg-red-200"
                            }`}
                          >
                            {coupon.activo ? "Activo" : "Inactivo"}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(coupon)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar cupón"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(coupon.id, coupon.codigo)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar permanentemente"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
