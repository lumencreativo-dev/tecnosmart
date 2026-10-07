"use client";

import { useState } from "react";
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
      <div className="flex items-center gap-2 border border-[#d9d9d9] rounded-lg px-3 py-2.5 focus-within:border-[#c9242b] bg-white">
        <Search className="w-4 h-4 text-[#6e6e6e] shrink-0" />
        <input
          type="text"
          value={q}
          onChange={e => buscar(e.target.value)}
          placeholder="Buscar por nombre o SKU..."
          className="flex-1 text-sm outline-none bg-transparent"
        />
        {loading && <div className="w-4 h-4 border-2 border-[#c9242b] border-t-transparent rounded-full animate-spin shrink-0" />}
      </div>
      {show && resultados.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white border border-[#d9d9d9] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {resultados.map(p => (
            <li key={p.id}>
              <button
                onClick={() => { onAdd(p); setQ(""); setResultados([]); setShow(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#f8fafc] text-left transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-[#111]">{p.nombre}</p>
                  <p className="text-xs text-[#6e6e6e]">SKU: {p.codigo_sku} · Stock: {p.stock ?? 0}</p>
                </div>
                <span className="text-sm font-bold text-[#c9242b]">{formatUSD(p.precio_venta)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {show && resultados.length === 0 && !loading && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-[#d9d9d9] rounded-lg px-4 py-3 text-sm text-[#6e6e6e] shadow">
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
      }]);
    }
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

  // ── Cálculos fiscales comunes ──
  const subtotalUsd  = modo === "desde_cotizacion" ? (cotizacion?.total || 0) : totalDirecto;
  const aplicaIgtf   = metodoPago === "usd_efectivo" || metodoPago === "zelle";
  const subtotalBs   = subtotalUsd * tasaBcv;
  const ivaBs        = subtotalBs * 0.16;
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

      const { error: insErr } = await supabase.from("facturas").insert([{
        cotizacion_id: cotizacion.id,
        numero_factura: numFactura,
        tasa_bcv:       tasaBcv,
        metodo_pago:    metodoPago,
        aplica_igtf:    aplicaIgtf,
        subtotal_usd:   subtotalUsd,
        subtotal_bs:    subtotalBs,
        iva_bs:         ivaBs,
        igtf_bs:        igtfBs,
        total_bs:       totalBs,
      }]);

      if (insErr) {
        if (insErr.code === "23505") throw new Error("Esta cotización ya fue facturada.");
        throw new Error("Error al guardar factura: " + insErr.message);
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

      const { error: insErr } = await supabase.from("facturas").insert([{
        cotizacion_id:  null,
        numero_factura: numFactura,
        tasa_bcv:       tasaBcv,
        metodo_pago:    metodoPago,
        aplica_igtf:    aplicaIgtf,
        subtotal_usd:   subtotalUsd,
        subtotal_bs:    subtotalBs,
        iva_bs:         ivaBs,
        igtf_bs:        igtfBs,
        total_bs:       totalBs,
        cliente_nombre: nombreCliente,
        cliente_rif:    rifCliente,
        notas:          "Venta directa sin cotización previa",
      }]);

      if (insErr) throw new Error("Error al guardar factura: " + insErr.message);

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
      <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wide">
        Configuración Fiscal (Providencia 00071)
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tasa BCV */}
        <div>
          <label className="block text-xs font-semibold text-[#6e6e6e] mb-1">Tasa de Cambio (BCV)</label>
          <div className="relative">
            <input
              type="number" step="0.01"
              value={tasaBcv || ""}
              onChange={e => setTasaBcv(parseFloat(e.target.value) || 0)}
              className="w-full pl-3 pr-10 py-2 border border-[#d9d9d9] rounded-lg text-sm focus:outline-none focus:border-[#c9242b]"
            />
            <button
              type="button" onClick={fetchBCVRate} disabled={cargandoTasa}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#c9242b] hover:text-red-700 disabled:opacity-50"
              title="Obtener tasa BCV"
            >
              <RefreshCw className={`w-4 h-4 ${cargandoTasa ? "animate-spin" : ""}`} />
            </button>
          </div>
          <p className="text-[10px] text-[#6e6e6e] mt-1">Se obtiene automáticamente de DolarAPI.</p>
        </div>

        {/* Método de pago */}
        <div>
          <label className="block text-xs font-semibold text-[#6e6e6e] mb-1">Método de Pago</label>
          <select
            value={metodoPago}
            onChange={e => setMetodoPago(e.target.value as any)}
            className="w-full px-3 py-2 border border-[#d9d9d9] rounded-lg text-sm focus:outline-none focus:border-[#c9242b] bg-white"
          >
            <option value="bs_transferencia">Transferencia / Pago Móvil (Bolívares)</option>
            <option value="usd_efectivo">Efectivo (Divisas)</option>
            <option value="zelle">Zelle / Transferencia Internacional</option>
          </select>
          <p className="text-[10px] text-[#6e6e6e] mt-1">
            {aplicaIgtf ? "Aplica recargo del 3% por IGTF." : "No aplica IGTF (Pago en Bs)."}
          </p>
        </div>
      </div>

      {/* Resumen fiscal */}
      <div className="bg-[#f8fafc] border border-[#d9d9d9] rounded-lg p-5">
        <h5 className="text-xs font-bold text-[#111111] uppercase tracking-wide mb-3 border-b border-[#d9d9d9] pb-2">
          Resumen a Facturar en Bolívares
        </h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6e6e6e]">Base Imponible (USD)</span>
            <span className="font-medium">{formatUSD(subtotalUsd)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6e6e6e]">Base Imponible (Bs)</span>
            <span className="font-medium">{formatBs(subtotalBs)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6e6e6e]">IVA (16%)</span>
            <span className="font-medium">{formatBs(ivaBs)}</span>
          </div>
          {aplicaIgtf && (
            <div className="flex justify-between">
              <span className="text-[#6e6e6e]">IGTF (3%)</span>
              <span className="font-medium text-[#c9242b]">{formatBs(igtfBs)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-[#d9d9d9] pt-2 mt-2">
            <span className="font-bold text-[#111111] text-base">TOTAL A PAGAR</span>
            <span className="font-extrabold text-[#c9242b] text-base">{formatBs(totalBs)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-[#c9242b] bg-[#c9242b]/10 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <button
        onClick={onGenerar}
        disabled={disabled || generando || tasaBcv <= 0}
        className="w-full flex items-center justify-center gap-2 bg-[#c9242b] hover:bg-red-700 disabled:opacity-50 text-white font-bold text-base py-4 rounded-xl transition-colors shadow-lg shadow-red-900/30"
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
      <div className="bg-white p-8 rounded-xl border border-green-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-[#111] mb-2">¡Factura Emitida!</h3>
        <p className="text-[#6e6e6e] mb-2">
          La factura <strong className="text-[#111]">{facturaGenerada}</strong> se guardó y el PDF se descargó.
        </p>
        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 inline-block mb-6">
          ✓ Stock actualizado automáticamente para los productos facturados.
        </p>
        <br />
        <button onClick={reset} className="text-[#c9242b] hover:underline font-medium text-sm">
          Emitir otra factura
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Selector de Modo ── */}
      <div className="flex gap-2 bg-[#f0f0f0] p-1 rounded-xl">
        <button
          onClick={() => { setModo("desde_cotizacion"); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            modo === "desde_cotizacion"
              ? "bg-white text-[#111] shadow-sm"
              : "text-[#6e6e6e] hover:text-[#111]"
          }`}
        >
          <FileText className="w-4 h-4" />
          Desde Cotización
        </button>
        <button
          onClick={() => { setModo("venta_directa"); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            modo === "venta_directa"
              ? "bg-white text-[#111] shadow-sm"
              : "text-[#6e6e6e] hover:text-[#111]"
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
          <div className="bg-white p-6 rounded-xl border border-[#d9d9d9] shadow-sm">
            <h2 className="text-sm font-bold text-[#111] uppercase tracking-wide mb-4">
              Buscar Cotización
            </h2>
            <form onSubmit={buscarCotizacion} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e6e6e]" />
                <input
                  type="text"
                  placeholder="Ej: COT-2026-001"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 border border-[#d9d9d9] rounded-lg text-sm focus:outline-none focus:border-[#c9242b]"
                />
              </div>
              <button
                type="submit" disabled={buscando || !query}
                className="bg-[#111] hover:bg-black text-white px-6 py-3 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {buscando ? "Buscando..." : "Buscar"}
              </button>
            </form>
            {error && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#c9242b] bg-[#c9242b]/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
          </div>

          {/* Cotización encontrada */}
          {cotizacion && (
            <div className="bg-white rounded-xl border border-[#d9d9d9] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#e5e5e5] bg-gray-50 flex justify-between items-start">
                <div>
                  <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2 ${
                    cotizacion.estado === "facturada"
                      ? "bg-green-100 text-green-700"
                      : "bg-[#c9242b]/10 text-[#c9242b]"
                  }`}>
                    {cotizacion.estado === "facturada" ? "YA FACTURADA" : "LISTA PARA FACTURAR"}
                  </span>
                  <h3 className="text-xl font-bold text-[#111]">{cotizacion.numero_cotizacion}</h3>
                  <p className="text-[#6e6e6e] mt-1 text-sm">
                    Cliente: <strong className="text-[#111]">
                      {cotizacion.clientes?.empresa || cotizacion.clientes?.contacto}
                    </strong>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#6e6e6e] uppercase font-semibold">Total Base (USD)</p>
                  <p className="text-2xl font-extrabold text-[#111] mt-1">{formatUSD(subtotalUsd)}</p>
                </div>
              </div>

              {cotizacion.estado === "facturada" ? (
                <div className="p-6 text-center">
                  <AlertCircle className="w-10 h-10 text-[#c9242b] mx-auto mb-3" />
                  <p className="font-medium text-[#111]">Esta cotización ya fue convertida en factura previamente.</p>
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
          <div className="bg-white rounded-xl border border-[#d9d9d9] shadow-sm overflow-hidden">
            <div className="bg-[#111] px-5 py-3 flex items-center justify-between">
              <span className="text-white text-sm font-bold uppercase tracking-wide">
                Cliente
              </span>
              <span className="text-[#a0a0a0] text-xs">
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
          <div className="bg-white p-5 rounded-xl border border-[#d9d9d9] shadow-sm">
            <h2 className="text-sm font-bold text-[#111] uppercase tracking-wide mb-3">
              Agregar Productos
            </h2>
            <BuscadorInline onAdd={agregarProductoDirecto} />
          </div>

          {/* Lista de items */}
          {lineasDirectas.length > 0 && (
            <div className="bg-white rounded-xl border border-[#d9d9d9] shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-[#f8fafc] border-b border-[#e5e5e5] flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#c9242b]" />
                <span className="text-sm font-bold text-[#111]">
                  Carrito de Venta ({lineasDirectas.length} producto{lineasDirectas.length !== 1 ? "s" : ""})
                </span>
              </div>
              <div className="divide-y divide-[#f0f0f0]">
                {lineasDirectas.map(linea => (
                  <div key={linea.id} className="flex items-center gap-3 px-5 py-3">
                    <Package className="w-4 h-4 text-[#6e6e6e] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111] truncate">{linea.descripcion}</p>
                      <p className="text-xs text-[#6e6e6e]">{formatUSD(linea.precio_unitario)} c/u</p>
                    </div>
                    {/* Controles de cantidad */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => cambiarCantidad(linea.id, -1)}
                        className="w-7 h-7 rounded-full border border-[#d9d9d9] flex items-center justify-center hover:border-[#c9242b] hover:text-[#c9242b] transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{linea.cantidad}</span>
                      <button
                        onClick={() => cambiarCantidad(linea.id, 1)}
                        className="w-7 h-7 rounded-full border border-[#d9d9d9] flex items-center justify-center hover:border-[#c9242b] hover:text-[#c9242b] transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-[#c9242b] w-20 text-right">
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
              <div className="px-5 py-3 bg-[#f8fafc] border-t border-[#e5e5e5] flex justify-between items-center">
                <span className="text-sm font-semibold text-[#6e6e6e]">Subtotal USD</span>
                <span className="text-lg font-extrabold text-[#111]">{formatUSD(totalDirecto)}</span>
              </div>
            </div>
          )}

          {/* Formulario Fiscal solo si hay productos */}
          {lineasDirectas.length > 0 && (
            <div className="bg-white rounded-xl border border-[#d9d9d9] shadow-sm overflow-hidden">
              <FormularioFiscal
                onGenerar={generarFacturaDirecta}
                disabled={lineasDirectas.length === 0}
              />
            </div>
          )}

          {lineasDirectas.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-[#d9d9d9] p-10 text-center">
              <ShoppingCart className="w-10 h-10 text-[#d9d9d9] mx-auto mb-3" />
              <p className="text-sm font-medium text-[#6e6e6e]">Agrega productos para comenzar la venta directa</p>
              <p className="text-xs text-[#a0a0a0] mt-1">Busca por nombre, SKU o código de modelo</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
