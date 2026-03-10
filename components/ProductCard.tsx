"use client";

import { useCart } from "../context/CartContext";

type Props = {
  nombre: string;
  precio: number;
  id: string;
};

export default function ProductCard({ nombre, precio, id }: Props) {
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
      <h3>{nombre}</h3>
      <p>${precio}</p>

      <button onClick={handleAdd}>Agregar al carrito</button>
    </div>
  );
}
