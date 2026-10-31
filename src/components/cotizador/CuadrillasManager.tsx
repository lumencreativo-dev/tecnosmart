// ─────────────────────────────────────────────────────────────────────────────
// src/components/cotizador/CuadrillasManager.tsx
// Panel Maestro de Cuadrillas & Técnicos de Campo — Sprint 8
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  HardHat, Users, UserCheck, Search, Phone, Calendar,
  Wrench, CheckCircle2, Clock, AlertTriangle, Star, RefreshCw,
  ExternalLink, Eye, ShieldCheck, MapPin
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
  direccion_obra?: string;
  fecha_ejecucion?: string;
  tecnico_lider_id?: string;
  ayudantes?: string[];
  cliente?: { nombre: string };
}

export default function CuadrillasManager() {
  const { usuario } = useUsuario();
  const permisosUsuario: string[] = usuario?.roles?.permisos || (usuario?.rol_id === "admin" ? ["*"] : []);
  const puedeAsignar = tienePermiso(permisosUsuario, "proyectos.asignar_cuadrillas");

  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [ordenParaAsignar, setOrdenParaAsignar] = useState<any | null>(null);

  const cargarDatos = async () => {
    setLoading(true);

    // 1. Cargar perfiles de técnicos y personal operativo
    const { data: usuariosData } = await supabase
      .from("perfiles")
      .select("id, nombre, email, telefono, cedula, avatar_url, rol_id, roles(nombre, color)")
      .eq("estado", "activo")
      .order("nombre");

    // 2. Cargar órdenes de trabajo activas
    const { data: ordenesData } = await supabase
      .from("ordenes_trabajo")
      .select("id, numero, tipo_servicio, estado, direccion_obra, fecha_ejecucion, tecnico_lider_id, ayudantes, cliente_id")
      .neq("estado", "cancelado")
      .order("created_at", { ascending: false });

    // 3. Cargar nombres de clientes para las órdenes
    const { data: clientesData } = await supabase
      .from("clientes")
      .select("id, nombre")
      .limit(1000);
    
    const mapaCli: Record<string, string> = {};
    (clientesData || []).forEach(c => { mapaCli[c.id] = c.nombre; });

    const ordenesProcesadas: OrdenResumen[] = (ordenesData || []).map(o => ({
      ...o,
      cliente: o.cliente_id && mapaCli[o.cliente_id] ? { nombre: mapaCli[o.cliente_id] } : undefined
    }));

    setOrdenes(ordenesProcesadas);

    // Mapear órdenes a cada técnico
    if (usuariosData) {
      const tecnicosMapeados = usuariosData.map((t: any) => {
        const lider = ordenesProcesadas.filter(o => o.tecnico_lider_id === t.id && o.estado !== "completado");
        const ayudante = ordenesProcesadas.filter(o => o.ayudantes?.includes(t.id) && o.estado !== "completado");
        return {
          ...t,
          ordenesLider: lider,
          ordenesAyudante: ayudante,
        };
      });
      setTecnicos(tecnicosMapeados);
    }

    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const tecnicosFiltrados = useMemo(() => {
    return tecnicos.filter(t => {
      const q = query.toLowerCase();
      return (
        t.nombre.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.roles?.nombre || "").toLowerCase().includes(q)
      );
    });
  }, [tecnicos, query]);

  // Estadísticas
  const totalTecnicos = tecnicos.length;
  const tecnicosEnObra = tecnicos.filter(t => ((t.ordenesLider?.length || 0) + (t.ordenesAyudante?.length || 0)) > 0).length;
  const tecnicosLibres = totalTecnicos - tecnicosEnObra;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black ts-text flex items-center gap-2">
              <HardHat className="w-5 h-5 text-[var(--ts-red)]" /> Cuadrillas & Técnicos
            </h1>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              BETA
            </span>
          </div>
          <p className="text-xs ts-text-muted mt-0.5">
            Disponibilidad de personal en campo y asignación de obras
          </p>
        </div>

        <button
          onClick={cargarDatos}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border ts-border ts-text hover:bg-[var(--ts-surface-2)] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Métricas de Cuadrillas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="ts-surface rounded-2xl p-4 border ts-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ts-text-muted uppercase">Equipo Técnico</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black ts-text mt-1">{totalTecnicos}</div>
          <div className="text-[11px] ts-text-muted mt-0.5">Personal registrado en sistema</div>
        </div>

        <div className="ts-surface rounded-2xl p-4 border ts-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-600 uppercase">En Obra Hoy</span>
            <HardHat className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-orange-600 mt-1">{tecnicosEnObra}</div>
          <div className="text-[11px] ts-text-muted mt-0.5">Con misiones activas asignadas</div>
        </div>

        <div className="ts-surface rounded-2xl p-4 border ts-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-green-600 uppercase">Disponibles</span>
            <UserCheck className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-black text-green-600 mt-1">{tecnicosLibres}</div>
          <div className="text-[11px] ts-text-muted mt-0.5">Listos para programar servicios</div>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ts-text-muted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar técnico por nombre, rol o email..."
            className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border ts-border bg-[var(--ts-surface)] ts-text focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
          />
        </div>
      </div>

      {/* Grid de Técnicos */}
      {loading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-8 h-8 animate-spin ts-text-muted" />
        </div>
      ) : (
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
                {/* Cabecera del Técnico */}
                <div>
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
                          ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600"
                          : "bg-green-100 dark:bg-green-900/30 text-green-600"
                      }`}
                    >
                      {estaOcupado ? "En Obra" : "Libre"}
                    </span>
                  </div>

                  {/* Teléfono y Contacto rápido */}
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
                      Misiones Activas ({totalMisiones})
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

                {/* Footer Tarjeta */}
                <div className="mt-4 pt-3 border-t ts-border flex justify-between items-center text-xs">
                  <span className="text-[11px] ts-text-muted">
                    {totalMisiones} obra{totalMisiones !== 1 ? "s" : ""} asignada{totalMisiones !== 1 ? "s" : ""}
                  </span>
                  {puedeAsignar && ordenes.length > 0 && (
                    <button
                      onClick={() => setOrdenParaAsignar(ordenes[0])}
                      className="text-xs font-bold text-[var(--ts-red)] hover:underline flex items-center gap-1"
                    >
                      <HardHat className="w-3 h-3" /> Asignar Obra
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal CuadrillaPicker si se invoca desde aquí */}
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
