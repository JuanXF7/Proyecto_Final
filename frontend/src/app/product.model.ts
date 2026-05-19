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
  categoria?: number | { nombre?: string };
}
