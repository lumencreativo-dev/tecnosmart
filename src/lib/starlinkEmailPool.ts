import { supabase } from "./supabase/client";

export interface StarlinkEmailAlias {
  id: string;
  email: string;
  estado: "disponible" | "asignado" | "reservado";
  cliente_nombre?: string;
  kit_serial?: string;
  suscripcion_id?: string;
  notas?: string;
  created_at?: string;
  fecha_asignacion?: string;
}

const LOCAL_STORAGE_KEY = "ts_starlink_email_pool_v1";

// Cuentas iniciales por defecto conocidas
const ALIAS_INICIALES: StarlinkEmailAlias[] = [
  {
    id: "initial-300",
    email: "starlink.300@somostecnosmart.com",
    estado: "asignado",
    cliente_nombre: "Cliente Histórico #300",
    notas: "Asignado previamente en Cloudflare",
    fecha_asignacion: new Date().toISOString(),
  },
  {
    id: "initial-301",
    email: "starlink.301@somostecnosmart.com",
    estado: "asignado",
    cliente_nombre: "Cliente Histórico #301",
    notas: "Asignado previamente en Cloudflare",
    fecha_asignacion: new Date().toISOString(),
  },
];

// Helper para leer localStorage
function getLocalPool(): StarlinkEmailAlias[] {
  if (typeof window === "undefined") return ALIAS_INICIALES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ALIAS_INICIALES));
      return ALIAS_INICIALES;
    }
    return JSON.parse(raw);
  } catch {
    return ALIAS_INICIALES;
  }
}

// Helper para guardar en localStorage
function setLocalPool(pool: StarlinkEmailAlias[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(pool));
  } catch (err) {
    console.error("Error guardando pool en localStorage:", err);
  }
}

/**
 * Obtener la lista completa de alias del pool.
 * Intenta Supabase primero; si la tabla no existe aún, usa localStorage de forma transparente.
 */
export async function obtenerPoolAlias(): Promise<{
  pool: StarlinkEmailAlias[];
  source: "supabase" | "local";
  disponiblesCount: number;
  asignadosCount: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("starlink_email_pool")
      .select("*")
      .order("email", { ascending: true });

    if (!error && data) {
      const disponibles = data.filter((item) => item.estado === "disponible").length;
      const asignados = data.filter((item) => item.estado === "asignado").length;
      return {
        pool: data as StarlinkEmailAlias[],
        source: "supabase",
        disponiblesCount: disponibles,
        asignadosCount: asignados,
      };
    }
  } catch (err: any) {
    // Si falla o la tabla no existe aún, recurrir a localStorage
    console.warn("Tabla Supabase starlink_email_pool no disponible, usando caché local:", err?.message);
  }

  const local = getLocalPool();
  const disponibles = local.filter((item) => item.estado === "disponible").length;
  const asignados = local.filter((item) => item.estado === "asignado").length;

  return {
    pool: local,
    source: "local",
    disponiblesCount: disponibles,
    asignadosCount: asignados,
  };
}

/**
 * Agrega correos al pool en lote.
 * Acepta texto con saltos de línea, comas o espacios.
 */
