"use client";

import { useCart } from "../../context/CartContext";
import { useState } from "react";

export default function CarritoPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const total = cart.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0,
  );

  return (
    <main style={{ padding: "40px" }}>
      <h1>Carrito de compras</h1>

      {cart.length === 0 && <p>Tu carrito está vacío</p>}

      {cart.map((item) => (
        <div
          key={item.id}
          style={{
            borderBottom: "1px solid #ddd",
            padding: "10px 0",
          }}
        >
          <h3>{item.nombre}</h3>

          <p>Precio: ${item.precio}</p>

          <input
            type="number"
            value={item.cantidad}
            min={1}
            onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
          />

          <button onClick={() => removeFromCart(item.id)}>Eliminar</button>
        </div>
      ))}

      <h2>Total: ${total}</h2>

      <h2>Datos de envío</h2>

      <form style={{ display: "grid", gap: "10px", maxWidth: "400px" }}>
        <input placeholder="Nombre completo" required />

        <input placeholder="Cédula" required />

        <input placeholder="Teléfono" required />

        <input placeholder="Dirección" required />

        <input placeholder="Ciudad" required />

        <input placeholder="Departamento" required />

        <input placeholder="Código postal" required />

        <button onClick={handleCheckout}>Pagar con MercadoPago</button>
      </form>
    </main>
  );

  async function handleCheckout() {
    const items = cart.map((item) => ({
      title: item.nombre,
      quantity: item.cantidad,
      unit_price: item.precio,
    }));

    const res = await fetch("/api/create-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    });

    const data = await res.json();

    window.location.href = `https://www.mercadopago.com/checkout/v1/redirect?pref_id=${data.id}`;
  }
}
