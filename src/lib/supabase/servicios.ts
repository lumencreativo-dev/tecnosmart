// ─────────────────────────────────────────────────────────────
// lib/supabase/servicios.ts — Queries de catálogo y Mano de Obra
// ─────────────────────────────────────────────────────────────
import { supabase } from "./client";
import type { Producto, ServicioManoObra } from "../types";

export const LOCAL_STORAGE_SERVICIOS_KEY = "ts_servicios_mano_obra_v2";

export const SERVICIOS_PREDETERMINADOS: ServicioManoObra[] = [
  { id: "srv-1",  codigo: "CAB-ELEC-M",   concepto: "Tendido Cable Eléctrico",                 categoria: "Cableado",      unidad: "metro",   precio_base: 0.25, precio_max: 0.25, precio_tecnico: 0.20, activo: true },
  { id: "srv-2",  codigo: "CAB-UTP-M",    concepto: "Tendido UTP / Red / Canaleta / Tubería",   categoria: "Cableado",      unidad: "metro",   precio_base: 0.50, precio_max: 0.50, precio_tecnico: 0.40, activo: true },
  { id: "srv-3",  codigo: "CFG-DVR-16",   concepto: "Configuración DVR / NVR ≤ 16ch",          categoria: "Configuración", unidad: "equipo",  precio_base: 50.00, precio_max: 50.00, precio_tecnico: 40.00, activo: true },
  { id: "srv-4",  codigo: "CFG-DVR-32",   concepto: "Configuración DVR / NVR > 16ch",          categoria: "Configuración", unidad: "equipo",  precio_base: 80.00, precio_max: 80.00, precio_tecnico: 65.00, activo: true },
  { id: "srv-5",  codigo: "CFG-RACK",     concepto: "Instalación y peinado de Rack",           categoria: "Configuración", unidad: "global",  precio_base: 40.00, precio_max: 40.00, precio_tecnico: 35.00, activo: true },
  { id: "srv-6",  codigo: "CFG-ACC-CTL",  concepto: "Mano de Obra Control de Acceso",          categoria: "Configuración", unidad: "punto",   precio_base: 150.00,precio_max: 250.00,precio_tecnico: 120.00,activo: true },
  { id: "srv-7",  codigo: "INS-CAM-BAJO", concepto: "Instalación Cámara – Centro < 2.5m",     categoria: "Instalación",   unidad: "punto",   precio_base: 25.00, precio_max: 25.00, precio_tecnico: 20.00, activo: true },
  { id: "srv-8",  codigo: "INS-CAM-STD",  concepto: "Instalación de Cámara – Estándar",        categoria: "Instalación",   unidad: "punto",   precio_base: 30.00, precio_max: 35.00, precio_tecnico: 25.00, activo: true },
  { id: "srv-9",  codigo: "LOG-LOCAL",    concepto: "Logística / Viáticos Local (Tinaquillo)", categoria: "Logística",     unidad: "día",     precio_base: 5.00,  precio_max: 10.00, precio_tecnico: 5.00,  activo: true },
  { id: "srv-10", codigo: "LOG-FORANEO",  concepto: "Transporte + Comida Foráneo / técnico",   categoria: "Logística",     unidad: "día",     precio_base: 30.00, precio_max: 30.00, precio_tecnico: 30.00, activo: true },
  { id: "srv-11", codigo: "MTO-DVR",      concepto: "Mantenimiento DVR (batería/firmware)",    categoria: "Mantenimiento", unidad: "equipo",  precio_base: 50.00, precio_max: 50.00, precio_tecnico: 40.00, activo: true },
  { id: "srv-12", codigo: "MTO-CAM",      concepto: "Mantenimiento preventivo por cámara",     categoria: "Mantenimiento", unidad: "punto",   precio_base: 30.00, precio_max: 30.00, precio_tecnico: 25.00, activo: true },
  { id: "srv-13", codigo: "SL-INS",       concepto: "Instalación de Antena Starlink",          categoria: "Starlink",      unidad: "global",  precio_base: 80.00, precio_max: 120.00,precio_tecnico: 70.00, activo: true },
  { id: "srv-14", codigo: "SL-CFG",       concepto: "Configuración de red Starlink",           categoria: "Starlink",      unidad: "equipo",  precio_base: 50.00, precio_max: 50.00, precio_tecnico: 40.00, activo: true },
  { id: "srv-15", codigo: "SL-MENS",      concepto: "Gestión mensual Starlink (Comisión)",    categoria: "Starlink",      unidad: "mes",     precio_base: 10.00, precio_max: 10.00, precio_tecnico: 10.00, activo: true }
];

// Helper para leer LocalStorage
export function getLocalServicios(): ServicioManoObra[] {
  if (typeof window === "undefined") return SERVICIOS_PREDETERMINADOS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SERVICIOS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_SERVICIOS_KEY, JSON.stringify(SERVICIOS_PREDETERMINADOS));
      return SERVICIOS_PREDETERMINADOS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SERVICIOS_PREDETERMINADOS;
  } catch {
    return SERVICIOS_PREDETERMINADOS;
  }
}

