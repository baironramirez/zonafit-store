"use client";

import { useCart } from "../../context/CartContext";
import { useState } from "react";

export default function CarritoPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const total = cart.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0,
  );

  async function handleCheckout(e: any) {
    e.preventDefault();

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

    const mpData = await mpRes.json();

    window.location.href = `https://www.mercadopago.com/checkout/v1/redirect?pref_id=${mpData.id}`;
  }
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

      <form
        onSubmit={handleCheckout}
        style={{ display: "grid", gap: "10px", maxWidth: "400px" }}
      >
        <input placeholder="Nombre completo" required />
        <input placeholder="Cédula" required />
        <input placeholder="Teléfono" required />
        <input placeholder="Dirección" required />
        <input placeholder="Ciudad" required />
        <input placeholder="Departamento" required />
        <input placeholder="Código postal" required />

        <button type="submit">Pagar con MercadoPago</button>
      </form>
    </main>
  );
}
