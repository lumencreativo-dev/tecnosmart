// ─────────────────────────────────────────────────────────────────────────────
// src/components/cotizador/OrdenesTrabajoManager.tsx
// Módulo principal de Órdenes de Trabajo — Sprint 8 (BETA)
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, Search, Filter, Wrench, HardHat, Calendar, Clock,
  CheckCircle2, AlertTriangle, XCircle, PlayCircle, PauseCircle,
  Eye, Edit3, FileText, Package, ChevronDown, ChevronRight,
  MapPin, User, Users, Loader2, RefreshCw, MoreVertical,
  ClipboardList, ArrowRight, Zap, SlidersHorizontal, X,
  LayoutGrid, Trash2, RotateCcw, FileSpreadsheet, Receipt,
  AlertCircle, ShieldAlert, Check, ArrowLeft
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";
import { tienePermiso } from "@/lib/permissions";
import InformeTecnicoWizard from "./InformeTecnicoWizard";
import CuadrillaPicker from "./CuadrillaPicker";
import RequisicionMateriales from "./RequisicionMateriales";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface OrdenTrabajo {
  id: string;
  numero: string;
  cliente_id: string | null;
  cotizacion_id: string | null;
  tipo_flujo: "con_inspeccion" | "directo";
  estado: "pendiente" | "programado" | "inspeccion" | "en_ejecucion" | "pausado" | "completado" | "cancelado";
  tipo_servicio: string | null;
  descripcion_alcance: string | null;
  direccion_obra: string | null;
  fecha_visita: string | null;
  fecha_ejecucion: string | null;
  fecha_cierre: string | null;
  tecnico_lider_id: string | null;
  ayudantes: string[] | null;
  prioridad: "baja" | "normal" | "alta" | "urgente";
  notas_internas: string | null;
  creado_por: string | null;
  created_at: string;
  eliminada?: boolean;
  eliminada_at?: string | null;
  // Relaciones en memoria
  cliente?: { nombre: string; email: string; direccion?: string; telefono?: string } | null;
  tecnico_lider?: { nombre: string; avatar_url: string | null } | null;
  informes_count?: number;
}

interface ItemCotizacion {
  id: string;
  numero_cotizacion: string;
  cliente_id: string | null;
  total: number;
  estado: string;
  notas?: string;
  created_at: string;
  cliente?: { nombre: string; direccion?: string; telefono?: string };
}

interface ItemFactura {
  id: string;
  numero_factura: string;
  cliente_id: string | null;
  cotizacion_id: string | null;
  total: number;
  created_at: string;
  cliente?: { nombre: string; direccion?: string; telefono?: string };
}

type VistaTab = "kanban" | "lista" | "papelera";
type Modal = "nueva" | "editar" | "detalle" | "informe" | "cuadrilla" | "materiales" | null;
type OrigenPrecarga = "cotizacion" | "factura" | "manual";

const ESTADOS_CONFIG = {
  pendiente:     { label: "Pendiente",     color: "text-yellow-600",    bg: "bg-yellow-100 dark:bg-yellow-900/20",   icon: Clock },
  programado:    { label: "Programado",    color: "text-blue-600",      bg: "bg-blue-100 dark:bg-blue-900/20",       icon: Calendar },
  inspeccion:    { label: "En Inspección", color: "text-purple-600",    bg: "bg-purple-100 dark:bg-purple-900/20",   icon: Eye },
  en_ejecucion:  { label: "En Ejecución",  color: "text-orange-600",    bg: "bg-orange-100 dark:bg-orange-900/20",   icon: PlayCircle },
  pausado:       { label: "Pausado",       color: "text-gray-500",      bg: "bg-gray-100 dark:bg-gray-800",          icon: PauseCircle },
  completado:    { label: "Completado",    color: "text-green-600",     bg: "bg-green-100 dark:bg-green-900/20",     icon: CheckCircle2 },
  cancelado:     { label: "Cancelado",     color: "text-red-600",       bg: "bg-red-100 dark:bg-red-900/20",         icon: XCircle },
} as const;

const PRIORIDAD_CONFIG = {
  baja:    { label: "Baja",    color: "text-gray-500", dot: "bg-gray-400" },
  normal:  { label: "Normal",  color: "text-blue-500", dot: "bg-blue-400" },
  alta:    { label: "Alta",    color: "text-orange-500", dot: "bg-orange-400" },
  urgente: { label: "Urgente", color: "text-red-600",  dot: "bg-red-500" },
} as const;

const TIPOS_SERVICIO = ["CCTV", "Redes", "Starlink", "Mantenimiento", "Eléctrico", "Fibra Óptica", "Alarmas", "Control de Acceso", "Otro"];
const ESTADOS_FLUJO = ["pendiente", "programado", "inspeccion", "en_ejecucion", "pausado", "completado", "cancelado"] as const;

const FORM_VACIO = {
  tipo_flujo: "directo" as "con_inspeccion" | "directo",
  estado: "pendiente" as OrdenTrabajo["estado"],
  tipo_servicio: "",
  descripcion_alcance: "",
  direccion_obra: "",
  fecha_visita: "",
  fecha_ejecucion: "",
  prioridad: "normal" as OrdenTrabajo["prioridad"],
  notas_internas: "",
  cliente_id: "",
  cotizacion_id: "",
};

