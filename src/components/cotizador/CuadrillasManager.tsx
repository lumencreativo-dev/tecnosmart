// ─────────────────────────────────────────────────────────────────────────────
// src/components/cotizador/CuadrillasManager.tsx
// Panel Maestro de Cuadrillas & Técnicos de Campo — Sprint 8 (BETA)
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  HardHat, Users, UserCheck, Search, Phone, Calendar,
  Wrench, CheckCircle2, Clock, AlertTriangle, Star, RefreshCw,
  ExternalLink, Eye, ShieldCheck, MapPin, Plus, UserPlus,
  Briefcase, Check, ArrowRight, X, AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";
import { tienePermiso } from "@/lib/permissions";
import CuadrillaPicker from "./CuadrillaPicker";

interface Tecnico {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  cedula?: string;
  avatar_url?: string | null;
  rol_id: string;
  roles?: { nombre: string; color: string };
  ordenesLider?: any[];
  ordenesAyudante?: any[];
}

interface OrdenResumen {
  id: string;
  numero: string;
  tipo_servicio: string;
  estado: string;
  prioridad?: string;
  tipo_flujo?: string;
  descripcion_alcance?: string;
  direccion_obra?: string;
  fecha_ejecucion?: string;
  fecha_visita?: string;
  tecnico_lider_id: string | null;
  ayudantes: string[] | null;
  cliente_id?: string | null;
  cliente?: { nombre: string };
  lider_obj?: { nombre: string; avatar_url: string | null; color?: string };
  ayudantes_objs?: { id: string; nombre: string; avatar_url: string | null }[];
}

type TabActiva = "obras" | "tecnicos";

