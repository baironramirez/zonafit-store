"use client";

import { useCart } from "../../context/CartContext";
import { useState } from "react";

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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            🛒 Carrito de Compras
          </h1>
          <p className="text-gray-600 text-lg">
            Revisa tus productos antes de proceder al pago
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <div className="text-6xl mb-4">🛍️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Tu carrito está vacío
            </h2>
            <p className="text-gray-600 mb-6">
              Comienza a agregar productos para completar tu compra
            </p>
            <a
              href="/productos"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Ir a productos
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de productos */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Header de la tabla */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                  <h2 className="text-2xl font-bold">
                    {cart.length} producto{cart.length !== 1 ? "s" : ""} en tu
                    carrito
                  </h2>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-200">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-6 hover:bg-gray-50 transition-colors duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      {/* Información del producto */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.nombre}
                        </h3>
                        <p className="text-2xl font-bold text-blue-600">
                          ${item.precio.toLocaleString("es-AR")}
                        </p>
                      </div>

                      {/* Cantidad */}
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">
                          Cantidad:
                        </label>
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.max(1, item.cantidad - 1),
                              )
                            }
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={item.cantidad}
                            min={1}
                            onChange={(e) =>
                              updateQuantity(
                                item.id,
                                Math.max(1, Number(e.target.value)),
                              )
                            }
                            className="w-12 text-center font-semibold border-0 focus:ring-0"
                          />
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.cantidad + 1)
                            }
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-2">Subtotal</p>
                        <p className="text-xl font-bold text-gray-900">
                          $
                          {(item.precio * item.cantidad).toLocaleString(
                            "es-AR",
                          )}
                        </p>
                      </div>

                      {/* Eliminar */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-full sm:w-auto px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-colors duration-200"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumen y formulario */}
            <div>
              {/* Resumen de precios */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Resumen de pedido
                </h3>

                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex justify-between text-gray-700 mb-3">
                    <span>Subtotal:</span>
                    <span className="font-semibold">
                      ${total.toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between mb-6">
                  <span className="text-2xl font-bold text-gray-900">
                    Total:
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${total.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>

              {/* Formulario de envío */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Datos de envío
                </h3>

                <form onSubmit={handleCheckout} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo *
                    </label>
                    <input
                      name="nombre"
                      placeholder="Ej: Juan Pérez"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cédula *
                      </label>
                      <input
                        name="cedula"
                        placeholder="Ej: 1234567890"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono *
                      </label>
                      <input
                        name="telefono"
                        placeholder="Ej: 3001234567"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección *
                    </label>
                    <input
                      name="direccion"
                      placeholder="Ej: Cra 5 # 10-20"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad *
                      </label>
                      <input
                        name="ciudad"
                        placeholder="Ej: Bogotá"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Departamento *
                      </label>
                      <input
                        name="departamento"
                        placeholder="Ej: Cundinamarca"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código postal *
                    </label>
                    <input
                      name="codigoPostal"
                      placeholder="Ej: 110111"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting
                      ? "Procesando..."
                      : "💳 Pagar con MercadoPago"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
