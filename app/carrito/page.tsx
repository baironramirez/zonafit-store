"use client";

import { useCart } from "../../context/CartContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, ShoppingBag, CreditCard, ChevronLeft, Minus, Plus, Tag, X } from "lucide-react";
import { getAuth } from "firebase/auth";

export default function CarritoPage() {
  const { cart, removeFromCart, updateQuantity, discount, applyDiscount, removeDiscount } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbProductos, setDbProductos] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);

  // API Colombia States
  const [departments, setDepartments] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedCityName, setSelectedCityName] = useState<string>("");

  useEffect(() => {
    // Verificamos si hay usuario activo para pre-cargar correo
    const auth = getAuth();
    if (auth.currentUser?.email) {
      setUserEmail(auth.currentUser.email);
    } else {
      // Intento alternativo de escuchar cambios si la api carga lento
      const unsubscribe = auth.onAuthStateChanged(user => {
        if (user?.email) setUserEmail(user.email);
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    fetch("/api/productos")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDbProductos(data);
        } else if (data.productos) {
          setDbProductos(data.productos);
        }
      })
      .catch((err) => console.error("Error fetching db products:", err));
  }, []);

  // Fetch Departments from API Colombia
  useEffect(() => {
    fetch("https://api-colombia.com/api/v1/Department")
      .then(res => res.json())
      .then(data => {
        // Sort alphabetically
        const sorted = data.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setDepartments(sorted);
      })
      .catch(err => console.error("Error fetching departments:", err));
  }, []);

  // Fetch Cities when Department changes
  useEffect(() => {
    if (selectedDeptId) {
      fetch(`https://api-colombia.com/api/v1/Department/${selectedDeptId}/cities`)
        .then(res => res.json())
        .then(data => {
          const sorted = data.sort((a: any, b: any) => a.name.localeCompare(b.name));
          setCities(sorted);
        })
        .catch(err => console.error("Error fetching cities:", err));
    } else {
      setCities([]);
    }
  }, [selectedDeptId]);

  const subtotal = cart.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0,
  );
  
  const discountAmount = discount ? subtotal * (discount.percentage / 100) : 0;
  const finalTotal = subtotal - discountAmount;

  async function handleCheckout(e: any) {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target.closest("form");
    const formData = new FormData(form);

    const cliente = {
      correo: formData.get("correo"),
      nombre: formData.get("nombre"),
      cedula: formData.get("cedula"),
      telefono: formData.get("telefono"),
      direccion: formData.get("direccion"),
      ciudad: formData.get("ciudad"),
      departamento: formData.get("departamento"),
      codigoPostal: formData.get("codigoPostal"),
    };

    const items = cart.map((item) => ({
      id: item.id,
      productoId: item.productoId,
      varianteId: item.varianteId,
      nombre: item.nombre,
      precio: item.precio,
      cantidad: item.cantidad,
      imagen: item.imagen || "",
    }));

    const orderTotal = finalTotal;

    const multiplier = discount ? (1 - discount.percentage / 100) : 1;

    try {
      // 1️⃣ Crear pedido en Firestore
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente,
          items,
          subtotal,
          descuento: discountAmount,
          cuponUsado: discount ? discount.code : null,
          total: orderTotal,
        }),
      });

      if (!orderRes.ok) {
        const errText = await orderRes.text();
        console.error("Error creando pedido:", orderRes.status, errText);
        alert("Error al crear el pedido. Intenta de nuevo.");
        setIsSubmitting(false);
        return;
      }

      const orderData = await orderRes.json();

      // 2️⃣ Crear preferencia de pago en MercadoPago
      const mpRes = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            id: item.id,
            title: item.nombre,
            quantity: Number(item.cantidad),
            unit_price: Number((item.precio * multiplier).toFixed(2)),
          })),
          orderId: orderData.orderId,
        })
      });

      // 3️⃣ Manejo de error del backend
      if (!mpRes.ok) {
        const errorText = await mpRes.text();
        console.error("Error creating payment:", mpRes.status, errorText);
        alert(
          `Error (${mpRes.status}): ${errorText || "Error al crear preferencia de pago"}`
        );
        setIsSubmitting(false);
        return;
      }

      const mpData = await mpRes.json();
      console.log("Preferencia creada:", mpData);

      // 4️⃣ Redirigir a checkout de MercadoPago (usa init_point que devuelve la API)
      if (mpData.init_point) {
        window.location.href = mpData.init_point;
      } else {
        alert("No se pudo iniciar el pago. Intenta de nuevo.");
        setIsSubmitting(false);
      }

    } catch (error) {
      console.error("Error en checkout:", error);
      alert("Error al procesar el pago. Verifica tu conexión e intenta de nuevo.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-black selection:bg-orange-500 selection:text-white pt-24 pb-36 lg:pb-12 relative">
      <div className="max-w-7xl mx-auto px-6">

        {/* Breadcrumb / Regresar */}
        <Link href="/productos" className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-all mb-8">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Seguir Comprando
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

            {/* Panel de Pago Brutalista (IZQUIERDA) */}
            <div className="lg:col-span-7">
              <div className="bg-gray-50 border border-gray-200 p-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2 border-b border-gray-200">
                  Totalización
                </h3>

                {/* Subtotales */}
                <div className="flex justify-between items-center mb-4 text-black font-medium">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString("es-AR")}</span>
                </div>
                {discount && (
                  <div className="flex justify-between items-center mb-4 text-green-600 font-medium">
                    <span>Descuento ({discount.code})</span>
                    <span>-${discountAmount.toLocaleString("es-AR")}</span>
                  </div>
                )}
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
                    ${finalTotal.toLocaleString("es-AR")}
                  </span>
                </div>

                {/* Checkout Form */}
                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 pt-4 border-t border-gray-200">
                    Datos de la Orden
                  </h3>

                  <div className="space-y-3">
                    <input name="correo" type="email" placeholder="CORREO ELECTRÓNICO" required
                      defaultValue={userEmail}
                      className="w-full px-4 py-3 bg-white border border-gray-300 text-black placeholder-gray-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />

                    <input name="nombre" placeholder="NOMBRE COMPLETO" required minLength={3}
                      className="w-full px-4 py-3 bg-white border border-gray-300 text-black placeholder-gray-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />

                    <div className="grid grid-cols-2 gap-3">
                      <input name="cedula" placeholder="CÉDULA" required pattern="\d+" title="Ingrese solo números" autoComplete="off"
                        className="w-full px-4 py-3 bg-white border border-gray-300 text-black placeholder-gray-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                      <input name="telefono" placeholder="TELÉFONO" required pattern="\d{10}" title="Debe contener exactamente 10 dígitos"
                        className="w-full px-4 py-3 bg-white border border-gray-300 text-black placeholder-gray-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                    </div>

                    <input name="direccion" placeholder="DIRECCIÓN DE ENVÍO" required minLength={5}
                      className="w-full px-4 py-3 bg-white border border-gray-300 text-black placeholder-gray-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />

                    <div className="grid grid-cols-2 gap-3">
                      <input type="hidden" name="departamento" value={departments.find(d => d.id.toString() === selectedDeptId)?.name || ""} />
                      <input type="hidden" name="ciudad" value={selectedCityName} />

                      <select
                        required
                        value={selectedDeptId}
                        onChange={(e) => {
                          setSelectedDeptId(e.target.value);
                          setSelectedCityName(""); // Reset city when region changes
                        }}
                        className="w-full px-4 py-3 bg-white border border-gray-300 text-black font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all appearance-none"
                      >
                        <option value="" disabled>DEPARTAMENTO</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>

                      <select
                        required
                        value={selectedCityName}
                        onChange={(e) => setSelectedCityName(e.target.value)}
                        disabled={!selectedDeptId}
                        className="w-full px-4 py-3 bg-white border border-gray-300 text-black font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all appearance-none disabled:opacity-50 disabled:bg-gray-100"
                      >
                        <option value="" disabled>CIUDAD</option>
                        {cities.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <input name="codigoPostal" placeholder="CÓDIGO POSTAL" required minLength={4}
                      className="w-full px-4 py-3 bg-white border border-gray-300 text-black placeholder-gray-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
                  </div>

                  {/* Submit Button (Hidden on Mobile, replaced by sticky footer) */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="hidden lg:flex w-full mt-8 bg-black hover:bg-orange-500 text-white font-bold uppercase tracking-widest py-4 px-6 transition-colors duration-200 items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
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
                  <p className="hidden lg:flex text-center text-xs font-bold uppercase tracking-widest text-gray-400 mt-4 items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Pagos seguros por MercadoPago
                  </p>
                </form>
              </div>
            </div>

            {/* Lista de productos Minimalista (DERECHA y STICKY) */}
            <div className="lg:col-span-5 sticky top-32 h-fit">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2 border-b border-gray-200">
                Resumen de Items ({cart.length})
              </h2>

              {/* Código de Descuento en Checkout */}
              <div className="mb-8">
                {discount ? (
                  <div className="flex justify-between items-center bg-gray-50 border border-gray-200 px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-xs uppercase tracking-widest flex items-center gap-1 text-black">
                        <Tag className="w-3 h-3" /> {discount.code}
                      </span>
                      <span className="text-xs text-green-600 font-bold mt-0.5">-{discount.percentage}% Aplicado a toda la compra</span>
                    </div>
                    <button onClick={removeDiscount} className="text-gray-400 hover:text-red-500 transition-colors p-1" type="button">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountInput}
                        onChange={(e) => { setDiscountInput(e.target.value); setDiscountError(""); }}
                        placeholder="CÓDIGO DE DESCUENTO"
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 text-black placeholder-gray-400 font-bold text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!discountInput.trim() || isVerifyingCoupon) return;
                          setIsVerifyingCoupon(true);
                          const res = await applyDiscount(discountInput);
                          if (!res.success) setDiscountError(res.message);
                          else setDiscountInput("");
                          setIsVerifyingCoupon(false);
                        }}
                        disabled={isVerifyingCoupon}
                        className="px-6 bg-black text-white font-bold uppercase tracking-widest text-xs hover:bg-orange-500 transition-colors disabled:opacity-50"
                      >
                        {isVerifyingCoupon ? "..." : "Aplicar"}
                      </button>
                    </div>
                    {discountError && <p className="text-red-500 text-xs mt-2 font-bold">{discountError}</p>}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6">
                {cart.map((item) => {
                  const dbItem = dbProductos.find((p) => p.id === item.id);
                  const imageUrl = item.imagen || dbItem?.imagen;

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 py-4 border-b border-gray-100"
                    >
                      {/* Imagen con Badge de Cantidad integrado (estilo Gymshark Summary) */}
                      <div className="relative w-20 h-24 bg-gray-50 rounded-md border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {imageUrl ? (
                          <img src={imageUrl} alt={item.nombre} className="w-full h-full object-contain mix-blend-multiply" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-gray-300" />
                        )}
                        {/* Quantity Badge on top right */}
                        <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-bl-md">
                          {item.cantidad}
                        </div>
                      </div>

                      {/* Información central y derecha */}
                      <div className="flex-1 min-w-0 flex flex-row justify-between">
                        <div className="flex flex-col pr-4">
                          <h3 className="text-sm font-medium text-black leading-snug">
                            {item.nombre}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {dbItem?.categoria || ''}
                          </p>

                          {/* Controles Ultra Minimalistas */}
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center gap-3 text-xs font-medium text-gray-600">
                              <button onClick={() => updateQuantity(item.id, Math.max(1, item.cantidad - 1))} className="w-5 h-5 flex justify-center items-center hover:bg-gray-100 rounded text-gray-400 hover:text-black transition-colors">-</button>
                              <span className="w-2 text-center text-black font-semibold">{item.cantidad}</span>
                              <button onClick={() => updateQuantity(item.id, item.cantidad + 1)} className="w-5 h-5 flex justify-center items-center hover:bg-gray-100 rounded text-gray-400 hover:text-black transition-colors">+</button>
                            </div>
                            <span className="text-gray-200">|</span>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>

                        {/* Precio */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium text-black">
                            ${item.precio.toLocaleString("es-AR")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Mobile Sticky Checkout Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-40 lg:hidden flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-500 text-xs uppercase tracking-widest">Total a Pagar</span>
            <span className="font-black text-xl">${finalTotal.toLocaleString("es-AR")}</span>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={isSubmitting}
            className="w-full bg-black hover:bg-orange-500 text-white font-bold uppercase tracking-widest py-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "PROCESANDO..." : "PAGAR AHORA"}
          </button>
        </div>
      )}

    </main>
  );
}
