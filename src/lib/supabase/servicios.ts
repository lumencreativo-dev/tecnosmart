// ─────────────────────────────────────────────────────────────
// lib/supabase/servicios.ts — Queries de catálogo
// ─────────────────────────────────────────────────────────────
import { supabase } from "./client";
import type { Producto, ServicioManoObra } from "../types";

/** Busca productos por nombre o SKU con autocompletado */
export async function buscarProductos(query: string): Promise<Producto[]> {
  if (!query || query.length < 2) return [];

  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .or(`nombre.ilike.%${query}%,codigo_sku.ilike.%${query}%`)
    .order("nombre")
    .limit(20);

  if (error) {
    console.error("Error buscando productos:", error.message);
    return [];
  }
  return (data ?? []) as Producto[];
}

/** Carga todos los servicios de mano de obra activos */
export async function cargarServicios(): Promise<ServicioManoObra[]> {
  const { data, error } = await supabase
    .from("servicios_mano_obra")
    .select("*")
    .eq("activo", true)
    .order("categoria, concepto");

  if (error) {
    console.error("Error cargando servicios:", error.message);
    return [];
  }
  return (data ?? []) as ServicioManoObra[];
}

/** Guarda una cotización completa en Supabase */
export async function guardarCotizacion(payload: {
  numero_cotizacion: string;
  cliente_id?: string;
  subtotal: number;
  descuento: number;
  total: number;
  anticipo_monto: number;
  saldo_monto: number;
  notas?: string;
}) {
  const { data, error } = await supabase
    .from("cotizaciones")
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Guarda o actualiza un cliente */
export async function upsertCliente(cliente: {
  empresa?: string;
  rif_cedula?: string;
  contacto: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}) {
  const { data, error } = await supabase
    .from("clientes")
    .insert([cliente])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
