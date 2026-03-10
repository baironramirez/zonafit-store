"use client";

import { useState } from "react";

export default function CrearProducto() {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState(0);
  const [stock, setStock] = useState(0);
  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault();

    const res = await fetch("/api/admin/productos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre,
        precio,
        stock,
        categoria,
        descripcion,
        imagen,
        activo: true,
      }),
    });

    if (res.ok) {
      alert("Producto creado");
    }
  }

  return (
    <main style={{ padding: "40px" }}>
      <h1>Crear producto</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "10px",
          maxWidth: "400px",
        }}
      >
        <input
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <input
          type="number"
          placeholder="Precio"
          onChange={(e) => setPrecio(Number(e.target.value))}
        />

        <input
          type="number"
          placeholder="Stock"
          onChange={(e) => setStock(Number(e.target.value))}
        />

        <input
          placeholder="Categoría"
          onChange={(e) => setCategoria(e.target.value)}
        />

        <input
          placeholder="Imagen URL"
          onChange={(e) => setImagen(e.target.value)}
        />

        <textarea
          placeholder="Descripción"
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <button type="submit">Crear producto</button>
      </form>
    </main>
  );
}
