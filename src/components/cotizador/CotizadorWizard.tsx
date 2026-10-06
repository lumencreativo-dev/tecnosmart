"use client";

import { useState, useCallback, useMemo } from "react";
import { FileDown, RotateCcw, CheckCircle2, Package } from "lucide-react";

import type { Cliente, LineaDetalle, ResumenCotizacion } from "@/lib/types";
import { generarNumeroCot, tempId } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

import BuscadorProductos from "./BuscadorProductos";
import ServiciosPicker   from "./ServiciosPicker";
import TablaDetalle      from "./TablaDetalle";
import ResumenFinanciero from "./ResumenFinanciero";
import ClientePicker     from "./ClientePicker";

const DESCUENTO_UMBRAL = 500;

const CLIENTE_VACIO: Cliente = { contacto: "" };

export default function CotizadorWizard() {
  const [numeroCot]              = useState(() => generarNumeroCot());
  const [lineas, setLineas]      = useState<LineaDetalle[]>([]);
  const [descuento, setDescuento]= useState(0);
  const [notas, setNotas]        = useState("");
  const [cliente, setCliente]    = useState<Cliente>(CLIENTE_VACIO);
  const [exportando, setExportando] = useState(false);
  const [guardado, setGuardado]  = useState(false);
  const [cotizacionId, setCotizacionId] = useState<string | null>(null);

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

  // ── Guardar en Supabase + Exportar PDF ───────────────────
  const handleExportPDF = async () => {
    if (lineas.length === 0) {
      alert("Agrega al menos un ítem antes de exportar.");
      return;
    }
    if (!cliente.contacto && !cliente.empresa) {
      alert("Selecciona o crea un cliente antes de exportar.");
      return;
    }
    setExportando(true);
    try {
      // 1. Upsert cliente (si ya tiene id, actualiza; si no, inserta)
      let clienteId = cliente.id;
      if (!clienteId) {
        const { data: cData, error: cErr } = await supabase
          .from("clientes")
          .insert([{
            empresa: cliente.empresa,
            rif_cedula: cliente.rif_cedula,
            contacto: cliente.contacto,
            email: cliente.email,
            telefono: cliente.telefono,
            direccion: cliente.direccion,
            tipo: cliente.tipo ?? "cliente_normal",
          }])
          .select("id")
          .single();
        if (cErr) throw new Error("Error guardando cliente: " + cErr.message);
        clienteId = cData.id;
      }

      // 2. Insertar cotización
      const { data: cotData, error: cotErr } = await supabase
        .from("cotizaciones")
        .insert([{
          numero_cotizacion: numeroCot,
          cliente_id: clienteId,
          fecha: new Date().toISOString().split("T")[0],
          subtotal: resumen.subtotal,
          descuento: resumen.descuento,
          total: resumen.total,
          anticipo_monto: resumen.anticipo,
          saldo_monto: resumen.saldo,
          notas,
          estado: "enviada",
        }])
        .select("id")
        .single();
      if (cotErr) throw new Error("Error guardando cotización: " + cotErr.message);
      setCotizacionId(cotData.id);

      // 3. Insertar líneas de detalle
      const detalles = lineas.map((l) => ({
        cotizacion_id: cotData.id,
        tipo_item: l.tipo_item,
        item_id: l.item_id ?? null,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
      }));
      const { error: detErr } = await supabase.from("cotizacion_detalles").insert(detalles);
      if (detErr) throw new Error("Error guardando detalles: " + detErr.message);

      setGuardado(true);

      // 4. Exportar PDF
      const { exportarCotizacionPDF } = await import("@/components/pdf/CotizacionPDF");
      await exportarCotizacionPDF({ numeroCot, fecha: new Date(), cliente, lineas, resumen, notas });

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      alert(msg);
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
              <Package className="w-4 h-4 text-[#c9242b]" />
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

          {/* Selector / Creador de cliente */}
          <div>
            <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wide mb-2">
              Cliente
            </h2>
            <ClientePicker
              onSelect={setCliente}
              clienteSeleccionado={cliente}
            />
          </div>

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
              placeholder="Ej: Incluye mano de obra en segundo piso. Materiales suministrados por el cliente."
              className="w-full border border-[#d9d9d9] rounded-lg px-3 py-2.5 text-sm text-[#111111] placeholder-[#6e6e6e] focus:outline-none focus:ring-2 focus:ring-[#c9242b]/40 focus:border-[#c9242b] resize-none"
            />
          </div>

          {/* Resumen financiero */}
          <ResumenFinanciero
            resumen={resumen}
            descuento={descuento}
            onDescuentoChange={setDescuento}
          />

          {/* Badge guardado */}
          {guardado && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Cotización <strong>{numeroCot}</strong> guardada en Supabase correctamente.
            </div>
          )}

          {/* Botón exportar */}
          <button
            onClick={handleExportPDF}
            disabled={exportando}
            className="w-full flex items-center justify-center gap-2 bg-[#c9242b] hover:bg-red-700 disabled:opacity-50 text-white font-bold text-base py-4 rounded-xl transition-colors shadow-lg shadow-red-900/30"
          >
            {exportando ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando y generando PDF...
              </>
            ) : (
              <>
                <FileDown className="w-5 h-5" />
                {guardado ? "Descargar PDF nuevamente" : "Guardar y Exportar PDF"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
