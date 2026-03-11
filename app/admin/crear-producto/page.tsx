"use client";

import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useState } from "react";

export default function CrearProducto() {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState(0);
  const [stock, setStock] = useState(0);
  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  async function handleSubmit(e: any) {
    e.preventDefault();

    let imageUrl = "";

    if (imageFile) {
      const imageRef = ref(storage, `products/${Date.now()}-${imageFile.name}`);

      await uploadBytes(imageRef, imageFile);

      imageUrl = await getDownloadURL(imageRef);
    }

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
        imagen: imageUrl,
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
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files) {
              setImageFile(e.target.files[0]);
            }
          }}
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
