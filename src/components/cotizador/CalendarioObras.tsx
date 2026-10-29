// ─────────────────────────────────────────────────────────────────────────────
// src/components/cotizador/CalendarioObras.tsx
// Calendario semanal/mensual de órdenes de trabajo — Sprint 8
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar, ChevronLeft, ChevronRight, Clock, MapPin,
  User, Wrench, AlertTriangle, Loader2, Eye, Plus
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";
import { tienePermiso } from "@/lib/permissions";

interface Evento {
  id: string;
  numero: string;
  tipo_servicio: string | null;
  descripcion_alcance: string | null;
  direccion_obra: string | null;
  estado: string;
  prioridad: string;
  fecha_ejecucion: string | null;
  fecha_visita: string | null;
  tecnico_lider?: { nombre: string } | null;
  cliente?: { nombre: string } | null;
}

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const ESTADO_COLORES: Record<string, string> = {
  pendiente:    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900",
  programado:   "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  inspeccion:   "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900",
  en_ejecucion: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900",
  completado:   "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900",
  cancelado:    "bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700",
};

export default function CalendarioObras() {
  const { usuario } = useUsuario();
  const permisosUsuario: string[] = usuario?.roles?.permisos || (usuario?.rol_id === "admin" ? ["*"] : []);
  const puedeCrear = tienePermiso(permisosUsuario, "proyectos.crear_ordenes");

  const [ordenes, setOrdenes] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [fechaActual, setFechaActual] = useState(new Date());
  const [vistaMode, setVistaMode] = useState<"mes" | "semana">("mes");
  const [seleccionado, setSeleccionado] = useState<Evento | null>(null);

  const cargar = async () => {
    setLoading(true);
    // Cargar órdenes del mes actual ±1 mes
    const inicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1).toISOString();
    const fin    = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 2, 0).toISOString();

    const { data } = await supabase
      .from("ordenes_trabajo")
      .select(`
        id, numero, tipo_servicio, descripcion_alcance, direccion_obra,
        estado, prioridad, fecha_ejecucion, fecha_visita,
        tecnico_lider:perfiles!ordenes_trabajo_tecnico_lider_id_fkey(nombre),
        cliente:perfiles!ordenes_trabajo_cliente_id_fkey(nombre)
      `)
      .or(`fecha_ejecucion.gte.${inicio},fecha_visita.gte.${inicio}`)
      .or(`fecha_ejecucion.lte.${fin},fecha_visita.lte.${fin}`)
      .neq("estado", "cancelado")
      .order("fecha_ejecucion");

    if (data) setOrdenes(data as unknown as Evento[]);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [fechaActual]);

  // Agrupar eventos por fecha (YYYY-MM-DD)
  const eventosPorDia = useMemo(() => {
    const mapa: Record<string, Evento[]> = {};
    ordenes.forEach(o => {
      const fechas = [o.fecha_ejecucion, o.fecha_visita].filter(Boolean) as string[];
      fechas.forEach(f => {
        const dia = f.slice(0, 10);
        if (!mapa[dia]) mapa[dia] = [];
        if (!mapa[dia].find(x => x.id === o.id)) mapa[dia].push(o);
      });
    });
    return mapa;
  }, [ordenes]);

  // Construir días del mes
  const diasDelMes = useMemo(() => {
    const year = fechaActual.getFullYear();
    const month = fechaActual.getMonth();
    const primerDia = new Date(year, month, 1).getDay();
    const totalDias = new Date(year, month + 1, 0).getDate();
    const dias: (number | null)[] = [];

    for (let i = 0; i < primerDia; i++) dias.push(null);
    for (let d = 1; d <= totalDias; d++) dias.push(d);
    return dias;
  }, [fechaActual]);

  const hoy = new Date();
  const esHoy = (dia: number) =>
    dia === hoy.getDate() &&
    fechaActual.getMonth() === hoy.getMonth() &&
    fechaActual.getFullYear() === hoy.getFullYear();

  const keyDia = (dia: number) => {
    const m = String(fechaActual.getMonth() + 1).padStart(2, "0");
    const d = String(dia).padStart(2, "0");
    return `${fechaActual.getFullYear()}-${m}-${d}`;
  };

  const navegar = (delta: number) => {
    setFechaActual(prev => {
      const nueva = new Date(prev);
      if (vistaMode === "mes") nueva.setMonth(prev.getMonth() + delta);
      else nueva.setDate(prev.getDate() + delta * 7);
      return nueva;
    });
  };

  // ── Vista Mensual ─────────────────────────────────────────────────────────
  const VistaMes = () => (
    <div>
      {/* Cabecera días de semana */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center text-xs font-bold ts-text-muted py-2">{d}</div>
        ))}
      </div>

      {/* Cuadrícula */}
      <div className="grid grid-cols-7 gap-1">
        {diasDelMes.map((dia, idx) => {
          if (!dia) return <div key={`vacio-${idx}`} />;
          const key = keyDia(dia);
          const eventos = eventosPorDia[key] || [];
          const hoyFlag = esHoy(dia);

          return (
            <div
              key={key}
              className={`min-h-[80px] rounded-xl p-1.5 border transition-colors ${
                hoyFlag
                  ? "border-[var(--ts-red)] bg-red-50 dark:bg-red-900/10"
                  : "ts-border hover:bg-[var(--ts-surface-2)]"
              }`}
            >
              <span className={`text-xs font-bold block mb-1 ${hoyFlag ? "text-[var(--ts-red)]" : "ts-text"}`}>
                {dia}
              </span>
              <div className="space-y-0.5">
                {eventos.slice(0, 3).map(e => (
                  <button
                    key={e.id}
                    onClick={() => setSeleccionado(e)}
                    className={`w-full text-left text-xs px-1.5 py-0.5 rounded border truncate transition-colors ${ESTADO_COLORES[e.estado] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                  >
                    {e.tipo_servicio || e.numero}
                  </button>
                ))}
                {eventos.length > 3 && (
                  <p className="text-xs ts-text-muted pl-1">+{eventos.length - 3} más</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Sidebar detalle evento ────────────────────────────────────────────────
  const DetalleEvento = () => {
    if (!seleccionado) return (
      <div className="flex flex-col items-center justify-center h-full ts-text-muted">
        <Calendar className="w-10 h-10 mb-2 opacity-30" />
        <p className="text-xs">Selecciona una orden para ver el detalle</p>
      </div>
    );

    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-mono ts-text-muted">{seleccionado.numero}</span>
            <h3 className="text-sm font-black ts-text">{seleccionado.tipo_servicio || "Orden de Trabajo"}</h3>
          </div>
          <button onClick={() => setSeleccionado(null)} className="p-1 rounded hover:bg-[var(--ts-surface-2)] ts-text-muted">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${ESTADO_COLORES[seleccionado.estado]}`}>
          {seleccionado.estado}
        </span>

        <div className="space-y-2 text-xs">
          {seleccionado.cliente?.nombre && (
            <div className="flex items-start gap-2">
              <User className="w-3.5 h-3.5 ts-text-muted mt-0.5 shrink-0" />
              <div>
                <p className="ts-text-muted">Cliente</p>
                <p className="ts-text font-medium">{seleccionado.cliente.nombre}</p>
              </div>
            </div>
          )}
          {seleccionado.tecnico_lider?.nombre && (
            <div className="flex items-start gap-2">
              <Wrench className="w-3.5 h-3.5 ts-text-muted mt-0.5 shrink-0" />
              <div>
                <p className="ts-text-muted">Técnico Líder</p>
                <p className="ts-text font-medium">{seleccionado.tecnico_lider.nombre}</p>
              </div>
            </div>
          )}
          {seleccionado.fecha_visita && (
            <div className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
              <div>
                <p className="ts-text-muted">Visita técnica</p>
                <p className="ts-text">{new Date(seleccionado.fecha_visita).toLocaleString("es-VE")}</p>
              </div>
            </div>
          )}
          {seleccionado.fecha_ejecucion && (
            <div className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <p className="ts-text-muted">Ejecución</p>
                <p className="ts-text">{new Date(seleccionado.fecha_ejecucion).toLocaleString("es-VE")}</p>
              </div>
            </div>
          )}
          {seleccionado.direccion_obra && (
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 ts-text-muted mt-0.5 shrink-0" />
              <p className="ts-text">{seleccionado.direccion_obra}</p>
            </div>
          )}
        </div>

        {seleccionado.descripcion_alcance && (
          <div>
            <p className="text-xs font-bold ts-text-muted uppercase mb-1">Alcance</p>
            <p className="text-xs ts-text bg-[var(--ts-surface-2)] p-2 rounded-lg">{seleccionado.descripcion_alcance}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black ts-text flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--ts-red)]" /> Calendario de Obras
          </h1>
          <p className="text-xs ts-text-muted">Vista de operaciones en campo</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Vista toggle */}
          <div className="flex rounded-lg border ts-border overflow-hidden text-xs">
            <button onClick={() => setVistaMode("mes")} className={`px-3 py-1.5 transition-colors ${vistaMode === "mes" ? "bg-[var(--ts-red)] text-white" : "ts-text-muted hover:bg-[var(--ts-surface-2)]"}`}>Mes</button>
            <button onClick={() => setVistaMode("semana")} className={`px-3 py-1.5 transition-colors ${vistaMode === "semana" ? "bg-[var(--ts-red)] text-white" : "ts-text-muted hover:bg-[var(--ts-surface-2)]"}`}>Semana</button>
          </div>
        </div>
      </div>

      {/* Navegación de mes */}
      <div className="flex items-center gap-3">
        <button onClick={() => navegar(-1)} className="p-1.5 rounded-lg border ts-border ts-text-muted hover:bg-[var(--ts-surface-2)]">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-bold ts-text">
          {MESES[fechaActual.getMonth()]} {fechaActual.getFullYear()}
        </h2>
        <button onClick={() => navegar(1)} className="p-1.5 rounded-lg border ts-border ts-text-muted hover:bg-[var(--ts-surface-2)]">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => setFechaActual(new Date())}
          className="text-xs px-2 py-1 rounded-lg border ts-border ts-text-muted hover:bg-[var(--ts-surface-2)] ml-1"
        >
          Hoy
        </button>
        <span className="text-xs ts-text-muted">·</span>
        <span className="text-xs ts-text-muted">{ordenes.length} órdenes en el período</span>
      </div>

      {/* Leyenda de colores */}
      <div className="flex flex-wrap gap-2">
        {[
          { estado: "programado", label: "Programado" },
          { estado: "inspeccion", label: "Inspección" },
          { estado: "en_ejecucion", label: "En Ejecución" },
          { estado: "completado", label: "Completado" },
        ].map(({ estado, label }) => (
          <span key={estado} className={`text-xs px-2 py-0.5 rounded-full border ${ESTADO_COLORES[estado]}`}>{label}</span>
        ))}
      </div>

      {/* Main Layout */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin ts-text-muted" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          {/* Calendario */}
          <div className="ts-surface rounded-2xl border ts-border p-4">
            <VistaMes />
          </div>

          {/* Panel lateral detalle */}
          <div className="ts-surface rounded-2xl border ts-border p-4">
            <DetalleEvento />
          </div>
        </div>
      )}
    </div>
  );
}
