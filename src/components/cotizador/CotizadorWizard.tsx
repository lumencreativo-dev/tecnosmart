"use client";

import { useState, useCallback, useMemo } from "react";
import { FileDown, Save, RotateCcw, FileText } from "lucide-react";

import type { Cliente, LineaDetalle, ResumenCotizacion } from "@/lib/types";
import { generarNumeroCot, tempId } from "@/lib/utils";

import BuscadorProductos  from "./BuscadorProductos";
import ServiciosPicker    from "./ServiciosPicker";
import TablaDetalle       from "./TablaDetalle";
import ResumenFinanciero  from "./ResumenFinanciero";
import ClienteForm        from "./ClienteForm";

const DESCUENTO_UMBRAL = 500;

export default function CotizadorWizard() {
  const [numeroCot] = useState(() => generarNumeroCot());
  const [lineas, setLineas]     = useState<LineaDetalle[]>([]);
  const [descuento, setDescuento] = useState(0);
  const [notas, setNotas]       = useState("");
  const [cliente, setCliente]   = useState<Cliente>({ contacto: "" });
  const [exportando, setExportando] = useState(false);

  // ── Gestión de líneas ─────────────────────────────────────
  const addLinea = useCallback((l: LineaDetalle) => {
    setLineas((prev) => [...prev, l]);
  }, []);

  const updateCantidad = useCallback((id: string, cantidad: number) => {
    setLineas((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, cantidad, subtotal: cantidad * l.precio_unitario } : l
      )
    );
  }, []);

  const updatePrecio = useCallback((id: string, precio_unitario: number) => {
    setLineas((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, precio_unitario, subtotal: l.cantidad * precio_unitario }
          : l
      )
    );
  }, []);

  const removeLinea = useCallback((id: string) => {
    setLineas((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const resetear = () => {
    setLineas([]);
    setDescuento(0);
    setNotas("");
    setCliente({ contacto: "" });
  };

  // ── Cálculos ──────────────────────────────────────────────
  const resumen = useMemo<ResumenCotizacion>(() => {
    const subtotal = lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0);
    const total    = Math.max(0, subtotal - descuento);
    const aplicaEsquemaPago = total > DESCUENTO_UMBRAL;
    return {
      subtotal,
      descuento,
      total,
      anticipo:         aplicaEsquemaPago ? total * 0.7 : 0,
      saldo:            aplicaEsquemaPago ? total * 0.3 : 0,
      aplicaEsquemaPago,
    };
  }, [lineas, descuento]);

  // ── Exportar PDF ──────────────────────────────────────────
  const handleExportPDF = async () => {
    if (lineas.length === 0) {
      alert("Agrega al menos un ítem antes de exportar.");
      return;
    }
    if (!cliente.contacto) {
      alert("Completa el nombre del cliente antes de exportar.");
      return;
    }
    setExportando(true);
    try {
      const { exportarCotizacionPDF } = await import("@/components/pdf/CotizacionPDF");
      await exportarCotizacionPDF({
        numeroCot,
        fecha: new Date(),
        cliente,
        lineas,
        resumen,
        notas,
      });
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* ── Barra superior ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111]">
            Tabulador Comercial
          </h1>
          <p className="text-sm text-[#6e6e6e] mt-0.5">
            <span className="font-mono text-[#c9242b] font-bold">{numeroCot}</span>
            {" · "}
            {new Date().toLocaleDateString("es-VE", {
              day: "2-digit", month: "long", year: "numeric",
            })}
          </p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={resetear}
            className="flex items-center gap-1.5 text-sm text-[#6e6e6e] hover:text-[#c9242b] border border-[#d9d9d9] hover:border-[#c9242b] px-3 py-2 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Limpiar
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exportando}
            className="flex items-center gap-2 bg-[#c9242b] hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-colors shadow-md shadow-red-900/30"
          >
            {exportando ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            Exportar PDF
          </button>
        </div>
      </div>

      {/* ── Layout principal: 2 columnas ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">

        {/* ── Columna izquierda: Selectores ── */}
        <div className="space-y-5">
          {/* Buscador de productos */}
          <div className="bg-white rounded-xl border border-[#d9d9d9] p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-[#c9242b]" />
              <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wide">
                Productos & Equipos
              </h2>
            </div>
            <BuscadorProductos onAdd={addLinea} />
          </div>

          {/* Servicios y mano de obra */}
          <div className="bg-white rounded-xl border border-[#d9d9d9] p-5 max-h-[600px] overflow-y-auto">
            <ServiciosPicker onAdd={addLinea} />
          </div>
        </div>

        {/* ── Columna derecha: Tabla + Resumen ── */}
        <div className="space-y-5">
          {/* Datos del cliente */}
          <ClienteForm cliente={cliente} onChange={setCliente} />

          {/* Tabla de ítems */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wide">
                Ítems de Cotización
                <span className="ml-2 text-xs font-normal text-[#6e6e6e] normal-case">
                  ({lineas.length} ítem{lineas.length !== 1 ? "s" : ""})
                </span>
              </h2>
            </div>
            <TablaDetalle
              lineas={lineas}
              onUpdateCantidad={updateCantidad}
              onUpdatePrecio={updatePrecio}
              onRemove={removeLinea}
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-[#6e6e6e] uppercase tracking-wide mb-1">
              Notas / Observaciones (opcional)
            </label>
            <textarea
              rows={3}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Incluye mano de obra en el segundo piso. Materiales suministrados por el cliente."
              className="w-full border border-[#d9d9d9] rounded-lg px-3 py-2.5 text-sm text-[#111111] placeholder-[#6e6e6e] focus:outline-none focus:ring-2 focus:ring-[#c9242b]/40 focus:border-[#c9242b] resize-none"
            />
          </div>

          {/* Resumen financiero */}
          <ResumenFinanciero
            resumen={resumen}
            descuento={descuento}
            onDescuentoChange={setDescuento}
          />

          {/* Botón exportar inferior */}
          <button
            onClick={handleExportPDF}
            disabled={exportando}
            className="w-full flex items-center justify-center gap-2 bg-[#c9242b] hover:bg-red-700 disabled:opacity-50 text-white font-bold text-base py-4 rounded-xl transition-colors shadow-lg shadow-red-900/30"
          >
            {exportando ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generando PDF...
              </>
            ) : (
              <>
                <FileDown className="w-5 h-5" />
                Exportar Cotización en PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