export async function agregarCorreosAlPool(
  correosTexto: string
): Promise<{ agregados: number; duplicados: number; error?: string }> {
  // Extraer todos los correos válidos del texto
  const rawList = correosTexto
    .split(/[\n,\s;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 5 && e.includes("@") && e.includes("."));

  if (rawList.length === 0) {
    return { agregados: 0, duplicados: 0, error: "No se encontraron correos válidos en el texto ingresado." };
  }

  // Desduplicar la lista entrante
  const uniqueIncoming = Array.from(new Set(rawList));

  // Obtener estado actual
  const actual = await obtenerPoolAlias();
  const existentesMap = new Set(actual.pool.map((p) => p.email.toLowerCase()));

  const paraInsertar = uniqueIncoming.filter((e) => !existentesMap.has(e));
  const duplicados = uniqueIncoming.length - paraInsertar.length;

  if (paraInsertar.length === 0) {
    return { agregados: 0, duplicados, error: "Todos los correos ingresados ya existen en el pool." };
  }

  // Intentar guardar en Supabase
  let guardadoEnSupabase = false;
  try {
    const rows = paraInsertar.map((email) => ({
      email,
      estado: "disponible",
    }));

    const { error } = await supabase.from("starlink_email_pool").insert(rows);
    if (!error) {
      guardadoEnSupabase = true;
    }
  } catch {
    guardadoEnSupabase = false;
  }

  // Guardar también / sincronizar en localStorage
  const nuevosObjetos: StarlinkEmailAlias[] = paraInsertar.map((email) => ({
    id: "local-" + Math.random().toString(36).substring(2, 9),
    email,
    estado: "disponible",
    created_at: new Date().toISOString(),
  }));

  const localActual = getLocalPool();
  setLocalPool([...localActual, ...nuevosObjetos]);

  return {
    agregados: paraInsertar.length,
    duplicados,
  };
}

/**
 * Marca un alias como asignado a un cliente y antena específica.
 */
export async function marcarAliasAsignado(
  email: string,
  info: {
    cliente_nombre?: string;
    kit_serial?: string;
    suscripcion_id?: string;
    notas?: string;
  }
): Promise<boolean> {
  const emailNorm = email.trim().toLowerCase();
  const now = new Date().toISOString();

  // 1. Intentar en Supabase
  try {
    await supabase
      .from("starlink_email_pool")
      .update({
        estado: "asignado",
        cliente_nombre: info.cliente_nombre || null,
        kit_serial: info.kit_serial || null,
        suscripcion_id: info.suscripcion_id || null,
        notas: info.notas || null,
        fecha_asignacion: now,
      })
      .eq("email", emailNorm);
  } catch (err) {
    console.warn("No se pudo actualizar alias en Supabase:", err);
  }

  // 2. Actualizar en localStorage
  const local = getLocalPool();
  let encontrado = false;
  const actualizado = local.map((item) => {
    if (item.email.toLowerCase() === emailNorm) {
      encontrado = true;
      return {
        ...item,
        estado: "asignado" as const,
        cliente_nombre: info.cliente_nombre,
        kit_serial: info.kit_serial,
        suscripcion_id: info.suscripcion_id,
        notas: info.notas,
        fecha_asignacion: now,
      };
    }
    return item;
  });

  if (!encontrado) {
    // Si el correo no estaba en el pool pero se usó en el cockpit, registrarlo directamente como asignado
    actualizado.push({
      id: "auto-" + Math.random().toString(36).substring(2, 9),
      email: emailNorm,
      estado: "asignado",
      cliente_nombre: info.cliente_nombre,
      kit_serial: info.kit_serial,
      suscripcion_id: info.suscripcion_id,
      notas: info.notas,
      fecha_asignacion: now,
    });
  }

  setLocalPool(actualizado);
  return true;
}

/**
 * Libera un alias asignado devolviéndolo a estado disponible.
 */
export async function liberarAlias(id: string, email: string): Promise<boolean> {
  const emailNorm = email.trim().toLowerCase();

  try {
    await supabase
      .from("starlink_email_pool")
      .update({
        estado: "disponible",
        cliente_nombre: null,
        kit_serial: null,
        suscripcion_id: null,
        fecha_asignacion: null,
      })
      .eq("email", emailNorm);
  } catch (err) {
    console.warn("Error liberando alias en Supabase:", err);
  }

  const local = getLocalPool();
  const actualizado = local.map((item) => {
    if (item.email.toLowerCase() === emailNorm || item.id === id) {
      return {
        ...item,
        estado: "disponible" as const,
        cliente_nombre: undefined,
        kit_serial: undefined,
        suscripcion_id: undefined,
        fecha_asignacion: undefined,
      };
    }
    return item;
  });

  setLocalPool(actualizado);
  return true;
}

/**
 * Elimina un alias del pool permanentemente.
 */
export async function eliminarAlias(id: string, email: string): Promise<boolean> {
  const emailNorm = email.trim().toLowerCase();

  try {
    await supabase.from("starlink_email_pool").delete().eq("email", emailNorm);
  } catch (err) {
    console.warn("Error eliminando alias en Supabase:", err);
  }

  const local = getLocalPool();
  const filtrado = local.filter((item) => item.email.toLowerCase() !== emailNorm && item.id !== id);
  setLocalPool(filtrado);
  return true;
}
