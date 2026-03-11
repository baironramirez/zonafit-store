"use client";

import { useCart } from "../context/CartContext";

type Props = {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
};

export default function ProductCard({ id, nombre, precio, imagen }: Props) {
  const { addToCart } = useCart();

  function handleAdd() {
    addToCart({
      id,
      nombre,
      precio,
      cantidad: 1,
    });
  }

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "16px",
        borderRadius: "8px",
        width: "200px",
      }}
    >
      <img
        src={imagen}
        alt={nombre}
        width="150"
        style={{ marginBottom: "10px" }}
      />

      <h3>{nombre}</h3>
      <p>${precio}</p>

      <button onClick={handleAdd}>Agregar al carrito</button>
    </div>
  );
}
