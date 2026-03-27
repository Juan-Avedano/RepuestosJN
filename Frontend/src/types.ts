export interface Repuesto {
  proveedor: any;
  id: number;
  codigo_barra: string;
  nombre: string;
  marca?: string;
  precio: number;
  stock: number;
  activo: boolean;
}

export interface ItemCarrito {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
}