export default function OrdenesTrabajoManager() {
  const { usuario } = useUsuario();
  const permisosUsuario: string[] = usuario?.roles?.permisos || (usuario?.rol_id === "admin" ? ["*"] : []);
  const esAdmin = usuario?.rol_id === "admin" || permisosUsuario.includes("*") || tienePermiso(permisosUsuario, "proyectos.eliminar_ordenes");
  const puedeCrear = tienePermiso(permisosUsuario, "proyectos.crear_ordenes");
  const puedeAsignar = tienePermiso(permisosUsuario, "proyectos.asignar_cuadrillas");
  const puedeMateriales = tienePermiso(permisosUsuario, "proyectos.materiales");
  const puedeVerPropias = tienePermiso(permisosUsuario, "proyectos.ver_propias");
  const puedeInformes = tienePermiso(permisosUsuario, "proyectos.actas");

  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [papelera, setPapelera] = useState<OrdenTrabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<VistaTab>("kanban");
  const [query, setQuery] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroServicio, setFiltroServicio] = useState<string>("todos");
  const [modal, setModal] = useState<Modal>(null);
  const [ordenActual, setOrdenActual] = useState<OrdenTrabajo | null>(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Precarga y vinculación
  const [origenPrecarga, setOrigenPrecarga] = useState<OrigenPrecarga>("cotizacion");
  const [clientes, setClientes] = useState<{ id: string; nombre: string; direccion?: string; telefono?: string; email?: string }[]>([]);
  const [cotizaciones, setCotizaciones] = useState<ItemCotizacion[]>([]);
  const [facturas, setFacturas] = useState<ItemFactura[]>([]);
  const [cotizacionElegida, setCotizacionElegida] = useState("");
  const [facturaElegida, setFacturaElegida] = useState("");
  const [filtroCotAprobadas, setFiltroCotAprobadas] = useState(true);
  const [cargandoPrecarga, setCargandoPrecarga] = useState(false);
  const [confirmacionMoverPapelera, setConfirmacionMoverPapelera] = useState<OrdenTrabajo | null>(null);
  const [confirmacionEliminarDefinitivo, setConfirmacionEliminarDefinitivo] = useState<OrdenTrabajo | null>(null);

  // ── Carga desacoplada de Órdenes y Papelera ────────────────────────────────
  const cargarOrdenes = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Cargar todas las órdenes
      let q = supabase
        .from("ordenes_trabajo")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);

      if (!puedeCrear && puedeVerPropias && usuario) {
        q = q.or(`tecnico_lider_id.eq.${usuario.id},ayudantes.cs.{${usuario.id}}`);
      }

      const { data, error: qErr } = await q;
      if (qErr) console.error("Error al cargar ordenes:", qErr);

      if (data) {
        // Cargar perfiles y clientes de forma desacoplada
        const [{ data: listaPerfiles }, { data: listaClientes }] = await Promise.all([
          supabase.from("perfiles").select("id, nombre, avatar_url").limit(500),
          supabase.from("clientes").select("id, empresa, contacto, email, telefono, direccion").limit(1000),
        ]);

        const mapaPerf: Record<string, { nombre: string; avatar_url: string | null }> = {};
        (listaPerfiles || []).forEach(p => {
          mapaPerf[p.id] = { nombre: p.nombre, avatar_url: p.avatar_url || null };
        });

        const mapaCli: Record<string, { nombre: string; email: string; direccion?: string; telefono?: string }> = {};
        (listaClientes || []).forEach(c => {
          const nom = c.empresa ? (c.contacto ? `${c.empresa} (${c.contacto})` : c.empresa) : (c.contacto || "Cliente");
          mapaCli[c.id] = { nombre: nom, email: c.email || "", direccion: c.direccion, telefono: c.telefono };
        });

        const ordenesEnriquecidas: OrdenTrabajo[] = (data as any[]).map(ord => ({
          ...ord,
          tecnico_lider: ord.tecnico_lider_id && mapaPerf[ord.tecnico_lider_id] ? mapaPerf[ord.tecnico_lider_id] : null,
          cliente: ord.cliente_id && mapaCli[ord.cliente_id] ? mapaCli[ord.cliente_id] : null,
        }));

        // Separar activas vs eliminadas (papelera)
        const activas = ordenesEnriquecidas.filter(o => !o.eliminada);
        const enPapelera = ordenesEnriquecidas.filter(o => o.eliminada);

        setOrdenes(activas);
        setPapelera(enPapelera);
      }
    } catch (err) {
      console.error("Error inesperado cargando ordenes:", err);
    } finally {
      setLoading(false);
    }
  }, [puedeCrear, puedeVerPropias, usuario]);

  // ── Cargar Directorio de Clientes, Cotizaciones y Facturas ──────────────────
  const cargarReferencias = async () => {
    // 1. Clientes (columnas reales: empresa, contacto, direccion, telefono, email)
    const { data: cliData, error: errCli } = await supabase
      .from("clientes")
      .select("id, empresa, contacto, direccion, telefono, email")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (errCli) console.error("Error al cargar clientes:", errCli);

    const mapaClientes: Record<string, any> = {};
    if (cliData) {
      const clientesMapeados = cliData.map((c: any) => ({
        id: c.id,
        nombre: c.empresa ? (c.contacto ? `${c.empresa} (${c.contacto})` : c.empresa) : (c.contacto || "Cliente sin nombre"),
        direccion: c.direccion || "",
        telefono: c.telefono || "",
        email: c.email || "",
      }));
      setClientes(clientesMapeados);
      clientesMapeados.forEach(c => { mapaClientes[c.id] = c; });
    }

    // 2. Cotizaciones (desacoplado de foreign keys)
    const { data: cotData, error: errCot } = await supabase
      .from("cotizaciones")
      .select("id, numero_cotizacion, cliente_id, total, estado, notas, created_at")
      .or("eliminada.is.null,eliminada.eq.false")
      .order("created_at", { ascending: false })
      .limit(200);

    if (errCot) console.error("Error al cargar cotizaciones:", errCot);

    if (cotData) {
      const cotsMapeadas: ItemCotizacion[] = cotData.map((c: any) => ({
        ...c,
        total: Number(c.total || 0),
        cliente: c.cliente_id && mapaClientes[c.cliente_id] ? mapaClientes[c.cliente_id] : undefined,
      }));
      setCotizaciones(cotsMapeadas);
    }

    // 3. Facturas (columnas reales: subtotal_usd, cliente_nombre, cotizacion_id)
    const { data: factData, error: errFact } = await supabase
      .from("facturas")
      .select("id, numero_factura, cotizacion_id, subtotal_usd, total_bs, cliente_nombre, created_at, estado")
      .neq("estado", "anulada")
      .order("created_at", { ascending: false })
      .limit(200);

    if (errFact) console.error("Error al cargar facturas:", errFact);

    if (factData) {
      const factsMapeadas: ItemFactura[] = factData.map((f: any) => {
        const cotVinculada = cotData?.find((c: any) => c.id === f.cotizacion_id);
        const cliVinculado = cotVinculada?.cliente_id && mapaClientes[cotVinculada.cliente_id];

        return {
          id: f.id,
          numero_factura: f.numero_factura,
          cliente_id: cotVinculada?.cliente_id || null,
          cotizacion_id: f.cotizacion_id || null,
          total: Number(f.subtotal_usd || 0),
          created_at: f.created_at,
          cliente: {
            nombre: f.cliente_nombre || cliVinculado?.nombre || "Cliente",
            direccion: cliVinculado?.direccion || "",
            telefono: cliVinculado?.telefono || "",
          },
        };
      });
      setFacturas(factsMapeadas);
    }
  };

  useEffect(() => {
    cargarOrdenes();
    cargarReferencias();
  }, [cargarOrdenes]);

  // ── Detección de Parámetros URL (?cotizacion_id=... o ?factura_id=...) ──────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const cotIdParam = params.get("cotizacion_id");
    const factIdParam = params.get("factura_id");

    if (cotIdParam && cotizaciones.length > 0) {
      setModal("nueva");
      setOrigenPrecarga("cotizacion");
      handleSeleccionarCotizacion(cotIdParam);
    } else if (factIdParam && facturas.length > 0) {
      setModal("nueva");
      setOrigenPrecarga("factura");
      handleSeleccionarFactura(factIdParam);
    }
  }, [cotizaciones.length, facturas.length]);

  // ── Precargar datos desde Cotización ────────────────────────────────────────
  const handleSeleccionarCotizacion = async (cotId: string) => {
    setCotizacionElegida(cotId);
    if (!cotId) return;

    setCargandoPrecarga(true);
    const cot = cotizaciones.find(c => c.id === cotId);
    if (cot) {
      const { data: detalles } = await supabase
        .from("cotizacion_detalles")
        .select("*")
        .eq("cotizacion_id", cotId)
        .order("created_at");

      const descText = (detalles || []).map((d: any) => (d.descripcion || "").toLowerCase()).join(" ");
      let servSugerido = "CCTV";
      if (descText.includes("starlink") || descText.includes("antena")) servSugerido = "Starlink";
      else if (descText.includes("red") || descText.includes("cable") || descText.includes("mikrotik") || descText.includes("switch") || descText.includes("wifi")) servSugerido = "Redes";
      else if (descText.includes("fibra")) servSugerido = "Fibra Óptica";
      else if (descText.includes("mantenimiento")) servSugerido = "Mantenimiento";
      else if (descText.includes("alarma")) servSugerido = "Alarmas";
      else if (descText.includes("electr") || descText.includes("corriente") || descText.includes("ups")) servSugerido = "Eléctrico";

      const lineasAlcance = (detalles || []).map((d: any) => `• ${d.cantidad}x ${d.descripcion}`).join("\n");
      const resumenAlcance = `Servicio según Cotización ${cot.numero_cotizacion}:\n${lineasAlcance}`;

      setForm(prev => ({
        ...prev,
        cliente_id: cot.cliente_id || prev.cliente_id,
        tipo_servicio: servSugerido,
        direccion_obra: cot.cliente?.direccion || prev.direccion_obra,
        descripcion_alcance: resumenAlcance,
        cotizacion_id: cot.id,
      }));
    }
    setCargandoPrecarga(false);
  };

  // ── Precargar datos desde Factura ───────────────────────────────────────────
  const handleSeleccionarFactura = async (factId: string) => {
    setFacturaElegida(factId);
    if (!factId) return;

    setCargandoPrecarga(true);
    const fact = facturas.find(f => f.id === factId);
    if (fact) {
      let cliId = fact.cliente_id || "";
      if (!cliId && fact.cliente?.nombre) {
        const cliMatch = clientes.find(c =>
          c.nombre.toLowerCase().includes(fact.cliente!.nombre.toLowerCase()) ||
          fact.cliente!.nombre.toLowerCase().includes(c.nombre.toLowerCase())
        );
        if (cliMatch) cliId = cliMatch.id;
      }

      let lineas: string[] = [];
      let servSugerido = "CCTV";

      if (fact.cotizacion_id) {
        const { data: cotDetalles } = await supabase
          .from("cotizacion_detalles")
          .select("*")
          .eq("cotizacion_id", fact.cotizacion_id)
          .order("created_at");

        if (cotDetalles && cotDetalles.length > 0) {
          lineas = cotDetalles.map((d: any) => `• ${d.cantidad}x ${d.descripcion}`);
          const descText = cotDetalles.map((d: any) => (d.descripcion || "").toLowerCase()).join(" ");
          if (descText.includes("starlink") || descText.includes("antena")) servSugerido = "Starlink";
          else if (descText.includes("red") || descText.includes("cable") || descText.includes("switch") || descText.includes("wifi")) servSugerido = "Redes";
          else if (descText.includes("fibra")) servSugerido = "Fibra Óptica";
          else if (descText.includes("mantenimiento")) servSugerido = "Mantenimiento";
        }
      }

      if (lineas.length === 0) {
        const { data: factDetalles } = await supabase
          .from("factura_detalles")
          .select("*")
          .eq("factura_id", factId)
          .order("created_at");

        if (factDetalles && factDetalles.length > 0) {
          lineas = factDetalles.map((d: any) => `• ${d.cantidad}x ${d.descripcion}`);
          const descText = factDetalles.map((d: any) => (d.descripcion || "").toLowerCase()).join(" ");
          if (descText.includes("starlink") || descText.includes("antena")) servSugerido = "Starlink";
          else if (descText.includes("red") || descText.includes("cable") || descText.includes("switch") || descText.includes("wifi")) servSugerido = "Redes";
          else if (descText.includes("fibra")) servSugerido = "Fibra Óptica";
          else if (descText.includes("mantenimiento")) servSugerido = "Mantenimiento";
        }
      }

      const resumenAlcance = lineas.length > 0
        ? `Servicio según Factura ${fact.numero_factura}:\n${lineas.join("\n")}`
        : `Servicio según Factura ${fact.numero_factura} para ${fact.cliente?.nombre || "Cliente"}`;

      setForm(prev => ({
        ...prev,
        cliente_id: cliId || prev.cliente_id,
        tipo_servicio: servSugerido,
        direccion_obra: fact.cliente?.direccion || prev.direccion_obra,
        descripcion_alcance: resumenAlcance,
        cotizacion_id: fact.cotizacion_id || prev.cotizacion_id,
      }));
    }
    setCargandoPrecarga(false);
  };

  // ── Guardar Orden ───────────────────────────────────────────────────────────
  const guardarOrden = async () => {
    setSaving(true);
    setError(null);

    const esMock = !usuario?.id || usuario.id === "00000000-0000-0000-0000-000000000000";
    const payload = {
      tipo_flujo: form.tipo_flujo,
      estado: form.estado,
      tipo_servicio: form.tipo_servicio,
      descripcion_alcance: form.descripcion_alcance,
      direccion_obra: form.direccion_obra,
      prioridad: form.prioridad,
      notas_internas: form.notas_internas,
      cotizacion_id: form.cotizacion_id || null,
      creado_por: esMock ? null : usuario.id,
      cliente_id: form.cliente_id || null,
      fecha_visita: form.fecha_visita || null,
      fecha_ejecucion: form.fecha_ejecucion || null,
    };

    let nuevaOrdenId = ordenActual?.id;
    let resultado;

    if (ordenActual) {
      resultado = await supabase.from("ordenes_trabajo").update(payload).eq("id", ordenActual.id);
    } else {
      resultado = await supabase.from("ordenes_trabajo").insert(payload).select("id").single();
      if (resultado.data) nuevaOrdenId = resultado.data.id;
    }

    if (resultado.error) {
      setError(resultado.error.message);
    } else {
      // Si proviene de cotización o factura, precargar materiales automáticamente
      if (!ordenActual && form.cotizacion_id && nuevaOrdenId) {
        const { data: detalles } = await supabase
          .from("cotizacion_detalles")
          .select("*")
          .eq("cotizacion_id", form.cotizacion_id);

        if (detalles && detalles.length > 0) {
          const materialesAInsertar = detalles
            .filter((d: any) => d.tipo_item === "producto" || !d.tipo_item)
            .map((d: any) => ({
              orden_id: nuevaOrdenId,
              producto_id: d.item_id || null,
              nombre_producto: d.descripcion,
              unidad: "und",
              cantidad_salida: d.cantidad || 1,
              cantidad_retorno: 0,
              estado: "pendiente",
              notas: `Precargado desde ${form.cotizacion_id ? "cotización" : "factura"}`,
            }));

          if (materialesAInsertar.length > 0) {
            await supabase.from("requisicion_materiales").insert(materialesAInsertar);
          }
        }
      }

      setModal(null);
      setOrdenActual(null);
      setForm(FORM_VACIO);
      setCotizacionElegida("");
      setFacturaElegida("");
      cargarOrdenes();
    }
    setSaving(false);
  };

  // ── Acciones de Papelera ────────────────────────────────────────────────────
  const moverAPapelera = async (ord: OrdenTrabajo) => {
    await supabase.from("ordenes_trabajo").update({
      eliminada: true,
      eliminada_at: new Date().toISOString(),
    }).eq("id", ord.id);

    setConfirmacionMoverPapelera(null);
    setModal(null);
    cargarOrdenes();
  };

  const restaurarDePapelera = async (ord: OrdenTrabajo) => {
    await supabase.from("ordenes_trabajo").update({
      eliminada: false,
      eliminada_at: null,
    }).eq("id", ord.id);

    cargarOrdenes();
  };

  const eliminarDefinitivo = async (ord: OrdenTrabajo) => {
    await supabase.from("ordenes_trabajo").delete().eq("id", ord.id);
    setConfirmacionEliminarDefinitivo(null);
    cargarOrdenes();
  };

  // ── Cambiar Estado Rápido ───────────────────────────────────────────────────
  const cambiarEstado = async (orden: OrdenTrabajo, nuevoEstado: OrdenTrabajo["estado"]) => {
    await supabase.from("ordenes_trabajo").update({
      estado: nuevoEstado,
      fecha_cierre: nuevoEstado === "completado" ? new Date().toISOString() : null,
    }).eq("id", orden.id);
    cargarOrdenes();
  };

  const abrirNueva = () => {
    setOrdenActual(null);
    setForm(FORM_VACIO);
    setCotizacionElegida("");
    setFacturaElegida("");
    setOrigenPrecarga("cotizacion");
    setModal("nueva");
  };

  const abrirDetalle = (orden: OrdenTrabajo) => {
    setOrdenActual(orden);
    setModal("detalle");
  };

  const abrirEditar = (orden: OrdenTrabajo) => {
    setOrdenActual(orden);
    setForm({
      tipo_flujo: orden.tipo_flujo,
      estado: orden.estado,
      tipo_servicio: orden.tipo_servicio || "",
      descripcion_alcance: orden.descripcion_alcance || "",
      direccion_obra: orden.direccion_obra || "",
      fecha_visita: orden.fecha_visita ? orden.fecha_visita.slice(0, 16) : "",
      fecha_ejecucion: orden.fecha_ejecucion ? orden.fecha_ejecucion.slice(0, 16) : "",
      prioridad: orden.prioridad,
      notas_internas: orden.notas_internas || "",
      cliente_id: orden.cliente_id || "",
      cotizacion_id: (orden as any).cotizacion_id || "",
    });
    setModal("editar");
  };

  // ── Filtros ────────────────────────────────────────────────────────────────
  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(o => {
      const matchQuery = !query || [o.numero, o.tipo_servicio, o.cliente?.nombre, o.direccion_obra]
        .some(v => v?.toLowerCase().includes(query.toLowerCase()));
      const matchEstado = filtroEstado === "todos" || o.estado === filtroEstado;
      const matchServicio = filtroServicio === "todos" || o.tipo_servicio === filtroServicio;
      return matchQuery && matchEstado && matchServicio;
    });
  }, [ordenes, query, filtroEstado, filtroServicio]);

  const papeleraFiltrada = useMemo(() => {
    return papelera.filter(o => {
      if (!query) return true;
      return [o.numero, o.tipo_servicio, o.cliente?.nombre, o.direccion_obra]
        .some(v => v?.toLowerCase().includes(query.toLowerCase()));
    });
  }, [papelera, query]);

  // Cotizaciones para el desplegable (destacando aprobadas)
  const cotizacionesParaSelect = useMemo(() => {
    if (!filtroCotAprobadas) return cotizaciones;
    return cotizaciones.filter(c => {
      const est = (c.estado || "").toLowerCase().trim();
      return est === "aprobada" || est === "aprobadas";
    });
  }, [cotizaciones, filtroCotAprobadas]);

  // Kanban agrupado
  const kanbanColumnas = useMemo(() => {
    const cols: Record<string, OrdenTrabajo[]> = {
      pendiente: [], programado: [], en_ejecucion: [], completado: [],
    };
    ordenesFiltradas.forEach(o => {
      const key = o.estado === "inspeccion" ? "en_ejecucion"
                : o.estado === "pausado"    ? "en_ejecucion"
                : o.estado === "cancelado"  ? "completado"
                : o.estado;
      if (cols[key]) cols[key].push(o);
    });
    return cols;
  }, [ordenesFiltradas]);

  // ── Render: Tarjeta Kanban ──────────────────────────────────────────────────
  const KanbanCard = ({ orden }: { orden: OrdenTrabajo }) => {
    const estadoCfg = ESTADOS_CONFIG[orden.estado];
    const prioridadCfg = PRIORIDAD_CONFIG[orden.prioridad];
    const EstadoIcon = estadoCfg.icon;

    return (
      <div
        className="ts-surface rounded-xl p-3 border ts-border cursor-pointer hover:border-[var(--ts-red)] transition-all group relative"
        onClick={() => abrirDetalle(orden)}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-[var(--ts-text-muted)]">{orden.numero}</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${prioridadCfg.dot}`} title={prioridadCfg.label} />
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${estadoCfg.bg} ${estadoCfg.color}`}>
              <EstadoIcon className="inline w-3 h-3 mr-0.5" />
              {estadoCfg.label}
            </span>
          </div>
        </div>

        {orden.tipo_servicio && (
          <div className="text-xs font-bold text-[var(--ts-red)] mb-1">{orden.tipo_servicio}</div>
        )}

        {orden.cliente?.nombre && (
          <p className="text-xs font-semibold ts-text line-clamp-1 mb-1">{orden.cliente.nombre}</p>
        )}

        <p className="text-xs ts-text-muted line-clamp-2 mb-2">{orden.descripcion_alcance || "Sin descripción"}</p>

        {orden.direccion_obra && (
          <div className="flex items-center gap-1 text-xs ts-text-muted mb-2">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{orden.direccion_obra}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t ts-border">
          <div className="flex items-center gap-1 text-xs ts-text-muted">
            <User className="w-3 h-3" />
            <span>{orden.tecnico_lider?.nombre || "Sin asignar"}</span>
          </div>
          {orden.fecha_ejecucion && (
            <div className="flex items-center gap-1 text-xs ts-text-muted">
              <Calendar className="w-3 h-3" />
              <span>{new Date(orden.fecha_ejecucion).toLocaleDateString("es-VE", { day: "2-digit", month: "short" })}</span>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            orden.tipo_flujo === "con_inspeccion"
              ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600"
              : "bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600"
          }`}>
            {orden.tipo_flujo === "con_inspeccion" ? "Inspección" : "Directa"}
          </span>

          {esAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmacionMoverPapelera(orden);
              }}
              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Mover a papelera"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── Render: Vista Kanban ────────────────────────────────────────────────────
  const VistaKanban = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {(["pendiente", "programado", "en_ejecucion", "completado"] as const).map(col => {
        const cfg = ESTADOS_CONFIG[col === "en_ejecucion" ? "en_ejecucion" : col === "completado" ? "completado" : col];
        const items = kanbanColumnas[col] || [];
        return (
          <div key={col} className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                <span className="text-xs font-bold ts-text">{cfg.label}</span>
                <span className="text-xs ts-text-muted bg-[var(--ts-surface-2)] px-1.5 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 min-h-[200px]">
              {items.map(o => <KanbanCard key={o.id} orden={o} />)}
              {items.length === 0 && (
                <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed ts-border rounded-xl text-xs ts-text-muted">
                  Sin órdenes
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Render: Vista Lista ─────────────────────────────────────────────────────
  const VistaLista = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left ts-text-muted border-b ts-border">
            <th className="py-2.5 px-3 font-semibold">N° Orden</th>
            <th className="py-2.5 px-3 font-semibold">Servicio</th>
            <th className="py-2.5 px-3 font-semibold">Cliente</th>
            <th className="py-2.5 px-3 font-semibold">Técnico Líder</th>
            <th className="py-2.5 px-3 font-semibold">Flujo</th>
            <th className="py-2.5 px-3 font-semibold">Estado</th>
            <th className="py-2.5 px-3 font-semibold">Prioridad</th>
            <th className="py-2.5 px-3 font-semibold">Fecha Ejec.</th>
            <th className="py-2.5 px-3 font-semibold text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ordenesFiltradas.map(o => {
            const estadoCfg = ESTADOS_CONFIG[o.estado];
            const prioridadCfg = PRIORIDAD_CONFIG[o.prioridad];
            return (
              <tr key={o.id} className="border-b ts-border hover:bg-[var(--ts-surface-2)] transition-colors">
                <td className="py-2.5 px-3 font-mono font-bold ts-text">{o.numero}</td>
                <td className="py-2.5 px-3 text-[var(--ts-red)] font-medium">{o.tipo_servicio || "—"}</td>
                <td className="py-2.5 px-3 ts-text font-medium">{o.cliente?.nombre || "—"}</td>
                <td className="py-2.5 px-3 ts-text-muted">{o.tecnico_lider?.nombre || <span className="italic">Sin asignar</span>}</td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    o.tipo_flujo === "con_inspeccion"
                      ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600"
                      : "bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600"
                  }`}>
                    {o.tipo_flujo === "con_inspeccion" ? "Insp." : "Directa"}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoCfg.bg} ${estadoCfg.color}`}>
                    {estadoCfg.label}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${prioridadCfg.dot}`} />
                    <span className={prioridadCfg.color}>{prioridadCfg.label}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 ts-text-muted">
                  {o.fecha_ejecucion ? new Date(o.fecha_ejecucion).toLocaleDateString("es-VE") : "—"}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => abrirDetalle(o)}
                      className="p-1.5 rounded hover:bg-[var(--ts-surface-2)] ts-text-muted hover:ts-text"
                      title="Ver detalle"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {puedeCrear && (
                      <button
                        onClick={() => abrirEditar(o)}
                        className="p-1.5 rounded hover:bg-[var(--ts-surface-2)] ts-text-muted hover:ts-text"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {puedeInformes && (
                      <button
                        onClick={() => { setOrdenActual(o); setModal("informe"); }}
                        className="p-1.5 rounded hover:bg-[var(--ts-surface-2)] text-purple-500"
                        title="Informe técnico"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {esAdmin && (
                      <button
                        onClick={() => setConfirmacionMoverPapelera(o)}
                        className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600"
                        title="Mover a papelera"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {ordenesFiltradas.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 ts-text-muted">
          <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">Sin órdenes de trabajo activas</p>
          <p className="text-xs mt-1">Crea la primera orden para comenzar</p>
        </div>
      )}
    </div>
  );

  // ── Render: Vista Papelera de 30 Días ───────────────────────────────────────
  const VistaPapelera = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black ts-text">Papelera de Reciclaje de Órdenes de Trabajo</h3>
            <p className="text-xs ts-text-muted">
              Las órdenes eliminadas se conservan aquí por 30 días de seguridad antes de su purga automática definitiva.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-red-600">
          {papelera.length} orden{papelera.length !== 1 ? "es" : ""} eliminada{papelera.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="ts-surface rounded-2xl border ts-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left ts-text-muted border-b ts-border">
              <th className="py-2.5 px-3 font-semibold">N° Orden</th>
              <th className="py-2.5 px-3 font-semibold">Servicio</th>
              <th className="py-2.5 px-3 font-semibold">Cliente</th>
              <th className="py-2.5 px-3 font-semibold">Eliminada el</th>
              <th className="py-2.5 px-3 font-semibold">Purga Automática</th>
              <th className="py-2.5 px-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {papeleraFiltrada.map(o => {
              const fechaEliminada = o.eliminada_at ? new Date(o.eliminada_at) : new Date(o.created_at);
              const diasPasados = Math.floor((Date.now() - fechaEliminada.getTime()) / (1000 * 60 * 60 * 24));
              const diasRestantes = Math.max(0, 30 - diasPasados);

              return (
                <tr key={o.id} className="border-b ts-border hover:bg-[var(--ts-surface-2)]">
                  <td className="py-2.5 px-3 font-mono font-bold ts-text">{o.numero}</td>
                  <td className="py-2.5 px-3 text-[var(--ts-red)] font-medium">{o.tipo_servicio || "—"}</td>
                  <td className="py-2.5 px-3 ts-text">{o.cliente?.nombre || "—"}</td>
                  <td className="py-2.5 px-3 ts-text-muted">
                    {fechaEliminada.toLocaleDateString("es-VE")} ({diasPasados}d atrás)
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      diasRestantes <= 5
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30"
                    }`}>
                      {diasRestantes > 0 ? `Quedan ${diasRestantes} días` : "Purga inminente"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => restaurarDePapelera(o)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/40 font-bold transition-colors"
                        title="Restaurar al tablero"
                      >
                        <RotateCcw className="w-3 h-3" /> Restaurar
                      </button>
                      <button
                        onClick={() => setConfirmacionEliminarDefinitivo(o)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40 font-bold transition-colors"
                        title="Eliminar de forma permanente"
                      >
                        <Trash2 className="w-3 h-3" /> Purgar Definitivo
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {papeleraFiltrada.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 ts-text-muted">
            <Trash2 className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">La papelera está vacía</p>
            <p className="text-xs mt-0.5">No hay órdenes de trabajo eliminadas recientemente</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── Render: Modal Detalle ───────────────────────────────────────────────────
  const renderModalDetalle = () => {
    if (!ordenActual) return null;
    const estadoCfg = ESTADOS_CONFIG[ordenActual.estado];

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) setModal(null);
        }}
      >
        <div className="ts-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border ts-border">
          <div className="flex items-start justify-between p-6 border-b ts-border">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm ts-text-muted">{ordenActual.numero}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoCfg.bg} ${estadoCfg.color}`}>
                  {estadoCfg.label}
                </span>
              </div>
              <h2 className="text-lg font-black ts-text">{ordenActual.tipo_servicio || "Orden de Trabajo"}</h2>
              {ordenActual.cliente?.nombre && (
                <p className="text-sm ts-text-muted">{ordenActual.cliente.nombre}</p>
              )}
            </div>
            <button onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-[var(--ts-surface-2)] ts-text-muted">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoField label="Tipo de Flujo" value={ordenActual.tipo_flujo === "con_inspeccion" ? "Con Inspección Previa" : "Ejecución Directa"} />
              <InfoField label="Prioridad" value={PRIORIDAD_CONFIG[ordenActual.prioridad].label} />
              <InfoField label="Tipo de Servicio" value={ordenActual.tipo_servicio || "—"} />
              <InfoField label="Técnico Líder" value={ordenActual.tecnico_lider?.nombre || "Sin asignar"} />
              {ordenActual.fecha_visita && <InfoField label="Fecha Visita" value={new Date(ordenActual.fecha_visita).toLocaleDateString("es-VE")} />}
              {ordenActual.fecha_ejecucion && <InfoField label="Fecha Ejecución" value={new Date(ordenActual.fecha_ejecucion).toLocaleDateString("es-VE")} />}
            </div>

            {ordenActual.descripcion_alcance && (
              <div>
                <p className="text-xs font-bold ts-text-muted uppercase mb-1">Alcance del Trabajo</p>
                <p className="text-sm ts-text bg-[var(--ts-surface-2)] p-3 rounded-lg whitespace-pre-line">{ordenActual.descripcion_alcance}</p>
              </div>
            )}

            {ordenActual.direccion_obra && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[var(--ts-red)] mt-0.5 shrink-0" />
                <p className="text-sm ts-text">{ordenActual.direccion_obra}</p>
              </div>
            )}

            {ordenActual.notas_internas && (
              <div>
                <p className="text-xs font-bold ts-text-muted uppercase mb-1">Notas Internas</p>
                <p className="text-sm ts-text-muted italic bg-[var(--ts-surface-2)] p-3 rounded-lg">{ordenActual.notas_internas}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-6 border-t ts-border">
            <div className="flex flex-wrap gap-2">
              {puedeCrear && (
                <button
                  onClick={() => { setModal(null); setTimeout(() => abrirEditar(ordenActual), 100); }}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border ts-border hover:bg-[var(--ts-surface-2)] ts-text transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar
                </button>
              )}
              {puedeAsignar && (
                <button
                  onClick={() => setModal("cuadrilla")}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border ts-border hover:bg-[var(--ts-surface-2)] ts-text transition-colors"
                >
                  <HardHat className="w-3.5 h-3.5" /> Cuadrilla
                </button>
              )}
              {puedeMateriales && (
                <button
                  onClick={() => setModal("materiales")}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border ts-border hover:bg-[var(--ts-surface-2)] ts-text transition-colors"
                >
                  <Package className="w-3.5 h-3.5" /> Materiales
                </button>
              )}
              {puedeInformes && (
                <button
                  onClick={() => setModal("informe")}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Informe
                </button>
              )}
              {puedeCrear && ordenActual.estado !== "completado" && ordenActual.estado !== "cancelado" && (
                <button
                  onClick={() => cambiarEstado(ordenActual, "completado")}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Marcar Completado
                </button>
              )}
            </div>

            {esAdmin && (
              <button
                onClick={() => setConfirmacionMoverPapelera(ordenActual)}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/40 font-bold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Mover a Papelera
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Render: Modal Formulario de Creación / Edición ──────────────────────────
  const renderModalFormulario = () => (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setModal(null);
      }}
    >
      <div className="ts-surface rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl border ts-border">
        <div className="flex items-center justify-between p-6 border-b ts-border">
          <div className="flex items-center gap-2.5">
            {ordenActual && (
              <button
                type="button"
                onClick={() => setModal("detalle")}
                className="p-1.5 -ml-1 rounded-xl hover:bg-[var(--ts-surface-2)] ts-text-muted hover:ts-text transition-colors"
                title="Volver a la orden"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-base font-black ts-text">
                {ordenActual ? `Editar ${ordenActual.numero}` : "Nueva Orden de Trabajo"}
              </h2>
              <p className="text-xs ts-text-muted mt-0.5">
                {ordenActual ? "Modifica los parámetros de la orden" : "Crea una orden desde una Cotización/Factura o desde cero"}
              </p>
            </div>
          </div>
          <button onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-[var(--ts-surface-2)] ts-text-muted" title="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* ── PANEL DE PRECARGA INTELIGENTE (Solo en Nueva Orden) ── */}
          {!ordenActual && (
            <div className="p-4 rounded-xl bg-[var(--ts-surface-2)] border ts-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black ts-text flex items-center gap-1.5 uppercase tracking-wide">
                  <Zap className="w-3.5 h-3.5 text-[var(--ts-red)]" /> Origen de la Orden (Precarga)
                </span>
                {cargandoPrecarga && (
                  <span className="text-[10px] text-[var(--ts-red)] animate-pulse flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Precargando datos...
                  </span>
                )}
              </div>

              {/* Selector de modo de precarga */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOrigenPrecarga("cotizacion")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold border transition-all ${
                    origenPrecarga === "cotizacion"
                      ? "border-[var(--ts-red)] bg-red-50 dark:bg-red-950/20 text-[var(--ts-red)] shadow-xs"
                      : "ts-border ts-text-muted hover:ts-text"
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Cotización
                </button>

                <button
                  type="button"
                  onClick={() => setOrigenPrecarga("factura")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold border transition-all ${
                    origenPrecarga === "factura"
                      ? "border-[var(--ts-red)] bg-red-50 dark:bg-red-950/20 text-[var(--ts-red)] shadow-xs"
                      : "ts-border ts-text-muted hover:ts-text"
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" /> Factura
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrigenPrecarga("manual");
                    setCotizacionElegida("");
                    setFacturaElegida("");
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold border transition-all ${
                    origenPrecarga === "manual"
                      ? "border-[var(--ts-red)] bg-red-50 dark:bg-red-950/20 text-[var(--ts-red)] shadow-xs"
                      : "ts-border ts-text-muted hover:ts-text"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Desde Cero
                </button>
              </div>

              {/* Selector de Cotización */}
              {origenPrecarga === "cotizacion" && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] ts-text-muted">
                    <span>Selecciona una cotización:</span>
                    <button
                      type="button"
                      onClick={() => setFiltroCotAprobadas(!filtroCotAprobadas)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                        filtroCotAprobadas
                          ? "bg-green-100 text-green-700 dark:bg-green-950/40 border-green-300"
                          : "ts-border ts-text-muted"
                      }`}
                    >
                      {filtroCotAprobadas ? "✓ Solo Aprobadas" : "Mostrar Todas"}
                    </button>
                  </div>

                  <select
                    value={cotizacionElegida}
                    onChange={e => handleSeleccionarCotizacion(e.target.value)}
                    className="w-full text-xs rounded-xl border ts-border bg-[var(--ts-surface)] ts-text px-3 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
                  >
                    <option value="">-- Elige una cotización para precargar --</option>
                    {cotizacionesParaSelect.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.numero_cotizacion} · {c.cliente?.nombre || "Cliente"} (${Number(c.total || 0).toFixed(2)}) [{c.estado}]
                      </option>
                    ))}
                  </select>

                  {cotizacionElegida && (
                    <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 text-[11px] text-green-700 dark:text-green-400 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Datos del cliente, dirección y alcance precargados. Al guardar, los materiales se registrarán en almacén.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Selector de Factura */}
              {origenPrecarga === "factura" && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] ts-text-muted block">Selecciona una factura emitida:</span>
                  <select
                    value={facturaElegida}
                    onChange={e => handleSeleccionarFactura(e.target.value)}
                    className="w-full text-xs rounded-xl border ts-border bg-[var(--ts-surface)] ts-text px-3 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
                  >
                    <option value="">-- Elige una factura para precargar --</option>
                    {facturas.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.numero_factura} · {f.cliente?.nombre || "Cliente"} (${Number(f.total || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>

                  {facturaElegida && (
                    <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 text-[11px] text-green-700 dark:text-green-400 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Datos de la factura y cliente precargados correctamente.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tipo de Flujo */}
          <div>
            <label className="text-xs font-bold ts-text-muted uppercase mb-2 block">Tipo de Flujo de Trabajo</label>
            <div className="grid grid-cols-2 gap-2">
              {(["con_inspeccion", "directo"] as const).map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, tipo_flujo: tipo }))}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.tipo_flujo === tipo
                      ? "border-[var(--ts-red)] bg-red-50 dark:bg-red-900/10"
                      : "ts-border hover:border-[var(--ts-red)]/50"
                  }`}
                >
                  <div className="text-xs font-bold ts-text mb-0.5">
                    {tipo === "con_inspeccion" ? "🔍 Con Inspección Previa" : "⚡ Ejecución Directa"}
                  </div>
                  <div className="text-[11px] ts-text-muted leading-relaxed">
                    {tipo === "con_inspeccion"
                      ? "Requiere visita previa de diagnóstico y propuesta antes de ejecutar"
                      : "Alcance definido desde presupuesto/factura para ir a obra directamente"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de Servicio + Prioridad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold ts-text-muted uppercase mb-1 block">Tipo de Servicio *</label>
              <select
                value={form.tipo_servicio}
                onChange={e => setForm(f => ({ ...f, tipo_servicio: e.target.value }))}
                className="w-full text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
              >
                <option value="">Seleccionar servicio...</option>
                {TIPOS_SERVICIO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold ts-text-muted uppercase mb-1 block">Prioridad</label>
              <select
                value={form.prioridad}
                onChange={e => setForm(f => ({ ...f, prioridad: e.target.value as OrdenTrabajo["prioridad"] }))}
                className="w-full text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
              >
                <option value="baja">Baja</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Cliente */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold ts-text-muted uppercase">Cliente (Directorio)</label>
              <span className="text-[10px] ts-text-muted">Autocompleta dirección si existe</span>
            </div>
            <select
              value={form.cliente_id}
              onChange={e => {
                const cId = e.target.value;
                const cli = clientes.find(c => c.id === cId);
                setForm(f => ({
                  ...f,
                  cliente_id: cId,
                  direccion_obra: cli?.direccion || f.direccion_obra,
                }));
              }}
              className="w-full text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
            >
              <option value="">Sin cliente asignado</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          {/* Descripción / Alcance */}
          <div>
            <label className="text-xs font-bold ts-text-muted uppercase mb-1 block">Alcance del Trabajo</label>
            <textarea
              value={form.descripcion_alcance}
              onChange={e => setForm(f => ({ ...f, descripcion_alcance: e.target.value }))}
              placeholder="Describe los trabajos a realizar, equipos a montar o tareas..."
              rows={3}
              className="w-full text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="text-xs font-bold ts-text-muted uppercase mb-1 block">Dirección de la Obra</label>
            <input
              type="text"
              value={form.direccion_obra}
              onChange={e => setForm(f => ({ ...f, direccion_obra: e.target.value }))}
              placeholder="Av. Principal, Edif. X, Sector Y, Ciudad"
              className="w-full text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            {form.tipo_flujo === "con_inspeccion" && (
              <div>
                <label className="text-xs font-bold ts-text-muted uppercase mb-1 block">Fecha Visita Técnica</label>
                <input
                  type="datetime-local"
                  value={form.fecha_visita}
                  onChange={e => setForm(f => ({ ...f, fecha_visita: e.target.value }))}
                  className="w-full text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-bold ts-text-muted uppercase mb-1 block">Fecha Ejecución</label>
              <input
                type="datetime-local"
                value={form.fecha_ejecucion}
                onChange={e => setForm(f => ({ ...f, fecha_ejecucion: e.target.value }))}
                className="w-full text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
              />
            </div>
          </div>

          {/* Estado (solo en edición) */}
          {ordenActual && (
            <div>
              <label className="text-xs font-bold ts-text-muted uppercase mb-1 block">Estado</label>
              <select
                value={form.estado}
                onChange={e => setForm(f => ({ ...f, estado: e.target.value as OrdenTrabajo["estado"] }))}
                className="w-full text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
              >
                {ESTADOS_FLUJO.map(e => (
                  <option key={e} value={e}>{ESTADOS_CONFIG[e].label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Notas internas */}
          <div>
            <label className="text-xs font-bold ts-text-muted uppercase mb-1 block">Notas Internas</label>
            <textarea
              value={form.notas_internas}
              onChange={e => setForm(f => ({ ...f, notas_internas: e.target.value }))}
              placeholder="Notas para el equipo técnico..."
              rows={2}
              className="w-full text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-6 border-t ts-border">
          <button
            type="button"
            onClick={() => ordenActual ? setModal("detalle") : setModal(null)}
            className="text-xs px-4 py-2 rounded-lg border ts-border ts-text-muted hover:bg-[var(--ts-surface-2)] transition-colors"
          >
            {ordenActual ? "Volver" : "Cancelar"}
          </button>
          <button
            type="button"
            onClick={guardarOrden}
            disabled={saving || !form.tipo_servicio}
            className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-[var(--ts-red)] text-white hover:bg-red-700 transition-colors disabled:opacity-50 font-bold"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {ordenActual ? "Guardar Cambios" : "Crear Orden"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render Principal ────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Banner BETA */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40">
        <span className="text-amber-500 text-lg leading-none shrink-0">⚗️</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            Módulo en Beta — Úsalo con precaución
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5 leading-relaxed">
            Gestión completa de Órdenes de Trabajo, precarga desde Cotizaciones Aprobadas/Facturas, y Papelera de seguridad de 30 días para Administradores.
          </p>
        </div>
        <span className="shrink-0 text-[9px] font-black uppercase px-2 py-1 rounded-full bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-400 tracking-widest">
          BETA
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black ts-text flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[var(--ts-red)]" /> Órdenes de Trabajo
          </h1>
          <p className="text-xs ts-text-muted mt-0.5">
            {ordenes.length} orden{ordenes.length !== 1 ? "es" : ""} activas
            {esAdmin && papelera.length > 0 && ` · ${papelera.length} en papelera`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={cargarOrdenes}
            className="p-2 rounded-lg border ts-border ts-text-muted hover:bg-[var(--ts-surface-2)] transition-colors"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Selector de Vistas: Kanban, Lista, Papelera */}
          <div className="flex rounded-lg border ts-border overflow-hidden p-0.5 bg-[var(--ts-surface-2)]">
            <button
              onClick={() => setVista("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                vista === "kanban" ? "bg-[var(--ts-surface)] ts-text shadow-xs" : "ts-text-muted hover:ts-text"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>

            <button
              onClick={() => setVista("lista")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                vista === "lista" ? "bg-[var(--ts-surface)] ts-text shadow-xs" : "ts-text-muted hover:ts-text"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </button>

            {esAdmin && (
              <button
                onClick={() => setVista("papelera")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  vista === "papelera"
                    ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 shadow-xs"
                    : "text-gray-400 hover:text-red-500"
                }`}
                title="Papelera de reciclaje de 30 días"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Papelera</span>
                {papelera.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 font-black">
                    {papelera.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {puedeCrear && (
            <button
              onClick={abrirNueva}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-[var(--ts-red)] text-white hover:bg-red-700 transition-colors font-bold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Orden
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ts-text-muted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={vista === "papelera" ? "Buscar en papelera..." : "Buscar orden, cliente, servicio..."}
            className="text-xs pl-8 pr-3 py-2 rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)] w-64"
          />
        </div>

        {vista !== "papelera" && (
          <>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text focus:outline-none"
            >
              <option value="todos">Todos los estados</option>
              {ESTADOS_FLUJO.map(e => (
                <option key={e} value={e}>{ESTADOS_CONFIG[e].label}</option>
              ))}
            </select>
            <select
              value={filtroServicio}
              onChange={e => setFiltroServicio(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text focus:outline-none"
            >
              <option value="todos">Todos los servicios</option>
              {TIPOS_SERVICIO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </>
        )}
      </div>

      {/* Métricas rápidas (en Kanban y Lista) */}
      {vista !== "papelera" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Pendientes", count: ordenes.filter(o => o.estado === "pendiente").length, color: "text-yellow-500" },
            { label: "En Ejecución", count: ordenes.filter(o => o.estado === "en_ejecucion" || o.estado === "inspeccion").length, color: "text-orange-500" },
            { label: "Completadas", count: ordenes.filter(o => o.estado === "completado").length, color: "text-green-500" },
            { label: "Urgentes", count: ordenes.filter(o => o.prioridad === "urgente").length, color: "text-red-500" },
          ].map(stat => (
            <div key={stat.label} className="ts-surface rounded-xl p-3 border ts-border">
              <div className={`text-2xl font-black ${stat.color}`}>{stat.count}</div>
              <div className="text-xs ts-text-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Contenido Principal según vista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin ts-text-muted" />
        </div>
      ) : vista === "kanban" ? (
        <VistaKanban />
      ) : vista === "lista" ? (
        <div className="ts-surface rounded-2xl border ts-border overflow-hidden">
          <VistaLista />
        </div>
      ) : (
        <VistaPapelera />
      )}

      {/* ── Modales de Wizard, Cuadrilla, Materiales y Formulario ── */}
      {(modal === "nueva" || modal === "editar") && renderModalFormulario()}
      {modal === "detalle" && ordenActual && renderModalDetalle()}
      {modal === "informe" && ordenActual && (
        <InformeTecnicoWizard
          orden={ordenActual as any}
          onClose={() => { setModal(null); cargarOrdenes(); }}
          onBack={() => setModal("detalle")}
        />
      )}
      {modal === "cuadrilla" && ordenActual && (
        <CuadrillaPicker
          orden={ordenActual as any}
          onClose={() => { setModal(null); cargarOrdenes(); }}
          onBack={() => setModal("detalle")}
        />
      )}
      {modal === "materiales" && ordenActual && (
        <RequisicionMateriales
          orden={ordenActual as any}
          onClose={() => { setModal(null); }}
          onBack={() => setModal("detalle")}
        />
      )}

      {/* ── Modal Confirmación: Mover a Papelera ── */}
      {confirmacionMoverPapelera && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmacionMoverPapelera(null);
          }}
        >
          <div className="ts-surface rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border ts-border space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black ts-text">¿Mover orden a la papelera?</h3>
            <p className="text-xs ts-text-muted">
              La orden <strong>{confirmacionMoverPapelera.numero}</strong> dejará de mostrarse en el tablero.
              Permanecerá en la papelera durante 30 días de seguridad antes de su eliminación permanente.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmacionMoverPapelera(null)}
                className="flex-1 py-2 rounded-xl border ts-border text-xs ts-text-muted hover:bg-[var(--ts-surface-2)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => moverAPapelera(confirmacionMoverPapelera)}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Sí, mover a papelera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Confirmación: Purga Definitiva ── */}
      {confirmacionEliminarDefinitivo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmacionEliminarDefinitivo(null);
          }}
        >
          <div className="ts-surface rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border ts-border space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black ts-text">¿Eliminar definitivamente?</h3>
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
              Esta acción es irreversible. Se borrarán permanentemente la orden <strong>{confirmacionEliminarDefinitivo.numero}</strong> y sus registros asociados.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmacionEliminarDefinitivo(null)}
                className="flex-1 py-2 rounded-xl border ts-border text-xs ts-text-muted hover:bg-[var(--ts-surface-2)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarDefinitivo(confirmacionEliminarDefinitivo)}
                className="flex-1 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-black transition-colors shadow-xs"
              >
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper: campo de info ──────────────────────────────────────────────────────
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold ts-text-muted uppercase mb-0.5">{label}</p>
      <p className="text-sm ts-text">{value}</p>
    </div>
  );
}
