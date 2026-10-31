// ─────────────────────────────────────────────────────────────────────────────
// src/components/cotizador/OrdenesTrabajoManager.tsx
// Módulo principal de Órdenes de Trabajo — Sprint 8
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, Search, Filter, Wrench, HardHat, Calendar, Clock,
  CheckCircle2, AlertTriangle, XCircle, PlayCircle, PauseCircle,
  Eye, Edit3, FileText, Package, ChevronDown, ChevronRight,
  MapPin, User, Users, Loader2, RefreshCw, MoreVertical,
  ClipboardList, ArrowRight, Zap, SlidersHorizontal, X,
  LayoutGrid, FlaskConical
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
  // Joined
  cliente?: { nombre: string; email: string } | null;
  tecnico_lider?: { nombre: string; avatar_url: string | null } | null;
  informes_count?: number;
}

type VistaTab = "kanban" | "lista";
type Modal = "nueva" | "editar" | "detalle" | "informe" | "cuadrilla" | "materiales" | null;

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

// ── Formulario vacío ──────────────────────────────────────────────────────────
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
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function OrdenesTrabajoManager() {
  const { usuario } = useUsuario();
  const permisosUsuario: string[] = usuario?.roles?.permisos || (usuario?.rol_id === "admin" ? ["*"] : []);
  const puedeCrear   = tienePermiso(permisosUsuario, "proyectos.crear_ordenes");
  const puedeAsignar = tienePermiso(permisosUsuario, "proyectos.asignar_cuadrillas");
  const puedeMateriales = tienePermiso(permisosUsuario, "proyectos.materiales");
  const puedeVerPropias = tienePermiso(permisosUsuario, "proyectos.ver_propias");
  const puedeInformes   = tienePermiso(permisosUsuario, "proyectos.actas");

  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
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
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([]);

  // ── Carga de datos ─────────────────────────────────────────────────────────
  const cargarOrdenes = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("ordenes_trabajo")
      .select(`
        *,
        tecnico_lider:perfiles!ordenes_trabajo_tecnico_lider_id_fkey(nombre, avatar_url)
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    // Los técnicos solo ven sus propias órdenes
    if (!puedeCrear && puedeVerPropias && usuario) {
      q = q.or(`tecnico_lider_id.eq.${usuario.id},ayudantes.cs.{${usuario.id}}`);
    }

    const { data, error } = await q;
    if (!error && data) {
      // Cruzar clientes por ID para evitar errores de foreign key o esquemas mixtos
      const { data: listaClientes } = await supabase
        .from("clientes")
        .select("id, nombre, email, telefono")
        .limit(1000);
      
      const mapaCli: Record<string, { nombre: string; email: string }> = {};
      (listaClientes || []).forEach(c => {
        mapaCli[c.id] = { nombre: c.nombre, email: c.email || "" };
      });

      const ordenesConCliente = (data as any[]).map(ord => ({
        ...ord,
        cliente: ord.cliente_id && mapaCli[ord.cliente_id] ? mapaCli[ord.cliente_id] : ord.cliente || null
      }));

      setOrdenes(ordenesConCliente as OrdenTrabajo[]);
    }
    setLoading(false);
  }, [puedeCrear, puedeVerPropias, usuario]);

  const cargarClientes = async () => {
    // Cargar de la tabla "clientes" (Directorio de Clientes de la empresa)
    const { data } = await supabase
      .from("clientes")
      .select("id, nombre")
      .order("nombre")
      .limit(500);
    if (data) setClientes(data);
  };

  useEffect(() => {
    cargarOrdenes();
    cargarClientes();
  }, [cargarOrdenes]);

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

  // ── Kanban agrupado ────────────────────────────────────────────────────────
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

  // ── Guardar orden ──────────────────────────────────────────────────────────
  const guardarOrden = async () => {
    setSaving(true);
    setError(null);

    const esMock = !usuario?.id || usuario.id === "00000000-0000-0000-0000-000000000000";
    const payload = {
      ...form,
      creado_por: esMock ? null : usuario.id,
      cliente_id: form.cliente_id || null,
      fecha_visita: form.fecha_visita || null,
      fecha_ejecucion: form.fecha_ejecucion || null,
    };

    let resultado;
    if (ordenActual) {
      resultado = await supabase.from("ordenes_trabajo").update(payload).eq("id", ordenActual.id);
    } else {
      resultado = await supabase.from("ordenes_trabajo").insert(payload);
    }

    if (resultado.error) {
      setError(resultado.error.message);
    } else {
      setModal(null);
      setOrdenActual(null);
      setForm(FORM_VACIO);
      cargarOrdenes();
    }
    setSaving(false);
  };

  // ── Cambiar estado rápido ─────────────────────────────────────────────────
  const cambiarEstado = async (orden: OrdenTrabajo, nuevoEstado: OrdenTrabajo["estado"]) => {
    await supabase.from("ordenes_trabajo").update({
      estado: nuevoEstado,
      fecha_cierre: nuevoEstado === "completado" ? new Date().toISOString() : null,
    }).eq("id", orden.id);
    cargarOrdenes();
  };

  // ── Abrir modales ──────────────────────────────────────────────────────────
  const abrirNueva = () => {
    setOrdenActual(null);
    setForm(FORM_VACIO);
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
    });
    setModal("editar");
  };

  // ── Render: Tarjeta Kanban ────────────────────────────────────────────────
  const KanbanCard = ({ orden }: { orden: OrdenTrabajo }) => {
    const estadoCfg = ESTADOS_CONFIG[orden.estado];
    const prioridadCfg = PRIORIDAD_CONFIG[orden.prioridad];
    const EstadoIcon = estadoCfg.icon;

    return (
      <div
        className="ts-surface rounded-xl p-3 border ts-border cursor-pointer hover:border-[var(--ts-red)] transition-all group"
        onClick={() => abrirDetalle(orden)}
      >
        {/* Header */}
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

        {/* Servicio */}
        {orden.tipo_servicio && (
          <div className="text-xs font-bold text-[var(--ts-red)] mb-1">{orden.tipo_servicio}</div>
        )}

        {/* Descripción */}
        <p className="text-xs ts-text-muted line-clamp-2 mb-2">{orden.descripcion_alcance || "Sin descripción"}</p>

        {/* Dirección */}
        {orden.direccion_obra && (
          <div className="flex items-center gap-1 text-xs ts-text-muted mb-2">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{orden.direccion_obra}</span>
          </div>
        )}

        {/* Footer */}
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

        {/* Tipo flujo badge */}
        <div className="mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            orden.tipo_flujo === "con_inspeccion"
              ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600"
              : "bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600"
          }`}>
            {orden.tipo_flujo === "con_inspeccion" ? "Con Inspección" : "Ejecución Directa"}
          </span>
        </div>
      </div>
    );
  };

  // ── Render: Vista Kanban ──────────────────────────────────────────────────
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

  // ── Render: Vista Lista ───────────────────────────────────────────────────
  const VistaLista = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left ts-text-muted border-b ts-border">
            <th className="py-2 px-3 font-semibold">N° Orden</th>
            <th className="py-2 px-3 font-semibold">Servicio</th>
            <th className="py-2 px-3 font-semibold">Cliente</th>
            <th className="py-2 px-3 font-semibold">Técnico Líder</th>
            <th className="py-2 px-3 font-semibold">Flujo</th>
            <th className="py-2 px-3 font-semibold">Estado</th>
            <th className="py-2 px-3 font-semibold">Prioridad</th>
            <th className="py-2 px-3 font-semibold">Fecha Ejec.</th>
            <th className="py-2 px-3 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ordenesFiltradas.map(o => {
            const estadoCfg = ESTADOS_CONFIG[o.estado];
            const prioridadCfg = PRIORIDAD_CONFIG[o.prioridad];
            return (
              <tr key={o.id} className="border-b ts-border hover:bg-[var(--ts-surface-2)] transition-colors">
                <td className="py-2 px-3 font-mono font-bold ts-text">{o.numero}</td>
                <td className="py-2 px-3 text-[var(--ts-red)] font-medium">{o.tipo_servicio || "—"}</td>
                <td className="py-2 px-3 ts-text">{o.cliente?.nombre || "—"}</td>
                <td className="py-2 px-3 ts-text-muted">{o.tecnico_lider?.nombre || <span className="italic">Sin asignar</span>}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    o.tipo_flujo === "con_inspeccion"
                      ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600"
                      : "bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600"
                  }`}>
                    {o.tipo_flujo === "con_inspeccion" ? "Insp." : "Directa"}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoCfg.bg} ${estadoCfg.color}`}>
                    {estadoCfg.label}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${prioridadCfg.dot}`} />
                    <span className={prioridadCfg.color}>{prioridadCfg.label}</span>
                  </div>
                </td>
                <td className="py-2 px-3 ts-text-muted">
                  {o.fecha_ejecucion ? new Date(o.fecha_ejecucion).toLocaleDateString("es-VE") : "—"}
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirDetalle(o)}
                      className="p-1 rounded hover:bg-[var(--ts-surface-2)] ts-text-muted hover:ts-text transition-colors"
                      title="Ver detalle"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {puedeCrear && (
                      <button
                        onClick={() => abrirEditar(o)}
                        className="p-1 rounded hover:bg-[var(--ts-surface-2)] ts-text-muted transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {puedeInformes && (
                      <button
                        onClick={() => { setOrdenActual(o); setModal("informe"); }}
                        className="p-1 rounded hover:bg-[var(--ts-surface-2)] text-purple-500 transition-colors"
                        title="Informe técnico"
                      >
                        <FileText className="w-3.5 h-3.5" />
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
          <p className="text-sm font-medium">Sin órdenes de trabajo</p>
          <p className="text-xs mt-1">Crea la primera orden para comenzar</p>
        </div>
      )}
    </div>
  );

  // ── Render: Modal Detalle ─────────────────────────────────────────────────
  const renderModalDetalle = () => {
    if (!ordenActual) return null;
    const estadoCfg = ESTADOS_CONFIG[ordenActual.estado];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="ts-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
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

          {/* Cuerpo */}
          <div className="p-6 space-y-4">
            {/* Info Grid */}
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
                <p className="text-sm ts-text bg-[var(--ts-surface-2)] p-3 rounded-lg">{ordenActual.descripcion_alcance}</p>
              </div>
            )}

            {ordenActual.direccion_obra && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 ts-text-muted mt-0.5 shrink-0" />
                <p className="text-sm ts-text">{ordenActual.direccion_obra}</p>
              </div>
            )}

            {ordenActual.notas_internas && (
              <div>
                <p className="text-xs font-bold ts-text-muted uppercase mb-1">Notas Internas</p>
                <p className="text-sm ts-text-muted italic">{ordenActual.notas_internas}</p>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 p-6 border-t ts-border">
            {puedeCrear && (
              <button
                onClick={() => { setModal(null); setTimeout(() => abrirEditar(ordenActual), 100); }}
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ts-border hover:bg-[var(--ts-surface-2)] ts-text transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Editar Orden
              </button>
            )}
            {puedeAsignar && (
              <button
                onClick={() => setModal("cuadrilla")}
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ts-border hover:bg-[var(--ts-surface-2)] ts-text transition-colors"
              >
                <HardHat className="w-3.5 h-3.5" /> Asignar Cuadrilla
              </button>
            )}
            {puedeMateriales && (
              <button
                onClick={() => setModal("materiales")}
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ts-border hover:bg-[var(--ts-surface-2)] ts-text transition-colors"
              >
                <Package className="w-3.5 h-3.5" /> Materiales
              </button>
            )}
            {puedeInformes && (
              <button
                onClick={() => setModal("informe")}
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" /> Informe Técnico
              </button>
            )}
            {puedeCrear && ordenActual.estado !== "completado" && ordenActual.estado !== "cancelado" && (
              <button
                onClick={() => cambiarEstado(ordenActual, "completado")}
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Marcar Completado
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Render: Modal Formulario ──────────────────────────────────────────────
  const renderModalFormulario = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="ts-surface rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b ts-border">
          <h2 className="text-base font-black ts-text">
            {ordenActual ? `Editar ${ordenActual.numero}` : "Nueva Orden de Trabajo"}
          </h2>
          <button onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-[var(--ts-surface-2)] ts-text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Tipo de flujo */}
          <div>
            <label className="text-xs font-bold ts-text-muted uppercase mb-2 block">Tipo de Flujo</label>
            <div className="grid grid-cols-2 gap-2">
              {(["con_inspeccion", "directo"] as const).map(tipo => (
                <button
                  key={tipo}
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
                  <div className="text-xs ts-text-muted">
                    {tipo === "con_inspeccion"
                      ? "Visita técnica → diagnóstico → propuesta → ejecución"
                      : "Alcance definido desde cotización → ejecución directa"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tipo servicio + Prioridad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold ts-text-muted uppercase mb-1 block">Tipo de Servicio</label>
              <select
                value={form.tipo_servicio}
                onChange={e => setForm(f => ({ ...f, tipo_servicio: e.target.value }))}
                className="w-full text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
              >
                <option value="">Seleccionar...</option>
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
            <label className="text-xs font-bold ts-text-muted uppercase mb-1 block">Cliente (Opcional)</label>
            <select
              value={form.cliente_id}
              onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}
              className="w-full text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
            >
              <option value="">Sin cliente asignado</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-bold ts-text-muted uppercase mb-1 block">Alcance del Trabajo</label>
            <textarea
              value={form.descripcion_alcance}
              onChange={e => setForm(f => ({ ...f, descripcion_alcance: e.target.value }))}
              placeholder="Describe el alcance, equipos a instalar o problema a resolver..."
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
              placeholder="Av. Principal, Local X, Sector Y, Ciudad"
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

          {/* Estado */}
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
              placeholder="Notas para el equipo (no visibles para el cliente)..."
              rows={2}
              className="w-full text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-6 border-t ts-border">
          <button onClick={() => setModal(null)} className="text-xs px-4 py-2 rounded-lg border ts-border ts-text-muted hover:bg-[var(--ts-surface-2)] transition-colors">
            Cancelar
          </button>
          <button
            onClick={guardarOrden}
            disabled={saving || !form.tipo_servicio}
            className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-[var(--ts-red)] text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {ordenActual ? "Guardar Cambios" : "Crear Orden"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render Principal ──────────────────────────────────────────────────────
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
            Este módulo está en fase de pruebas activas. Las funciones principales operan correctamente,
            pero pueden existir detalles menores en flujo. Cualquier inconsistencia repórtala al administrador.
            <strong className="ml-1">Aplica primero la migración SQL en Supabase antes de crear órdenes.</strong>
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
            {ordenes.length} orden{ordenes.length !== 1 ? "es" : ""} en el sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargarOrdenes}
            className="p-2 rounded-lg border ts-border ts-text-muted hover:bg-[var(--ts-surface-2)] transition-colors"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {/* Vista toggle */}
          <div className="flex rounded-lg border ts-border overflow-hidden">
            <button
              onClick={() => setVista("kanban")}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                vista === "kanban" ? "bg-[var(--ts-red)] text-white" : "ts-text-muted hover:bg-[var(--ts-surface-2)]"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setVista("lista")}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                vista === "lista" ? "bg-[var(--ts-red)] text-white" : "ts-text-muted hover:bg-[var(--ts-surface-2)]"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
            </button>
          </div>
          {puedeCrear && (
            <button
              onClick={abrirNueva}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-[var(--ts-red)] text-white hover:bg-red-700 transition-colors font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Orden
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ts-text-muted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar orden, cliente, servicio..."
            className="text-xs pl-8 pr-3 py-2 rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)] w-64"
          />
        </div>
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
      </div>

      {/* Stats rápidas */}
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

      {/* Contenido principal */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin ts-text-muted" />
        </div>
      ) : vista === "kanban" ? (
        <VistaKanban />
      ) : (
        <div className="ts-surface rounded-2xl border ts-border overflow-hidden">
          <VistaLista />
        </div>
      )}

      {/* Modales */}
      {(modal === "nueva" || modal === "editar") && renderModalFormulario()}
      {modal === "detalle" && ordenActual && renderModalDetalle()}
      {modal === "informe" && ordenActual && (
        <InformeTecnicoWizard
          orden={ordenActual as any}
          onClose={() => { setModal(null); cargarOrdenes(); }}
        />
      )}
      {modal === "cuadrilla" && ordenActual && (
        <CuadrillaPicker
          orden={ordenActual as any}
          onClose={() => { setModal(null); cargarOrdenes(); }}
        />
      )}
      {modal === "materiales" && ordenActual && (
        <RequisicionMateriales
          orden={ordenActual as any}
          onClose={() => { setModal(null); }}
        />
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
