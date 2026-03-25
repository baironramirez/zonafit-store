export type CartItem = {
  id: string; // The cart unique ID (usually productoId or productoId-varianteId)
  productoId: string; // The base product ID
  varianteId?: string; // Optional variant ID
  nombre: string;
  precio: number;
  cantidad: number;
  maxStock: number; // For enforcing limits in UI
  imagen?: string;
};
