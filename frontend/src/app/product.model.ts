export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string | number;
  stock: number;
  imagen?: string | null;
  marca: string;
  tipo: string;
  promocion?: boolean;
  descuento?: number;
  categoria?: number | { nombre?: string };
  proveedor?: number | { nombre?: string };
  average_rating?: number | null;
  reviews?: Array<{ id: number; usuario: { id: number; username?: string; email?: string }; rating: number; comentario?: string; fecha?: string }>;
}
