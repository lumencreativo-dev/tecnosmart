"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search, FileText, CheckCircle2, AlertCircle,
  RefreshCw, ShoppingCart, Plus, Minus, Trash2,
  ArrowRight, Package, Building2,
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
  const searchParams = useSearchParams();
  const initialModo = (searchParams.get("modo") as Modo) || "desde_cotizacion";

  const [modo, setModo] = useState<Modo>(initialModo);

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
  const [metodoPago, setMetodoPago]       = useState<"bs_transferencia" | "usd_efectivo" | "zelle" | "binance">("bs_transferencia");

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

  useEffect(() => {
    if (initialModo === "venta_directa" && searchParams.get("cliente_id")) {
      const cId = searchParams.get("cliente_id");
      const cNombre = searchParams.get("cliente_nombre");
      const cRif = searchParams.get("cliente_rif");
      const cTelf = searchParams.get("cliente_telefono");
      const sNombre = searchParams.get("servicio");
      const sMonto = searchParams.get("monto");

      if (cId) {
        setClienteDirecto({
          id: cId,
          empresa: cNombre || "",
          contacto: cNombre || "",
          rif_cedula: cRif || "",
          telefono: cTelf || "",
          tipo: "cliente_normal"
        });
      }

      if (sNombre && sMonto && lineasDirectas.length === 0) {
        setLineasDirectas([{
          id: "svc-" + Date.now(),
          producto_id: "",
          codigo_sku: "SVC",
          descripcion: sNombre,
          cantidad: 1,
          precio_unitario: Number(sMonto),
          subtotal: Number(sMonto)
        }]);
      }
    }
  }, [searchParams]);

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
    if (data.clientes?.es_contribuyente_especial) {
      setAplicaRetencionIva(true);
      if (typeof data.clientes.retencion_iva_pct === "number") setRetencionIvaPct(data.clientes.retencion_iva_pct);
      if (typeof data.clientes.retencion_islr_pct === "number") {
        setRetencionIslrPct(data.clientes.retencion_islr_pct);
        setAplicaRetencionIslr(true);
      }
    }
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
  const [ivaPct, setIvaPct]             = useState(16);
  const [aplicaIgtf, setAplicaIgtf]     = useState(false);
  const [igtfPct, setIgtfPct]           = useState(3);

  // ── Retenciones Fiscales (Contribuyente Especial) ──
  const [aplicaRetencionIva, setAplicaRetencionIva]   = useState(false);
  const [retencionIvaPct, setRetencionIvaPct]         = useState(75);
  const [aplicaRetencionIslr, setAplicaRetencionIslr] = useState(false);
  const [retencionIslrPct, setRetencionIslrPct]       = useState(2);

  // Sincronizar IGTF sugerido al cambiar método de pago (siempre editable por el usuario)
  useEffect(() => {
    const esDivisa = metodoPago === "usd_efectivo" || metodoPago === "zelle" || metodoPago === "binance";
    setAplicaIgtf(esDivisa);
  }, [metodoPago]);

  // ── Cálculos fiscales comunes ──
  const subtotalUsd  = modo === "desde_cotizacion" ? (cotizacion?.total || 0) : totalDirecto;
  const subtotalBs   = subtotalUsd * tasaBcv;
  const ivaBs        = aplicaIva ? subtotalBs * (ivaPct / 100) : 0;
  const igtfBs       = aplicaIgtf ? subtotalBs * (igtfPct / 100) : 0;
  const totalBs      = subtotalBs + ivaBs + igtfBs;

  // ── Retenciones ──
  const retencionIvaBs  = (aplicaIva && aplicaRetencionIva) ? (ivaBs * (retencionIvaPct / 100)) : 0;
  const retencionIslrBs = aplicaRetencionIslr ? (subtotalBs * (retencionIslrPct / 100)) : 0;
  const totalNetoBs     = Math.max(0, totalBs - retencionIvaBs - retencionIslrBs);

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

      const infoRetenciones = [
        aplicaRetencionIva && retencionIvaBs > 0 ? `Ret. IVA ${retencionIvaPct}% (-Bs. ${retencionIvaBs.toFixed(2)})` : null,
        aplicaRetencionIslr && retencionIslrBs > 0 ? `Ret. ISLR ${retencionIslrPct}% (-Bs. ${retencionIslrBs.toFixed(2)})` : null,
        (aplicaRetencionIva || aplicaRetencionIslr) ? `Neto a Cobrar: Bs. ${totalNetoBs.toFixed(2)}` : null
      ].filter(Boolean).join(" | ");

      const facturaPayload: any = {
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
        aplica_retencion_iva: aplicaRetencionIva,
        retencion_iva_pct: retencionIvaPct,
        retencion_iva_bs: retencionIvaBs,
        aplica_retencion_islr: aplicaRetencionIslr,
        retencion_islr_pct: retencionIslrPct,
        retencion_islr_bs: retencionIslrBs,
        total_neto_bs: totalNetoBs,
        notas: infoRetenciones ? `${cotizacion.notas || ""} [${infoRetenciones}]`.trim() : cotizacion.notas,
      };

      let factData = null;
      const { data: resData, error: insErr } = await supabase.from("facturas").insert([facturaPayload]).select().single();

      if (insErr) {
        if (insErr.code === "23505") throw new Error("Esta cotización ya fue facturada.");
        // Fallback por si la base de datos no tiene las columnas de retención aún
        const fallbackPayload = {
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
          notas: infoRetenciones ? `${cotizacion.notas || ""} [${infoRetenciones}]`.trim() : cotizacion.notas,
        };
        const { data: fallbackData, error: fbErr } = await supabase.from("facturas").insert([fallbackPayload]).select().single();
        if (fbErr) throw new Error("Error al guardar factura: " + fbErr.message);
        factData = fallbackData;
      } else {
        factData = resData;
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
        ivaPct,
        igtfBs,
        igtfPct,
        totalBs,
        aplicaIgtf,
        aplicaRetencionIva,
        retencionIvaPct,
        retencionIvaBs,
        aplicaRetencionIslr,
        retencionIslrPct,
        retencionIslrBs,
        totalNetoBs,
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

      const infoRetenciones = [
        aplicaRetencionIva && retencionIvaBs > 0 ? `Ret. IVA ${retencionIvaPct}% (-Bs. ${retencionIvaBs.toFixed(2)})` : null,
        aplicaRetencionIslr && retencionIslrBs > 0 ? `Ret. ISLR ${retencionIslrPct}% (-Bs. ${retencionIslrBs.toFixed(2)})` : null,
        (aplicaRetencionIva || aplicaRetencionIslr) ? `Neto a Cobrar: Bs. ${totalNetoBs.toFixed(2)}` : null
      ].filter(Boolean).join(" | ");

      const directPayload: any = {
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
        aplica_retencion_iva: aplicaRetencionIva,
        retencion_iva_pct: retencionIvaPct,
        retencion_iva_bs: retencionIvaBs,
        aplica_retencion_islr: aplicaRetencionIslr,
        retencion_islr_pct: retencionIslrPct,
        retencion_islr_bs: retencionIslrBs,
        total_neto_bs: totalNetoBs,
        notas: infoRetenciones ? `Venta directa [${infoRetenciones}]` : "Venta directa sin cotización previa",
      };

      let factData = null;
      const { data: resData, error: insErr } = await supabase.from("facturas").insert([directPayload]).select().single();

      if (insErr) {
        // Fallback por si la base de datos no tiene las columnas de retención aún
        const fbPayload = {
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
          notas: infoRetenciones ? `Venta directa [${infoRetenciones}]` : "Venta directa sin cotización previa",
        };
        const { data: fbData, error: fbErr } = await supabase.from("facturas").insert([fbPayload]).select().single();
        if (fbErr) throw new Error("Error al guardar factura: " + fbErr.message);
        factData = fbData;
      } else {
        factData = resData;
      }

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
        ivaPct,
        igtfBs,
        igtfPct,
        totalBs,
        aplicaIgtf,
        aplicaRetencionIva,
        retencionIvaPct,
        retencionIvaBs,
        aplicaRetencionIslr,
        retencionIslrPct,
        retencionIslrBs,
        totalNetoBs,
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
    setAplicaIva(true);
    setIvaPct(16);
    setAplicaIgtf(false);
    setIgtfPct(3);
    setAplicaRetencionIva(false);
    setRetencionIvaPct(75);
    setAplicaRetencionIslr(false);
    setRetencionIslrPct(2);
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
            <option value="binance">Binance (USDT)</option>
          </select>
          <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">
            {aplicaIgtf ? `Aplica recargo del ${igtfPct}% por IGTF.` : "No aplica IGTF."}
          </p>
        </div>

        {/* ── Impuestos y Retenciones Fiscales ── */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--ts-border)] pb-2 gap-2">
            <div>
              <span className="text-xs font-bold text-[var(--ts-text-primary)] uppercase tracking-wide">
                Impuestos y Retenciones Fiscales
              </span>
              <p className="text-[10px] text-[var(--ts-text-muted)]">
                Personaliza alícuotas libremente o apaga los que no apliquen
              </p>
            </div>
            {/* Presets rápidos */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setAplicaIva(true);
                  setIvaPct(16);
                  setAplicaIgtf(true);
                  setIgtfPct(3);
                  setAplicaRetencionIva(true);
                  setRetencionIvaPct(75);
                  setAplicaRetencionIslr(true);
                  setRetencionIslrPct(2);
                }}
                className="text-[11px] px-2.5 py-1 rounded bg-[var(--ts-surface)] hover:bg-[var(--ts-surface-2)] border border-[var(--ts-border)] font-semibold text-[var(--ts-text-primary)] transition-colors shadow-sm"
                title="Activar IVA (16%), IGTF (3%), Ret. IVA (75%) y Ret. ISLR (2%)"
              >
                + Incluir Todo
              </button>
              <button
                type="button"
                onClick={() => {
                  setAplicaIva(true);
                  setIvaPct(16);
                  setAplicaIgtf(false);
                  setAplicaRetencionIva(false);
                  setAplicaRetencionIslr(false);
                }}
                className="text-[11px] px-2.5 py-1 rounded bg-[var(--ts-surface)] hover:bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] transition-colors"
              >
                Solo IVA (16%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAplicaIva(false);
                  setAplicaIgtf(false);
                  setAplicaRetencionIva(false);
                  setAplicaRetencionIslr(false);
                }}
                className="text-[11px] px-2.5 py-1 rounded bg-[var(--ts-surface)] hover:bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-[var(--ts-text-muted)] hover:text-red-500 transition-colors"
              >
                Apagar Todos
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. IVA */}
            <div className={`p-4 rounded-xl border transition-all ${
              aplicaIva
                ? "bg-[var(--ts-surface-2)] border-[var(--ts-border)]"
                : "bg-[var(--ts-surface)] border-[var(--ts-border)] opacity-60"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={aplicaIva}
                      onChange={(e) => setAplicaIva(e.target.checked)}
                    />
                    <div className={`block w-9 h-5 rounded-full transition-colors ${
                      aplicaIva ? "bg-[var(--ts-red)]" : "bg-[var(--ts-border)]"
                    }`}></div>
                    <div className={`absolute left-0.5 top-0.5 bg-[var(--ts-surface)] w-4 h-4 rounded-full transition-transform ${
                      aplicaIva ? "translate-x-4" : ""
                    }`}></div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--ts-text-primary)] group-hover:text-[var(--ts-red)]">
                      IVA ({ivaPct}%)
                    </span>
                    <p className="text-[10px] text-[var(--ts-text-muted)]">Impuesto al Valor Agregado</p>
                  </div>
                </label>
                <span className="text-xs font-bold text-[var(--ts-text-primary)]">
                  {aplicaIva ? formatBs(ivaBs) : "Bs. 0,00"}
                </span>
              </div>

              {aplicaIva && (
                <div className="flex items-center justify-between pt-2 border-t border-[var(--ts-border)]">
                  <span className="text-[11px] text-[var(--ts-text-muted)]">Alícuota IVA:</span>
                  <div className="flex items-center gap-1.5">
                    {[16, 8].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setIvaPct(pct)}
                        className={`text-[11px] px-2.5 py-0.5 rounded font-bold transition-colors ${
                          ivaPct === pct
                            ? "bg-[var(--ts-red)] text-white"
                            : "bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={ivaPct}
                        onChange={(e) => setIvaPct(parseFloat(e.target.value) || 0)}
                        className="w-14 text-center border border-[var(--ts-border)] rounded px-1 py-0.5 text-xs bg-[var(--ts-surface)] focus:outline-none focus:border-[var(--ts-red)]"
                      />
                      <span className="text-[11px] text-[var(--ts-text-muted)]">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. IGTF */}
            <div className={`p-4 rounded-xl border transition-all ${
              aplicaIgtf
                ? "bg-[var(--ts-surface-2)] border-[var(--ts-border)]"
                : "bg-[var(--ts-surface)] border-[var(--ts-border)] opacity-60"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={aplicaIgtf}
                      onChange={(e) => setAplicaIgtf(e.target.checked)}
                    />
                    <div className={`block w-9 h-5 rounded-full transition-colors ${
                      aplicaIgtf ? "bg-[var(--ts-red)]" : "bg-[var(--ts-border)]"
                    }`}></div>
                    <div className={`absolute left-0.5 top-0.5 bg-[var(--ts-surface)] w-4 h-4 rounded-full transition-transform ${
                      aplicaIgtf ? "translate-x-4" : ""
                    }`}></div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--ts-text-primary)] group-hover:text-[var(--ts-red)]">
                      IGTF ({igtfPct}%)
                    </span>
                    <p className="text-[10px] text-[var(--ts-text-muted)]">Grandes Transacciones Financieras</p>
                  </div>
                </label>
                <span className="text-xs font-bold text-[var(--ts-text-primary)]">
                  {aplicaIgtf ? formatBs(igtfBs) : "Bs. 0,00"}
                </span>
              </div>

              {aplicaIgtf && (
                <div className="flex items-center justify-between pt-2 border-t border-[var(--ts-border)]">
                  <span className="text-[11px] text-[var(--ts-text-muted)]">Alícuota IGTF:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIgtfPct(3)}
                      className={`text-[11px] px-2.5 py-0.5 rounded font-bold transition-colors ${
                        igtfPct === 3
                          ? "bg-[var(--ts-red)] text-white"
                          : "bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                      }`}
                    >
                      3%
                    </button>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={igtfPct}
                        onChange={(e) => setIgtfPct(parseFloat(e.target.value) || 0)}
                        className="w-14 text-center border border-[var(--ts-border)] rounded px-1 py-0.5 text-xs bg-[var(--ts-surface)] focus:outline-none focus:border-[var(--ts-red)]"
                      />
                      <span className="text-[11px] text-[var(--ts-text-muted)]">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Retención IVA */}
            <div className={`p-4 rounded-xl border transition-all ${
              aplicaRetencionIva && aplicaIva
                ? "bg-[var(--ts-surface-2)] border-[var(--ts-red)]/40 shadow-sm"
                : "bg-[var(--ts-surface)] border-[var(--ts-border)] opacity-60"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      disabled={!aplicaIva}
                      checked={aplicaRetencionIva && aplicaIva}
                      onChange={(e) => setAplicaRetencionIva(e.target.checked)}
                    />
                    <div className={`block w-9 h-5 rounded-full transition-colors ${
                      aplicaRetencionIva && aplicaIva ? "bg-[var(--ts-red)]" : "bg-[var(--ts-border)]"
                    }`}></div>
                    <div className={`absolute left-0.5 top-0.5 bg-[var(--ts-surface)] w-4 h-4 rounded-full transition-transform ${
                      aplicaRetencionIva && aplicaIva ? "translate-x-4" : ""
                    }`}></div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--ts-text-primary)] group-hover:text-[var(--ts-red)]">
                      Retención IVA ({retencionIvaPct}%)
                    </span>
                    <p className="text-[10px] text-[var(--ts-text-muted)]">Contribuyentes Especiales (s/ IVA)</p>
                  </div>
                </label>
                {aplicaRetencionIva && aplicaIva && (
                  <span className="text-xs font-bold text-[var(--ts-red)]">
                    -{formatBs(retencionIvaBs)}
                  </span>
                )}
              </div>

              {aplicaRetencionIva && aplicaIva && (
                <div className="flex items-center justify-between pt-2 border-t border-[var(--ts-border)]">
                  <span className="text-[11px] text-[var(--ts-text-muted)]">Alícuota Retención:</span>
                  <div className="flex items-center gap-1.5">
                    {[75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setRetencionIvaPct(pct)}
                        className={`text-[11px] px-2.5 py-0.5 rounded font-bold transition-colors ${
                          retencionIvaPct === pct
                            ? "bg-[var(--ts-red)] text-white"
                            : "bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={retencionIvaPct}
                        onChange={(e) => setRetencionIvaPct(parseFloat(e.target.value) || 0)}
                        className="w-14 text-center border border-[var(--ts-border)] rounded px-1 py-0.5 text-xs bg-[var(--ts-surface)] focus:outline-none focus:border-[var(--ts-red)]"
                      />
                      <span className="text-[11px] text-[var(--ts-text-muted)]">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Retención ISLR */}
            <div className={`p-4 rounded-xl border transition-all ${
              aplicaRetencionIslr
                ? "bg-[var(--ts-surface-2)] border-[var(--ts-red)]/40 shadow-sm"
                : "bg-[var(--ts-surface)] border-[var(--ts-border)] opacity-60"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={aplicaRetencionIslr}
                      onChange={(e) => setAplicaRetencionIslr(e.target.checked)}
                    />
                    <div className={`block w-9 h-5 rounded-full transition-colors ${
                      aplicaRetencionIslr ? "bg-[var(--ts-red)]" : "bg-[var(--ts-border)]"
                    }`}></div>
                    <div className={`absolute left-0.5 top-0.5 bg-[var(--ts-surface)] w-4 h-4 rounded-full transition-transform ${
                      aplicaRetencionIslr ? "translate-x-4" : ""
                    }`}></div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--ts-text-primary)] group-hover:text-[var(--ts-red)]">
                      Retención ISLR ({retencionIslrPct}%)
                    </span>
                    <p className="text-[10px] text-[var(--ts-text-muted)]">Contribuyentes Especiales (s/ Base)</p>
                  </div>
                </label>
                {aplicaRetencionIslr && (
                  <span className="text-xs font-bold text-[var(--ts-red)]">
                    -{formatBs(retencionIslrBs)}
                  </span>
                )}
              </div>

              {aplicaRetencionIslr && (
                <div className="flex items-center justify-between pt-2 border-t border-[var(--ts-border)]">
                  <span className="text-[11px] text-[var(--ts-text-muted)]">Alícuota Retención:</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 5].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setRetencionIslrPct(pct)}
                        className={`text-[11px] px-2.5 py-0.5 rounded font-bold transition-colors ${
                          retencionIslrPct === pct
                            ? "bg-[var(--ts-red)] text-white"
                            : "bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={retencionIslrPct}
                        onChange={(e) => setRetencionIslrPct(parseFloat(e.target.value) || 0)}
                        className="w-14 text-center border border-[var(--ts-border)] rounded px-1 py-0.5 text-xs bg-[var(--ts-surface)] focus:outline-none focus:border-[var(--ts-red)]"
                      />
                      <span className="text-[11px] text-[var(--ts-text-muted)]">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
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
            <span className="text-[var(--ts-text-muted)]">IVA ({aplicaIva ? `${ivaPct}%` : "0%"})</span>
            <span className="font-medium">{formatBs(ivaBs)}</span>
          </div>
          {aplicaIgtf && (
            <div className="flex justify-between">
              <span className="text-[var(--ts-text-muted)]">IGTF ({igtfPct}%)</span>
              <span className="font-medium text-[var(--ts-red)]">{formatBs(igtfBs)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-[var(--ts-border)] pt-2 mt-2">
            <span className="font-bold text-[var(--ts-text-primary)] text-sm">TOTAL FACTURA FISCAL</span>
            <span className="font-bold text-[var(--ts-text-primary)] text-sm">{formatBs(totalBs)}</span>
          </div>

          {/* Deducciones por Retenciones */}
          {Boolean((aplicaRetencionIva && retencionIvaBs > 0) || (aplicaRetencionIslr && retencionIslrBs > 0)) && (
            <div className="border-t border-dashed border-[var(--ts-border)] pt-2 space-y-1.5">
              {Boolean(aplicaRetencionIva && retencionIvaBs > 0) && (
                <div className="flex justify-between text-xs text-[var(--ts-red)]">
                  <span>(-) Retención IVA ({retencionIvaPct}%)</span>
                  <span className="font-bold">-{formatBs(retencionIvaBs)}</span>
                </div>
              )}
              {Boolean(aplicaRetencionIslr && retencionIslrBs > 0) && (
                <div className="flex justify-between text-xs text-[var(--ts-red)]">
                  <span>(-) Retención ISLR ({retencionIslrPct}%)</span>
                  <span className="font-bold">-{formatBs(retencionIslrBs)}</span>
                </div>
              )}
              <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-2.5 rounded-lg mt-2">
                <div>
                  <span className="block font-extrabold text-emerald-800 dark:text-emerald-300 text-sm">TOTAL NETO A COBRAR</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Monto a pagar por el cliente</span>
                </div>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-lg">{formatBs(totalNetoBs)}</span>
              </div>
            </div>
          )}
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
                onSelect={(c) => {
                  setClienteDirecto(c);
                  if (c?.es_contribuyente_especial) {
                    setAplicaRetencionIva(true);
                    if (typeof c.retencion_iva_pct === "number") setRetencionIvaPct(c.retencion_iva_pct);
                    if (typeof c.retencion_islr_pct === "number") {
                      setRetencionIslrPct(c.retencion_islr_pct);
                      setAplicaRetencionIslr(true);
                    }
                  }
                }}
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
