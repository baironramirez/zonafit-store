"use client";

import { useEffect, useState } from "react";

export default function AdminProductos() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const res = await fetch("/api/admin/productos/list");
    const data = await res.json();

    setProducts(data);
  }

  return (
    <main style={{ padding: "40px" }}>
      <h1>Gestión de productos</h1>

      {products.map((product: any) => (
        <div
          key={product.id}
          style={{
            borderBottom: "1px solid #ddd",
            padding: "10px 0",
          }}
        >
          <h3>{product.nombre}</h3>

          <p>Precio: ${product.precio}</p>

          <p>Stock: {product.stock}</p>
          <button onClick={() => toggleProduct(product.id, product.activo)}>
            {product.activo ? "Desactivar" : "Activar"}
          </button>

          <p>Estado: {product.activo ? "Activo" : "Inactivo"}</p>
        </div>
      ))}
    </main>
  );

  async function toggleProduct(id: string, activo: boolean) {
    await fetch("/api/admin/productos/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        activo: !activo,
      }),
    });

    fetchProducts();
  }
}
