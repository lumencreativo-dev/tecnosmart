"use client";

import { useState } from "react";
import { Search, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatUSD } from "@/lib/utils";

// Tipos simplificados para el scope de facturación
type CotizacionDB = any; // En producción usaríamos un tipo más estricto

export default function FacturadorWizard() {
  const [query, setQuery] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [cotizacion, setCotizacion] = useState<CotizacionDB | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [facturaGenerada, setFacturaGenerada] = useState<string | null>(null);

  const buscarCotizacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setBuscando(true);
    setError(null);
    setFacturaGenerada(null);
    setCotizacion(null);

    // Buscar la cotización con el cliente y los detalles
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
  };

  const generarFactura = async () => {
    if (!cotizacion) return;
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

      // 4. Exportar el PDF de Factura
      const { exportarCotizacionPDF } = await import("@/components/pdf/CotizacionPDF");
      
      // Adaptar los datos al formato esperado por el PDF
      const resumenAdaptado = {
        subtotal: cotizacion.subtotal,
        descuento: cotizacion.descuento,
        total: cotizacion.total,
        anticipo: cotizacion.anticipo_monto,
        saldo: cotizacion.saldo_monto,
        aplicaEsquemaPago: cotizacion.anticipo_monto > 0,
      };

      await exportarCotizacionPDF({
        numeroCot: cotizacion.numero_cotizacion,
        fecha: new Date(),
        cliente: cotizacion.clientes,
        lineas: cotizacion.cotizacion_detalles,
        resumen: resumenAdaptado,
        notas: cotizacion.notas,
        esFactura: true,
        numeroFactura: numFactura,
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

      {/* ── Resultados ── */}
      {cotizacion && !facturaGenerada && (
        <div className="bg-white rounded-xl border border-[#d9d9d9] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-[#e5e5e5]">
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
                <p className="text-xs text-[#6e6e6e] uppercase tracking-wide font-semibold">Total a Facturar</p>
                <p className="text-3xl font-extrabold text-[#c9242b] mt-1">
                  {formatUSD(cotizacion.total)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-[#f8fafc]">
            <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wide mb-3">Detalle (Resumen)</h4>
            <ul className="space-y-2 mb-6">
              {cotizacion.cotizacion_detalles?.map((d: any) => (
                <li key={d.id} className="flex justify-between text-sm">
                  <span className="text-[#6e6e6e]">
                    {d.cantidad}x {d.descripcion}
                  </span>
                  <span className="font-medium text-[#111111]">{formatUSD(d.precio_unitario * d.cantidad)}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={generarFactura}
              disabled={generando || cotizacion.estado === "facturada"}
              className="w-full flex items-center justify-center gap-2 bg-[#c9242b] hover:bg-red-700 disabled:opacity-50 text-white font-bold text-base py-4 rounded-xl transition-colors shadow-lg shadow-red-900/30"
            >
              {generando ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
              {cotizacion.estado === "facturada" ? "Esta cotización ya tiene factura" : "Generar Factura Oficial"}
            </button>
          </div>
        </div>
      )}

      {/* ── Éxito ── */}
      {facturaGenerada && (
        <div className="bg-white p-8 rounded-xl border border-green-200 shadow-sm text-center animate-in zoom-in duration-500">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-[#111111] mb-2">
            ¡Factura Generada!
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
