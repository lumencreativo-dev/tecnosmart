"use client";

import { useState } from "react";
import { Search, FileText, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatUSD } from "@/lib/utils";

type CotizacionDB = any; 

// Función para formatear a Bolívares
const formatBs = (num: number) => {
  return "Bs. " + num.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function FacturadorWizard() {
  const [query, setQuery] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [cotizacion, setCotizacion] = useState<CotizacionDB | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [generando, setGenerando] = useState(false);
  const [facturaGenerada, setFacturaGenerada] = useState<string | null>(null);

  // Estados Fiscales
  const [tasaBcv, setTasaBcv] = useState<number>(0);
  const [cargandoTasa, setCargandoTasa] = useState(false);
  const [metodoPago, setMetodoPago] = useState<"bs_transferencia" | "usd_efectivo" | "zelle">("bs_transferencia");

  // Obtener la tasa BCV vía API
  const fetchBCVRate = async () => {
    setCargandoTasa(true);
    try {
      const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial");
      const data = await res.json();
      if (data && data.promedio) {
        setTasaBcv(data.promedio);
      }
    } catch (err) {
      console.error("Error al obtener tasa BCV", err);
      // Fallback a manual si falla
    } finally {
      setCargandoTasa(false);
    }
  };

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
      .select(`
        *,
        clientes (*),
        cotizacion_detalles (*)
      `)
      .ilike("numero_cotizacion", `%${query.trim()}%`)
      .single();

    setBuscando(false);

    if (err || !data) {
      setError("No se encontró ninguna cotización con ese número.");
      return;
    }

    setCotizacion(data);
    
    // Si la cotización no ha sido facturada, buscamos la tasa para preparar la factura
    if (data.estado !== "facturada") {
      fetchBCVRate();
    }
  };

  // Cálculos Fiscales en tiempo real
  const subtotalUsd = cotizacion?.total || 0; // Usamos el total de la cotización como base imponible
  const aplicaIgtf = metodoPago === "usd_efectivo" || metodoPago === "zelle";
  
  const subtotalBs = subtotalUsd * tasaBcv;
  const ivaBs = subtotalBs * 0.16;
  const igtfBs = aplicaIgtf ? (subtotalBs * 0.03) : 0;
  const totalBs = subtotalBs + ivaBs + igtfBs;

  const generarFactura = async () => {
    if (!cotizacion || tasaBcv <= 0) return;
    setGenerando(true);
    setError(null);

    try {
      // 1. Obtener número de factura (RPC)
      const { data: numFactura, error: rpcErr } = await supabase.rpc("next_factura_number");
      if (rpcErr) throw new Error("Error al generar número de factura: " + rpcErr.message);

      // 2. Insertar en tabla facturas
      const { error: insErr } = await supabase
        .from("facturas")
        .insert([{
          cotizacion_id: cotizacion.id,
          numero_factura: numFactura,
          tasa_bcv: tasaBcv,
          metodo_pago: metodoPago,
          aplica_igtf: aplicaIgtf,
          subtotal_usd: subtotalUsd,
          subtotal_bs: subtotalBs,
          iva_bs: ivaBs,
          igtf_bs: igtfBs,
          total_bs: totalBs
        }]);
        
      if (insErr) {
        if (insErr.code === "23505") {
          throw new Error("Esta cotización ya fue facturada.");
        }
        throw new Error("Error al guardar factura: " + insErr.message);
      }

      // 3. Actualizar estado de cotización a 'facturada'
      await supabase
        .from("cotizaciones")
        .update({ estado: "facturada" })
        .eq("id", cotizacion.id);

      setFacturaGenerada(numFactura);

      // 4. Exportar el PDF Fiscal
      const { exportarFacturaFiscalPDF } = await import("@/components/pdf/FacturaFiscalPDF");
      
      await exportarFacturaFiscalPDF({
        numeroFactura: numFactura,
        numeroControl: `00-${numFactura.split("-")[2]}`, // Número de control simplificado
        fecha: new Date(),
        cliente: cotizacion.clientes,
        lineas: cotizacion.cotizacion_detalles,
        tasaBcv: tasaBcv,
        subtotalBs: subtotalBs,
        ivaBs: ivaBs,
        igtfBs: igtfBs,
        totalBs: totalBs,
        aplicaIgtf: aplicaIgtf
      });

    } catch (err: any) {
      setError(err.message || "Error desconocido al facturar.");
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── Buscador ── */}
      <div className="bg-white p-6 rounded-xl border border-[#d9d9d9] shadow-sm">
        <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wide mb-4">
          Buscar Cotización
        </h2>
        <form onSubmit={buscarCotizacion} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e6e6e]" />
            <input
              type="text"
              placeholder="Ej: COT-2026-001"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-3 border border-[#d9d9d9] rounded-lg text-sm focus:outline-none focus:border-[#c9242b] focus:ring-1 focus:ring-[#c9242b]/30"
            />
          </div>
          <button
            type="submit"
            disabled={buscando || !query}
            className="bg-[#111111] hover:bg-black text-white px-6 py-3 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {buscando ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-[#c9242b] bg-[#c9242b]/10 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* ── Resultados y Formulario Fiscal ── */}
      {cotizacion && !facturaGenerada && (
        <div className="bg-white rounded-xl border border-[#d9d9d9] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Cabecera Cotización */}
          <div className="p-6 border-b border-[#e5e5e5] bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-block bg-[#c9242b]/10 text-[#c9242b] text-xs font-bold px-2.5 py-1 rounded-full mb-2">
                  {cotizacion.estado === "facturada" ? "YA FACTURADA" : "LISTA PARA FACTURAR"}
                </span>
                <h3 className="text-xl font-bold text-[#111111]">
                  {cotizacion.numero_cotizacion}
                </h3>
                <p className="text-[#6e6e6e] mt-1 text-sm">
                  Cliente: <strong className="text-[#111111]">{cotizacion.clientes?.empresa || cotizacion.clientes?.contacto}</strong>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#6e6e6e] uppercase tracking-wide font-semibold">Total Base (USD)</p>
                <p className="text-2xl font-extrabold text-[#111] mt-1">
                  {formatUSD(subtotalUsd)}
                </p>
              </div>
            </div>
          </div>

          {cotizacion.estado !== "facturada" && (
            <div className="p-6">
              <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wide mb-4">Configuración Fiscal (Providencia 00071)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Tasa BCV */}
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e6e] mb-1">Tasa de Cambio (BCV)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={tasaBcv || ""}
                      onChange={(e) => setTasaBcv(parseFloat(e.target.value) || 0)}
                      className="w-full pl-3 pr-10 py-2 border border-[#d9d9d9] rounded-lg text-sm focus:outline-none focus:border-[#c9242b]"
                    />
                    <button
                      type="button"
                      onClick={fetchBCVRate}
                      title="Actualizar tasa desde API Dolar"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#c9242b] hover:text-red-700 disabled:opacity-50"
                      disabled={cargandoTasa}
                    >
                      <RefreshCw className={`w-4 h-4 ${cargandoTasa ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                  <p className="text-[10px] text-[#6e6e6e] mt-1">Se obtiene automáticamente de DolarAPI.</p>
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e6e] mb-1">Método de Pago (Aplica IGTF?)</label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as any)}
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

              {/* Resumen Fiscal */}
              <div className="bg-[#f8fafc] border border-[#d9d9d9] rounded-lg p-5">
                <h5 className="text-xs font-bold text-[#111111] uppercase tracking-wide mb-3 border-b border-[#d9d9d9] pb-2">
                  Resumen a Facturar en Bolívares
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6e6e6e]">Base Imponible (Subtotal)</span>
                    <span className="font-medium text-[#111111]">{formatBs(subtotalBs)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6e6e6e]">IVA (16%)</span>
                    <span className="font-medium text-[#111111]">{formatBs(ivaBs)}</span>
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

              <div className="mt-6">
                <button
                  onClick={generarFactura}
                  disabled={generando || tasaBcv <= 0}
                  className="w-full flex items-center justify-center gap-2 bg-[#c9242b] hover:bg-red-700 disabled:opacity-50 text-white font-bold text-base py-4 rounded-xl transition-colors shadow-lg shadow-red-900/30"
                >
                  {generando ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                  Emitir Factura Fiscal (Forma Libre)
                </button>
              </div>

            </div>
          )}
          
          {cotizacion.estado === "facturada" && (
            <div className="p-6 text-center">
              <AlertCircle className="w-10 h-10 text-[#c9242b] mx-auto mb-3" />
              <p className="font-medium text-[#111111]">Esta cotización ya fue convertida en factura previamente.</p>
            </div>
          )}

        </div>
      )}

      {/* ── Éxito ── */}
      {facturaGenerada && (
        <div className="bg-white p-8 rounded-xl border border-green-200 shadow-sm text-center animate-in zoom-in duration-500">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-[#111111] mb-2">
            ¡Factura Fiscal Emitida!
          </h3>
          <p className="text-[#6e6e6e] mb-6">
            La factura <strong className="text-[#111111]">{facturaGenerada}</strong> se ha guardado exitosamente y el PDF se ha descargado.
          </p>
          <button
            onClick={() => { setFacturaGenerada(null); setCotizacion(null); setQuery(""); }}
            className="text-[#c9242b] hover:underline font-medium text-sm"
          >
            Facturar otra cotización
          </button>
        </div>
      )}

    </div>
  );
}
