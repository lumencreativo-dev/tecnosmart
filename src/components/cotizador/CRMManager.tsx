"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search, Clock, LayoutGrid, List, Trash2,
  RotateCcw, AlertTriangle, Phone, MoreVertical,
  X, Download, FileText, MessageCircle, Wrench
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatUSD, formatFecha } from "@/lib/utils";

type CotizacionDB = any;

const COLUMNAS = [
  { id: "pendientes",  label: "Pendientes",  estados: ["borrador", "pendiente"] },
  { id: "enviadas",    label: "Enviadas",    estados: ["enviada"] },
  { id: "aprobadas",   label: "Aprobadas ✓", estados: ["aprobada"] },
  { id: "concretadas", label: "Facturadas",  estados: ["facturada"] },
];

const ESTADOS_MAP: Record<string, { label: string; color: string }> = {
  borrador:  { label: "Borrador",  color: "bg-gray-100 text-gray-700" },
  pendiente: { label: "Pendiente", color: "bg-gray-100 text-gray-700" },
  enviada:   { label: "Enviada",   color: "bg-blue-100 text-blue-700" },
  aprobada:  { label: "Aprobada",  color: "bg-emerald-100 text-emerald-700" },
  facturada: { label: "Facturada", color: "bg-purple-100 text-purple-700" },
  rechazada: { label: "Rechazada", color: "bg-red-100 text-red-700" },
  vencida:   { label: "Vencida",   color: "bg-orange-100 text-orange-700" },
};

