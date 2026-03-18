export type Product = {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  imagen: string;
  imagenes?: string[];
  descripcion: string;
  categoria: string;
};
