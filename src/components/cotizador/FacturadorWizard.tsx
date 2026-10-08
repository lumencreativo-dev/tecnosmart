"use client";

import { useState, useEffect } from "react";
import {
  Search, FileText, CheckCircle2, AlertCircle,
  RefreshCw, ShoppingCart, Plus, Minus, Trash2,
  ArrowRight, Package,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatUSD, tempId } from "@/lib/utils";
import { buscarProductos } from "@/lib/supabase/servicios";
import type { Producto, Cliente } from "@/lib/types";
import ClientePicker from "@/components/cotizador/ClientePicker";

type CotizacionDB = any;
type Modo = "desde_cotizacion" | "venta_directa";

// ── Helpers ────────────────────────────────────────
const formatBs = (num: number) =>
  "Bs. " + num.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface LineaVenta {
  id: string;
  producto_id: string;
  codigo_sku: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  tipo_item?: string;
}

// ── Buscador inline de productos ──────────────────
function BuscadorInline({ onAdd }: { onAdd: (p: Producto) => void }) {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const buscar = async (val: string) => {
    setQ(val);
    if (val.length < 2) { setResultados([]); setShow(false); return; }
    setLoading(true);
    const data = await buscarProductos(val);
    setResultados(data);
    setShow(true);
    setLoading(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 border border-[var(--ts-border)] rounded-lg px-3 py-2.5 focus-within:border-[var(--ts-red)] bg-[var(--ts-surface)]">
        <Search className="w-4 h-4 text-[var(--ts-text-muted)] shrink-0" />
        <input
          type="text"
          value={q}
          onChange={e => buscar(e.target.value)}
          placeholder="Buscar por nombre o SKU..."
          className="flex-1 text-sm outline-none bg-transparent"
        />
        {loading && <div className="w-4 h-4 border-2 border-[var(--ts-red)] border-t-transparent rounded-full animate-spin shrink-0" />}
      </div>
      {show && resultados.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {resultados.map(p => (
            <li key={p.id}>
              <button
                onClick={() => { onAdd(p); setQ(""); setResultados([]); setShow(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[var(--ts-surface-2)] text-left transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ts-text-primary)]">{p.nombre}</p>
                  <p className="text-xs text-[var(--ts-text-muted)]">SKU: {p.codigo_sku} · Stock: {p.stock ?? 0}</p>
                </div>
                <span className="text-sm font-bold text-[var(--ts-red)]">{formatUSD(p.precio_venta)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {show && resultados.length === 0 && !loading && (
        <div className="absolute z-20 w-full mt-1 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-4 py-3 text-sm text-[var(--ts-text-muted)] shadow">
          Sin resultados.
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────
export default function FacturadorWizard() {
  const [modo, setModo] = useState<Modo>("desde_cotizacion");

  // ── Estado: Desde Cotización ──
  const [query, setQuery]           = useState("");
  const [buscando, setBuscando]     = useState(false);
  const [cotizacion, setCotizacion] = useState<CotizacionDB | null>(null);

  // ── Estado: Venta Directa ──
  const [lineasDirectas, setLineasDirectas]     = useState<LineaVenta[]>([]);
  const [clienteDirecto, setClienteDirecto]     = useState<Cliente | null>(null);

  // ── Estado: Concepto Libre ──
  const [conceptoDesc, setConceptoDesc] = useState("");
  const [conceptoCant, setConceptoCant] = useState(1);
  const [conceptoPrecio, setConceptoPrecio] = useState(0);

  // ── Estado compartido ──
  const [error, setError]                 = useState<string | null>(null);
  const [generando, setGenerando]         = useState(false);
  const [facturaGenerada, setFacturaGenerada] = useState<string | null>(null);
  const [tasaBcv, setTasaBcv]             = useState<number>(0);
  const [cargandoTasa, setCargandoTasa]   = useState(false);
  const [metodoPago, setMetodoPago]       = useState<"bs_transferencia" | "usd_efectivo" | "zelle">("bs_transferencia");

  // ── BCV ──
  const fetchBCVRate = async () => {
    setCargandoTasa(true);
    try {
      const res  = await fetch("https://ve.dolarapi.com/v1/dolares/oficial");
      const data = await res.json();
      if (data?.promedio) setTasaBcv(data.promedio);
    } catch { /* el usuario puede ingresar manualmente */ }
    finally { setCargandoTasa(false); }
  };

  useEffect(() => {
    if (modo === "venta_directa" && tasaBcv === 0) {
      fetchBCVRate();
    }
  }, [modo]);

  // ── Buscar cotización ──
  const buscarCotizacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setBuscando(true);
    setError(null);
    setFacturaGenerada(null);
    setCotizacion(null);
    setTasaBcv(0);

    const { data, error: err } = await supabase
      .from("cotizaciones")
      .select("*, clientes (*), cotizacion_detalles (*)")
      .ilike("numero_cotizacion", `%${query.trim()}%`)
      .single();

    setBuscando(false);
    if (err || !data) { setError("No se encontró ninguna cotización con ese número."); return; }
    setCotizacion(data);
    if (data.estado !== "facturada") fetchBCVRate();
  };

  // ── Venta directa: agregar producto ──
  const agregarProductoDirecto = (p: Producto) => {
    const existe = lineasDirectas.findIndex(l => l.producto_id === p.id);
    if (existe >= 0) {
      // Incrementar cantidad si ya existe
      setLineasDirectas(prev => prev.map((l, i) =>
        i === existe ? { ...l, cantidad: l.cantidad + 1, subtotal: (l.cantidad + 1) * l.precio_unitario } : l
      ));
    } else {
      setLineasDirectas(prev => [...prev, {
        id:             tempId(),
        producto_id:    p.id,
        codigo_sku:     p.codigo_sku,
        descripcion:    `${p.codigo_sku} – ${p.nombre}`,
        cantidad:       1,
        precio_unitario: p.precio_venta,
        subtotal:       p.precio_venta,
        tipo_item:      "producto",
      }]);
    }
  };

  const agregarConceptoLibre = () => {
    if (!conceptoDesc.trim() || conceptoPrecio <= 0) return;
    setLineasDirectas(prev => [...prev, {
      id:             tempId(),
      producto_id:    "",
      codigo_sku:     "LIBRE",
      descripcion:    conceptoDesc.trim(),
      cantidad:       conceptoCant,
      precio_unitario: conceptoPrecio,
      subtotal:       conceptoCant * conceptoPrecio,
      tipo_item:      "servicio", // Para que no descuente stock
    }]);
    setConceptoDesc("");
    setConceptoCant(1);
    setConceptoPrecio(0);
  };

  const cambiarCantidad = (id: string, delta: number) => {
    setLineasDirectas(prev => prev
      .map(l => l.id === id
        ? { ...l, cantidad: Math.max(1, l.cantidad + delta), subtotal: Math.max(1, l.cantidad + delta) * l.precio_unitario }
        : l
      )
    );
  };

  const quitarLinea = (id: string) => setLineasDirectas(prev => prev.filter(l => l.id !== id));

  const totalDirecto = lineasDirectas.reduce((s, l) => s + l.subtotal, 0);

  const [aplicaIva, setAplicaIva]       = useState(true);

  // ── Cálculos fiscales comunes ──
  const subtotalUsd  = modo === "desde_cotizacion" ? (cotizacion?.total || 0) : totalDirecto;
  const aplicaIgtf   = metodoPago === "usd_efectivo" || metodoPago === "zelle";
  const subtotalBs   = subtotalUsd * tasaBcv;
  const ivaBs        = aplicaIva ? subtotalBs * 0.16 : 0;
  const igtfBs       = aplicaIgtf ? subtotalBs * 0.03 : 0;
  const totalBs      = subtotalBs + ivaBs + igtfBs;

  // ── Descontar stock de un array de líneas ──
  const descontarStock = async (lineas: { producto_id?: string; item_id?: string; descripcion?: string; cantidad: number; tipo_item?: string }[]) => {
    for (const linea of lineas) {
      // Sólo descontamos productos (no servicios)
      if (linea.tipo_item && linea.tipo_item !== "producto") continue;

      const pid = linea.producto_id || linea.item_id;
      if (!pid) continue;

      // Leer stock actual y decrementar
      const { data: prod } = await supabase
        .from("productos")
        .select("stock")
        .eq("id", pid)
        .single();

      if (!prod) continue;

      const nuevoStock = Math.max(0, (prod.stock ?? 0) - linea.cantidad);
      await supabase
        .from("productos")
        .update({ stock: nuevoStock })
        .eq("id", pid);
    }
  };

  // ── Generar factura desde cotización ──
  const generarDesdeCotizacion = async () => {
    if (!cotizacion || tasaBcv <= 0) return;
    setGenerando(true);
    setError(null);

    try {
      const { data: numFactura, error: rpcErr } = await supabase.rpc("next_factura_number");
      if (rpcErr) throw new Error("Error al generar número de factura: " + rpcErr.message);

      const { data: factData, error: insErr } = await supabase.from("facturas").insert([{
        cotizacion_id: cotizacion.id,
        numero_factura: numFactura,
        tasa_bcv:       tasaBcv,
        metodo_pago:    metodoPago,
        aplica_igtf:    aplicaIgtf,
        aplica_iva:     aplicaIva,
        subtotal_usd:   subtotalUsd,
        subtotal_bs:    subtotalBs,
        iva_bs:         ivaBs,
        igtf_bs:        igtfBs,
        total_bs:       totalBs,
      }]).select().single();

      if (insErr) {
        if (insErr.code === "23505") throw new Error("Esta cotización ya fue facturada.");
        throw new Error("Error al guardar factura: " + insErr.message);
      }

      // ✅ Guardar los detalles en factura_detalles
      const detallesCot = cotizacion.cotizacion_detalles ?? [];
      if (factData && detallesCot.length > 0) {
        const detallesToInsert = detallesCot.map((d: any, idx: number) => ({
          factura_id:      factData.id,
          descripcion:     d.descripcion,
          cantidad:        d.cantidad,
          precio_unitario: d.precio_unitario,
          subtotal:        d.subtotal,
          tipo_item:       d.tipo_item || "producto",
          producto_id:     d.producto_id || d.item_id || null,
          orden:           idx
        }));
        await supabase.from("factura_detalles").insert(detallesToInsert);
      }

      // Marcar cotización como facturada
      await supabase.from("cotizaciones").update({ estado: "facturada" }).eq("id", cotizacion.id);

      // ✅ Descontar stock por cada línea de la cotización
      await descontarStock(cotizacion.cotizacion_detalles ?? []);

      setFacturaGenerada(numFactura);

      // Generar PDF
      const { exportarFacturaFiscalPDF } = await import("@/components/pdf/FacturaFiscalPDF");
      await exportarFacturaFiscalPDF({
        numeroFactura:  numFactura,
        numeroControl:  `00-${numFactura.split("-")[2]}`,
        fecha:          new Date(),
        cliente:        cotizacion.clientes,
        lineas:         cotizacion.cotizacion_detalles,
        tasaBcv,
        subtotalBs,
        ivaBs,
        igtfBs,
        totalBs,
        aplicaIgtf,
      });

    } catch (err: any) {
      setError(err.message || "Error desconocido al facturar.");
    } finally {
      setGenerando(false);
    }
  };

  // ── Generar factura directa ──
  const generarFacturaDirecta = async () => {
    if (lineasDirectas.length === 0 || tasaBcv <= 0) return;
    setGenerando(true);
    setError(null);

    try {
      const { data: numFactura, error: rpcErr } = await supabase.rpc("next_factura_number");
      if (rpcErr) throw new Error("Error al generar número de factura: " + rpcErr.message);

      const nombreCliente = clienteDirecto?.empresa || clienteDirecto?.contacto || "Cliente General";
      const rifCliente    = clienteDirecto?.rif_cedula || "";

      const { data: factData, error: insErr } = await supabase.from("facturas").insert([{
        cotizacion_id:  null,
        numero_factura: numFactura,
        tasa_bcv:       tasaBcv,
        metodo_pago:    metodoPago,
        aplica_igtf:    aplicaIgtf,
        aplica_iva:     aplicaIva,
        subtotal_usd:   subtotalUsd,
        subtotal_bs:    subtotalBs,
        iva_bs:         ivaBs,
        igtf_bs:        igtfBs,
        total_bs:       totalBs,
        cliente_nombre: nombreCliente,
        cliente_rif:    rifCliente,
        notas:          "Venta directa sin cotización previa",
      }]).select().single();

      if (insErr) throw new Error("Error al guardar factura: " + insErr.message);

      // ✅ Guardar los detalles en factura_detalles para las estadísticas
      if (factData && lineasDirectas.length > 0) {
        const detallesToInsert = lineasDirectas.map((l, idx) => ({
          factura_id:      factData.id,
          descripcion:     l.descripcion,
          cantidad:        l.cantidad,
          precio_unitario: l.precio_unitario,
          subtotal:        l.subtotal,
          tipo_item:       l.tipo_item || "producto",
          producto_id:     l.producto_id || null,
          orden:           idx
        }));
        await supabase.from("factura_detalles").insert(detallesToInsert);
      }

      // ✅ Descontar stock
      await descontarStock(lineasDirectas);

      setFacturaGenerada(numFactura);

      // Generar PDF con todos los datos del cliente
      const clientePDF = {
        empresa:    nombreCliente,
        rif_cedula: rifCliente || "V-00000000",
        contacto:   clienteDirecto?.contacto || nombreCliente,
        email:      clienteDirecto?.email    || "",
        telefono:   clienteDirecto?.telefono || "",
        direccion:  clienteDirecto?.direccion || "",
      };

      const { exportarFacturaFiscalPDF } = await import("@/components/pdf/FacturaFiscalPDF");
      await exportarFacturaFiscalPDF({
        numeroFactura:  numFactura,
        numeroControl:  `00-${numFactura.split("-")[2]}`,
        fecha:          new Date(),
        cliente:        clientePDF,
        lineas:         lineasDirectas.map(l => ({
          descripcion:     l.descripcion,
          cantidad:        l.cantidad,
          precio_unitario: l.precio_unitario,
          subtotal:        l.subtotal,
          tipo_item:       "producto",
        })),
        tasaBcv,
        subtotalBs,
        ivaBs,
        igtfBs,
        totalBs,
        aplicaIgtf,
      });

    } catch (err: any) {
      setError(err.message || "Error desconocido al facturar.");
    } finally {
      setGenerando(false);
    }
  };

  // ── Reset ──
  const reset = () => {
    setFacturaGenerada(null);
    setCotizacion(null);
    setQuery("");
    setLineasDirectas([]);
    setClienteDirecto(null);
    setError(null);
    setTasaBcv(0);
  };

  // ── Formulario fiscal (compartido entre ambos modos) ──
  const FormularioFiscal = ({ onGenerar, disabled }: { onGenerar: () => void; disabled: boolean }) => (
    <div className="p-6 space-y-6">
      <h4 className="text-sm font-bold text-[var(--ts-text-primary)] uppercase tracking-wide">
        Configuración Fiscal (Providencia 00071)
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tasa BCV */}
        <div>
          <label className="block text-xs font-semibold text-[var(--ts-text-muted)] mb-1">Tasa de Cambio (BCV)</label>
          <div className="relative">
            <input
              type="number" step="0.01"
              value={tasaBcv || ""}
              onChange={e => setTasaBcv(parseFloat(e.target.value) || 0)}
              className="w-full pl-3 pr-10 py-2 border border-[var(--ts-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--ts-red)]"
            />
            <button
              type="button" onClick={fetchBCVRate} disabled={cargandoTasa}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ts-red)] hover:text-red-700 disabled:opacity-50"
              title="Obtener tasa BCV"
            >
              <RefreshCw className={`w-4 h-4 ${cargandoTasa ? "animate-spin" : ""}`} />
            </button>
          </div>
          <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">Se obtiene automáticamente de DolarAPI.</p>
        </div>

        {/* Método de pago */}
        <div>
          <label className="block text-xs font-semibold text-[var(--ts-text-muted)] mb-1">Método de Pago</label>
          <select
            value={metodoPago}
            onChange={e => setMetodoPago(e.target.value as any)}
            className="w-full px-3 py-2 border border-[var(--ts-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--ts-red)] bg-[var(--ts-surface)]"
          >
            <option value="bs_transferencia">Transferencia / Pago Móvil (Bolívares)</option>
            <option value="usd_efectivo">Efectivo (Divisas)</option>
            <option value="zelle">Zelle / Transferencia Internacional</option>
          </select>
          <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">
            {aplicaIgtf ? "Aplica recargo del 3% por IGTF." : "No aplica IGTF (Pago en Bs)."}
          </p>
        </div>

        {/* Toggle IVA */}
        <div className="md:col-span-2 mt-2">
          <label className="flex items-center gap-2 cursor-pointer w-fit group">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={aplicaIva}
                onChange={(e) => setAplicaIva(e.target.checked)}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${aplicaIva ? "bg-[var(--ts-red)]" : "bg-[var(--ts-border)]"}`}></div>
              <div className={`absolute left-1 top-1 bg-[var(--ts-surface)] w-4 h-4 rounded-full transition-transform ${aplicaIva ? "translate-x-4" : ""}`}></div>
            </div>
            <div>
              <span className="text-sm font-bold text-[var(--ts-text-primary)] transition-colors group-hover:text-[var(--ts-red)]">
                Incluir IVA (16%)
              </span>
              <p className="text-[10px] text-[var(--ts-text-muted)]">Por defecto activado. Desmárcalo si la factura no lleva IVA.</p>
            </div>
          </label>
        </div>
      </div>

      {/* Resumen fiscal */}
      <div className="bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-lg p-5">
        <h5 className="text-xs font-bold text-[var(--ts-text-primary)] uppercase tracking-wide mb-3 border-b border-[var(--ts-border)] pb-2">
          Resumen a Facturar en Bolívares
        </h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--ts-text-muted)]">Base Imponible (USD)</span>
            <span className="font-medium">{formatUSD(subtotalUsd)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--ts-text-muted)]">Base Imponible (Bs)</span>
            <span className="font-medium">{formatBs(subtotalBs)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--ts-text-muted)]">IVA (16%)</span>
            <span className="font-medium">{formatBs(ivaBs)}</span>
          </div>
          {aplicaIgtf && (
            <div className="flex justify-between">
              <span className="text-[var(--ts-text-muted)]">IGTF (3%)</span>
              <span className="font-medium text-[var(--ts-red)]">{formatBs(igtfBs)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-[var(--ts-border)] pt-2 mt-2">
            <span className="font-bold text-[var(--ts-text-primary)] text-base">TOTAL A PAGAR</span>
            <span className="font-extrabold text-[var(--ts-red)] text-base">{formatBs(totalBs)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-[var(--ts-red)] bg-[var(--ts-red)]/10 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <button
        onClick={onGenerar}
        disabled={disabled || generando || tasaBcv <= 0}
        className="w-full flex items-center justify-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 disabled:opacity-50 text-[var(--ts-text-primary)] font-bold text-base py-4 rounded-xl transition-colors shadow-lg shadow-red-900/30"
      >
        {generando
          ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <FileText className="w-5 h-5" />
        }
        Emitir Factura Fiscal
      </button>
    </div>
  );

  // ── Pantalla de éxito ──
  if (facturaGenerada) {
    return (
      <div className="bg-[var(--ts-surface)] p-8 rounded-xl border border-green-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-[var(--ts-text-primary)] mb-2">¡Factura Emitida!</h3>
        <p className="text-[var(--ts-text-muted)] mb-2">
          La factura <strong className="text-[var(--ts-text-primary)]">{facturaGenerada}</strong> se guardó y el PDF se descargó.
        </p>
        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 inline-block mb-6">
          ✓ Stock actualizado automáticamente para los productos facturados.
        </p>
        <br />
        <button onClick={reset} className="text-[var(--ts-red)] hover:underline font-medium text-sm">
          Emitir otra factura
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Selector de Modo ── */}
      <div className="flex gap-2 bg-[var(--ts-surface-2)] p-1 rounded-xl">
        <button
          onClick={() => { setModo("desde_cotizacion"); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            modo === "desde_cotizacion"
              ? "bg-[var(--ts-surface)] text-[var(--ts-text-primary)] shadow-sm"
              : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
          }`}
        >
          <FileText className="w-4 h-4" />
          Desde Cotización
        </button>
        <button
          onClick={() => { setModo("venta_directa"); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            modo === "venta_directa"
              ? "bg-[var(--ts-surface)] text-[var(--ts-text-primary)] shadow-sm"
              : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Venta Directa
        </button>
      </div>

      {/* ════════════════════════════════════════
          MODO 1: Desde Cotización
      ════════════════════════════════════════ */}
      {modo === "desde_cotizacion" && (
        <div className="space-y-5">
          {/* Buscador */}
          <div className="bg-[var(--ts-surface)] p-6 rounded-xl border border-[var(--ts-border)] shadow-sm">
            <h2 className="text-sm font-bold text-[var(--ts-text-primary)] uppercase tracking-wide mb-4">
              Buscar Cotización
            </h2>
            <form onSubmit={buscarCotizacion} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ts-text-muted)]" />
                <input
                  type="text"
                  placeholder="Ej: COT-2026-001"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 border border-[var(--ts-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>
              <button
                type="submit" disabled={buscando || !query}
                className="bg-[var(--ts-text-primary)] hover:bg-black text-[var(--ts-text-primary)] px-6 py-3 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {buscando ? "Buscando..." : "Buscar"}
              </button>
            </form>
            {error && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[var(--ts-red)] bg-[var(--ts-red)]/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
          </div>

          {/* Cotización encontrada */}
          {cotizacion && (
            <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[var(--ts-border)] bg-[var(--ts-surface-2)] flex justify-between items-start">
                <div>
                  <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2 ${
                    cotizacion.estado === "facturada"
                      ? "bg-green-100 text-green-700"
                      : "bg-[var(--ts-red)]/10 text-[var(--ts-red)]"
                  }`}>
                    {cotizacion.estado === "facturada" ? "YA FACTURADA" : "LISTA PARA FACTURAR"}
                  </span>
                  <h3 className="text-xl font-bold text-[var(--ts-text-primary)]">{cotizacion.numero_cotizacion}</h3>
                  <p className="text-[var(--ts-text-muted)] mt-1 text-sm">
                    Cliente: <strong className="text-[var(--ts-text-primary)]">
                      {cotizacion.clientes?.empresa || cotizacion.clientes?.contacto}
                    </strong>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--ts-text-muted)] uppercase font-semibold">Total Base (USD)</p>
                  <p className="text-2xl font-extrabold text-[var(--ts-text-primary)] mt-1">{formatUSD(subtotalUsd)}</p>
                </div>
              </div>

              {cotizacion.estado === "facturada" ? (
                <div className="p-6 text-center">
                  <AlertCircle className="w-10 h-10 text-[var(--ts-red)] mx-auto mb-3" />
                  <p className="font-medium text-[var(--ts-text-primary)]">Esta cotización ya fue convertida en factura previamente.</p>
                </div>
              ) : (
                <FormularioFiscal onGenerar={generarDesdeCotizacion} disabled={!cotizacion} />
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          MODO 2: Venta Directa
      ════════════════════════════════════════ */}
      {modo === "venta_directa" && (
        <div className="space-y-5">
          {/* ── Selector de cliente ── */}
          <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] shadow-sm overflow-hidden">
            <div className="bg-[var(--ts-text-primary)] px-5 py-3 flex items-center justify-between">
              <span className="text-[var(--ts-text-primary)] text-sm font-bold uppercase tracking-wide">
                Cliente
              </span>
              <span className="text-[var(--ts-text-muted)] text-xs">
                Busca por RIF/Cédula para identificar con precisión
              </span>
            </div>
            <div className="p-4">
              <ClientePicker
                onSelect={setClienteDirecto}
                clienteSeleccionado={clienteDirecto}
              />
            </div>
          </div>

          {/* ── Buscador de productos ── */}
          <div className="bg-[var(--ts-surface)] p-5 rounded-xl border border-[var(--ts-border)] shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-bold text-[var(--ts-text-primary)] uppercase tracking-wide mb-3">
                Agregar Productos del Stock
              </h2>
              <BuscadorInline onAdd={agregarProductoDirecto} />
            </div>

            <div className="pl-0 md:pl-6 md:border-l border-[var(--ts-border)]">
              <h2 className="text-sm font-bold text-[var(--ts-text-primary)] uppercase tracking-wide mb-3">
                Concepto Libre
              </h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Descripción del concepto..."
                  value={conceptoDesc}
                  onChange={(e) => setConceptoDesc(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-[var(--ts-border)] rounded-lg focus:outline-none focus:border-[var(--ts-red)] bg-transparent"
                />
                <div className="flex gap-2">
                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      placeholder="Cant."
                      value={conceptoCant || ""}
                      onChange={(e) => setConceptoCant(Number(e.target.value))}
                      className="w-full text-sm px-3 py-2 border border-[var(--ts-border)] rounded-lg focus:outline-none focus:border-[var(--ts-red)] bg-transparent"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--ts-text-muted)]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Precio Unitario"
                      value={conceptoPrecio || ""}
                      onChange={(e) => setConceptoPrecio(Number(e.target.value))}
                      className="w-full pl-6 pr-3 py-2 text-sm border border-[var(--ts-border)] rounded-lg focus:outline-none focus:border-[var(--ts-red)] bg-transparent"
                    />
                  </div>
                  <button
                    onClick={agregarConceptoLibre}
                    disabled={!conceptoDesc.trim() || conceptoPrecio <= 0}
                    className="bg-[#111] hover:bg-black text-[var(--ts-text-primary)] px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50 transition-colors"
                  >
                    Añadir
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de items */}
          {lineasDirectas.length > 0 && (
            <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)] flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[var(--ts-red)]" />
                <span className="text-sm font-bold text-[var(--ts-text-primary)]">
                  Carrito de Venta ({lineasDirectas.length} producto{lineasDirectas.length !== 1 ? "s" : ""})
                </span>
              </div>
              <div className="divide-y divide-[var(--ts-border-2)]">
                {lineasDirectas.map(linea => (
                  <div key={linea.id} className="flex items-center gap-3 px-5 py-3">
                    <Package className="w-4 h-4 text-[var(--ts-text-muted)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--ts-text-primary)] truncate">{linea.descripcion}</p>
                      <p className="text-xs text-[var(--ts-text-muted)]">{formatUSD(linea.precio_unitario)} c/u</p>
                    </div>
                    {/* Controles de cantidad */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => cambiarCantidad(linea.id, -1)}
                        className="w-7 h-7 rounded-full border border-[var(--ts-border)] flex items-center justify-center hover:border-[var(--ts-red)] hover:text-[var(--ts-red)] transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{linea.cantidad}</span>
                      <button
                        onClick={() => cambiarCantidad(linea.id, 1)}
                        className="w-7 h-7 rounded-full border border-[var(--ts-border)] flex items-center justify-center hover:border-[var(--ts-red)] hover:text-[var(--ts-red)] transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-[var(--ts-red)] w-20 text-right">
                      {formatUSD(linea.subtotal)}
                    </span>
                    <button
                      onClick={() => quitarLinea(linea.id)}
                      className="text-[#d9d9d9] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 bg-[var(--ts-surface-2)] border-t border-[var(--ts-border)] flex justify-between items-center">
                <span className="text-sm font-semibold text-[var(--ts-text-muted)]">Subtotal USD</span>
                <span className="text-lg font-extrabold text-[var(--ts-text-primary)]">{formatUSD(totalDirecto)}</span>
              </div>
            </div>
          )}

          {/* Formulario Fiscal solo si hay productos */}
          {lineasDirectas.length > 0 && (
            <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] shadow-sm overflow-hidden">
              <FormularioFiscal
                onGenerar={generarFacturaDirecta}
                disabled={lineasDirectas.length === 0}
              />
            </div>
          )}

          {lineasDirectas.length === 0 && (
            <div className="bg-[var(--ts-surface)] rounded-xl border border-dashed border-[var(--ts-border)] p-10 text-center">
              <ShoppingCart className="w-10 h-10 text-[#d9d9d9] mx-auto mb-3" />
              <p className="text-sm font-medium text-[var(--ts-text-muted)]">Agrega productos para comenzar la venta directa</p>
              <p className="text-xs text-[var(--ts-text-muted)] mt-1">Busca por nombre, SKU o código de modelo</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
