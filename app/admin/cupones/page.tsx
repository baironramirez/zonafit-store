"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus, Download, Tag, DollarSign, Activity, Users, X } from "lucide-react";

export interface Coupon {
  id: string;
  codigo: string;
  tipoDescuento?: "porcentaje" | "fijo";
  descuento: number; // Porcentaje o monto fijo de descuento para el cliente
  tipoComision: "porcentaje" | "fijo";
  valorComision: number;
  activo: boolean;
  usos: number;
  dineroGenerado: number;
  dineroLiquidado?: number; // Total pagado
  usosLiquidados?: number;  // Usos ya pagados
  fechaCreacion?: any;
}

export default function CuponesAdmin() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newCodigo, setNewCodigo] = useState("");
  const [newTipoDescuento, setNewTipoDescuento] = useState<"porcentaje" | "fijo">("porcentaje");
  const [newDescuento, setNewDescuento] = useState<number>(10);
  const [newTipoComision, setNewTipoComision] = useState<"porcentaje" | "fijo">("porcentaje");
  const [newValorComision, setNewValorComision] = useState<number>(10);

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
      
      // Sort by usos desc
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

    // Check if code already exists locally
    const codeExists = coupons.some(c => c.codigo.toUpperCase() === newCodigo.trim().toUpperCase());
    if (codeExists) {
      alert("Este código ya existe.");
      return;
    }

    try {
      const newCoupon = {
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
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating coupon:", error);
      alert("Hubo un error al crear el cupón.");
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
    // Definimos las cabeceras
    const headers = ["CÓDIGO", "TIPO DESC.", "DESCUENTO", "ACTIVO", "USOS", "TOTAL VENTAS ($)", "TIPO COMISION", "VALOR COMISION", "TOTAL PAGADO ($)", "COMISIÓN PENDIENTE ($)"];
    
    // Mapeamos los datos
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
        comisionPendiente.toFixed(2)
      ].join(","); // Join by comma
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

        {/* Formulario de Creación */}
        {isCreating && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
            <h3 className="text-lg font-black uppercase tracking-widest mb-6">Alta de Nuevo Cupón / Atleta</h3>
            <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
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
              <div className="lg:col-span-1">
                <button type="submit" className="w-full bg-black text-white font-bold uppercase tracking-widest text-xs px-6 py-4 rounded-xl hover:bg-orange-500 transition-colors h-[50px]">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabla Lista de Cupones */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Código</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Descuento</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Métrica Ventas</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest bg-orange-50">Liquidación a Atleta</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Estado</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
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

                    return (
                      <tr key={coupon.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
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
                            <span className="text-xs text-gray-500 font-medium">{coupon.usos} usos totales</span>
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
                          <button
                            onClick={() => handleDelete(coupon.id, coupon.codigo)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar permanentemente"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
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
