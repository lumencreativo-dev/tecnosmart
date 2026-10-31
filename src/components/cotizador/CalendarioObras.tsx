// ─────────────────────────────────────────────────────────────────────────────
// src/components/cotizador/CalendarioObras.tsx
// Calendario semanal/mensual de órdenes de trabajo — Sprint 8
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin,
  User, Wrench, AlertTriangle, Loader2, Eye, Plus, RefreshCw
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
const DIAS_SEMANA_LUNES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

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

  const cargar = useCallback(async () => {
    setLoading(true);

    // Cargar órdenes directamente sin depender de foreign keys rígidas (excluyendo órdenes en papelera/eliminadas)
    const [{ data: ordData, error: ordErr }, { data: listaPerfiles }, { data: listaClientes }] = await Promise.all([
      supabase
        .from("ordenes_trabajo")
        .select("*")
        .or("eliminada.is.null,eliminada.eq.false")
        .neq("estado", "cancelado")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase.from("perfiles").select("id, nombre").limit(500),
      supabase.from("clientes").select("id, empresa, contacto").limit(1000),
    ]);

    if (ordErr) {
      console.error("Error al cargar ordenes en calendario:", ordErr);
    }

    if (ordData) {
      const mapaPerf: Record<string, string> = {};
      (listaPerfiles || []).forEach(p => { mapaPerf[p.id] = p.nombre; });

      const mapaCli: Record<string, string> = {};
      (listaClientes || []).forEach(c => {
        mapaCli[c.id] = c.empresa ? (c.contacto ? `${c.empresa} (${c.contacto})` : c.empresa) : (c.contacto || "Cliente");
      });

      const procesados: Evento[] = (ordData as any[])
        .filter(o => !o.eliminada && !o.eliminada_at)
        .map(o => ({
          ...o,
          tecnico_lider: o.tecnico_lider_id && mapaPerf[o.tecnico_lider_id] ? { nombre: mapaPerf[o.tecnico_lider_id] } : null,
          cliente: o.cliente_id && mapaCli[o.cliente_id] ? { nombre: mapaCli[o.cliente_id] } : null,
        }));

      setOrdenes(procesados);
      setSeleccionado(prev => (prev && procesados.some(p => p.id === prev.id) ? prev : null));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Agrupar eventos por fecha (YYYY-MM-DD)
  const eventosPorDia = useMemo(() => {
    const mapa: Record<string, Evento[]> = {};
    ordenes.forEach(o => {
      // Priorizar fechas reales programadas (ejecución o inspección/visita)
      const fechas = [o.fecha_ejecucion, o.fecha_visita].filter(Boolean) as string[];
      // Solo si la orden no tiene ninguna fecha fijada aún, se toma la de creación como referencia
      const fechasFinales = fechas.length > 0 ? fechas : [(o as any).created_at].filter(Boolean) as string[];

      fechasFinales.forEach(f => {
        try {
          const dia = f.slice(0, 10);
          if (!mapa[dia]) mapa[dia] = [];
          if (!mapa[dia].find(x => x.id === o.id)) mapa[dia].push(o);
        } catch (e) {}
      });
    });
    return mapa;
  }, [ordenes]);

  // ── Días del Mes ──
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

  // ── Días de la Semana Actual (Lunes a Domingo) ──
  const diasSemanaActual = useMemo(() => {
    const d = new Date(fechaActual);
    const diaSem = d.getDay(); // 0 es Domingo
    const diffALunes = diaSem === 0 ? -6 : 1 - diaSem;
    const lunes = new Date(d);
    lunes.setDate(d.getDate() + diffALunes);

    const dias = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(lunes);
      fecha.setDate(lunes.getDate() + i);
      const isoDia = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
      dias.push({
        fecha,
        numero: fecha.getDate(),
        nombreDia: DIAS_SEMANA_LUNES[i],
        isoDia,
      });
    }
    return dias;
  }, [fechaActual]);

  const hoy = new Date();
  const esHoy = (dia: number, mes?: number, anio?: number) =>
    dia === hoy.getDate() &&
    (mes !== undefined ? mes : fechaActual.getMonth()) === hoy.getMonth() &&
    (anio !== undefined ? anio : fechaActual.getFullYear()) === hoy.getFullYear();

  const keyDia = (dia: number) => {
    const m = String(fechaActual.getMonth() + 1).padStart(2, "0");
    const d = String(dia).padStart(2, "0");
    return `${fechaActual.getFullYear()}-${m}-${d}`;
  };

  const navegar = (delta: number) => {
    setFechaActual(prev => {
      const nueva = new Date(prev);
      if (vistaMode === "mes") {
        nueva.setMonth(prev.getMonth() + delta);
      } else {
        nueva.setDate(prev.getDate() + delta * 7);
      }
      return nueva;
    });
  };

  // ── Render: Vista Mensual ───────────────────────────────────────────────────
  const VistaMes = () => (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center text-xs font-bold ts-text-muted py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {diasDelMes.map((dia, idx) => {
          if (!dia) return <div key={`vacio-${idx}`} />;
          const key = keyDia(dia);
          const eventos = eventosPorDia[key] || [];
          const hoyFlag = esHoy(dia);

          return (
            <div
              key={key}
              className={`min-h-[85px] rounded-xl p-1.5 border transition-colors ${
                hoyFlag
                  ? "border-[var(--ts-red)] bg-red-50/70 dark:bg-red-900/10"
                  : "ts-border hover:bg-[var(--ts-surface-2)]"
              }`}
            >
              <span className={`text-xs font-bold block mb-1 ${hoyFlag ? "text-[var(--ts-red)]" : "ts-text"}`}>
                {dia}
              </span>
              <div className="space-y-1">
                {eventos.slice(0, 3).map(e => (
                  <button
                    key={e.id}
                    onClick={() => setSeleccionado(e)}
                    className={`w-full text-left text-[11px] px-1.5 py-1 rounded-lg border truncate transition-all shadow-2xs font-medium ${ESTADO_COLORES[e.estado] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                  >
                    <span className="font-bold">{e.numero}</span> · {e.tipo_servicio || "Obra"}
                  </button>
                ))}
                {eventos.length > 3 && (
                  <p className="text-[10px] ts-text-muted pl-1">+{eventos.length - 3} más</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Render: Vista Semanal ───────────────────────────────────────────────────
  const VistaSemana = () => (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
        {diasSemanaActual.map(d => {
          const eventos = eventosPorDia[d.isoDia] || [];
          const hoyFlag = esHoy(d.numero, d.fecha.getMonth(), d.fecha.getFullYear());

          return (
            <div
              key={d.isoDia}
              className={`rounded-2xl border p-2.5 min-h-[300px] flex flex-col ${
                hoyFlag
                  ? "border-[var(--ts-red)] bg-red-50/50 dark:bg-red-900/10 shadow-2xs"
                  : "ts-border ts-surface"
              }`}
            >
              {/* Header Día */}
              <div className="pb-2 mb-2 border-b ts-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-black ts-text-muted">{d.nombreDia}</span>
                  <div className={`text-base font-black ${hoyFlag ? "text-[var(--ts-red)]" : "ts-text"}`}>
                    {d.numero}
                  </div>
                </div>
                {hoyFlag && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-[var(--ts-red)] text-white">
                    Hoy
                  </span>
                )}
              </div>

              {/* Lista de eventos del día */}
              <div className="flex-1 space-y-1.5 overflow-y-auto">
                {eventos.map(e => (
                  <button
                    key={e.id}
                    onClick={() => setSeleccionado(e)}
                    className={`w-full text-left p-2 rounded-xl border transition-all text-xs shadow-2xs ${ESTADO_COLORES[e.estado] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                  >
                    <div className="font-black text-[11px] truncate">{e.numero}</div>
                    <div className="text-[10px] font-medium truncate">{e.tipo_servicio || "Obra"}</div>
                    {e.cliente?.nombre && (
                      <div className="text-[9px] opacity-80 truncate mt-0.5">{e.cliente.nombre}</div>
                    )}
                  </button>
                ))}

                {eventos.length === 0 && (
                  <div className="h-24 flex items-center justify-center text-[11px] ts-text-muted italic border border-dashed ts-border rounded-xl">
                    Sin obras
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Render: Sidebar Detalle Evento ─────────────────────────────────────────
  const DetalleEvento = () => {
    if (!seleccionado) return (
      <div className="flex flex-col items-center justify-center h-full py-16 ts-text-muted">
        <CalendarIcon className="w-10 h-10 mb-2 opacity-30" />
        <p className="text-xs font-medium">Selecciona una orden de trabajo</p>
        <p className="text-[11px] mt-0.5">Haz clic sobre un evento para ver su detalle</p>
      </div>
    );

    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-mono font-bold text-[var(--ts-red)]">{seleccionado.numero}</span>
            <h3 className="text-base font-black ts-text">{seleccionado.tipo_servicio || "Orden de Trabajo"}</h3>
          </div>
          <button onClick={() => setSeleccionado(null)} className="p-1 rounded hover:bg-[var(--ts-surface-2)] ts-text-muted">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <span className={`inline-block text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${ESTADO_COLORES[seleccionado.estado]}`}>
          {seleccionado.estado}
        </span>

        <div className="space-y-3 text-xs border-y ts-border py-3">
          {seleccionado.cliente?.nombre && (
            <div className="flex items-start gap-2">
              <User className="w-3.5 h-3.5 ts-text-muted mt-0.5 shrink-0" />
              <div>
                <p className="ts-text-muted text-[10px] font-bold uppercase">Cliente</p>
                <p className="ts-text font-bold">{seleccionado.cliente.nombre}</p>
              </div>
            </div>
          )}

          {seleccionado.tecnico_lider?.nombre && (
            <div className="flex items-start gap-2">
              <Wrench className="w-3.5 h-3.5 ts-text-muted mt-0.5 shrink-0" />
              <div>
                <p className="ts-text-muted text-[10px] font-bold uppercase">Técnico Líder</p>
                <p className="ts-text font-bold">{seleccionado.tecnico_lider.nombre}</p>
              </div>
            </div>
          )}

          {seleccionado.fecha_visita && (
            <div className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
              <div>
                <p className="ts-text-muted text-[10px] font-bold uppercase">Visita Técnica / Inspección</p>
                <p className="ts-text">{new Date(seleccionado.fecha_visita).toLocaleString("es-VE")}</p>
              </div>
            </div>
          )}

          {seleccionado.fecha_ejecucion && (
            <div className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <p className="ts-text-muted text-[10px] font-bold uppercase">Fecha de Ejecución</p>
                <p className="ts-text font-bold text-orange-600">{new Date(seleccionado.fecha_ejecucion).toLocaleString("es-VE")}</p>
              </div>
            </div>
          )}

          {seleccionado.direccion_obra && (
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 ts-text-muted mt-0.5 shrink-0" />
              <div>
                <p className="ts-text-muted text-[10px] font-bold uppercase">Dirección de la Obra</p>
                <p className="ts-text">{seleccionado.direccion_obra}</p>
              </div>
            </div>
          )}
        </div>

        {seleccionado.descripcion_alcance && (
          <div>
            <p className="text-[10px] font-black ts-text-muted uppercase mb-1">Alcance Acordado</p>
            <p className="text-xs ts-text bg-[var(--ts-surface-2)] p-3 rounded-xl whitespace-pre-line leading-relaxed">
              {seleccionado.descripcion_alcance}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black ts-text flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[var(--ts-red)]" /> Calendario de Obras
            </h1>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              BETA
            </span>
          </div>
          <p className="text-xs ts-text-muted mt-0.5">Programación y hoja de ruta de cuadrillas técnicas en campo</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Vista toggle: Mes / Semana */}
          <div className="flex rounded-xl border ts-border overflow-hidden text-xs bg-[var(--ts-surface)]">
            <button
              onClick={() => setVistaMode("mes")}
              className={`px-3 py-2 font-bold transition-colors ${
                vistaMode === "mes" ? "bg-[var(--ts-red)] text-white shadow-xs" : "ts-text-muted hover:bg-[var(--ts-surface-2)]"
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setVistaMode("semana")}
              className={`px-3 py-2 font-bold transition-colors ${
                vistaMode === "semana" ? "bg-[var(--ts-red)] text-white shadow-xs" : "ts-text-muted hover:bg-[var(--ts-surface-2)]"
              }`}
            >
              Semana
            </button>
          </div>

          <button
            onClick={cargar}
            className="p-2 rounded-xl border ts-border ts-text hover:bg-[var(--ts-surface-2)] transition-colors"
            title="Recargar eventos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Barra de Navegación de Fecha */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navegar(-1)}
          className="p-2 rounded-xl border ts-border ts-text hover:bg-[var(--ts-surface-2)] transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <h2 className="text-sm font-black ts-text">
          {vistaMode === "mes" ? (
            `${MESES[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`
          ) : (
            `Semana del ${diasSemanaActual[0].numero} al ${diasSemanaActual[6].numero} de ${MESES[diasSemanaActual[0].fecha.getMonth()]} ${diasSemanaActual[0].fecha.getFullYear()}`
          )}
        </h2>

        <button
          onClick={() => navegar(1)}
          className="p-2 rounded-xl border ts-border ts-text hover:bg-[var(--ts-surface-2)] transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => setFechaActual(new Date())}
          className="text-xs font-bold px-3 py-1.5 rounded-xl border ts-border ts-text hover:bg-[var(--ts-surface-2)] ml-1"
        >
          Hoy
        </button>

        <span className="text-xs ts-text-muted">·</span>
        <span className="text-xs ts-text-muted font-medium">{ordenes.length} órdenes registradas</span>
      </div>

      {/* Leyenda de colores */}
      <div className="flex flex-wrap gap-2">
        {[
          { estado: "programado", label: "Programado" },
          { estado: "inspeccion", label: "Inspección" },
          { estado: "en_ejecucion", label: "En Ejecución" },
          { estado: "completado", label: "Completado" },
        ].map(({ estado, label }) => (
          <span key={estado} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ESTADO_COLORES[estado]}`}>
            {label}
          </span>
        ))}
      </div>

      {/* Main Layout: Calendario + Detalle */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin ts-text-muted" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          {/* Contenedor Calendario */}
          <div className="ts-surface rounded-2xl border ts-border p-4 shadow-xs">
            {vistaMode === "mes" ? <VistaMes /> : <VistaSemana />}
          </div>

          {/* Panel Lateral Detalle */}
          <div className="ts-surface rounded-2xl border ts-border p-4 shadow-xs">
            <DetalleEvento />
          </div>
        </div>
      )}
    </div>
  );
}
