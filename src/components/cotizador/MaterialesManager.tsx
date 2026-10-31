// ─────────────────────────────────────────────────────────────────────────────
// src/components/cotizador/MaterialesManager.tsx
// Panel Global de Requisiciones de Materiales en Campo — Sprint 8
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Boxes, Package, Search, ArrowRight, ArrowLeft, CheckCircle2,
  AlertTriangle, RefreshCw, Filter, Layers, Clock, Check, Trash2,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";
import { tienePermiso } from "@/lib/permissions";

interface RequisicionConOrden {
  id: string;
  orden_id: string;
  producto_id: string | null;
  nombre_producto: string;
  codigo_sku: string | null;
  unidad: string;
  cantidad_salida: number;
  cantidad_retorno: number;
  cantidad_usada: number;
  estado: "pendiente" | "despachado" | "retornado" | "consumido";
  notas: string | null;
  fecha_despacho: string | null;
  fecha_retorno: string | null;
  created_at: string;
  orden?: {
    numero: string;
    tipo_servicio: string;
    tecnico_lider?: { nombre: string };
  };
}

const ESTADOS = [
  { key: "todos", label: "Todos los materiales" },
  { key: "pendiente", label: "Pendientes por Despacho" },
  { key: "despachado", label: "En Obra / Campo" },
  { key: "retornado", label: "Retornados / Finalizados" },
];

