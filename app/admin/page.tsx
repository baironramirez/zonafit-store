export default function AdminPage() {
  return (
    <main style={{ padding: "40px" }}>
      <h1>Panel Administrador</h1>

      <ul>
        <li>
          <a href="/admin/productos">Gestionar productos</a>
        </li>

        <li>
          <a href="/admin/crear-producto">Crear producto</a>
        </li>
      </ul>
    </main>
  );
}