// Helper para escribir LocalStorage
export function setLocalServicios(servicios: ServicioManoObra[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_SERVICIOS_KEY, JSON.stringify(servicios));
  } catch (err) {
    console.error("Error guardando servicios en localStorage:", err);
  }
}

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

/** Carga todos los servicios de mano de obra (con dual persistence Supabase + LocalStorage) */
export async function cargarServicios(soloActivos = true): Promise<ServicioManoObra[]> {
  const local = getLocalServicios();

  try {
    let query = supabase.from("servicios_mano_obra").select("*");
    if (soloActivos) {
      query = query.eq("activo", true);
    }
    query = query.order("categoria, concepto");

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      setLocalServicios(data as ServicioManoObra[]);
      return data as ServicioManoObra[];
    }
  } catch (e) {
    console.warn("Supabase servicios_mano_obra inaccesible, usando respaldo local:", e);
  }

  // Fallback seguro a localStorage
  return soloActivos ? local.filter(s => s.activo !== false) : local;
}

/** Guarda o actualiza un servicio de mano de obra */
export async function upsertServicio(servicio: Partial<ServicioManoObra> & { concepto: string; precio_base: number }): Promise<ServicioManoObra> {
  const localList = getLocalServicios();
  const esUuidValido = servicio.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(servicio.id);
  const id = esUuidValido ? servicio.id! : (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `srv-${Date.now()}`);
  const codigo = servicio.codigo || `SRV-${Date.now().toString().slice(-4)}`;
  
  const payload: ServicioManoObra = {
    id,
    codigo: codigo.trim().toUpperCase(),
    concepto: servicio.concepto.trim(),
    categoria: servicio.categoria?.trim() || "Instalación",
    unidad: servicio.unidad?.trim() || "punto",
    precio_base: Number(servicio.precio_base) || 0,
    precio_max: servicio.precio_max ? Number(servicio.precio_max) : Number(servicio.precio_base) || 0,
    precio_tecnico: servicio.precio_tecnico !== undefined ? Number(servicio.precio_tecnico) : undefined,
    detalles: servicio.detalles?.trim(),
    activo: servicio.activo !== undefined ? servicio.activo : true,
    updated_at: new Date().toISOString()
  };

  // 1. Guardar en LocalStorage
  const idx = localList.findIndex(s => s.id === id || s.codigo === payload.codigo);
  let updatedList: ServicioManoObra[];
  if (idx >= 0) {
    updatedList = [...localList];
    updatedList[idx] = { ...updatedList[idx], ...payload };
  } else {
    updatedList = [payload, ...localList];
  }
  setLocalServicios(updatedList);

  // 2. Intentar guardar en Supabase (omitiendo ID no-UUID para que Postgres asigne el suyo)
  try {
    const supabasePayload: any = { ...payload };
    if (!esUuidValido) {
      delete supabasePayload.id;
    }

    const { data, error } = await supabase
      .from("servicios_mano_obra")
      .upsert(supabasePayload, { onConflict: "codigo" })
      .select()
      .single();

    if (!error && data) {
      if (data.id && data.id !== payload.id) {
        payload.id = data.id;
        const finalIdx = updatedList.findIndex(s => s.codigo === payload.codigo);
        if (finalIdx >= 0) {
          updatedList[finalIdx].id = data.id;
          setLocalServicios(updatedList);
        }
      }
      return data as ServicioManoObra;
    }
  } catch (err) {
    console.warn("No se pudo persistir en Supabase servicios_mano_obra, persistido localmente:", err);
  }

  return payload;
}

/** Elimina un servicio (o lo marca inactivo) */
export async function eliminarServicio(id: string): Promise<boolean> {
  // 1. En LocalStorage
  const local = getLocalServicios();
  const filtered = local.filter(s => s.id !== id);
  setLocalServicios(filtered);

  // 2. En Supabase
  try {
    const { error } = await supabase
      .from("servicios_mano_obra")
      .delete()
      .eq("id", id);
    if (!error) return true;
  } catch (err) {
    console.warn("Error eliminando servicio en Supabase:", err);
  }

  return true;
}

/** Restaura la lista predeterminada de servicios de TecnoSmart */
export async function restaurarServiciosPredeterminados(): Promise<ServicioManoObra[]> {
  setLocalServicios(SERVICIOS_PREDETERMINADOS);

  try {
    for (const s of SERVICIOS_PREDETERMINADOS) {
      const copy: any = { ...s };
      delete copy.id; // Permite que Postgres asigne UUID nativo
      await supabase.from("servicios_mano_obra").upsert(copy, { onConflict: "codigo" });
    }
  } catch (e) {
    console.warn("No se pudo resembrar Supabase:", e);
  }

  return SERVICIOS_PREDETERMINADOS;
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