export default function CRMManager() {
  const [cotizaciones, setCotizaciones]   = useState<CotizacionDB[]>([]);
  const [papelera, setPapelera]           = useState<CotizacionDB[]>([]);
  const [loading, setLoading]             = useState(true);
  const [query, setQuery]                 = useState("");
  const [viewMode, setViewMode]           = useState<"kanban" | "list" | "papelera">("kanban");
  const [updatingId, setUpdatingId]       = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ── Drawer detalle ──
  const [selected, setSelected]             = useState<CotizacionDB | null>(null);
  const [detalles, setDetalles]             = useState<any[]>([]);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [regenerando, setRegenerando]       = useState(false);

  const cargarDatos = async () => {
    setLoading(true);

    const [{ data }, { data: trash }] = await Promise.all([
      supabase
        .from("cotizaciones")
        .select("*, clientes (*)")
        .or("eliminada.is.null,eliminada.eq.false")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("cotizaciones")
        .select("*, clientes (*)")
        .eq("eliminada", true)
        .order("eliminada_at", { ascending: false }),
    ]);

    if (data)  setCotizaciones(data);
    if (trash) setPapelera(trash);
    setLoading(false);
  };

  useEffect(() => { cargarDatos(); }, []);

  // ── Acciones ──────────────────────────────────────────────
  const handleUpdateEstado = async (id: string, nuevoEstado: string) => {
    setUpdatingId(id);
    const { error } = await supabase.from("cotizaciones").update({ estado: nuevoEstado }).eq("id", id);
    if (!error) setCotizaciones(prev => prev.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
    setUpdatingId(null);
  };

  const handleMoverPapelera = async (id: string) => {
    await supabase.from("cotizaciones").update({ eliminada: true, eliminada_at: new Date().toISOString() }).eq("id", id);
    const eliminada = cotizaciones.find(c => c.id === id);
    if (eliminada) {
      setCotizaciones(prev => prev.filter(c => c.id !== id));
      setPapelera(prev => [{ ...eliminada, eliminada: true }, ...prev]);
    }
  };

  const handleRestaurar = async (id: string) => {
    await supabase.from("cotizaciones").update({ eliminada: false, eliminada_at: null }).eq("id", id);
    const restaurada = papelera.find(c => c.id === id);
    if (restaurada) {
      setPapelera(prev => prev.filter(c => c.id !== id));
      setCotizaciones(prev => [{ ...restaurada, eliminada: false }, ...prev]);
    }
  };

  const handleEliminarDefinitivo = async (id: string) => {
    await supabase.from("cotizacion_detalles").delete().eq("cotizacion_id", id);
    await supabase.from("cotizaciones").delete().eq("id", id);
    setPapelera(prev => prev.filter(c => c.id !== id));
    setConfirmDelete(null);
  };

  // ── Drawer detalle: funciones ─────────────────────────────
  const cargarDetalles = async (cotId: string) => {
    setLoadingDetalles(true);
    const { data } = await supabase
      .from("cotizacion_detalles")
      .select("*")
      .eq("cotizacion_id", cotId)
      .order("created_at");
    if (data) setDetalles(data);
    setLoadingDetalles(false);
  };

  const abrirDetalle = (cot: CotizacionDB) => {
    setSelected(cot);
    setDetalles([]);
    cargarDetalles(cot.id);
  };

  const handleRedescargarCot = async (cot: CotizacionDB) => {
    setRegenerando(true);
    try {
      const cliente = cot.clientes || {};
      const lineas = detalles.map((d: any) => ({
        id:             d.id,
        tipo_item:      d.tipo_item || "producto",
        item_id:        d.item_id || undefined,
        descripcion:    d.descripcion,
        cantidad:       d.cantidad,
        precio_unitario: d.precio_unitario,
        subtotal:       d.cantidad * d.precio_unitario,
      }));

      const subtotal = lineas.reduce((s: number, l: any) => s + l.subtotal, 0);
      const descuento = Number(cot.descuento || 0);
      const total = Math.max(0, subtotal - descuento);
      const aplicaEsquemaPago = total > 500;

      const { exportarCotizacionPDF } = await import("@/components/pdf/CotizacionPDF");
      await exportarCotizacionPDF({
        numeroCot: cot.numero_cotizacion,
        fecha:     new Date(cot.fecha || cot.created_at),
        cliente,
        lineas,
        resumen: {
          subtotal,
          descuento,
          total,
          anticipo:         aplicaEsquemaPago ? total * 0.7 : 0,
          saldo:            aplicaEsquemaPago ? total * 0.3 : 0,
          aplicaEsquemaPago,
        },
        notas: cot.notas || undefined,
      });
    } catch (e) {
      console.error("Error al re-generar PDF de cotización:", e);
      alert("No se pudo generar el PDF.");
    }
    setRegenerando(false);
  };

  // ── Filtrado ──────────────────────────────────────────────
  const cotFiltradas = useMemo(() =>
    cotizaciones.filter(c => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        c.numero_cotizacion?.toLowerCase().includes(q) ||
        c.clientes?.empresa?.toLowerCase().includes(q) ||
        c.clientes?.contacto?.toLowerCase().includes(q)
      );
    }), [cotizaciones, query]);

  const getColsData = () => {
    const res: Record<string, CotizacionDB[]> = { pendientes: [], enviadas: [], aprobadas: [], concretadas: [] };
    cotFiltradas.forEach(c => {
      if      (["borrador","pendiente"].includes(c.estado)) res.pendientes.push(c);
      else if (c.estado === "enviada")    res.enviadas.push(c);
      else if (c.estado === "aprobada")   res.aprobadas.push(c);
      else if (c.estado === "facturada")  res.concretadas.push(c);
    });
    return res;
  };

  const colsData = getColsData();

  // ── Tarjeta reutilizable ──────────────────────────────────
  const TarjetaCot = ({ cot, showTrash = true }: { cot: CotizacionDB; showTrash?: boolean }) => (
    <div
      onClick={() => abrirDetalle(cot)}
      className={`bg-[var(--ts-surface)] p-4 rounded-lg border border-[var(--ts-border)] shadow-sm hover:shadow-md hover:border-[var(--ts-red)]/30 transition-all relative group cursor-pointer ${updatingId === cot.id ? "opacity-50" : ""}`}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="text-xs font-bold text-[var(--ts-red)]">{cot.numero_cotizacion}</span>
        <span className="text-[10px] text-[var(--ts-text-muted)] flex items-center gap-1">
          <Clock className="w-3 h-3" /> {formatFecha(cot.created_at)}
        </span>
      </div>

      <h4 className="font-bold text-[var(--ts-text-primary)] leading-tight text-sm">
        {cot.clientes?.empresa || cot.clientes?.contacto || "Cliente sin nombre"}
      </h4>
      {cot.clientes?.empresa && cot.clientes?.contacto && (
        <p className="text-[10px] text-[var(--ts-text-muted)]">{cot.clientes.contacto}</p>
      )}

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--ts-border-2)]">
        <span className="text-sm font-extrabold text-[var(--ts-text-primary)]">{formatUSD(cot.total)}</span>

        <select
          value={cot.estado}
          onClick={e => e.stopPropagation()}
          onChange={e => handleUpdateEstado(cot.id, e.target.value)}
          disabled={updatingId === cot.id}
          className={`appearance-none text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer focus:outline-none ${ESTADOS_MAP[cot.estado]?.color || "bg-gray-100"}`}
        >
          {Object.entries(ESTADOS_MAP).map(([val, cfg]) => (
            <option key={val} value={val}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* Botón rápido para cotizaciones aprobadas */}
      {(["aprobada", "aprobadas", "Aprobada", "Aprobadas"].includes(cot.estado)) && (
        <div className="mt-2.5 pt-2 border-t border-[var(--ts-border-2)]">
          <a
            href={`/ordenes?cotizacion_id=${cot.id}`}
            onClick={e => e.stopPropagation()}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-[var(--ts-red)] text-[11px] font-bold border border-red-200 dark:border-red-900/40 transition-colors shadow-xs"
          >
            <Wrench className="w-3 h-3" />
            <span>Generar Orden de Trabajo</span>
          </a>
        </div>
      )}

      {/* Botones de acción rápida */}
      {showTrash && (
        <button
          onClick={(e) => { e.stopPropagation(); handleMoverPapelera(cot.id); }}
          className="absolute -right-2 -top-2 bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[var(--ts-text-muted)] hover:text-[var(--ts-red)] hover:border-[var(--ts-red)] p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          title="Mover a papelera"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
      {cot.clientes?.telefono && (
        <a
          href={`https://wa.me/${cot.clientes.telefono.replace(/\D/g, "")}`}
          target="_blank" rel="noreferrer"
          onClick={e => e.stopPropagation()}
          className="absolute -left-2 -top-2 bg-[#25D366] text-[var(--ts-text-primary)] p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          title="WhatsApp"
        >
          <Phone className="w-3 h-3" />
        </a>
      )}
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Toolbar ── */}
      <div className="bg-[var(--ts-surface)] rounded-xl shadow-sm border border-[var(--ts-border)] p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ts-text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por cliente o N° cotización..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[var(--ts-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--ts-red)]"
          />
        </div>

        <div className="flex bg-[var(--ts-bg)] p-1 rounded-lg border border-[var(--ts-border)] w-full sm:w-auto gap-0.5">
          {[
            { mode: "kanban",   icon: LayoutGrid, label: "Pipeline" },
            { mode: "list",     icon: List,       label: "Historial" },
            { mode: "papelera", icon: Trash2,     label: `Papelera${papelera.length > 0 ? ` (${papelera.length})` : ""}` },
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                viewMode === mode ? "bg-[var(--ts-surface)] text-[var(--ts-text-primary)] shadow-sm" : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
              } ${mode === "papelera" && papelera.length > 0 ? "text-[var(--ts-red)]" : ""}`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[var(--ts-text-muted)]">
          <div className="w-8 h-8 border-2 border-[var(--ts-red)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Cargando...
        </div>
      ) : (
        <>
          {/* ── KANBAN ── */}
          {viewMode === "kanban" && (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {COLUMNAS.map(col => (
                <div key={col.id} className="min-w-[280px] flex-1 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl flex flex-col snap-center">
                  <div className="px-4 py-3 border-b border-[var(--ts-border)] flex justify-between items-center bg-[var(--ts-surface-2)] rounded-t-xl">
                    <h3 className="font-bold text-xs text-[var(--ts-text-primary)] uppercase tracking-wide">{col.label}</h3>
                    <span className="bg-[var(--ts-surface)] text-[var(--ts-text-muted)] text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {colsData[col.id].length}
                    </span>
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-3 min-h-[400px]">
                    {colsData[col.id].map(cot => <TarjetaCot key={cot.id} cot={cot} />)}
                    {colsData[col.id].length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-xs text-[var(--ts-text-muted)] border-2 border-dashed border-[var(--ts-border)] rounded-lg">
                        Sin cotizaciones
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── LISTA ── */}
          {viewMode === "list" && (
            <div className="bg-[var(--ts-surface)] rounded-xl shadow-sm border border-[var(--ts-border)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] text-[10px] uppercase tracking-wider">
                      <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)]">N° Cotización</th>
                      <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)]">Fecha</th>
                      <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)]">Cliente</th>
                      <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)] text-right">Total</th>
                      <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)] text-center">Estado</th>
                      <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)] text-center w-16">Acc.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ts-border-2)]">
                    {cotFiltradas.length === 0 ? (
                      <tr><td colSpan={6} className="py-10 text-center text-sm text-[var(--ts-text-muted)]">No hay cotizaciones.</td></tr>
                    ) : cotFiltradas.map(cot => (
                      <tr key={cot.id} onClick={() => abrirDetalle(cot)} className="hover:bg-[var(--ts-surface-2)] group cursor-pointer">
                        <td className="px-5 py-3 text-sm font-bold text-[var(--ts-red)]">{cot.numero_cotizacion}</td>
                        <td className="px-5 py-3 text-xs text-[var(--ts-text-muted)]">{formatFecha(cot.created_at)}</td>
                        <td className="px-5 py-3 text-sm font-medium text-[var(--ts-text-primary)]">
                          {cot.clientes?.empresa || cot.clientes?.contacto}
                        </td>
                        <td className="px-5 py-3 text-sm font-bold text-right">{formatUSD(cot.total)}</td>
                        <td className="px-5 py-3 text-center">
                          <select
                            value={cot.estado}
                            onClick={e => e.stopPropagation()}
                            onChange={e => handleUpdateEstado(cot.id, e.target.value)}
                            disabled={updatingId === cot.id}
                            className={`appearance-none text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer focus:outline-none ${ESTADOS_MAP[cot.estado]?.color || "bg-gray-100"}`}
                          >
                            {Object.entries(ESTADOS_MAP).map(([val, cfg]) => (
                              <option key={val} value={val}>{cfg.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMoverPapelera(cot.id); }}
                            className="text-[#d9d9d9] group-hover:text-[var(--ts-red)] transition-colors p-1"
                            title="Mover a papelera"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PAPELERA ── */}
          {viewMode === "papelera" && (
            <div className="space-y-4">
              {papelera.length === 0 ? (
                <div className="bg-[var(--ts-surface)] rounded-xl p-12 text-center border border-[var(--ts-border)]">
                  <Trash2 className="w-10 h-10 mx-auto mb-3 text-[#d9d9d9]" />
                  <p className="font-semibold text-[var(--ts-text-muted)]">La papelera está vacía</p>
                  <p className="text-xs text-[var(--ts-text-muted)] mt-1">Las cotizaciones eliminadas aparecerán aquí.</p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 font-medium">
                    Las cotizaciones en la papelera <strong>no cuentan</strong> en las métricas. Puedes restaurarlas o eliminarlas permanentemente.
                  </p>
                </div>
              )}

              {papelera.map(cot => (
                <div key={cot.id} className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] p-4 flex items-center justify-between gap-4 shadow-sm">
                  <div>
                    <p className="text-xs font-bold text-[var(--ts-red)]">{cot.numero_cotizacion}</p>
                    <p className="text-sm font-semibold text-[var(--ts-text-primary)]">{cot.clientes?.empresa || cot.clientes?.contacto}</p>
                    <p className="text-[10px] text-[var(--ts-text-muted)]">Eliminada el {formatFecha(cot.eliminada_at)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[var(--ts-text-primary)] mb-2">{formatUSD(cot.total)}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestaurar(cot.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" /> Restaurar
                      </button>
                      <button
                        onClick={() => setConfirmDelete(cot.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── DRAWER DETALLE COTIZACIÓN ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />

          {/* Panel */}
          <div className="w-full max-w-lg bg-[var(--ts-surface)] h-full overflow-y-auto shadow-2xl flex flex-col">

            {/* ── Header ── */}
            <div className="px-6 py-5 border-b border-[var(--ts-border)] bg-[var(--ts-surface-2)]">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-extrabold text-[var(--ts-red)]">
                      {selected.numero_cotizacion}
                    </h2>
                    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${ESTADOS_MAP[selected.estado]?.color || "bg-gray-100 text-gray-700"}`}>
                      {ESTADOS_MAP[selected.estado]?.label || selected.estado}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ts-text-muted)]">
                    Creada: {formatFecha(selected.fecha || selected.created_at)}
                  </p>
                </div>
                <button onClick={() => setSelected(null)}>
                  <X className="w-5 h-5 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] transition-colors" />
                </button>
              </div>
            </div>

            {/* ── Cuerpo ── */}
            <div className="flex-1 p-5 space-y-6 overflow-y-auto">

              {/* Cliente */}
              {selected.clientes && (
                <div>
                  <h3 className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wide mb-2">
                    Cliente
                  </h3>
                  <div className="bg-[var(--ts-surface-2)] rounded-lg p-3 border border-[var(--ts-border)] space-y-1">
                    <p className="text-sm font-bold text-[var(--ts-text-primary)]">
                      {selected.clientes.empresa || selected.clientes.contacto}
                    </p>
                    {selected.clientes.empresa && selected.clientes.contacto && (
                      <p className="text-xs text-[var(--ts-text-muted)]">Contacto: {selected.clientes.contacto}</p>
                    )}
                    {selected.clientes.rif_cedula && (
                      <p className="text-xs text-[var(--ts-text-muted)]">RIF/Cédula: {selected.clientes.rif_cedula}</p>
                    )}
                    {selected.clientes.telefono && (
                      <p className="text-xs text-[var(--ts-text-muted)]">Tel: {selected.clientes.telefono}</p>
                    )}
                    {selected.clientes.direccion && (
                      <p className="text-xs text-[var(--ts-text-muted)]">{selected.clientes.direccion}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Ítems / Líneas */}
              <div>
                <h3 className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wide mb-2">
                  Ítems Cotizados
                </h3>
                {loadingDetalles ? (
                  <div className="py-4 text-center text-xs text-[var(--ts-text-muted)]">
                    <div className="w-5 h-5 border-2 border-[var(--ts-red)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Cargando detalles...
                  </div>
                ) : detalles.length === 0 ? (
                  <div className="flex items-center gap-2 py-4 text-center text-xs text-[var(--ts-text-muted)] border border-dashed border-[var(--ts-border)] rounded-lg justify-center">
                    <FileText className="w-4 h-4" />
                    No hay ítems registrados para esta cotización.
                  </div>
                ) : (
                  <div className="border border-[var(--ts-border)] rounded-lg overflow-hidden">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] text-[9px] uppercase">
                          <th className="px-3 py-2 text-left border-b border-[var(--ts-border)]">Descripción</th>
                          <th className="px-3 py-2 text-center border-b border-[var(--ts-border)]">Cant.</th>
                          <th className="px-3 py-2 text-right border-b border-[var(--ts-border)]">P.U.</th>
                          <th className="px-3 py-2 text-right border-b border-[var(--ts-border)]">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--ts-border-2)]">
                        {detalles.map((d: any) => (
                          <tr key={d.id}>
                            <td className="px-3 py-2.5 text-[var(--ts-text-primary)] leading-snug">{d.descripcion}</td>
                            <td className="px-3 py-2.5 text-center text-[var(--ts-text-muted)]">{d.cantidad}</td>
                            <td className="px-3 py-2.5 text-right text-[var(--ts-text-muted)]">{formatUSD(d.precio_unitario)}</td>
                            <td className="px-3 py-2.5 text-right font-bold text-[var(--ts-text-primary)]">{formatUSD(d.cantidad * d.precio_unitario)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Resumen financiero */}
              <div>
                <h3 className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wide mb-2">
                  Resumen
                </h3>
                <div className="bg-[var(--ts-surface-2)] rounded-lg p-4 border border-[var(--ts-border)] space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--ts-text-muted)]">Subtotal</span>
                    <span className="font-semibold">{formatUSD(Number(selected.subtotal || 0))}</span>
                  </div>
                  {Number(selected.descuento) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--ts-text-muted)]">Descuento</span>
                      <span className="font-semibold text-emerald-600">− {formatUSD(Number(selected.descuento))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm border-t border-[var(--ts-border)] pt-2">
                    <span className="font-bold text-[var(--ts-text-primary)]">Total</span>
                    <span className="font-extrabold text-[var(--ts-text-primary)] text-base">{formatUSD(Number(selected.total || 0))}</span>
                  </div>
                  {Number(selected.total) > 500 && (
                    <>
                      <div className="flex justify-between text-xs text-[var(--ts-text-muted)] pt-1">
                        <span>Anticipo (70%)</span>
                        <span className="font-semibold">{formatUSD(Number(selected.anticipo_monto || selected.total * 0.7))}</span>
                      </div>
                      <div className="flex justify-between text-xs text-[var(--ts-text-muted)]">
                        <span>Saldo (30%)</span>
                        <span className="font-semibold">{formatUSD(Number(selected.saldo_monto || selected.total * 0.3))}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notas */}
              {selected.notas && (
                <div>
                  <h3 className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wide mb-2">
                    Notas / Observaciones
                  </h3>
                  <p className="text-xs text-[var(--ts-text-muted)] bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-lg px-3 py-2.5 leading-relaxed">
                    {selected.notas}
                  </p>
                </div>
              )}

            </div>

            {/* ── Acciones del drawer ── */}
            <div className="p-5 border-t border-[var(--ts-border)] space-y-2">
              {(["aprobada", "aprobadas", "Aprobada", "Aprobadas"].includes(selected.estado)) && (
                <a
                  href={`/ordenes?cotizacion_id=${selected.id}`}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors shadow-xs"
                >
                  <Wrench className="w-4 h-4" />
                  Generar Orden de Trabajo (OT)
                </a>
              )}

              <button
                onClick={() => handleRedescargarCot(selected)}
                disabled={regenerando || loadingDetalles || detalles.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-[var(--ts-text-primary)] hover:bg-black disabled:opacity-40 text-[var(--ts-surface)] text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                {regenerando ? "Generando PDF..." : "Descargar PDF"}
              </button>

              {selected.clientes?.telefono && (
                <a
                  href={`https://wa.me/${selected.clientes.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, adjunto la cotización ${selected.numero_cotizacion} de TecnoSmart VZL por un total de ${formatUSD(selected.total)}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20b858] text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Enviar por WhatsApp
                </a>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Modal Confirmación Borrado Definitivo ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--ts-surface)] rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-[var(--ts-red)]" />
            </div>
            <h2 className="text-lg font-bold text-[var(--ts-text-primary)] mb-2">¿Eliminar definitivamente?</h2>
            <p className="text-sm text-[var(--ts-text-muted)] mb-6">Esta acción es <strong>irreversible</strong>. La cotización y todos sus detalles serán eliminados permanentemente.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 text-sm font-semibold border border-[var(--ts-border)] rounded-xl hover:bg-[var(--ts-bg)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminarDefinitivo(confirmDelete)}
                className="flex-1 py-2.5 text-sm font-bold bg-[var(--ts-red)] hover:bg-red-700 text-[var(--ts-text-primary)] rounded-xl transition-colors"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