export default function MaterialesManager() {
  const { usuario } = useUsuario();
  const permisosUsuario: string[] = usuario?.roles?.permisos || (usuario?.rol_id === "admin" ? ["*"] : []);
  const puedeGestionar = tienePermiso(permisosUsuario, "proyectos.materiales");

  const [items, setItems] = useState<RequisicionConOrden[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [savingId, setSavingId] = useState<string | null>(null);

  const cargarMateriales = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("requisicion_materiales")
      .select(`
        *,
        orden:ordenes_trabajo!requisicion_materiales_orden_id_fkey(
          numero,
          tipo_servicio,
          eliminada,
          tecnico_lider:perfiles!ordenes_trabajo_tecnico_lider_id_fkey(nombre)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(300);

    if (!error && data) {
      const activas = (data as any[]).filter(item => !item.orden?.eliminada);
      setItems(activas as unknown as RequisicionConOrden[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    cargarMateriales();
  }, [cargarMateriales]);

  // Despachar material a obra
  const handleDespachar = async (item: RequisicionConOrden) => {
    setSavingId(item.id);
    await supabase
      .from("requisicion_materiales")
      .update({
        estado: "despachado",
        aprobado_por: usuario?.id,
        despachado_por: usuario?.id,
        fecha_despacho: new Date().toISOString(),
      })
      .eq("id", item.id);

    // Descontar del inventario de productos si está vinculado
    if (item.producto_id) {
      const { data: prod } = await supabase
        .from("productos")
        .select("stock")
        .eq("id", item.producto_id)
        .single();

      if (prod) {
        await supabase
          .from("productos")
          .update({ stock: Math.max(0, (prod.stock || 0) - item.cantidad_salida) })
          .eq("id", item.producto_id);
      }
    }

    await cargarMateriales();
    setSavingId(null);
  };

  // Registrar retorno de sobrante
  const handleRetorno = async (item: RequisicionConOrden, cantRetorno: number) => {
    setSavingId(item.id);
    const nuevoEstado = cantRetorno >= item.cantidad_salida ? "retornado" : "consumido";
    await supabase
      .from("requisicion_materiales")
      .update({
        cantidad_retorno: cantRetorno,
        estado: nuevoEstado,
        fecha_retorno: new Date().toISOString(),
      })
      .eq("id", item.id);

    // Reintegrar sobrante al catálogo de productos
    if (item.producto_id && cantRetorno > 0) {
      const { data: prod } = await supabase
        .from("productos")
        .select("stock")
        .eq("id", item.producto_id)
        .single();

      if (prod) {
        await supabase
          .from("productos")
          .update({ stock: (prod.stock || 0) + cantRetorno })
          .eq("id", item.producto_id);
      }
    }

    await cargarMateriales();
    setSavingId(null);
  };

  // Filtrado
  const itemsFiltrados = useMemo(() => {
    return items.filter(i => {
      const q = query.toLowerCase();
      const matchQuery =
        !query ||
        i.nombre_producto.toLowerCase().includes(q) ||
        (i.codigo_sku || "").toLowerCase().includes(q) ||
        (i.orden?.numero || "").toLowerCase().includes(q) ||
        (i.orden?.tecnico_lider?.nombre || "").toLowerCase().includes(q);

      const matchEstado =
        filtroEstado === "todos"
          ? true
          : filtroEstado === "retornado"
          ? i.estado === "retornado" || i.estado === "consumido"
          : i.estado === filtroEstado;

      return matchQuery && matchEstado;
    });
  }, [items, query, filtroEstado]);

  // Totales métricas
  const totalItems = items.length;
  const totalSalida = items.reduce((acc, curr) => acc + (curr.cantidad_salida || 0), 0);
  const totalRetorno = items.reduce((acc, curr) => acc + (curr.cantidad_retorno || 0), 0);
  const totalUsado = items.reduce((acc, curr) => acc + (curr.cantidad_usada || 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black ts-text flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[var(--ts-red)]" /> Requisición de Materiales
            </h1>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              BETA
            </span>
          </div>
          <p className="text-xs ts-text-muted mt-0.5">
            Control integral de insumos despachados, materiales en obra y retorno de sobrantes
          </p>
        </div>

        <button
          onClick={cargarMateriales}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border ts-border ts-text hover:bg-[var(--ts-surface-2)] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Métricas Globales de Insumos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="ts-surface rounded-2xl p-4 border ts-border">
          <span className="text-xs font-bold ts-text-muted uppercase">Total Requisiciones</span>
          <div className="text-2xl font-black ts-text mt-1">{totalItems}</div>
          <div className="text-[11px] ts-text-muted mt-0.5">Partidas de material asignadas</div>
        </div>

        <div className="ts-surface rounded-2xl p-4 border ts-border">
          <span className="text-xs font-bold text-blue-600 uppercase">Salida Almacén</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{totalSalida}</div>
          <div className="text-[11px] ts-text-muted mt-0.5">Unidades despachadas</div>
        </div>

        <div className="ts-surface rounded-2xl p-4 border ts-border">
          <span className="text-xs font-bold text-orange-600 uppercase">Consumido en Obra</span>
          <div className="text-2xl font-black text-orange-600 mt-1">{totalUsado}</div>
          <div className="text-[11px] ts-text-muted mt-0.5">Unidades instaladas</div>
        </div>

        <div className="ts-surface rounded-2xl p-4 border ts-border">
          <span className="text-xs font-bold text-green-600 uppercase">Retornado</span>
          <div className="text-2xl font-black text-green-600 mt-1">{totalRetorno}</div>
          <div className="text-[11px] ts-text-muted mt-0.5">Reintegrado a inventario</div>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ts-text-muted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por material, SKU, orden (OT-2026-...) o técnico..."
            className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border ts-border bg-[var(--ts-surface)] ts-text focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {ESTADOS.map(est => (
            <button
              key={est.key}
              onClick={() => setFiltroEstado(est.key)}
              className={`text-xs px-3 py-2 rounded-xl transition-all whitespace-nowrap font-medium ${
                filtroEstado === est.key
                  ? "bg-[var(--ts-red)] text-white font-bold"
                  : "ts-surface border ts-border ts-text-muted hover:ts-text"
              }`}
            >
              {est.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="ts-surface rounded-2xl border ts-border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin ts-text-muted" />
          </div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 ts-text-muted">
            <Package className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No hay requisiciones de materiales en este estado</p>
            <p className="text-xs mt-1">Crea o vincula materiales dentro de una Orden de Trabajo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[var(--ts-surface-2)] border-b ts-border text-left ts-text-muted">
                <tr>
                  <th className="py-3 px-4 font-bold">Material / Insumo</th>
                  <th className="py-3 px-4 font-bold">Orden Destino</th>
                  <th className="py-3 px-4 font-bold">Técnico Responsable</th>
                  <th className="py-3 px-4 font-bold text-center">Salida</th>
                  <th className="py-3 px-4 font-bold text-center">Retorno</th>
                  <th className="py-3 px-4 font-bold text-center">Consumido</th>
                  <th className="py-3 px-4 font-bold">Estado</th>
                  <th className="py-3 px-4 font-bold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y ts-border">
                {itemsFiltrados.map(item => {
                  const isSaving = savingId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-[var(--ts-surface-2)]/60 transition-colors">
                      {/* Producto */}
                      <td className="py-3 px-4">
                        <div className="font-bold ts-text">{item.nombre_producto}</div>
                        {item.codigo_sku && (
                          <div className="text-[10px] ts-text-muted font-mono">{item.codigo_sku}</div>
                        )}
                        {item.notas && (
                          <div className="text-[10px] text-gray-500 italic mt-0.5">{item.notas}</div>
                        )}
                      </td>

                      {/* Orden */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[var(--ts-red)]">
                          {item.orden?.numero || "OT-General"}
                        </span>
                        <div className="text-[10px] ts-text-muted">
                          {item.orden?.tipo_servicio || "Instalación"}
                        </div>
                      </td>

                      {/* Técnico */}
                      <td className="py-3 px-4 ts-text">
                        {item.orden?.tecnico_lider?.nombre || (
                          <span className="text-[10px] ts-text-muted italic">Sin asignar</span>
                        )}
                      </td>

                      {/* Cantidades */}
                      <td className="py-3 px-4 text-center font-bold text-blue-600">
                        {item.cantidad_salida} <span className="text-[10px] ts-text-muted">{item.unidad}</span>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-green-600">
                        {item.cantidad_retorno} <span className="text-[10px] ts-text-muted">{item.unidad}</span>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-orange-600">
                        {item.cantidad_usada} <span className="text-[10px] ts-text-muted">{item.unidad}</span>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            item.estado === "pendiente"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600"
                              : item.estado === "despachado"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                              : item.estado === "retornado"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-600"
                          }`}
                        >
                          {item.estado === "pendiente"
                            ? "Pendiente"
                            : item.estado === "despachado"
                            ? "En Campo"
                            : item.estado === "retornado"
                            ? "Retornado"
                            : "Consumido"}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        {puedeGestionar && (
                          <div className="flex items-center justify-end gap-1.5">
                            {item.estado === "pendiente" && (
                              <button
                                onClick={() => handleDespachar(item)}
                                disabled={isSaving}
                                className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-2xs"
                              >
                                <ArrowRight className="w-3 h-3" />
                                <span>Despachar</span>
                              </button>
                            )}

                            {item.estado === "despachado" && (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={item.cantidad_salida}
                                  defaultValue={0}
                                  id={`ret-${item.id}`}
                                  className="w-14 text-xs rounded-lg border ts-border bg-[var(--ts-surface)] ts-text px-2 py-1 text-center focus:outline-none"
                                  placeholder="Sobró"
                                />
                                <button
                                  onClick={() => {
                                    const input = document.getElementById(`ret-${item.id}`) as HTMLInputElement;
                                    handleRetorno(item, parseInt(input.value) || 0);
                                  }}
                                  disabled={isSaving}
                                  title="Registrar retorno de sobrante al almacén"
                                  className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all shadow-2xs"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                  <span>Retornar</span>
                                </button>
                              </div>
                            )}

                            {(item.estado === "retornado" || item.estado === "consumido") && (
                              <span className="text-[10px] text-green-600 font-bold flex items-center gap-1 justify-end">
                                <Check className="w-3 h-3" /> Liquidado
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
