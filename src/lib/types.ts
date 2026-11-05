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
  precio_tecnico?: number;   // Precio especial para técnicos
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
  precio_tecnico?: number;   // Precio especial para técnicos
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
  tipo?: "cliente_normal" | "tecnico";  // Tipo para precios diferenciados
  notas?: string;
  acepta_promociones?: boolean;
  es_contribuyente_especial?: boolean; // Contribuyente Especial / Agente de Retención
  retencion_iva_pct?: number;          // % sugerido de retención IVA (ej. 75, 100)
  retencion_islr_pct?: number;         // % sugerido de retención ISLR (ej. 2)
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
  baseImponible?: number;
  // IVA
  aplicaIva?: boolean;
  ivaPct?: number;
  ivaMonto?: number;
  // Total bruto (Base + IVA)
  total: number;
  anticipo: number; // 70% si aplica esquema
  saldo: number;    // 30%
  aplicaEsquemaPago: boolean;
  // Moneda y tasa de cambio
  moneda?: "USD" | "VES";
  tasaBcv?: number;
  // Retenciones fiscales
  aplicaRetenciones?: boolean;
  aplicaRetencionIva?: boolean;
  retencionIvaPct?: number;
  retencionIvaMonto?: number;
  aplicaRetencionIslr?: boolean;
  retencionIslrPct?: number;
  retencionIslrMonto?: number;
  totalNeto?: number;
}

// ─────────────────────────────────────────────────────────────
// GESTIÓN ESPECIALIZADA DE FLOTA STARLINK
// ─────────────────────────────────────────────────────────────

export interface StarlinkMetadata {
  wifi_ssid?: string;
  wifi_password?: string;
  correo_starlink?: string;
  clave_starlink?: string;
  plan_starlink?: string;
  dia_corte?: number | string;
  direccion_instalacion?: string;
  kit_serial?: string;
  fee_soporte?: number;
  es_vip?: boolean;
  cedula_frontal_url?: string;
  cedula_trasera_url?: string;
  notas_soporte?: string;
  ubicacion_detalles?: string;
}

export function isStarlinkSubscription(sub: {
  servicios_recurrentes?: { nombre?: string } | null;
  equipo_serial?: string | null;
  credenciales_notas?: string | null;
}): boolean {
  const nombre = sub.servicios_recurrentes?.nombre?.toLowerCase() || "";
  if (nombre.includes("starlink")) return true;
  const serial = sub.equipo_serial?.toLowerCase() || "";
  if (serial.includes("kit") || serial.includes("starlink")) return true;
  const notas = sub.credenciales_notas?.toLowerCase() || "";
  if (notas.includes("kit4m") || notas.includes("<!--starlink_data")) return true;
  return false;
}

export function extractStarlinkData(sub: {
  credenciales_notas?: string | null;
  credenciales_usuario?: string | null;
  credenciales_clave?: string | null;
  equipo_serial?: string | null;
  costo_base?: number | null;
  monto?: number | null;
  servicios_recurrentes?: { nombre?: string; precio_sugerido?: number } | null;
  clientes?: { direccion?: string } | null;
  proximo_pago?: string | null;
}): StarlinkMetadata {
  let meta: StarlinkMetadata = {};
  const rawNotas = sub.credenciales_notas || "";

  if (rawNotas) {
    try {
      const match = rawNotas.match(/<!--STARLINK_DATA:([\s\S]*?)-->/i);
      if (match && match[1]) {
        meta = JSON.parse(match[1]);
      } else if (rawNotas.trim().startsWith("{") && rawNotas.trim().endsWith("}")) {
        meta = JSON.parse(rawNotas.trim());
      }
    } catch {
      // Ignorar error de parseo si es texto libre
    }
  }

  // Fallbacks automáticos desde las columnas existentes si no vienen en el JSON
  if (!meta.correo_starlink && sub.credenciales_usuario) {
    meta.correo_starlink = sub.credenciales_usuario;
  }
  if (!meta.clave_starlink && sub.credenciales_clave) {
    meta.clave_starlink = sub.credenciales_clave;
  }

  // Serial KIT: buscar en equipo_serial o inferir de notas como "KIT4M070688358RG"
  if (!meta.kit_serial) {
    if (sub.equipo_serial) {
      meta.kit_serial = sub.equipo_serial;
    } else {
      const kitMatch = rawNotas.match(/(KIT[0-9A-Z]+)/i);
      if (kitMatch && kitMatch[1]) {
        meta.kit_serial = kitMatch[1];
      }
    }
  }

  // Dirección de instalación fallback
  if (!meta.direccion_instalacion && sub.clientes?.direccion) {
    meta.direccion_instalacion = sub.clientes.direccion;
  }

  // Día de corte mensual fallback desde proximo_pago
  if (!meta.dia_corte && sub.proximo_pago) {
    try {
      const d = new Date(sub.proximo_pago);
      if (!isNaN(d.getDate())) {
        meta.dia_corte = d.getUTCDate();
      }
    } catch {}
  }

  // Plan Starlink fallback
  if (!meta.plan_starlink && sub.servicios_recurrentes?.nombre) {
    meta.plan_starlink = sub.servicios_recurrentes.nombre;
  }

  // Status VIP ($0) vs Regular ($10)
  const montoNum = Number(sub.monto || 0);
  if (meta.es_vip === undefined) {
    meta.es_vip = montoNum <= 0;
  }

  if (meta.fee_soporte === undefined) {
    if (meta.es_vip) {
      meta.fee_soporte = 0;
    } else {
      const costo = Number(sub.costo_base || 0);
      const diff = montoNum - costo;
      meta.fee_soporte = diff > 0 ? diff : 10;
    }
  }

  // Si en notas quedó texto humano adicional
  if (!meta.notas_soporte) {
    const cleanedNotes = rawNotas.replace(/<!--STARLINK_DATA:[\s\S]*?-->/gi, "").trim();
    if (cleanedNotes && !cleanedNotes.startsWith("KIT")) {
      meta.notas_soporte = cleanedNotes;
    }
  }

  return meta;
}

export function packStarlinkData(meta: StarlinkMetadata, humanNotes?: string): string {
  const json = JSON.stringify(meta);
  const cleanHuman = (humanNotes || "").replace(/<!--STARLINK_DATA:[\s\S]*?-->/gi, "").trim();
  return cleanHuman ? `${cleanHuman}\n\n<!--STARLINK_DATA:${json}-->` : `<!--STARLINK_DATA:${json}-->`;
}

export interface SolicitudStarlink {
  id?: string;
  nombre_completo: string;
  cedula_rif: string;
  telefono: string;
  email?: string;
  direccion: string;
  coordenadas_gps?: string;
  plan_deseado: string;
  wifi_ssid_preferido?: string;
  wifi_password_preferido?: string;
  cedula_frontal_url?: string;
  cedula_trasera_url?: string;
  notas?: string;
  estado: "pendiente" | "en_proceso" | "activada" | "rechazada";
  origen?: "web_cliente" | "asistida_tienda";
  created_at?: string;
  updated_at?: string;
}


