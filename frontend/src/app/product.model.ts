export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string | number;
  stock: number;
  imagen?: string | null;
  marca: string;
  tipo: string;
  categoria?: number | { nombre?: string };
}
