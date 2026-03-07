type Props = {
  nombre: string;
  precio: number;
};

export default function ProductCard({ nombre, precio }: Props) {
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
      <button>Agregar al carrito</button>
    </div>
  );
}
