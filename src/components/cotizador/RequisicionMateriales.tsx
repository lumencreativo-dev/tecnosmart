// ─────────────────────────────────────────────────────────────────────────────
// src/components/cotizador/RequisicionMateriales.tsx
// Control de salida y retorno de materiales para órdenes de trabajo — Sprint 8
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package, Plus, Trash2, X, CheckCircle2, Loader2, Search,
  ArrowRight, ArrowLeft, BarChart3, AlertTriangle, Boxes
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";

interface Requisicion {
  id: string;
  producto_id: string | null;
  nombre_producto: string;
  codigo_sku: string | null;
  unidad: string;
  cantidad_salida: number;
  cantidad_retorno: number;
  cantidad_usada: number;
  estado: "pendiente" | "despachado" | "retornado" | "consumido";
  notas: string | null;
  aprobado_por: string | null;
  fecha_despacho: string | null;
}

interface Producto {
  id: string;
  nombre: string;
  codigo_sku: string;
  stock: number;
  unidad?: string;
}

interface OrdenResumen {
  id: string;
  numero: string;
  tipo_servicio: string;
}

const ESTADO_COLORES = {
  pendiente:  { label: "Pendiente",  color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/20" },
  despachado: { label: "Despachado", color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/20" },
  retornado:  { label: "Retornado",  color: "text-green-600",  bg: "bg-green-100 dark:bg-green-900/20" },
  consumido:  { label: "Consumido",  color: "text-gray-600",   bg: "bg-gray-100 dark:bg-gray-800" },
};

export default function RequisicionMateriales({
  orden,
  onClose,
}: {
  orden: OrdenResumen;
  onClose: () => void;
}) {
  const { usuario } = useUsuario();
  const [items, setItems] = useState<Requisicion[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [queryProd, setQueryProd] = useState("");
  const [panelProductos, setPanelProductos] = useState(false);

  // Form nuevo item
  const [nuevoItem, setNuevoItem] = useState({
    producto_id: "",
    nombre_producto: "",
    codigo_sku: "",
    unidad: "und",
    cantidad_salida: 1,
    notas: "",
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("requisicion_materiales")
      .select("*")
      .eq("orden_id", orden.id)
      .order("created_at");
    if (data) setItems(data as Requisicion[]);
    setLoading(false);
  }, [orden.id]);

  useEffect(() => {
    cargar();
    // Cargar catálogo de productos
    supabase
      .from("productos")
      .select("id, nombre, codigo_sku, stock")
      .order("nombre")
      .limit(500)
      .then(({ data }) => { if (data) setProductos(data as Producto[]); });
  }, [cargar]);

  const productosFiltrados = productos.filter(p =>
    !queryProd || p.nombre.toLowerCase().includes(queryProd.toLowerCase()) || p.codigo_sku?.toLowerCase().includes(queryProd.toLowerCase())
  );

  const seleccionarProducto = (p: Producto) => {
    setNuevoItem(prev => ({
      ...prev,
      producto_id: p.id,
      nombre_producto: p.nombre,
      codigo_sku: p.codigo_sku,
    }));
    setPanelProductos(false);
    setQueryProd("");
  };

  const agregarItem = async () => {
    if (!nuevoItem.nombre_producto || nuevoItem.cantidad_salida < 1) return;
    setSaving(true);

    const esMock = !usuario?.id || usuario.id === "00000000-0000-0000-0000-000000000000";
    const { data } = await supabase.from("requisicion_materiales").insert({
      orden_id: orden.id,
      producto_id: nuevoItem.producto_id || null,
      nombre_producto: nuevoItem.nombre_producto,
      codigo_sku: nuevoItem.codigo_sku || null,
      unidad: nuevoItem.unidad,
      cantidad_salida: nuevoItem.cantidad_salida,
      cantidad_retorno: 0,
      notas: nuevoItem.notas || null,
      estado: "pendiente",
      creado_por: esMock ? null : usuario.id,
    }).select().single();

    if (data) {
      setItems(prev => [...prev, data as Requisicion]);
      setNuevoItem({ producto_id: "", nombre_producto: "", codigo_sku: "", unidad: "und", cantidad_salida: 1, notas: "" });
    }
    setSaving(false);
  };

  const despachar = async (item: Requisicion) => {
    setSaving(true);
    await supabase.from("requisicion_materiales").update({
      estado: "despachado",
      aprobado_por: usuario?.id,
      fecha_despacho: new Date().toISOString(),
    }).eq("id", item.id);

    // Reducir stock del producto
    if (item.producto_id) {
      const prod = productos.find(p => p.id === item.producto_id);
      if (prod) {
        await supabase.from("productos").update({ stock: Math.max(0, prod.stock - item.cantidad_salida) }).eq("id", item.producto_id);
      }
    }
    await cargar();
    setSaving(false);
  };

  const registrarRetorno = async (item: Requisicion, cantRetorno: number) => {
    setSaving(true);
    const nuevoEstado = cantRetorno >= item.cantidad_salida ? "retornado" : "consumido";
    await supabase.from("requisicion_materiales").update({
      cantidad_retorno: cantRetorno,
      estado: nuevoEstado,
      fecha_retorno: new Date().toISOString(),
    }).eq("id", item.id);

    // Reintegrar stock sobrante
    if (item.producto_id && cantRetorno > 0) {
      const prod = productos.find(p => p.id === item.producto_id);
      if (prod) {
        await supabase.from("productos").update({ stock: prod.stock + cantRetorno }).eq("id", item.producto_id);
      }
    }
    await cargar();
    setSaving(false);
  };

  const eliminar = async (id: string) => {
    await supabase.from("requisicion_materiales").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const totalUsado = items.reduce((sum, i) => sum + (i.cantidad_usada || 0), 0);
  const totalSalida = items.reduce((sum, i) => sum + i.cantidad_salida, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="ts-surface rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b ts-border">
          <div>
            <h2 className="text-base font-black ts-text flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[var(--ts-red)]" /> Requisición de Materiales
            </h2>
            <p className="text-xs ts-text-muted">{orden.numero} — {orden.tipo_servicio}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--ts-surface-2)] ts-text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 p-4 border-b ts-border">
          <div className="ts-surface rounded-xl p-3 border ts-border text-center">
            <p className="text-lg font-black ts-text">{items.length}</p>
            <p className="text-xs ts-text-muted">Items</p>
          </div>
          <div className="ts-surface rounded-xl p-3 border ts-border text-center">
            <p className="text-lg font-black text-blue-600">{totalSalida}</p>
            <p className="text-xs ts-text-muted">Unidades Salida</p>
          </div>
          <div className="ts-surface rounded-xl p-3 border ts-border text-center">
            <p className="text-lg font-black text-green-600">{totalSalida - totalUsado}</p>
            <p className="text-xs ts-text-muted">Retornadas</p>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin ts-text-muted" /></div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 ts-text-muted">
              <Package className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-xs">Sin materiales registrados para esta orden</p>
            </div>
          ) : (
            items.map(item => {
              const estadoCfg = ESTADO_COLORES[item.estado];
              return (
                <div key={item.id} className="border ts-border rounded-xl p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-bold ts-text">{item.nombre_producto}</p>
                        {item.codigo_sku && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--ts-surface-2)] ts-text-muted font-mono">{item.codigo_sku}</span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${estadoCfg.bg} ${estadoCfg.color}`}>
                          {estadoCfg.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs ts-text-muted">
                        <span className="flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-blue-500" />
                          Salida: <strong className="ts-text">{item.cantidad_salida} {item.unidad}</strong>
                        </span>
                        {item.estado !== "pendiente" && (
                          <span className="flex items-center gap-1">
                            <ArrowLeft className="w-3 h-3 text-green-500" />
                            Retorno: <strong className="ts-text">{item.cantidad_retorno} {item.unidad}</strong>
                          </span>
                        )}
                        {item.estado !== "pendiente" && (
                          <span>Usado: <strong className="text-orange-600">{item.cantidad_usada} {item.unidad}</strong></span>
                        )}
                      </div>

                      {item.notas && <p className="text-xs ts-text-muted italic mt-1">{item.notas}</p>}
                    </div>

                    {/* Acciones según estado */}
                    <div className="flex gap-1.5 shrink-0">
                      {item.estado === "pendiente" && (
                        <button
                          onClick={() => despachar(item)}
                          disabled={saving}
                          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                          <ArrowRight className="w-3 h-3" /> Despachar
                        </button>
                      )}
                      {item.estado === "despachado" && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={item.cantidad_salida}
                            defaultValue={0}
                            id={`retorno-${item.id}`}
                            className="w-14 text-xs rounded border ts-border bg-[var(--ts-surface-2)] ts-text px-2 py-1 focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById(`retorno-${item.id}`) as HTMLInputElement;
                              registrarRetorno(item, parseInt(input.value) || 0);
                            }}
                            className="text-xs px-2 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {item.estado === "pendiente" && (
                        <button
                          onClick={() => eliminar(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Agregar nuevo item */}
        <div className="p-4 border-t ts-border space-y-3">
          <p className="text-xs font-bold ts-text-muted uppercase">Agregar Material</p>

          {/* Selector de producto del catálogo */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ts-text-muted" />
                <input
                  type="text"
                  value={nuevoItem.nombre_producto || queryProd}
                  onChange={e => {
                    if (nuevoItem.nombre_producto) setNuevoItem(prev => ({ ...prev, nombre_producto: e.target.value, producto_id: "" }));
                    else setQueryProd(e.target.value);
                    setPanelProductos(true);
                  }}
                  onFocus={() => setPanelProductos(true)}
                  placeholder="Buscar en catálogo o escribir nombre..."
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
                />
              </div>
              <input
                type="number"
                min={1}
                value={nuevoItem.cantidad_salida}
                onChange={e => setNuevoItem(prev => ({ ...prev, cantidad_salida: parseInt(e.target.value) || 1 }))}
                className="w-16 text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-2 py-2 focus:outline-none"
                placeholder="Cant"
              />
              <input
                type="text"
                value={nuevoItem.unidad}
                onChange={e => setNuevoItem(prev => ({ ...prev, unidad: e.target.value }))}
                className="w-16 text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-2 py-2 focus:outline-none"
                placeholder="Und"
              />
              <button
                onClick={agregarItem}
                disabled={saving || !nuevoItem.nombre_producto}
                className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-[var(--ts-red)] text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Dropdown productos */}
            {panelProductos && (queryProd || !nuevoItem.nombre_producto) && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-[var(--ts-surface)] border ts-border rounded-xl shadow-xl max-h-48 overflow-y-auto z-10">
                {productosFiltrados.slice(0, 20).map(p => (
                  <button
                    key={p.id}
                    onClick={() => seleccionarProducto(p)}
                    className="w-full text-left px-3 py-2 hover:bg-[var(--ts-surface-2)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium ts-text">{p.nombre}</p>
                        <p className="text-xs ts-text-muted font-mono">{p.codigo_sku}</p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        p.stock > 5 ? "bg-green-100 dark:bg-green-900/20 text-green-600"
                        : p.stock > 0 ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600"
                        : "bg-red-100 dark:bg-red-900/20 text-red-600"
                      }`}>
                        Stock: {p.stock}
                      </span>
                    </div>
                  </button>
                ))}
                {productosFiltrados.length === 0 && (
                  <p className="text-xs ts-text-muted p-3 text-center">Escribe el nombre del material</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
