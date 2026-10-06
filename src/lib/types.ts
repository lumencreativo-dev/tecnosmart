// ─────────────────────────────────────────────────────────────
// lib/types.ts — Interfaces globales TecnoSmart
// ─────────────────────────────────────────────────────────────

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Producto {
  id: string;
  codigo_sku: string;
  nombre: string;
  categoria_id?: string;
  marca?: string;
  precio_costo: number;
  precio_venta: number;
  stock: number;
  datasheet_url?: string;
  especificaciones_json?: Record<string, unknown>;
  activo: boolean;
}

export interface ServicioManoObra {
  id: string;
  codigo: string;
  concepto: string;
  precio_base: number;
  precio_max?: number;
  unidad: string;
  categoria?: string;
}

export interface Cliente {
  id?: string;
  empresa?: string;
  rif_cedula?: string;
  contacto: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

export type TipoItem = "producto" | "servicio";

export interface LineaDetalle {
  id: string; // UUID temporal en cliente
  tipo_item: TipoItem;
  item_id?: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number; // computed
}

export interface ResumenCotizacion {
  subtotal: number;
  descuento: number;
  total: number;
  anticipo: number; // 70% si total > 500
  saldo: number; // 30%
  aplicaEsquemaPago: boolean;
}
