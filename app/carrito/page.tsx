"use client";

import { useCart } from "../../context/CartContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, ShoppingBag, CreditCard, ChevronLeft, Minus, Plus } from "lucide-react";
import { getAuth } from "firebase/auth";

export default function CarritoPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbProductos, setDbProductos] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState("");

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
      nombre: item.nombre,
      precio: item.precio,
      cantidad: item.cantidad,
      imagen: item.imagen || "",
    }));

    const total = cart.reduce(
      (acc, item) => acc + item.precio * item.cantidad,
      0,
    );

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
          total,
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
            unit_price: Number(item.precio),
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
    <main className="min-h-screen bg-white text-black selection:bg-orange-500 selection:text-white pt-24 pb-12">
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

            {/* Lista de productos Minimalista (DERECHA y STICKY) */}
            <div className="lg:col-span-5 sticky top-32 h-fit">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2 border-b border-gray-200">
                Resumen de Items ({cart.length})
              </h2>

              <div className="flex flex-col gap-6">
                {cart.map((item) => {
                  const dbItem = dbProductos.find((p) => p.id === item.id);
                  const imageUrl = item.imagen || dbItem?.imagen;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-gray-100"
                    >
                      {/* Información del producto */}
                      <div className="flex-1 flex gap-4 items-center">
                        {/* Imagen dinámica (desde state o db) */}
                        {imageUrl ? (
                          <div className="w-20 h-24 bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <img src={imageUrl} alt={item.nombre} className="w-full h-full object-contain mix-blend-multiply" />
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
                            className="w-12 h-10 text-center font-bold text-black border-none focus:ring-0 bg-transparent p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                  )
                })}
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
