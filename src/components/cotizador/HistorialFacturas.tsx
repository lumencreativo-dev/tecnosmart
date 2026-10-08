"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search, Trash2, AlertTriangle, Lock, CheckCircle,
  X, FileText, Download, XCircle, AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatUSD, formatFecha } from "@/lib/utils";

const ADMIN_PASSWORD = "tecnosmart.123";

type Factura = any;

// ── Badge de estado ──────────────────────────────────────────
const EstadoBadge = ({ estado }: { estado: string }) => {
  if (estado === "anulada") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
        <XCircle className="w-3 h-3" /> Anulada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
      <CheckCircle className="w-3 h-3" /> Activa
    </span>
  );
};

export default function HistorialFacturas() {
  const [facturas, setFacturas]       = useState<Factura[]>([]);
  const [loading, setLoading]         = useState(true);
  const [query, setQuery]             = useState("");

  // Drawer / Detalle
  const [selected, setSelected]       = useState<Factura | null>(null);
  const [detalles, setDetalles]       = useState<any[]>([]);
  const [loadingDetalles, setLoadingDetalles] = useState(false);

  // Modal eliminar
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [password, setPassword]       = useState("");
  const [pwError, setPwError]         = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Modal anular
  const [anulandoId, setAnulandoId]   = useState<string | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [pwAnular, setPwAnular]       = useState("");
  const [pwAnularError, setPwAnularError] = useState(false);
  const [anulando, setAnulando]       = useState(false);
  const [anularSuccess, setAnularSuccess] = useState(false);

  // Re-descargar PDF
  const [regenerando, setRegenerando] = useState(false);

  const cargarFacturas = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("facturas")
      .select(`
        *,
        cotizaciones (
          id, numero_cotizacion, total, tasa_bcv, subtotal, notas,
          clientes (id, empresa, contacto, rif_cedula, telefono, direccion)
        )
      `)
      .order("created_at", { ascending: false });

    if (data) setFacturas(data);
    setLoading(false);
  };

  const cargarDetalles = async (facturaId: string) => {
    setLoadingDetalles(true);
    const { data } = await supabase
      .from("factura_detalles")
      .select("*")
      .eq("factura_id", facturaId)
      .order("orden");
    if (data) setDetalles(data);
    setLoadingDetalles(false);
  };

  useEffect(() => { cargarFacturas(); }, []);

  const abrirDetalle = (f: Factura) => {
    setSelected(f);
    setDetalles([]);
    cargarDetalles(f.id);
  };

  // ── Filtrado ──────────────────────────────────────────────
  const facturasFiltradas = useMemo(() =>
    facturas.filter(f => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        f.numero_factura?.toLowerCase().includes(q) ||
        f.cotizaciones?.numero_cotizacion?.toLowerCase().includes(q) ||
        f.cotizaciones?.clientes?.empresa?.toLowerCase().includes(q) ||
        f.cotizaciones?.clientes?.contacto?.toLowerCase().includes(q)
      );
    }), [facturas, query]);

  // ── Eliminar definitivo ───────────────────────────────────
  const handleDelete = async () => {
    if (password !== ADMIN_PASSWORD) { setPwError(true); setTimeout(() => setPwError(false), 2000); return; }
    setDeleting(true);
    await supabase.from("facturas").delete().eq("id", deletingId!);
    setFacturas(prev => prev.filter(f => f.id !== deletingId));
    if (selected?.id === deletingId) setSelected(null);
    setDeleteSuccess(true);
    setTimeout(() => { setDeletingId(null); setPassword(""); setDeleteSuccess(false); }, 1500);
    setDeleting(false);
  };

  // ── Anular factura (Nota de Crédito) ─────────────────────
  const handleAnular = async () => {
    if (pwAnular !== ADMIN_PASSWORD) { setPwAnularError(true); setTimeout(() => setPwAnularError(false), 2000); return; }
    if (!motivoAnulacion.trim()) return;
    setAnulando(true);
    const { error } = await supabase.from("facturas").update({
      estado: "anulada",
      motivo_anulacion: motivoAnulacion,
      anulada_at: new Date().toISOString(),
    }).eq("id", anulandoId!);
    if (!error) {
      setFacturas(prev => prev.map(f => f.id === anulandoId ? { ...f, estado: "anulada", motivo_anulacion: motivoAnulacion } : f));
      if (selected?.id === anulandoId) setSelected((prev: Factura | null) => prev ? { ...prev, estado: "anulada", motivo_anulacion: motivoAnulacion } : prev);
      setAnularSuccess(true);
      setTimeout(() => { setAnulandoId(null); setPwAnular(""); setMotivoAnulacion(""); setAnularSuccess(false); }, 1500);
    }
    setAnulando(false);
  };

  // ── Re-descargar PDF ─────────────────────────────────────
  const handleRedescargar = async (f: Factura) => {
    setRegenerando(true);
    try {
      const cliente = f.cotizaciones?.clientes || {};
      const lineas = detalles.length > 0 ? detalles : [];

      const { exportarFacturaFiscalPDF } = await import("@/components/pdf/FacturaFiscalPDF");
      await exportarFacturaFiscalPDF({
        numeroFactura:  f.numero_factura,
        numeroControl:  f.numero_control || `NC-${f.numero_factura}`,
        fecha:          new Date(f.fecha || f.created_at),
        cliente,
        lineas,
        tasaBcv:        Number(f.tasa_bcv || 0),
        subtotalBs:     Number(f.subtotal_bs || 0),
        ivaBs:          Number(f.iva_bs || 0),
        igtfBs:         Number(f.igtf_bs || 0),
        totalBs:        Number(f.total_bs || 0),
        aplicaIgtf:     Boolean(f.aplica_igtf),
      });
    } catch (e) {
      console.error("Error al re-generar PDF:", e);
      alert("No se pudo generar el PDF. Los datos de línea pueden estar incompletos.");
    }
    setRegenerando(false);
  };

  // ── Totales ───────────────────────────────────────────────
  const facturasActivas = facturas.filter(f => f.estado !== "anulada");
  
  const totalUsd = facturasActivas.reduce((s, f) => s + Number(f.subtotal_usd || f.cotizaciones?.total || 0), 0);
  const totalBs = facturasActivas.reduce((s, f) => s + Number(f.total_bs || 0), 0);

  return (
    <div className="space-y-5">

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] p-4 text-center">
          <p className="text-2xl font-extrabold text-[var(--ts-red)]">{facturasActivas.length}</p>
          <p className="text-xs text-[var(--ts-text-muted)] font-medium mt-0.5">Activas</p>
        </div>
        <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] p-4 text-center">
          <p className="text-2xl font-extrabold text-[var(--ts-text-primary)]">{formatUSD(totalUsd)}</p>
          <p className="text-xs text-[var(--ts-text-muted)] font-medium mt-0.5">Total Facturado (USD)</p>
          {totalBs > 0 && (
             <p className="text-[10px] font-bold text-[var(--ts-text-muted)] mt-1 bg-[var(--ts-surface-2)] inline-block px-2 py-0.5 rounded-full">
               Bs. {totalBs.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
             </p>
          )}
        </div>
        <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-extrabold text-red-600">{facturas.filter(f => f.estado === "anulada").length}</p>
          <p className="text-xs text-[var(--ts-text-muted)] font-medium mt-0.5">Anuladas</p>
        </div>
      </div>

      {/* ── Buscador ── */}
      <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ts-text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por N° factura, cliente o cotización..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[var(--ts-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--ts-red)]"
          />
        </div>
      </div>

      {/* ── Tabla ── */}
      {loading ? (
        <div className="text-center py-16 text-[var(--ts-text-muted)]">
          <div className="w-8 h-8 border-2 border-[var(--ts-red)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Cargando facturas...
        </div>
      ) : (
        <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] overflow-hidden shadow-sm">
          {facturasFiltradas.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-10 h-10 text-[#d9d9d9] mx-auto mb-3" />
              <p className="text-sm font-medium text-[var(--ts-text-muted)]">No hay facturas emitidas aún.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] text-[10px] uppercase tracking-wider">
                  <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)]">N° Factura</th>
                  <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)]">Fecha</th>
                  <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)]">Cliente</th>
                  <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)] text-right">Total USD</th>
                  <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)] text-center">Estado</th>
                  <th className="px-5 py-3 font-semibold border-b border-[var(--ts-border)] text-center w-16">⋯</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ts-border-2)]">
                {facturasFiltradas.map(f => (
                  <tr
                    key={f.id}
                    className={`hover:bg-[var(--ts-surface-2)] transition-colors cursor-pointer group ${f.estado === "anulada" ? "opacity-60" : ""}`}
                    onClick={() => abrirDetalle(f)}
                  >
                    <td className="px-5 py-3">
                      <span className="text-sm font-bold text-[var(--ts-red)]">{f.numero_factura}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--ts-text-muted)]">{formatFecha(f.fecha || f.created_at)}</td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-[var(--ts-text-primary)]">
                        {f.cotizaciones?.clientes?.empresa || f.cotizaciones?.clientes?.contacto || f.cliente_nombre || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-[var(--ts-text-primary)] text-right">
                      {formatUSD(Number(f.subtotal_usd || f.cotizaciones?.total || 0))}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <EstadoBadge estado={f.estado || "activa"} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={e => { e.stopPropagation(); setDeletingId(f.id); setPassword(""); setPwError(false); }}
                        className="text-[#d9d9d9] group-hover:text-[var(--ts-red)] transition-colors p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── DRAWER DETALLE ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="w-full max-w-lg bg-[var(--ts-surface)] h-full overflow-y-auto shadow-2xl flex flex-col">

            {/* Header */}
            <div className={`px-6 py-5 border-b border-[var(--ts-border)] ${selected.estado === "anulada" ? "bg-red-50" : "bg-[var(--ts-surface-2)]"}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-extrabold text-[var(--ts-red)]">{selected.numero_factura}</h2>
                    <EstadoBadge estado={selected.estado || "activa"} />
                  </div>
                  <p className="text-xs text-[var(--ts-text-muted)]">
                    Emitida: {formatFecha(selected.fecha || selected.created_at)}
                    {selected.cotizaciones?.numero_cotizacion && ` · Cot: ${selected.cotizaciones.numero_cotizacion}`}
                  </p>
                  {selected.estado === "anulada" && selected.motivo_anulacion && (
                    <p className="text-xs text-red-600 font-semibold mt-1">
                      Motivo: {selected.motivo_anulacion}
                    </p>
                  )}
                </div>
                <button onClick={() => setSelected(null)}>
                  <X className="w-5 h-5 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-5 space-y-6 overflow-y-auto">

              {/* Cliente */}
              {selected.cotizaciones?.clientes && (
                <div>
                  <h3 className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wide mb-2">Cliente</h3>
                  <div className="bg-[var(--ts-surface-2)] rounded-lg p-3 border border-[var(--ts-border)] space-y-1">
                    <p className="text-sm font-bold text-[var(--ts-text-primary)]">
                      {selected.cotizaciones.clientes.empresa || selected.cotizaciones.clientes.contacto}
                    </p>
                    {selected.cotizaciones.clientes.rif_cedula && (
                      <p className="text-xs text-[var(--ts-text-muted)]">RIF/Cédula: {selected.cotizaciones.clientes.rif_cedula}</p>
                    )}
                    {selected.cotizaciones.clientes.telefono && (
                      <p className="text-xs text-[var(--ts-text-muted)]">Tel: {selected.cotizaciones.clientes.telefono}</p>
                    )}
                    {selected.cotizaciones.clientes.direccion && (
                      <p className="text-xs text-[var(--ts-text-muted)]">{selected.cotizaciones.clientes.direccion}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Detalles / Líneas */}
              <div>
                <h3 className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wide mb-2">
                  Productos y Servicios Facturados
                </h3>
                {loadingDetalles ? (
                  <div className="py-4 text-center text-xs text-[var(--ts-text-muted)]">Cargando líneas...</div>
                ) : detalles.length === 0 ? (
                  <p className="text-xs text-[var(--ts-text-muted)] italic">No hay detalles registrados para esta factura.</p>
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
                        {detalles.map(d => (
                          <tr key={d.id}>
                            <td className="px-3 py-2 text-[var(--ts-text-primary)]">{d.descripcion}</td>
                            <td className="px-3 py-2 text-center text-[var(--ts-text-muted)]">{d.cantidad}</td>
                            <td className="px-3 py-2 text-right text-[var(--ts-text-muted)]">{formatUSD(d.precio_unitario)}</td>
                            <td className="px-3 py-2 text-right font-bold text-[var(--ts-text-primary)]">{formatUSD(d.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Resumen Fiscal */}
              <div>
                <h3 className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wide mb-2">Resumen Fiscal</h3>
                <div className="bg-[var(--ts-surface-2)] rounded-lg p-4 border border-[var(--ts-border)] space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--ts-text-muted)]">Subtotal</span>
                    <span className="font-semibold">{formatUSD(Number(selected.subtotal_usd || selected.cotizaciones?.subtotal || 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--ts-text-muted)]">IVA ({selected.iva_bs > 0 ? "16%" : "0%"}) en Bs.</span>
                    <span className="font-semibold">Bs. {Number(selected.iva_bs || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {selected.aplica_igtf && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--ts-text-muted)]">IGTF (3%) en Bs.</span>
                      <span className="font-semibold">Bs. {Number(selected.igtf_bs || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm border-t border-[var(--ts-border)] pt-2">
                    <span className="text-[var(--ts-text-muted)]">Total en Bs.</span>
                    <span className="font-extrabold text-[var(--ts-text-primary)]">Bs. {Number(selected.total_bs || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--ts-text-muted)]">Tasa BCV</span>
                    <span className="font-semibold text-[var(--ts-text-muted)]">Bs. {Number(selected.tasa_bcv || 0).toFixed(2)} / USD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--ts-text-muted)]">Método de pago</span>
                    <span className="font-semibold capitalize">{selected.metodo_pago || "—"}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Acciones del drawer */}
            <div className="p-5 border-t border-[var(--ts-border)] space-y-2">
              <button
                onClick={() => handleRedescargar(selected)}
                disabled={regenerando}
                className="w-full flex items-center justify-center gap-2 bg-[#111] hover:bg-black text-[var(--ts-text-primary)] text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                {regenerando ? "Generando PDF..." : "Descargar PDF"}
              </button>

              {selected.estado !== "anulada" && (
                <button
                  onClick={() => { setAnulandoId(selected.id); setMotivoAnulacion(""); setPwAnular(""); }}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-bold py-2.5 rounded-xl border border-red-200 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Anular Factura (Nota de Crédito)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Eliminar ── */}
      {deletingId && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--ts-surface)] rounded-2xl shadow-2xl max-w-sm w-full p-6">
            {deleteSuccess ? (
              <div className="text-center py-4">
                <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
                <p className="font-bold text-[var(--ts-text-primary)]">Factura eliminada</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-[var(--ts-red)]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[var(--ts-text-primary)]">Eliminar Factura</h2>
                    <p className="text-xs text-[var(--ts-text-muted)]">Requiere contraseña de administrador.</p>
                  </div>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPwError(false); }}
                  onKeyDown={e => e.key === "Enter" && handleDelete()}
                  placeholder="••••••••••••"
                  autoFocus
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none mb-1 ${pwError ? "border-red-400 bg-red-50" : "border-[var(--ts-border)] focus:border-[var(--ts-red)]"}`}
                />
                {pwError && <p className="text-xs text-red-600 mb-3 font-semibold">⚠ Contraseña incorrecta</p>}
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setDeletingId(null)} className="flex-1 py-2.5 text-sm font-semibold border border-[var(--ts-border)] rounded-xl hover:bg-[var(--ts-bg)]">Cancelar</button>
                  <button onClick={handleDelete} disabled={deleting || !password} className="flex-1 py-2.5 text-sm font-bold bg-[var(--ts-red)] hover:bg-red-700 disabled:opacity-50 text-[var(--ts-text-primary)] rounded-xl">
                    {deleting ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Anular (Nota de Crédito) ── */}
      {anulandoId && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--ts-surface)] rounded-2xl shadow-2xl max-w-sm w-full p-6">
            {anularSuccess ? (
              <div className="text-center py-4">
                <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
                <p className="font-bold text-[var(--ts-text-primary)]">Factura anulada</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[var(--ts-text-primary)]">Anular Factura</h2>
                    <p className="text-xs text-[var(--ts-text-muted)]">Genera una Nota de Crédito SENIAT.</p>
                  </div>
                </div>

                {/* Nota legal */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 my-3">
                  <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                    Según la Providencia 00071 del SENIAT, una factura <strong>no puede eliminarse</strong>.
                    En su lugar, se emite una <strong>Nota de Crédito</strong> que la anula contablemente.
                    Esta acción marcará la factura como "Anulada" y quedará registrada en el historial.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ts-text-muted)] mb-1">Motivo de Anulación *</label>
                    <textarea
                      value={motivoAnulacion}
                      onChange={e => setMotivoAnulacion(e.target.value)}
                      placeholder="Ej: Error en datos del cliente, devolución parcial, monto incorrecto..."
                      rows={3}
                      className="w-full px-3 py-2 border border-[var(--ts-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--ts-red)] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ts-text-muted)] mb-1">Contraseña de Admin *</label>
                    <input
                      type="password"
                      value={pwAnular}
                      onChange={e => { setPwAnular(e.target.value); setPwAnularError(false); }}
                      placeholder="••••••••••••"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${pwAnularError ? "border-red-400 bg-red-50" : "border-[var(--ts-border)] focus:border-[var(--ts-red)]"}`}
                    />
                    {pwAnularError && <p className="text-xs text-red-600 mt-1 font-semibold">⚠ Contraseña incorrecta</p>}
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button onClick={() => setAnulandoId(null)} className="flex-1 py-2.5 text-sm font-semibold border border-[var(--ts-border)] rounded-xl hover:bg-[var(--ts-bg)]">Cancelar</button>
                  <button
                    onClick={handleAnular}
                    disabled={anulando || !motivoAnulacion.trim() || !pwAnular}
                    className="flex-1 py-2.5 text-sm font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-[var(--ts-text-primary)] rounded-xl"
                  >
                    {anulando ? "Anulando..." : "Anular Factura"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
