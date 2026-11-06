"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FileDown,
  RotateCcw,
  CheckCircle2,
  Package,
  PenLine,
  Plus,
  Save,
  GitBranch,
  Copy,
  AlertTriangle,
  ShieldAlert,
  ArrowLeft,
  Check,
  Info,
  Sparkles,
  FileEdit,
  Eye,
  FileCheck,
} from "lucide-react";

import type { Cliente, LineaDetalle, ResumenCotizacion } from "@/lib/types";
import { generarNumeroCot, tempId, formatUSD } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

import BuscadorProductos from "./BuscadorProductos";
import ServiciosPicker from "./ServiciosPicker";
import TablaDetalle from "./TablaDetalle";
import ResumenFinanciero from "./ResumenFinanciero";
import ClientePicker from "./ClientePicker";

const DESCUENTO_UMBRAL = 500;

const CLIENTE_VACIO: Cliente = { contacto: "" };

export default function CotizadorWizard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("edit");
  const duplicarId = searchParams.get("duplicar");

  // ── Modo de operación ──
  const [modo, setModo] = useState<"nueva" | "editar" | "duplicar">("nueva");
  const [cotizacionOriginal, setCotizacionOriginal] = useState<any | null>(null);
  const [cargandoOrigen, setCargandoOrigen] = useState(false);
  const [bloqueadaPorEstado, setBloqueadaPorEstado] = useState(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState<string | null>(null);
  const [modalConfirmarSobreescritura, setModalConfirmarSobreescritura] = useState(false);

  // ── Estados principales de la cotización ──
  const [numeroCot, setNumeroCot] = useState("Cargando...");
  const [lineas, setLineas] = useState<LineaDetalle[]>([]);
  const [descuento, setDescuento] = useState(0);
  const [notas, setNotas] = useState("");
  const [cliente, setCliente] = useState<Cliente>(CLIENTE_VACIO);
  const [exportando, setExportando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [cotizacionId, setCotizacionId] = useState<string | null>(null);
  const [descuentoTecnico, setDescuentoTecnico] = useState(15); // porcentaje
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // ── Estado: Moneda y Tasa BCV ──
  const [moneda, setMoneda]             = useState<"USD" | "VES">("USD");
  const [tasaBcv, setTasaBcv]           = useState<number>(0);
  const [cargandoTasa, setCargandoTasa] = useState(false);

  // ── Estado: Impuesto al Valor Agregado (IVA) ──
  const [aplicaIva, setAplicaIva]       = useState(true);
  const [ivaPct, setIvaPct]             = useState(16);

  // ── Estado: Retenciones Fiscales (Contribuyente Especial) ──
  const [aplicaRetenciones, setAplicaRetenciones]     = useState(false);
  const [aplicaRetencionIva, setAplicaRetencionIva]   = useState(true);
  const [retencionIvaPct, setRetencionIvaPct]         = useState(75);
  const [aplicaRetencionIslr, setAplicaRetencionIslr] = useState(false);
  const [retencionIslrPct, setRetencionIslrPct]       = useState(2);

  // ── Estado: Esquema de Pago 70/30 (Cuotas) ──
  const [incluirEsquemaPago, setIncluirEsquemaPago]   = useState(true);

  // ── Estado: Concepto Libre ──
  const [conceptoDesc, setConceptoDesc] = useState("");
  const [conceptoCant, setConceptoCant] = useState(1);
  const [conceptoPrecio, setConceptoPrecio] = useState(0);

  // Consultar tasa oficial BCV
  const fetchBCVRate = async () => {
    setCargandoTasa(true);
    try {
      const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial");
      const data = await res.json();
      if (data?.promedio) setTasaBcv(data.promedio);
    } catch {
      // Ingreso manual por el usuario
    } finally {
      setCargandoTasa(false);
    }
  };

  // Sincronizar retenciones si el cliente es contribuyente especial
  useEffect(() => {
    if (cliente?.es_contribuyente_especial) {
      setAplicaRetenciones(true);
      if (typeof cliente.retencion_iva_pct === "number") setRetencionIvaPct(cliente.retencion_iva_pct);
      if (typeof cliente.retencion_islr_pct === "number") {
        setRetencionIslrPct(cliente.retencion_islr_pct);
        setAplicaRetencionIslr(true);
      }
    }
  }, [cliente]);

  // Obtener número correlativo inicial, configuración global y tasa BCV
  useEffect(() => {
    async function fetchInit() {
      fetchBCVRate();
      const [{ data: numData, error: numErr }, { data: confData }] = await Promise.all([
        supabase.rpc("next_cotizacion_number"),
        supabase.from("configuracion").select("clave,valor").eq("clave", "descuento_tecnico").single(),
      ]);

      if (!editId && !duplicarId) {
        if (!numErr && numData) setNumeroCot(numData);
        else setNumeroCot(generarNumeroCot());
      }

      if (confData) {
        const pct = parseFloat(String(confData.valor));
        if (!isNaN(pct)) setDescuentoTecnico(pct);
      }
    }
    fetchInit();
  }, [editId, duplicarId]);

  // Cargar datos de cotización origen (para Edición o Duplicación)
  useEffect(() => {
    async function cargarCotizacionOrigen() {
      const id = editId || duplicarId;
      if (!id) {
        setModo("nueva");
        setCotizacionOriginal(null);
        return;
      }

      setCargandoOrigen(true);
      try {
        // 1. Obtener cabecera y cliente
        const { data: cot, error: cotErr } = await supabase
          .from("cotizaciones")
          .select("*, clientes(*)")
          .eq("id", id)
          .single();

        if (cotErr || !cot) throw new Error("No se pudo cargar la cotización seleccionada.");

        // 2. Obtener detalles/líneas
        const { data: det } = await supabase
          .from("cotizacion_detalles")
          .select("*")
          .eq("cotizacion_id", id)
          .order("orden, created_at");

        setCotizacionOriginal(cot);

        if (editId) {
          // ── MODO EDITAR ──
          setModo("editar");
          setCotizacionId(cot.id);
          setNumeroCot(cot.numero_cotizacion);

          // Verificar "Regla de Oro de Seguridad" (si está aprobada, facturada o en OT)
          const [{ count: countOT }, { count: countFac }] = await Promise.all([
            supabase.from("ordenes_trabajo").select("id", { count: "exact", head: true }).eq("cotizacion_id", id),
            supabase.from("facturas").select("id", { count: "exact", head: true }).eq("cotizacion_id", id),
          ]);

          const esFacturada = cot.estado === "facturada" || (countFac ? countFac > 0 : false);
          const esAprobada = ["aprobada", "aprobadas", "Aprobada", "Aprobadas"].includes(cot.estado) || (countOT ? countOT > 0 : false);

          if (esFacturada) {
            setBloqueadaPorEstado(true);
            setMotivoBloqueo(
              "Esta cotización ya fue facturada ante el SENIAT. Por normativa contable y fiscal, se recomienda guardar como Nueva Versión (Rev) o Duplicar."
            );
          } else if (esAprobada) {
            setBloqueadaPorEstado(true);
            setMotivoBloqueo(
              "Esta cotización ya fue aprobada y/o tiene una Orden de Trabajo vinculada. Para no alterar cuadrillas y materiales en curso, te recomendamos generar una Nueva Versión (Rev)."
            );
          } else {
            setBloqueadaPorEstado(false);
            setMotivoBloqueo(null);
          }
        } else {
          // ── MODO DUPLICAR ──
          setModo("duplicar");
          setCotizacionId(null);
          setBloqueadaPorEstado(false);
          setMotivoBloqueo(null);

          // Generar correlativo fresco para la copia
          const { data: numData } = await supabase.rpc("next_cotizacion_number");
          setNumeroCot(numData || generarNumeroCot());
        }

        // Cargar Cliente
        if (cot.clientes) {
          setCliente(cot.clientes);
        }

        // Cargar Líneas de producto / servicio
        if (det && det.length > 0) {
          const lineasMapeadas: LineaDetalle[] = det.map((d: any) => ({
            id: d.id || tempId(),
            tipo_item: d.tipo_item || "producto",
            item_id: d.item_id || undefined,
            descripcion: d.descripcion,
            cantidad: Number(d.cantidad || 1),
            precio_unitario: Number(d.precio_unitario || 0),
            subtotal: Number(d.subtotal || (Number(d.cantidad || 1) * Number(d.precio_unitario || 0))),
          }));
          setLineas(lineasMapeadas);
        }

        // Descuento y Notas
        setDescuento(Number(cot.descuento || 0));

        // Detección de moneda y notas
        let notasTexto = cot.notas || "";
        if (notasTexto.includes("[Cotización emitida en Bolívares")) {
          setMoneda("VES");
        } else {
          setMoneda("USD");
        }
        setNotas(notasTexto);

        // Tasa BCV
        if (cot.tasa_bcv && Number(cot.tasa_bcv) > 0) {
          setTasaBcv(Number(cot.tasa_bcv));
        }

        // Retenciones fiscales
        if (cot.aplica_retenciones) {
          setAplicaRetenciones(true);
          if (typeof cot.retencion_iva_pct === "number") setRetencionIvaPct(cot.retencion_iva_pct);
          if (typeof cot.retencion_islr_pct === "number") {
            setRetencionIslrPct(cot.retencion_islr_pct);
            setAplicaRetencionIslr(true);
          }
        }

      } catch (err: any) {
        console.error("Error al cargar cotización:", err);
        alert("Aviso: " + err.message);
      } finally {
        setCargandoOrigen(false);
      }
    }

    cargarCotizacionOrigen();
  }, [editId, duplicarId]);

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

  const agregarConceptoLibre = () => {
    if (!conceptoDesc.trim() || conceptoPrecio <= 0) return;
    addLinea({
      id:             tempId(),
      tipo_item:      "servicio",   // Para que no afecte inventario/stock
      descripcion:    conceptoDesc.trim(),
      cantidad:       conceptoCant,
      precio_unitario: conceptoPrecio,
      subtotal:       conceptoCant * conceptoPrecio,
    });
    setConceptoDesc("");
    setConceptoCant(1);
    setConceptoPrecio(0);
  };

  const resetear = () => {
    if (modo !== "nueva") {
      router.push("/nueva");
      return;
    }
    setLineas([]);
    setDescuento(0);
    setNotas("");
    setCliente(CLIENTE_VACIO);
    setConceptoDesc("");
    setConceptoCant(1);
    setConceptoPrecio(0);
    setAplicaRetenciones(false);
    setAplicaRetencionIva(true);
    setRetencionIvaPct(75);
    setAplicaRetencionIslr(false);
    setRetencionIslrPct(2);
    setIncluirEsquemaPago(true);
    setGuardado(false);
    setMensajeExito(null);
  };

  // ── Cálculos ──────────────────────────────────────────────
  const resumen = useMemo<ResumenCotizacion>(() => {
    const subtotal      = lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0);
    const baseImponible = Math.max(0, subtotal - descuento);
    const ivaMonto      = aplicaIva ? baseImponible * (ivaPct / 100) : 0;
    const total         = baseImponible + ivaMonto;

    const retencionIvaMonto = (aplicaRetenciones && aplicaRetencionIva && aplicaIva)
      ? (ivaMonto * (retencionIvaPct / 100))
      : 0;
    const retencionIslrMonto = (aplicaRetenciones && aplicaRetencionIslr)
      ? (baseImponible * (retencionIslrPct / 100))
      : 0;
    const totalNeto = Math.max(0, total - retencionIvaMonto - retencionIslrMonto);

    const aplicaEsquemaPago = incluirEsquemaPago && total > 0;

    return {
      subtotal,
      descuento,
      baseImponible,
      aplicaIva,
      ivaPct,
      ivaMonto,
      total,
      anticipo:         aplicaEsquemaPago ? total * 0.7 : 0,
      saldo:            aplicaEsquemaPago ? total * 0.3 : 0,
      aplicaEsquemaPago,
      moneda,
      tasaBcv,
      aplicaRetenciones,
      aplicaRetencionIva,
      retencionIvaPct,
      retencionIvaMonto,
      aplicaRetencionIslr,
      retencionIslrPct,
      retencionIslrMonto,
      totalNeto,
    };
  }, [
    lineas,
    descuento,
    incluirEsquemaPago,
    aplicaIva,
    ivaPct,
    moneda,
    tasaBcv,
    aplicaRetenciones,
    aplicaRetencionIva,
    retencionIvaPct,
    aplicaRetencionIslr,
    retencionIslrPct,
  ]);

  // ── Siguiente revisión correlativa ──
  const siguienteRevision = useMemo(() => {
    const baseNum = cotizacionOriginal?.numero_cotizacion || numeroCot;
    if (!baseNum || baseNum === "Cargando...") return "COT-R1";
    const match = baseNum.match(/^(.*?)-R(\d+)$/i);
    if (match) {
      const base = match[1];
      const revNum = parseInt(match[2], 10) + 1;
      return `${base}-R${revNum}`;
    }
    return `${baseNum}-R1`;
  }, [cotizacionOriginal, numeroCot]);

  // ── Guardar / Corregir / Nueva Revisión ──
  const ejecutarGuardado = async (
    tipoAccion: "sobreescribir" | "revision" | "nueva",
    descargarPDF: boolean = false
  ) => {
    if (lineas.length === 0) {
      alert("Agrega al menos un ítem antes de guardar.");
      return;
    }
    if (!cliente.contacto && !cliente.empresa) {
      alert("Selecciona o crea un cliente antes de guardar.");
      return;
    }

    setExportando(true);
    setMensajeExito(null);

    try {
      // 1. Asegurar cliente en tabla clientes
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
            acepta_promociones: cliente.acepta_promociones ?? false,
          }])
          .select("id")
          .single();
        if (cErr) throw new Error("Error guardando cliente: " + cErr.message);
        clienteId = cData.id;
        setCliente((prev) => ({ ...prev, id: clienteId }));
      }

      // Metadata de moneda en notas
      const infoMoneda = moneda === "VES" ? `[Cotización emitida en Bolívares | Tasa BCV: Bs. ${tasaBcv.toFixed(2)}]` : "";
      const notasFinales = [notas, infoMoneda].filter(Boolean).join(" ");

      let cotIdFinal = cotizacionId;
      let numCotFinal = numeroCot;

      if (tipoAccion === "sobreescribir" && editId) {
        // ── CASO A: ACTUALIZAR COTIZACIÓN EXISTENTE (SOBREESCRIBIR) ──
        const { error: updErr } = await supabase
          .from("cotizaciones")
          .update({
            cliente_id: clienteId,
            subtotal: resumen.subtotal,
            descuento: resumen.descuento,
            total: resumen.total,
            anticipo_monto: resumen.anticipo,
            saldo_monto: resumen.saldo,
            notas: notasFinales,
            tasa_bcv: tasaBcv,
            aplica_retenciones: aplicaRetenciones,
            retencion_iva_pct: retencionIvaPct,
            retencion_islr_pct: retencionIslrPct,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editId);

        if (updErr) throw new Error("Error actualizando cotización: " + updErr.message);

        // Reemplazar detalles: eliminar líneas previas e insertar actualizadas
        await supabase.from("cotizacion_detalles").delete().eq("cotizacion_id", editId);

        const detalles = lineas.map((l, idx) => ({
          cotizacion_id: editId,
          tipo_item: l.tipo_item,
          item_id: l.item_id ?? null,
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
          orden: idx + 1,
        }));
        const { error: detErr } = await supabase.from("cotizacion_detalles").insert(detalles);
        if (detErr) throw new Error("Error guardando líneas de detalle: " + detErr.message);

        cotIdFinal = editId;
        numCotFinal = numeroCot;
        setMensajeExito(`Cotización ${numeroCot} actualizada correctamente.`);

      } else if (tipoAccion === "revision") {
        // ── CASO B: CREAR NUEVA REVISIÓN (-R1, -R2) ──
        numCotFinal = siguienteRevision;

        const { data: cotData, error: cotErr } = await supabase
          .from("cotizaciones")
          .insert([{
            numero_cotizacion: numCotFinal,
            cliente_id: clienteId,
            fecha: new Date().toISOString().split("T")[0],
            subtotal: resumen.subtotal,
            descuento: resumen.descuento,
            total: resumen.total,
            anticipo_monto: resumen.anticipo,
            saldo_monto: resumen.saldo,
            notas: notasFinales,
            estado: "enviada",
            tasa_bcv: tasaBcv,
            aplica_retenciones: aplicaRetenciones,
            retencion_iva_pct: retencionIvaPct,
            retencion_islr_pct: retencionIslrPct,
          }])
          .select("id")
          .single();

        if (cotErr) throw new Error("Error generando revisión: " + cotErr.message);

        cotIdFinal = cotData.id;
        setCotizacionId(cotIdFinal);
        setNumeroCot(numCotFinal);

        const detalles = lineas.map((l, idx) => ({
          cotizacion_id: cotIdFinal,
          tipo_item: l.tipo_item,
          item_id: l.item_id ?? null,
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
          orden: idx + 1,
        }));
        const { error: detErr } = await supabase.from("cotizacion_detalles").insert(detalles);
        if (detErr) throw new Error("Error guardando líneas de revisión: " + detErr.message);

        // Si venía de una anterior, registrar en la original que fue revisada
        if (editId) {
          await supabase
            .from("cotizaciones")
            .update({
              notas: `[Reemplazada por revisión ${numCotFinal}] ${cotizacionOriginal?.notas || ""}`.trim(),
            })
            .eq("id", editId);
        }

        setMensajeExito(`Nueva Revisión ${numCotFinal} generada y registrada en el pipeline.`);

      } else {
        // ── CASO C: NUEVA COTIZACIÓN O DUPLICADA ──
        let numToUse = numeroCot;
        if (numToUse === "Cargando..." || modo === "duplicar") {
          const { data: numData } = await supabase.rpc("next_cotizacion_number");
          numToUse = numData || generarNumeroCot();
          setNumeroCot(numToUse);
        }
        numCotFinal = numToUse;

        const { data: cotData, error: cotErr } = await supabase
          .from("cotizaciones")
          .insert([{
            numero_cotizacion: numCotFinal,
            cliente_id: clienteId,
            fecha: new Date().toISOString().split("T")[0],
            subtotal: resumen.subtotal,
            descuento: resumen.descuento,
            total: resumen.total,
            anticipo_monto: resumen.anticipo,
            saldo_monto: resumen.saldo,
            notas: notasFinales,
            estado: "enviada",
            tasa_bcv: tasaBcv,
            aplica_retenciones: aplicaRetenciones,
            retencion_iva_pct: retencionIvaPct,
            retencion_islr_pct: retencionIslrPct,
          }])
          .select("id")
          .single();

        if (cotErr) throw new Error("Error guardando cotización: " + cotErr.message);

        cotIdFinal = cotData.id;
        setCotizacionId(cotIdFinal);

        const detalles = lineas.map((l, idx) => ({
          cotizacion_id: cotIdFinal,
          tipo_item: l.tipo_item,
          item_id: l.item_id ?? null,
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
          orden: idx + 1,
        }));
        const { error: detErr } = await supabase.from("cotizacion_detalles").insert(detalles);
        if (detErr) throw new Error("Error guardando detalles: " + detErr.message);

        setMensajeExito(`Cotización ${numCotFinal} creada exitosamente.`);
      }

      setGuardado(true);

      // Si se solicitó exportar PDF
      if (descargarPDF) {
        const { exportarCotizacionPDF } = await import("@/components/pdf/CotizacionPDF");
        await exportarCotizacionPDF({
          numeroCot: numCotFinal,
          fecha: new Date(),
          cliente,
          lineas,
          resumen,
          notas,
          moneda,
          tasaBcv,
        });
      }

    } catch (err: any) {
      console.error("Error al procesar guardado:", err);
      alert(err.message || "Error al procesar cotización.");
    } finally {
      setExportando(false);
      setModalConfirmarSobreescritura(false);
    }
  };

  const handleBotonSobreescribir = () => {
    if (bloqueadaPorEstado) {
      setModalConfirmarSobreescritura(true);
    } else {
      ejecutarGuardado("sobreescribir", false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* ── Banner de Carga Inicial si se está importando cotización ── */}
      {cargandoOrigen && (
        <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-6 text-center space-y-2 animate-pulse">
          <div className="w-6 h-6 border-2 border-[var(--ts-red)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--ts-text-muted)] font-bold">
            Cargando datos de la cotización para edición...
          </p>
        </div>
      )}

      {/* ── BANNER CONTEXTUAL DE MODO (EDICIÓN O DUPLICACIÓN) ── */}
      {modo === "editar" && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md ${
            bloqueadaPorEstado
              ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
              : "bg-blue-500/10 border-blue-500/30 text-blue-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                bloqueadaPorEstado ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {bloqueadaPorEstado ? <ShieldAlert className="w-5 h-5" /> : <PenLine className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-white">
                  Modo Corrección
                </span>
                <h3 className="text-sm font-bold text-white">
                  Editando Cotización <span className="font-mono text-cyan-400">{numeroCot}</span>
                </h3>
                {cotizacionOriginal?.estado && (
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Estado Actual: {cotizacionOriginal.estado}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {bloqueadaPorEstado
                  ? motivoBloqueo
                  : "Ajusta cantidades, agrega productos o servicios y guarda los cambios directamente o como una nueva versión."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/nueva")}
            className="px-3 py-1.5 bg-[var(--ts-surface)] hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] hover:text-white rounded-xl text-xs font-semibold border border-[var(--ts-border)] transition-colors shrink-0"
          >
            Salir / Nueva en blanco
          </button>
        </div>
      )}

      {modo === "duplicar" && (
        <div className="p-4 rounded-2xl border bg-purple-500/10 border-purple-500/30 text-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-300">
                  Modo Duplicación
                </span>
                <h3 className="text-sm font-bold text-white">
                  Clonando ítems desde <span className="font-mono text-purple-300">{cotizacionOriginal?.numero_cotizacion}</span>
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Se guardará como una cotización independiente con correlativo <strong className="text-white font-mono">{numeroCot}</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/nueva")}
            className="px-3 py-1.5 bg-[var(--ts-surface)] hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] hover:text-white rounded-xl text-xs font-semibold border border-[var(--ts-border)] transition-colors shrink-0"
          >
            Cancelar duplicación
          </button>
        </div>
      )}

      {/* ── Barra superior ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--ts-text-primary)]">
            {modo === "editar" ? "Corrección de Presupuesto" : modo === "duplicar" ? "Duplicar Cotización" : "Tabulador Comercial"}
          </h1>
          <p className="text-sm text-[var(--ts-text-muted)] mt-0.5">
            <span className="font-mono text-[var(--ts-red)] font-bold">{numeroCot}</span>
            {" · "}
            {new Date().toLocaleDateString("es-VE", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Acciones Rápidas Superiores */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={resetear}
            className="flex items-center gap-1.5 text-xs text-[var(--ts-text-muted)] hover:text-[var(--ts-red)] border border-[var(--ts-border)] hover:border-[var(--ts-red)] px-3 py-2 rounded-xl transition-colors font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {modo !== "nueva" ? "Nueva en Blanco" : "Limpiar"}
          </button>

          {modo === "editar" ? (
            <>
              <button
                onClick={handleBotonSobreescribir}
                disabled={exportando}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm ${
                  bloqueadaPorEstado
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                    : "bg-emerald-600/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                }`}
                title={bloqueadaPorEstado ? "Requiere confirmación por estar aprobada/facturada" : "Sobreescribir cambios en esta cotización"}
              >
                <Save className="w-3.5 h-3.5" />
                <span>Actualizar ({numeroCot})</span>
              </button>

              <button
                onClick={() => ejecutarGuardado("revision", false)}
                disabled={exportando}
                className="flex items-center gap-1.5 bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                title="Genera una nueva versión correlativa preservando la original"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Crear Revisión ({siguienteRevision})</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => ejecutarGuardado(modo === "duplicar" ? "nueva" : "nueva", false)}
              disabled={exportando}
              className="flex items-center gap-1.5 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[var(--ts-text-primary)] px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>Guardar</span>
            </button>
          )}

          <button
            onClick={() => ejecutarGuardado(modo === "editar" ? (bloqueadaPorEstado ? "revision" : "sobreescribir") : "nueva", true)}
            disabled={exportando}
            className="flex items-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-red-900/30"
          >
            {exportando ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>Guardar & PDF</span>
          </button>
        </div>
      </div>

      {/* ── Layout principal: 2 columnas ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">

        {/* ── Columna izquierda: Selectores ── */}
        <div className="space-y-5">
          {/* Buscador de productos */}
          <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-[var(--ts-red)]" />
              <h2 className="text-sm font-bold text-[var(--ts-text-primary)] uppercase tracking-wide">
                Productos & Equipos
              </h2>
            </div>
            <BuscadorProductos onAdd={addLinea} clienteTipo={cliente.tipo} descuentoTecnico={descuentoTecnico} />
          </div>

          {/* Servicios y mano de obra */}
          <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] p-5 max-h-[600px] overflow-y-auto">
            <ServiciosPicker onAdd={addLinea} clienteTipo={cliente.tipo} descuentoTecnico={descuentoTecnico} />
          </div>

          {/* Concepto Libre */}
          <div className="bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <PenLine className="w-4 h-4 text-[var(--ts-red)]" />
              <h2 className="text-sm font-bold text-[var(--ts-text-primary)] uppercase tracking-wide">
                Concepto Libre
              </h2>
            </div>
            <p className="text-xs text-[var(--ts-text-muted)] mb-3">
              Agrega ítems que no están en el inventario ni en servicios.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Descripción del concepto..."
                value={conceptoDesc}
                onChange={(e) => setConceptoDesc(e.target.value)}
                className="w-full text-sm px-3 py-2.5 border border-[var(--ts-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9242b]/40 focus:border-[var(--ts-red)] bg-[var(--ts-surface)]"
              />
              <div className="flex gap-2">
                <div className="w-20">
                  <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] mb-1">Cant.</label>
                  <input
                    type="number"
                    min="1"
                    value={conceptoCant || ""}
                    onChange={(e) => setConceptoCant(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 border border-[var(--ts-border)] rounded-lg focus:outline-none focus:border-[var(--ts-red)] bg-transparent"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-[var(--ts-text-muted)] mb-1">Precio (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--ts-text-muted)]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={conceptoPrecio || ""}
                      onChange={(e) => setConceptoPrecio(Number(e.target.value))}
                      className="w-full pl-6 pr-3 py-2 text-sm border border-[var(--ts-border)] rounded-lg focus:outline-none focus:border-[var(--ts-red)] bg-transparent"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={agregarConceptoLibre}
                disabled={!conceptoDesc.trim() || conceptoPrecio <= 0}
                className="w-full flex items-center justify-center gap-2 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-border)] border border-[var(--ts-border)] disabled:opacity-40 text-[var(--ts-text-primary)] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Añadir Concepto
              </button>
            </div>
          </div>
        </div>

        {/* ── Columna derecha: Tabla + Resumen ── */}
        <div className="space-y-5">

          {/* Selector / Creador de cliente */}
          <div>
            <h2 className="text-sm font-bold text-[var(--ts-text-primary)] uppercase tracking-wide mb-2">
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
              <h2 className="text-sm font-bold text-[var(--ts-text-primary)] uppercase tracking-wide">
                Ítems de Cotización
                <span className="ml-2 text-xs font-normal text-[var(--ts-text-muted)] normal-case">
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
            <label className="block text-xs font-semibold text-[var(--ts-text-muted)] uppercase tracking-wide mb-1">
              Notas / Observaciones (opcional)
            </label>
            <textarea
              rows={3}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Incluye mano de obra en segundo piso. Materiales suministrados por el cliente."
              className="w-full border border-[var(--ts-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--ts-text-primary)] placeholder-[#6e6e6e] focus:outline-none focus:ring-2 focus:ring-[#c9242b]/40 focus:border-[var(--ts-red)] resize-none"
            />
          </div>

          {/* Resumen financiero */}
          <ResumenFinanciero
            resumen={resumen}
            descuento={descuento}
            onDescuentoChange={setDescuento}
            moneda={moneda}
            onMonedaChange={setMoneda}
            tasaBcv={tasaBcv}
            onTasaBcvChange={setTasaBcv}
            onRefreshTasa={fetchBCVRate}
            cargandoTasa={cargandoTasa}
            aplicaIva={aplicaIva}
            onAplicaIvaChange={setAplicaIva}
            ivaPct={ivaPct}
            onIvaPctChange={setIvaPct}
            aplicaRetenciones={aplicaRetenciones}
            onAplicaRetencionesChange={setAplicaRetenciones}
            aplicaRetencionIva={aplicaRetencionIva}
            onAplicaRetencionIvaChange={setAplicaRetencionIva}
            retencionIvaPct={retencionIvaPct}
            onRetencionIvaPctChange={setRetencionIvaPct}
            aplicaRetencionIslr={aplicaRetencionIslr}
            onAplicaRetencionIslrChange={setAplicaRetencionIslr}
            retencionIslrPct={retencionIslrPct}
            onRetencionIslrPctChange={setRetencionIslrPct}
            incluirEsquemaPago={incluirEsquemaPago}
            onIncluirEsquemaPagoChange={setIncluirEsquemaPago}
          />

          {/* Badge guardado / Mensaje de éxito */}
          {mensajeExito && (
            <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-3 rounded-xl animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <p className="font-bold">{mensajeExito}</p>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">
                  Puedes descargar el PDF actualizado o revisar el pipeline en el CRM.
                </p>
              </div>
            </div>
          )}

          {/* ── BOTONES DE ACCIÓN PRINCIPALES AL FONDO ── */}
          {modo === "editar" ? (
            <div className="space-y-3 pt-2">
              <div className="p-4 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--ts-border)]">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-[var(--ts-text-primary)]">
                      Opciones de Guardado de la Corrección
                    </h4>
                  </div>
                  <span className="text-[10px] text-[var(--ts-text-muted)] font-mono">
                    Ref: {numeroCot}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Opción 1: Actualizar / Sobreescribir */}
                  <button
                    type="button"
                    onClick={handleBotonSobreescribir}
                    disabled={exportando}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      bloqueadaPorEstado
                        ? "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30 text-amber-300"
                        : "bg-[var(--ts-surface)] hover:bg-[var(--ts-border)]/40 border-[var(--ts-border)] text-[var(--ts-text-primary)]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <Save className="w-3.5 h-3.5 text-emerald-400" />
                          Actualizar Directamente
                        </span>
                        {bloqueadaPorEstado && (
                          <span className="text-[9px] font-black uppercase bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                            ⚠️ Bloqueada
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--ts-text-muted)] leading-snug">
                        Sobreescribe <strong className="text-white font-mono">{numeroCot}</strong> manteniendo el mismo número correlativo.
                      </p>
                    </div>
                  </button>

                  {/* Opción 2: Guardar como Revisión */}
                  <button
                    type="button"
                    onClick={() => ejecutarGuardado("revision", false)}
                    disabled={exportando}
                    className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/15 text-left transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                          <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                          Guardar como Revisión
                        </span>
                        <span className="text-[9px] font-black uppercase bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                          {siguienteRevision}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--ts-text-muted)] leading-snug">
                        Crea una sub-versión nueva correlativa preservando la original para auditoría histórica.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Botón Principal: Guardar & Descargar PDF */}
              <button
                onClick={() => ejecutarGuardado(bloqueadaPorEstado ? "revision" : "sobreescribir", true)}
                disabled={exportando}
                className="w-full flex items-center justify-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm py-4 rounded-xl transition-colors shadow-lg shadow-red-900/30"
              >
                {exportando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando cambios y generando PDF...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-5 h-5" />
                    <span>Guardar y Descargar PDF Actualizado</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Modo Nueva / Duplicada */
            <div className="space-y-2 pt-2">
              <button
                onClick={() => ejecutarGuardado(modo === "duplicar" ? "nueva" : "nueva", true)}
                disabled={exportando}
                className="w-full flex items-center justify-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 disabled:opacity-50 text-white font-bold text-base py-4 rounded-xl transition-colors shadow-lg shadow-red-900/30"
              >
                {exportando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando y generando PDF...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-5 h-5" />
                    <span>Guardar y Exportar PDF</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL DE CONFIRMACIÓN DE SEGURIDAD (REGLA DE ORO) ── */}
      {modalConfirmarSobreescritura && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--ts-surface)] border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/15 rounded-2xl border border-amber-500/30 text-amber-400 shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--ts-text-primary)]">
                  Regla de Oro de Seguridad
                </h3>
                <p className="text-xs text-[var(--ts-text-muted)]">
                  Cotización {numeroCot} con impacto contable / operativo
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs space-y-2 text-amber-200">
              <p className="font-semibold text-white">
                {motivoBloqueo}
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Sobreescribir esta cotización directamente cambiará los montos de una orden o factura ya existente.
                Para mantener la trazabilidad comercial profesional, <strong>te recomendamos generar una Nueva Revisión ({siguienteRevision})</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmarSobreescritura(false)}
                className="w-full sm:w-auto px-4 py-2 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-border)] text-[var(--ts-text-primary)] rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => ejecutarGuardado("revision", true)}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Crear Revisión ({siguienteRevision}) (Recomendado)</span>
              </button>
              <button
                type="button"
                onClick={() => ejecutarGuardado("sobreescribir", false)}
                className="w-full sm:w-auto px-3 py-2 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-red-500/30 text-center"
              >
                Sobreescribir de todos modos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
