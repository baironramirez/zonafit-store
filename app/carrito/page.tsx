"use client";

import { useCart } from "../../context/CartContext";
import { useState } from "react";
import Link from "next/link";
import { Trash2, ShoppingBag, CreditCard, ChevronLeft, Minus, Plus } from "lucide-react";

export default function CarritoPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = cart.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0,
  );

  async function handleCheckout(e: any) {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target.closest("form");
    const formData = new FormData(form);

    const cliente = {
      nombre: formData.get("nombre"),
      cedula: formData.get("cedula"),
      telefono: formData.get("telefono"),
      direccion: formData.get("direccion"),
      ciudad: formData.get("ciudad"),
      departamento: formData.get("departamento"),
      codigoPostal: formData.get("codigoPostal"),
    };

    const items = cart.map((item) => ({
      nombre: item.nombre,
      precio: item.precio,
      cantidad: item.cantidad,
    }));

    const total = cart.reduce(
      (acc, item) => acc + item.precio * item.cantidad,
      0,
    );

    try {
      // 1️⃣ crear pedido
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente,
          items,
          total,
        }),
      });

      const orderData = await orderRes.json();

      // 2️⃣ crear pago
      const mpRes = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            title: item.nombre,
            quantity: item.cantidad,
            unit_price: item.precio,
          })),
          orderId: orderData.orderId,
        }),
      });

      if (!mpRes.ok) {
        const errorText = await mpRes.text();
        console.error("Error creating payment:", mpRes.status, errorText);
        alert(
          `Error (${mpRes.status}): ${errorText || "Sin detalles del error"}`,
        );
        setIsSubmitting(false);
        return;
      }

      const mpData = await mpRes.json();

      window.location.href = `https://www.mercadopago.com/checkout/v1/redirect?pref_id=${mpData.id}`;
    } catch (error) {
      alert("Error al procesar el pago");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-black selection:bg-orange-500 selection:text-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Breadcrumb / Regresar */}
        <Link href="/productos" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors mb-8">
          <ChevronLeft className="w-4 h-4" /> Seguir Comprando
        </Link>

        {/* Header */}
        <div className="mb-12 border-b border-gray-200 pb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-black mb-2 flex items-center gap-4">
            Tu Pedido <ShoppingBag className="w-8 h-8 text-orange-500" />
          </h1>
          <p className="text-gray-500 font-medium text-lg tracking-wide">
            Asegúrate de llevar todo lo necesario para romper tus récords.
          </p>
        </div>

        {cart.length === 0 ? (
          // Empty State Minimalista
          <div className="text-center py-24 bg-gray-50 border border-gray-200 rounded-none">
            <div className="w-24 h-24 bg-white border border-gray-200 rounded-xl flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-black mb-2">
              Bolsa Vacía
            </h2>
            <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto">
              Aún no has agregado suplementos a tu pedido. El camino a la grandeza empieza en la tienda.
            </p>
            <Link
              href="/productos"
              className="inline-block bg-black text-white font-bold uppercase tracking-widest py-4 px-10 hover:bg-orange-500 transition-colors"
            >
              Ir al Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            
            {/* Lista de productos Minimalista */}
            <div className="lg:col-span-2">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2 border-b border-gray-200">
                Resumen de Items ({cart.length})
              </h2>
              
              <div className="flex flex-col gap-6">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-gray-100"
                  >
                    {/* Información del producto */}
                    <div className="flex-1 flex gap-4 items-center">
                      {/* Imagen placeholder (si hay imagen en el cart state la mostramos, sino un cuadrito) */}
                      {item.imagen ? (
                        <div className="w-20 h-24 bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                           <img src={item.imagen} alt={item.nombre} className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                      ) : (
                        <div className="w-20 h-24 bg-gray-50 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-widest text-black mb-1">
                          {item.nombre}
                        </h3>
                        <p className="text-xl font-medium text-gray-900">
                          ${item.precio.toLocaleString("es-AR")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
                      {/* Cantidad estricta */}
                      <div className="flex items-center border border-gray-200">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.cantidad - 1))}
                          className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-black transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={item.cantidad}
                          min={1}
                          onChange={(e) => updateQuantity(item.id, Math.max(1, Number(e.target.value)))}
                          className="w-12 h-10 text-center font-bold text-black border-none focus:ring-0 bg-transparent p-0"
                        />
                        <button
                          onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                          className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-black transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Subtotal & Eliminar */}
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-lg font-black text-black">
                            ${(item.precio * item.cantidad).toLocaleString("es-AR")}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel de Pago Brutalista */}
            <div>
              <div className="bg-gray-50 border border-gray-200 p-8 sticky top-32">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2 border-b border-gray-200">
                  Totalización
                </h3>

                {/* Subtotales */}
                <div className="flex justify-between items-center mb-4 text-black font-medium">
                  <span>Subtotal</span>
                  <span>${total.toLocaleString("es-AR")}</span>
                </div>
                <div className="flex justify-between items-center mb-6 text-black font-medium pb-6 border-b border-gray-200">
                  <span>Envío</span>
                  <span className="text-orange-500 text-sm font-bold uppercase tracking-wider">Por Calcular</span>
                </div>

                {/* Total Final */}
                <div className="flex justify-between items-end mb-8">
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-500">
                    Total a Pagar
                  </span>
                  <span className="text-3xl font-black text-black leading-none">
                    ${total.toLocaleString("es-AR")}
                  </span>
                </div>

                {/* Checkout Form */}
                <form onSubmit={handleCheckout} className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 pt-4 border-t border-gray-200">
                    Datos de la Orden
                  </h3>

                  <div className="space-y-3">
                    <input name="nombre" placeholder="NOMBRE COMPLETO" required
                      className="w-full px-4 py-3 bg-white border border-gray-300 text-black placeholder-gray-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <input name="cedula" placeholder="CÉDULA" required
                        className="w-full px-4 py-3 bg-white border border-gray-300 text-black placeholder-gray-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                      <input name="telefono" placeholder="TELÉFONO" required
                        className="w-full px-4 py-3 bg-white border border-gray-300 text-black placeholder-gray-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                    </div>

                    <input name="direccion" placeholder="DIRECCIÓN DE ENVÍO" required
                      className="w-full px-4 py-3 bg-white border border-gray-300 text-black placeholder-gray-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <input name="ciudad" placeholder="CIUDAD" required
                        className="w-full px-4 py-3 bg-white border border-gray-300 text-black placeholder-gray-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                      <input name="departamento" placeholder="DEPARTAMENTO" required
                        className="w-full px-4 py-3 bg-white border border-gray-300 text-black placeholder-gray-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                    </div>
                    
                    <input name="codigoPostal" placeholder="CÓDIGO POSTAL" required
                      className="w-full px-4 py-3 bg-white border border-gray-300 text-black placeholder-gray-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-8 bg-black hover:bg-orange-500 text-white font-bold uppercase tracking-widest py-4 px-6 transition-colors duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isSubmitting ? (
                      "PROCESANDO..."
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                        PAGAR AHORA
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mt-4 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Pagos seguros por MercadoPago
                  </p>
                </form>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