export default function CuadrillasManager() {
  const { usuario } = useUsuario();
  const permisosUsuario: string[] = usuario?.roles?.permisos || (usuario?.rol_id === "admin" ? ["*"] : []);
  const puedeAsignar = tienePermiso(permisosUsuario, "proyectos.asignar_cuadrillas");

  const [tab, setTab] = useState<TabActiva>("obras");
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filtroCuadrilla, setFiltroCuadrilla] = useState<"todas" | "sin_cuadrilla" | "con_cuadrilla">("todas");
  
  // Modales
  const [ordenParaAsignar, setOrdenParaAsignar] = useState<OrdenResumen | null>(null);
  const [tecnicoSeleccionadoParaObra, setTecnicoSeleccionadoParaObra] = useState<Tecnico | null>(null);
  const [modalElegirObra, setModalElegirObra] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);

    try {
      // 1. Cargar perfiles de técnicos y personal operativo
      const { data: usuariosData } = await supabase
        .from("perfiles")
        .select("id, nombre, email, telefono, cedula, avatar_url, rol_id, roles(nombre, color)")
        .eq("estado", "activo")
        .order("nombre");

      // 2. Cargar órdenes de trabajo activas (no completadas, no canceladas, no eliminadas)
      const { data: ordenesData } = await supabase
        .from("ordenes_trabajo")
        .select("id, numero, tipo_servicio, estado, prioridad, tipo_flujo, descripcion_alcance, direccion_obra, fecha_ejecucion, fecha_visita, tecnico_lider_id, ayudantes, cliente_id, eliminada, eliminada_at")
        .or("eliminada.is.null,eliminada.eq.false")
        .not("estado", "in", '("completado","cancelado")')
        .order("created_at", { ascending: false });

      // 3. Cargar nombres de clientes
      const { data: clientesData } = await supabase
        .from("clientes")
        .select("id, empresa, contacto")
        .limit(1000);

      const mapaCli: Record<string, string> = {};
      (clientesData || []).forEach(c => {
        mapaCli[c.id] = c.empresa ? (c.contacto ? `${c.empresa} (${c.contacto})` : c.empresa) : (c.contacto || "Cliente");
      });

      const mapaTec: Record<string, { nombre: string; avatar_url: string | null; color?: string }> = {};
      (usuariosData || []).forEach((u: any) => {
        mapaTec[u.id] = {
          nombre: u.nombre,
          avatar_url: u.avatar_url || null,
          color: u.roles?.color || "var(--ts-red)",
        };
      });

      const ordenesProcesadas: OrdenResumen[] = (ordenesData || [])
        .filter((o: any) => !o.eliminada && !o.eliminada_at)
        .map((o: any) => ({
        ...o,
        cliente: o.cliente_id && mapaCli[o.cliente_id] ? { nombre: mapaCli[o.cliente_id] } : undefined,
        lider_obj: o.tecnico_lider_id && mapaTec[o.tecnico_lider_id] ? mapaTec[o.tecnico_lider_id] : undefined,
        ayudantes_objs: (o.ayudantes || []).map((aid: string) => ({
          id: aid,
          nombre: mapaTec[aid]?.nombre || "Técnico",
          avatar_url: mapaTec[aid]?.avatar_url || null,
        })),
      }));

      setOrdenes(ordenesProcesadas);

      // Mapear órdenes activas a cada técnico
      if (usuariosData) {
        const tecnicosMapeados = (usuariosData as any[]).map(t => {
          const lider = ordenesProcesadas.filter(o => o.tecnico_lider_id === t.id);
          const ayudante = ordenesProcesadas.filter(o => o.ayudantes?.includes(t.id));
          return {
            ...t,
            ordenesLider: lider,
            ordenesAyudante: ayudante,
          };
        });
        setTecnicos(tecnicosMapeados);
      }
    } catch (err) {
      console.error("Error al cargar datos de cuadrillas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Estadísticas globales
  const totalTecnicos = tecnicos.length;
  const tecnicosEnObra = tecnicos.filter(t => ((t.ordenesLider?.length || 0) + (t.ordenesAyudante?.length || 0)) > 0).length;
  const tecnicosLibres = totalTecnicos - tecnicosEnObra;

  const totalObras = ordenes.length;
  const obrasSinCuadrilla = ordenes.filter(o => !o.tecnico_lider_id).length;
  const obrasConCuadrilla = totalObras - obrasSinCuadrilla;

  // Filtrado de Obras
  const obrasFiltradas = useMemo(() => {
    return ordenes.filter(o => {
      const q = query.toLowerCase();
      const matchQ = !q || [o.numero, o.tipo_servicio, o.cliente?.nombre, o.direccion_obra]
        .some(v => v?.toLowerCase().includes(q));

      const matchFiltro =
        filtroCuadrilla === "todas" ? true :
        filtroCuadrilla === "sin_cuadrilla" ? !o.tecnico_lider_id :
        Boolean(o.tecnico_lider_id);

      return matchQ && matchFiltro;
    });
  }, [ordenes, query, filtroCuadrilla]);

  // Filtrado de Técnicos
  const tecnicosFiltrados = useMemo(() => {
    return tecnicos.filter(t => {
      const q = query.toLowerCase();
      return (
        !q ||
        t.nombre.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.roles?.nombre || "").toLowerCase().includes(q)
      );
    });
  }, [tecnicos, query]);

  // Manejar apertura de selector de obra para un técnico específico
  const abrirSeleccionParaTecnico = (tecnico: Tecnico) => {
    setTecnicoSeleccionadoParaObra(tecnico);
    setModalElegirObra(true);
  };

  const seleccionarObraYAsignar = (ord: OrdenResumen) => {
    setModalElegirObra(false);
    setOrdenParaAsignar(ord);
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* ── Cabecera Principal ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black ts-text flex items-center gap-2">
              <HardHat className="w-5 h-5 text-[var(--ts-red)]" /> Gestión de Cuadrillas & Obras
            </h1>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              BETA
            </span>
          </div>
          <p className="text-xs ts-text-muted mt-0.5">
            Selecciona la obra que deseas cubrir y arma el equipo de técnicos asignados
          </p>
        </div>

        <div className="flex items-center gap-2">
          {puedeAsignar && (
            <button
              onClick={() => {
                setTecnicoSeleccionadoParaObra(null);
                setModalElegirObra(true);
              }}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-[var(--ts-red)] text-white hover:bg-red-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Asignar Cuadrilla a Obra</span>
            </button>
          )}

          <button
            onClick={cargarDatos}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border ts-border ts-text hover:bg-[var(--ts-surface-2)] transition-colors"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* ── Métricas Operativas ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="ts-surface rounded-2xl p-4 border ts-border">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase">Sin Cuadrilla</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">{obrasSinCuadrilla}</div>
          <div className="text-[10px] ts-text-muted mt-0.5">Obras esperando personal</div>
        </div>

        <div className="ts-surface rounded-2xl p-4 border ts-border">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 uppercase">Obras Asignadas</span>
            <Briefcase className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">{obrasConCuadrilla}</div>
          <div className="text-[10px] ts-text-muted mt-0.5">Con cuadrilla en marcha</div>
        </div>

        <div className="ts-surface rounded-2xl p-4 border ts-border">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-green-600 uppercase">Técnicos Libres</span>
            <UserCheck className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-black text-green-600 mt-1">{tecnicosLibres}</div>
          <div className="text-[10px] ts-text-muted mt-0.5">Disponibles de {totalTecnicos}</div>
        </div>

        <div className="ts-surface rounded-2xl p-4 border ts-border">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-orange-600 uppercase">En Campo Hoy</span>
            <HardHat className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-orange-600 mt-1">{tecnicosEnObra}</div>
          <div className="text-[10px] ts-text-muted mt-0.5">Técnicos activos en obra</div>
        </div>
      </div>

      {/* ── Tabs de Navegación y Barra de Búsqueda ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Pestañas */}
        <div className="flex bg-[var(--ts-surface-2)] p-1 rounded-xl border ts-border">
          <button
            onClick={() => setTab("obras")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === "obras"
                ? "bg-[var(--ts-surface)] ts-text shadow-xs"
                : "ts-text-muted hover:ts-text"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-[var(--ts-red)]" />
            <span>Obras Activas & Cuadrillas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-100 dark:bg-red-900/30 text-[var(--ts-red)] font-black">
              {totalObras}
            </span>
          </button>

          <button
            onClick={() => setTab("tecnicos")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === "tecnicos"
                ? "bg-[var(--ts-surface)] ts-text shadow-xs"
                : "ts-text-muted hover:ts-text"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span>Disponibilidad del Personal</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 font-black">
              {totalTecnicos}
            </span>
          </button>
        </div>

        {/* Buscador y Filtros */}
        <div className="flex items-center gap-2">
          {tab === "obras" && (
            <select
              value={filtroCuadrilla}
              onChange={e => setFiltroCuadrilla(e.target.value as any)}
              className="text-xs px-2.5 py-2 rounded-xl border ts-border bg-[var(--ts-surface)] ts-text focus:outline-none"
            >
              <option value="todas">Todas las obras ({totalObras})</option>
              <option value="sin_cuadrilla">⚠️ Sin cuadrilla ({obrasSinCuadrilla})</option>
              <option value="con_cuadrilla">✓ Asignadas ({obrasConCuadrilla})</option>
            </select>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ts-text-muted" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={tab === "obras" ? "Buscar obra, cliente..." : "Buscar técnico..."}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border ts-border bg-[var(--ts-surface)] ts-text focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
            />
          </div>
        </div>
      </div>

      {/* ── Contenido de la Tab Activa ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 ts-text-muted">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-[var(--ts-red)]" />
          <p className="text-xs">Cargando información operativa...</p>
        </div>
      ) : tab === "obras" ? (
        /* TAB 1: LISTADO DE OBRAS & ASIGNACIÓN DE CUADRILLAS */
        <div className="space-y-3">
          {obrasFiltradas.length === 0 ? (
            <div className="ts-surface border-2 border-dashed ts-border rounded-2xl p-12 text-center ts-text-muted">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-bold ts-text">No hay obras que coincidan con el filtro</p>
              <p className="text-xs mt-1">Todas las órdenes activas cuentan con personal o no hay registros pendientes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {obrasFiltradas.map(obra => {
                const tieneLider = Boolean(obra.tecnico_lider_id);
                const cantAyudantes = (obra.ayudantes || []).length;

                return (
                  <div
                    key={obra.id}
                    className="ts-surface rounded-2xl border ts-border p-4 flex flex-col justify-between hover:border-[var(--ts-red)]/40 transition-all shadow-xs space-y-3"
                  >
                    <div>
                      {/* Cabecera de la Obra */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black ts-text bg-[var(--ts-surface-2)] px-2 py-0.5 rounded-md border ts-border">
                              {obra.numero}
                            </span>
                            <span className="text-xs font-bold text-[var(--ts-red)]">
                              {obra.tipo_servicio || "Servicio General"}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              obra.prioridad === "urgente" ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
                              obra.prioridad === "alta" ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30" :
                              "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                            }`}>
                              {obra.prioridad || "normal"}
                            </span>
                          </div>
                          {obra.cliente?.nombre && (
                            <h3 className="text-sm font-bold ts-text mt-1.5 flex items-center gap-1.5">
                              {obra.cliente.nombre}
                            </h3>
                          )}
                        </div>

                        {/* Badge de estado de cuadrilla */}
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                          tieneLider
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 animate-pulse"
                        }`}>
                          {tieneLider ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {tieneLider ? "Cuadrilla Asignada" : "Requiere Cuadrilla"}
                        </span>
                      </div>

                      {/* Dirección y Fechas */}
                      <div className="space-y-1 text-xs ts-text-muted my-2">
                        {obra.direccion_obra && (
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[var(--ts-red)] shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{obra.direccion_obra}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-[11px]">
                          {obra.fecha_ejecucion && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Ejecución: {new Date(obra.fecha_ejecucion).toLocaleDateString("es-VE")}
                            </span>
                          )}
                          {obra.fecha_visita && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Visita: {new Date(obra.fecha_visita).toLocaleDateString("es-VE")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Alcance breve */}
                      {obra.descripcion_alcance && (
                        <p className="text-[11px] ts-text-muted bg-[var(--ts-surface-2)] p-2 rounded-lg line-clamp-2 italic">
                          "{obra.descripcion_alcance}"
                        </p>
                      )}
                    </div>

                    {/* Sección Cuadrilla Actual */}
                    <div className="pt-2 border-t ts-border">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase ts-text-muted">Personal en Obra</span>
                          {tieneLider ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Líder */}
                              <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 text-[var(--ts-red)] px-2 py-1 rounded-lg text-xs font-bold border border-red-200 dark:border-red-900/40">
                                <Star className="w-3 h-3 fill-current" />
                                <span>{obra.lider_obj?.nombre || "Líder Asignado"}</span>
                              </div>

                              {/* Ayudantes */}
                              {cantAyudantes > 0 && (
                                <span className="text-[11px] ts-text-muted flex items-center gap-1">
                                  <Users className="w-3 h-3" /> +{cantAyudantes} ayudante{cantAyudantes > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-amber-600 font-medium">
                              Sin técnico líder asignado aún
                            </p>
                          )}
                        </div>

                        {/* Botón Armar/Modificar */}
                        {puedeAsignar && (
                          <button
                            onClick={() => setOrdenParaAsignar(obra)}
                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs ${
                              tieneLider
                                ? "border ts-border ts-text hover:bg-[var(--ts-surface-2)]"
                                : "bg-[var(--ts-red)] text-white hover:bg-red-700"
                            }`}
                          >
                            <HardHat className="w-3.5 h-3.5" />
                            <span>{tieneLider ? "Modificar Cuadrilla" : "Armar Cuadrilla"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: DISPONIBILIDAD DEL PERSONAL (VISTA TÉCNICOS) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tecnicosFiltrados.map(tecnico => {
            const misionesLider = tecnico.ordenesLider || [];
            const misionesAyudante = tecnico.ordenesAyudante || [];
            const totalMisiones = misionesLider.length + misionesAyudante.length;
            const estaOcupado = totalMisiones > 0;

            return (
              <div
                key={tecnico.id}
                className="ts-surface rounded-2xl border ts-border p-4 flex flex-col justify-between hover:border-[var(--ts-red)]/50 transition-all shadow-xs"
              >
                <div>
                  {/* Cabecera del Técnico */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden shadow-xs"
                        style={{ backgroundColor: tecnico.roles?.color || "var(--ts-red)" }}
                      >
                        {tecnico.avatar_url ? (
                          <img src={tecnico.avatar_url} alt={tecnico.nombre} className="w-full h-full object-cover" />
                        ) : (
                          tecnico.nombre.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold ts-text">{tecnico.nombre}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${tecnico.roles?.color || "#c9242b"}20`,
                              color: tecnico.roles?.color || "#c9242b"
                            }}
                          >
                            {tecnico.roles?.nombre || tecnico.rol_id}
                          </span>
                          {tecnico.cedula && (
                            <span className="text-[10px] ts-text-muted font-mono">{tecnico.cedula}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-black uppercase px-2 py-1 rounded-full shrink-0 ${
                        estaOcupado
                          ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 font-bold"
                          : "bg-green-100 dark:bg-green-900/30 text-green-600 font-bold"
                      }`}
                    >
                      {estaOcupado ? "En Obra" : "Libre"}
                    </span>
                  </div>

                  {/* Teléfono y WhatsApp */}
                  {tecnico.telefono && (
                    <div className="flex items-center justify-between py-2 border-y ts-border text-xs mb-3">
                      <span className="ts-text-muted flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {tecnico.telefono}
                      </span>
                      <a
                        href={`https://wa.me/${tecnico.telefono.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-green-600 hover:underline"
                      >
                        WhatsApp
                      </a>
                    </div>
                  )}

                  {/* Misiones Asignadas */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-[var(--ts-text-muted)] tracking-wider">
                      Misiones Asignadas ({totalMisiones})
                    </p>

                    {totalMisiones === 0 ? (
                      <p className="text-xs ts-text-muted italic py-1">Sin órdenes de trabajo activas hoy</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {misionesLider.map((ord: any) => (
                          <div
                            key={ord.id}
                            className="p-2 rounded-xl bg-[var(--ts-surface-2)] border ts-border text-xs flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1 font-mono font-bold ts-text">
                                <Star className="w-3 h-3 text-[var(--ts-red)] shrink-0" />
                                <span>{ord.numero}</span>
                                <span className="text-[10px] text-[var(--ts-red)] truncate">· {ord.tipo_servicio}</span>
                              </div>
                              {ord.cliente?.nombre && (
                                <p className="text-[10px] ts-text-muted truncate">{ord.cliente.nombre}</p>
                              )}
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 font-bold shrink-0">
                              Líder
                            </span>
                          </div>
                        ))}

                        {misionesAyudante.map((ord: any) => (
                          <div
                            key={ord.id}
                            className="p-2 rounded-xl bg-[var(--ts-surface-2)] border ts-border text-xs flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1 font-mono font-bold ts-text">
                                <Users className="w-3 h-3 text-blue-500 shrink-0" />
                                <span>{ord.numero}</span>
                                <span className="text-[10px] text-blue-500 truncate">· {ord.tipo_servicio}</span>
                              </div>
                              {ord.cliente?.nombre && (
                                <p className="text-[10px] ts-text-muted truncate">{ord.cliente.nombre}</p>
                              )}
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold shrink-0">
                              Ayudante
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Tarjeta: Asignar a Obra */}
                <div className="mt-4 pt-3 border-t ts-border flex justify-between items-center text-xs">
                  <span className="text-[11px] ts-text-muted">
                    {totalMisiones} obra{totalMisiones !== 1 ? "s" : ""} asignada{totalMisiones !== 1 ? "s" : ""}
                  </span>
                  {puedeAsignar && ordenes.length > 0 && (
                    <button
                      onClick={() => abrirSeleccionParaTecnico(tecnico)}
                      className="text-xs font-bold text-[var(--ts-red)] hover:underline flex items-center gap-1"
                    >
                      <HardHat className="w-3 h-3" /> Asignar a Obra
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: Selector de Obra para Asignar ── */}
      {modalElegirObra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="ts-surface rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl border ts-border">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 border-b ts-border">
              <div>
                <h3 className="text-base font-black ts-text flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[var(--ts-red)]" />
                  Seleccionar Obra para Asignar
                </h3>
                {tecnicoSeleccionadoParaObra ? (
                  <p className="text-xs ts-text-muted mt-0.5">
                    Elige a qué obra deseas integrar a <strong>{tecnicoSeleccionadoParaObra.nombre}</strong>
                  </p>
                ) : (
                  <p className="text-xs ts-text-muted mt-0.5">
                    Elige una obra activa para configurar su cuadrilla técnica
                  </p>
                )}
              </div>
              <button
                onClick={() => setModalElegirObra(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--ts-surface-2)] ts-text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Obras Disponibles */}
            <div className="p-5 overflow-y-auto space-y-2 flex-1">
              {ordenes.length === 0 ? (
                <div className="text-center py-10 ts-text-muted">
                  <p className="text-xs">No hay órdenes de trabajo activas en este momento.</p>
                </div>
              ) : (
                ordenes.map(ord => {
                  const tieneLider = Boolean(ord.tecnico_lider_id);
                  return (
                    <div
                      key={ord.id}
                      onClick={() => seleccionarObraYAsignar(ord)}
                      className="p-3.5 rounded-xl border ts-border bg-[var(--ts-surface)] hover:border-[var(--ts-red)] hover:bg-[var(--ts-surface-2)] cursor-pointer transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold ts-text">{ord.numero}</span>
                          <span className="text-xs font-bold text-[var(--ts-red)]">· {ord.tipo_servicio}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            tieneLider
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30"
                          }`}>
                            {tieneLider ? "Con Cuadrilla" : "Sin Cuadrilla"}
                          </span>
                        </div>
                        {ord.cliente?.nombre && (
                          <p className="text-xs font-medium ts-text mt-1">{ord.cliente.nombre}</p>
                        )}
                        {ord.direccion_obra && (
                          <p className="text-[11px] ts-text-muted truncate mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[var(--ts-red)] shrink-0" />
                            {ord.direccion_obra}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[var(--ts-red)] text-white group-hover:bg-red-700 transition-colors flex items-center gap-1">
                          <span>Elegir</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t ts-border flex justify-end">
              <button
                onClick={() => setModalElegirObra(false)}
                className="text-xs px-4 py-2 rounded-xl border ts-border ts-text hover:bg-[var(--ts-surface-2)] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal CuadrillaPicker ── */}
      {ordenParaAsignar && (
        <CuadrillaPicker
          orden={ordenParaAsignar}
          onClose={() => {
            setOrdenParaAsignar(null);
            cargarDatos();
          }}
        />
      )}
    </div>
  );
}
