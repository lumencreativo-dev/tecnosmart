// ─────────────────────────────────────────────────────────────────────────────
// src/components/cotizador/InformeTecnicoWizard.tsx
// Wizard de Informes Técnicos (Inspección + Cierre Final) — Sprint 8
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, ChevronRight, ChevronLeft, FileText, Camera, PenTool,
  Plus, Trash2, Save, CheckCircle2, AlertTriangle, Loader2,
  Search, BookOpen, Zap, Eye, Download, ToggleLeft, ToggleRight,
  FileCheck, Shield, BarChart3, ClipboardList, Image as ImageIcon,
  Star, ArrowRight, Info
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";
import FirmaDigital from "./FirmaDigital";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Clausula {
  id: string;
  categoria: string;
  titulo: string;
  icono: string;
  contenido: string;
  tags: string[];
}

interface BloqueDiagnostico {
  clausula_id?: string;
  titulo: string;
  contenido: string;
  icono: string;
}

interface RiesgoItem {
  riesgo: string;
  nivel: "bajo" | "medio" | "alto" | "critico";
  impacto: string;
}

interface ComparativoItem {
  aspecto: string;
  actual: string;
  propuesto: string;
}

interface FaseAccion {
  fase: string;
  descripcion: string;
  duracion: string;
}

interface TrabajoRealizado {
  descripcion: string;
  cantidad: string;
  unidad: string;
}

interface FotoEvidencia {
  url: string;
  descripcion: string;
  tomada_en: string;
}

interface Informe {
  id?: string;
  tipo_informe: "inspeccion" | "final_cierre";
  estado: "borrador" | "finalizado" | "entregado";
  representante_tecnico_id?: string;
  fecha_informe: string;
  lugar_inspeccion: string;
  introduccion: string;
  radiografia: BloqueDiagnostico[];
  analisis_riesgos: RiesgoItem[];
  cuadro_comparativo: ComparativoItem[];
  fases_accion: FaseAccion[];
  trabajos_realizados: TrabajoRealizado[];
  evidencia_fotos: FotoEvidencia[];
  parametros_finales: Record<string, string>;
  firma_cliente_url: string;
  nombre_firmante: string;
  cedula_firmante: string;
  cargo_firmante: string;
  garantia_texto: string;
  garantia_meses: number;
  omitido: boolean;
  motivo_omision: string;
}

interface OrdenResumen {
  id: string;
  numero: string;
  tipo_flujo: "con_inspeccion" | "directo";
  tipo_servicio: string;
  descripcion_alcance: string;
  direccion_obra: string;
  cliente?: { nombre: string };
  tecnico_lider?: { nombre: string };
}

const INFORME_VACIO = (tipo: "inspeccion" | "final_cierre"): Informe => ({
  tipo_informe: tipo,
  estado: "borrador",
  fecha_informe: new Date().toISOString().slice(0, 10),
  lugar_inspeccion: "",
  introduccion: "",
  radiografia: [],
  analisis_riesgos: [],
  cuadro_comparativo: [],
  fases_accion: [],
  trabajos_realizados: [],
  evidencia_fotos: [],
  parametros_finales: {},
  firma_cliente_url: "",
  nombre_firmante: "",
  cedula_firmante: "",
  cargo_firmante: "",
  garantia_texto: "El trabajo realizado cuenta con garantía de mano de obra y materiales instalados.",
  garantia_meses: 12,
  omitido: false,
  motivo_omision: "",
});

const NIVEL_RIESGO_CONFIG = {
  bajo:    { label: "Bajo",    color: "text-green-600",  bg: "bg-green-100 dark:bg-green-900/20" },
  medio:   { label: "Medio",   color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/20" },
  alto:    { label: "Alto",    color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/20" },
  critico: { label: "Crítico", color: "text-red-600",    bg: "bg-red-100 dark:bg-red-900/20" },
};

// ── Pasos del Wizard ──────────────────────────────────────────────────────────
const PASOS_INSPECCION = [
  { id: "intro",        label: "Introducción",     icon: FileText },
  { id: "diagnostico",  label: "Diagnóstico",       icon: Search },
  { id: "riesgos",      label: "Riesgos",           icon: AlertTriangle },
  { id: "comparativo",  label: "Propuesta",         icon: BarChart3 },
  { id: "fases",        label: "Plan de Acción",    icon: ClipboardList },
  { id: "fotos",        label: "Evidencia",         icon: Camera },
  { id: "firma",        label: "Firma Cliente",     icon: PenTool },
];

const PASOS_FINAL = [
  { id: "intro",        label: "Introducción",     icon: FileText },
  { id: "trabajos",     label: "Trabajos",          icon: CheckCircle2 },
  { id: "parametros",   label: "Parámetros",        icon: Zap },
  { id: "fotos",        label: "Evidencia",         icon: Camera },
  { id: "garantia",     label: "Garantía",          icon: Shield },
  { id: "firma",        label: "Firma Cliente",     icon: PenTool },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function InformeTecnicoWizard({
  orden,
  onClose,
}: {
  orden: OrdenResumen;
  onClose: () => void;
}) {
  const { usuario } = useUsuario();
  const [tipoSeleccionado, setTipoSeleccionado] = useState<"inspeccion" | "final_cierre" | null>(null);
  const [pasoActual, setPasoActual] = useState(0);
  const [informe, setInforme] = useState<Informe | null>(null);
  const [informeId, setInformeId] = useState<string | null>(null);
  const [clausulas, setClausulas] = useState<Clausula[]>([]);
  const [queryClausula, setQueryClausula] = useState("");
  const [panelClausulas, setPanelClausulas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firmaCaptured, setFirmaCaptured] = useState(false);

  // Cargar cláusulas predefinidas
  useEffect(() => {
    supabase.from("clausulas_predefinidas").select("*").eq("activa", true).order("categoria").then(({ data }) => {
      if (data) setClausulas(data);
    });
  }, []);

  // Iniciar informe
  const iniciarInforme = async (tipo: "inspeccion" | "final_cierre") => {
    setTipoSeleccionado(tipo);
    // Buscar si ya existe un borrador
    const { data: existente } = await supabase
      .from("informes_tecnicos")
      .select("*")
      .eq("orden_id", orden.id)
      .eq("tipo_informe", tipo)
      .eq("estado", "borrador")
      .maybeSingle();

    if (existente) {
      setInforme({
        ...INFORME_VACIO(tipo),
        ...existente,
        radiografia:        existente.radiografia        || [],
        analisis_riesgos:   existente.analisis_riesgos   || [],
        cuadro_comparativo: existente.cuadro_comparativo || [],
        fases_accion:       existente.fases_accion        || [],
        trabajos_realizados: existente.trabajos_realizados || [],
        evidencia_fotos:    existente.evidencia_fotos     || [],
        parametros_finales: existente.parametros_finales  || {},
      });
      setInformeId(existente.id);
    } else {
      // Si es informe final, heredar datos del informe de inspección
      if (tipo === "final_cierre") {
        const { data: inspeccion } = await supabase
          .from("informes_tecnicos")
          .select("*")
          .eq("orden_id", orden.id)
          .eq("tipo_informe", "inspeccion")
          .not("estado", "eq", "borrador")
          .maybeSingle();

        const base = INFORME_VACIO(tipo);
        if (inspeccion) {
          base.lugar_inspeccion = inspeccion.lugar_inspeccion || "";
          base.introduccion = `Este informe de cierre corresponde al trabajo ejecutado en ${orden.direccion_obra || "la ubicación acordada"}, como seguimiento a la inspección técnica previa realizada el ${inspeccion.fecha_informe}.\n\n`;
        }
        setInforme(base);
      } else {
        const base = INFORME_VACIO(tipo);
        base.lugar_inspeccion = orden.direccion_obra || "";
        base.introduccion = `En respuesta a la solicitud del cliente, se procedió a realizar una inspección técnica integral de la infraestructura de ${orden.tipo_servicio || "telecomunicaciones"} en las instalaciones ubicadas en ${orden.direccion_obra || "la dirección acordada"}.\n\nEl objetivo principal de esta visita fue diagnosticar el estado actual del sistema, identificar vulnerabilidades y proponer soluciones técnicas adecuadas.`;
        setInforme(base);
      }
    }
  };

  // Auto-guardar en BD cada 30s
  const guardarBorrador = useCallback(async (inf?: Informe) => {
    const data = inf || informe;
    if (!data || !tipoSeleccionado) return;
    setSaving(true);

    const payload = {
      orden_id: orden.id,
      tipo_informe: data.tipo_informe,
      estado: data.estado,
      representante_tecnico_id: usuario?.id,
      fecha_informe: data.fecha_informe,
      lugar_inspeccion: data.lugar_inspeccion,
      introduccion: data.introduccion,
      radiografia: data.radiografia,
      analisis_riesgos: data.analisis_riesgos,
      cuadro_comparativo: data.cuadro_comparativo,
      fases_accion: data.fases_accion,
      trabajos_realizados: data.trabajos_realizados,
      evidencia_fotos: data.evidencia_fotos,
      parametros_finales: data.parametros_finales,
      firma_cliente_url: data.firma_cliente_url,
      nombre_firmante: data.nombre_firmante,
      cedula_firmante: data.cedula_firmante,
      cargo_firmante: data.cargo_firmante,
      garantia_texto: data.garantia_texto,
      garantia_meses: data.garantia_meses,
      omitido: data.omitido,
      motivo_omision: data.motivo_omision,
      creado_por: usuario?.id,
    };

    if (informeId) {
      await supabase.from("informes_tecnicos").update(payload).eq("id", informeId);
    } else {
      const { data: nuevo } = await supabase.from("informes_tecnicos").insert(payload).select("id").single();
      if (nuevo) setInformeId(nuevo.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [informe, informeId, tipoSeleccionado, orden.id, usuario?.id]);

  // Auto-guardado periódico
  useEffect(() => {
    if (!informe) return;
    const t = setTimeout(() => guardarBorrador(), 30000);
    return () => clearTimeout(t);
  }, [informe, guardarBorrador]);

  const upd = (campo: keyof Informe, valor: any) =>
    setInforme(prev => prev ? { ...prev, [campo]: valor } : prev);

  const pasos = tipoSeleccionado === "inspeccion" ? PASOS_INSPECCION : PASOS_FINAL;
  const esUltimoPaso = pasoActual === pasos.length - 1;

  // ── Sección: Selección de Tipo ─────────────────────────────────────────────
  if (!tipoSeleccionado || !informe) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="ts-surface rounded-2xl w-full max-w-xl">
          <div className="flex items-center justify-between p-6 border-b ts-border">
            <div>
              <h2 className="text-base font-black ts-text">Nuevo Informe Técnico</h2>
              <p className="text-xs ts-text-muted mt-0.5">Orden: {orden.numero} — {orden.tipo_servicio}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--ts-surface-2)] ts-text-muted">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm ts-text-muted">¿Qué tipo de informe vas a generar?</p>

            <div className="grid grid-cols-1 gap-3">
              {/* Informe de Inspección */}
              {orden.tipo_flujo === "con_inspeccion" && (
                <button
                  onClick={() => iniciarInforme("inspeccion")}
                  className="p-4 rounded-xl border-2 ts-border text-left hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <Search className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold ts-text">Informe de Inspección</p>
                      <p className="text-xs ts-text-muted">Diagnóstico y propuesta técnica</p>
                    </div>
                    <ArrowRight className="w-4 h-4 ts-text-muted ml-auto group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="text-xs ts-text-muted pl-12 space-y-0.5">
                    <p>✓ Diagnóstico con bloques de cláusulas predefinidas</p>
                    <p>✓ Análisis de riesgos y cuadro comparativo</p>
                    <p>✓ Plan de acción por fases</p>
                    <p>✓ Evidencia fotográfica + firma del cliente</p>
                  </div>
                </button>
              )}

              {/* Informe Final de Cierre */}
              <button
                onClick={() => iniciarInforme("final_cierre")}
                className="p-4 rounded-xl border-2 ts-border text-left hover:border-[var(--ts-red)] hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-[var(--ts-red)]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold ts-text">Informe de Cierre Final</p>
                    <p className="text-xs ts-text-muted">Entrega y conformidad del trabajo</p>
                  </div>
                  <ArrowRight className="w-4 h-4 ts-text-muted ml-auto group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="text-xs ts-text-muted pl-12 space-y-0.5">
                  <p>✓ Relación de trabajos ejecutados</p>
                  <p>✓ Parámetros técnicos medidos (señal, latencia, voltaje)</p>
                  <p>✓ Fotografías del antes/después</p>
                  <p>✓ Garantía + firma digital de conformidad</p>
                </div>
              </button>
            </div>

            {/* Omitir informe */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--ts-surface-2)] border ts-border">
              <Info className="w-4 h-4 ts-text-muted shrink-0 mt-0.5" />
              <p className="text-xs ts-text-muted">
                En casos extraordinarios (venta de mostrador, entrega inmediata) el informe puede omitirse registrando el motivo.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Wizard ─────────────────────────────────────────────────────────
  const PasoActualIcon = pasos[pasoActual].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4">
      <div className="ts-surface rounded-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">

        {/* Header Wizard */}
        <div className="flex items-center justify-between p-4 border-b ts-border">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              tipoSeleccionado === "inspeccion" ? "bg-purple-100 dark:bg-purple-900/20" : "bg-red-100 dark:bg-red-900/20"
            }`}>
              {tipoSeleccionado === "inspeccion"
                ? <Search className="w-4 h-4 text-purple-600" />
                : <FileCheck className="w-4 h-4 text-[var(--ts-red)]" />
              }
            </div>
            <div>
              <p className="text-xs font-black ts-text">
                {tipoSeleccionado === "inspeccion" ? "Informe de Inspección" : "Informe de Cierre Final"}
              </p>
              <p className="text-xs ts-text-muted">{orden.numero} — {orden.tipo_servicio}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin ts-text-muted" />}
            {saved && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            <button
              onClick={() => guardarBorrador()}
              className="text-xs px-2 py-1.5 rounded-lg border ts-border ts-text-muted hover:bg-[var(--ts-surface-2)] transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--ts-surface-2)] ts-text-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center px-4 py-2 border-b ts-border overflow-x-auto gap-0.5">
          {pasos.map((p, idx) => {
            const PIcon = p.icon;
            const activo = idx === pasoActual;
            const hecho = idx < pasoActual;
            return (
              <button
                key={p.id}
                onClick={() => setPasoActual(idx)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                  activo ? "bg-[var(--ts-red)] text-white font-bold"
                  : hecho ? "text-green-500 hover:bg-[var(--ts-surface-2)]"
                  : "ts-text-muted hover:bg-[var(--ts-surface-2)]"
                }`}
              >
                {hecho ? <CheckCircle2 className="w-3 h-3" /> : <PIcon className="w-3 h-3" />}
                <span className="hidden sm:inline">{p.label}</span>
                {idx < pasos.length - 1 && (
                  <ChevronRight className="w-3 h-3 ts-text-muted ml-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Contenido del paso */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderPaso(pasos[pasoActual].id)}
        </div>

        {/* Footer navegación */}
        <div className="flex items-center justify-between p-4 border-t ts-border">
          <button
            onClick={() => setPasoActual(p => Math.max(0, p - 1))}
            disabled={pasoActual === 0}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ts-border ts-text-muted hover:bg-[var(--ts-surface-2)] disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Anterior
          </button>

          <span className="text-xs ts-text-muted">{pasoActual + 1} / {pasos.length}</span>

          {esUltimoPaso ? (
            <button
              onClick={async () => {
                upd("estado", "finalizado");
                await guardarBorrador({ ...informe!, estado: "finalizado" });
                onClose();
              }}
              className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-bold"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Finalizar Informe
            </button>
          ) : (
            <button
              onClick={() => { guardarBorrador(); setPasoActual(p => Math.min(pasos.length - 1, p + 1)); }}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-[var(--ts-red)] text-white hover:bg-red-700 transition-colors"
            >
              Siguiente <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDERIZADO DE CADA PASO
  // ═══════════════════════════════════════════════════════════════════════════
  function renderPaso(pasoId: string) {
    switch (pasoId) {
      case "intro":     return <PasoIntroduccion />;
      case "diagnostico": return <PasoDiagnostico />;
      case "riesgos":   return <PasoRiesgos />;
      case "comparativo": return <PasoComparativo />;
      case "fases":     return <PasoFases />;
      case "trabajos":  return <PasoTrabajos />;
      case "parametros": return <PasoParametros />;
      case "fotos":     return <PasoFotos />;
      case "garantia":  return <PasoGarantia />;
      case "firma":     return <PasoFirma />;
      default:          return null;
    }
  }

  // ── Paso 1: Introducción ────────────────────────────────────────────────────
  function PasoIntroduccion() {
    return (
      <div className="space-y-4">
        <SectionHeader icon={FileText} title="Datos Generales del Informe" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Fecha del Informe</label>
            <input
              type="date"
              value={informe!.fecha_informe}
              onChange={e => upd("fecha_informe", e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Lugar / Sitio</label>
            <input
              type="text"
              value={informe!.lugar_inspeccion}
              onChange={e => upd("lugar_inspeccion", e.target.value)}
              placeholder="Nombre del establecimiento o dirección"
              className="field-input"
            />
          </div>
        </div>

        <div>
          <label className="field-label">Introducción / Antecedentes</label>
          <textarea
            value={informe!.introduccion}
            onChange={e => upd("introduccion", e.target.value)}
            rows={7}
            placeholder="Describe el contexto de la visita, quién solicitó el servicio y cuáles son los objetivos..."
            className="field-input resize-none"
          />
          <p className="text-xs ts-text-muted mt-1">{informe!.introduccion.length} caracteres</p>
        </div>
      </div>
    );
  }

  // ── Paso 2: Diagnóstico (Radiografía del sitio) ────────────────────────────
  function PasoDiagnostico() {
    const clausulasFiltradas = clausulas.filter(c =>
      !queryClausula || [c.titulo, c.contenido, ...(c.tags || [])].some(t =>
        t.toLowerCase().includes(queryClausula.toLowerCase())
      )
    );

    const agregarClausula = (c: Clausula) => {
      const bloque: BloqueDiagnostico = { clausula_id: c.id, titulo: c.titulo, contenido: c.contenido, icono: c.icono };
      upd("radiografia", [...informe!.radiografia, bloque]);
      setPanelClausulas(false);
    };

    const agregarBloqueManual = () => {
      upd("radiografia", [...informe!.radiografia, { titulo: "", contenido: "", icono: "FileText" }]);
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader icon={Search} title="Diagnóstico del Sitio" />
          <div className="flex gap-2">
            <button
              onClick={() => setPanelClausulas(!panelClausulas)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-600 hover:bg-purple-200 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" /> Biblioteca
            </button>
            <button
              onClick={agregarBloqueManual}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--ts-surface-2)] ts-text border ts-border hover:bg-[var(--ts-surface)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Manual
            </button>
          </div>
        </div>

        {/* Panel Biblioteca Cláusulas */}
        {panelClausulas && (
          <div className="border ts-border rounded-xl overflow-hidden">
            <div className="p-3 border-b ts-border bg-purple-50 dark:bg-purple-900/10">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-purple-700 dark:text-purple-400">Biblioteca de Cláusulas</span>
              </div>
              <div className="relative mt-2">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ts-text-muted" />
                <input
                  type="text"
                  value={queryClausula}
                  onChange={e => setQueryClausula(e.target.value)}
                  placeholder="Buscar por categoría, título o tag..."
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border ts-border bg-white dark:bg-gray-900 ts-text focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto divide-y ts-border">
              {clausulasFiltradas.map(c => (
                <button
                  key={c.id}
                  onClick={() => agregarClausula(c)}
                  className="w-full text-left p-3 hover:bg-[var(--ts-surface-2)] transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/20 text-purple-600 shrink-0">{c.categoria}</span>
                    <div>
                      <p className="text-xs font-bold ts-text">{c.titulo}</p>
                      <p className="text-xs ts-text-muted line-clamp-1 mt-0.5">{c.contenido}</p>
                    </div>
                  </div>
                </button>
              ))}
              {clausulasFiltradas.length === 0 && (
                <p className="text-xs ts-text-muted p-4 text-center">Sin resultados para "{queryClausula}"</p>
              )}
            </div>
          </div>
        )}

        {/* Bloques de diagnóstico */}
        <div className="space-y-3">
          {informe!.radiografia.map((bloque, idx) => (
            <div key={idx} className="border ts-border rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={bloque.titulo}
                  onChange={e => {
                    const nuevo = [...informe!.radiografia];
                    nuevo[idx] = { ...bloque, titulo: e.target.value };
                    upd("radiografia", nuevo);
                  }}
                  placeholder="Título del hallazgo..."
                  className="flex-1 text-xs font-bold rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
                />
                <button
                  onClick={() => upd("radiografia", informe!.radiografia.filter((_, i) => i !== idx))}
                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={bloque.contenido}
                onChange={e => {
                  const nuevo = [...informe!.radiografia];
                  nuevo[idx] = { ...bloque, contenido: e.target.value };
                  upd("radiografia", nuevo);
                }}
                placeholder="Descripción técnica detallada del hallazgo..."
                rows={4}
                className="w-full text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
              />
            </div>
          ))}
          {informe!.radiografia.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed ts-border rounded-xl text-xs ts-text-muted">
              <BookOpen className="w-8 h-8 mb-2 opacity-30" />
              <p>Agrega bloques desde la biblioteca o crea uno manual</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Paso 3: Análisis de Riesgos ────────────────────────────────────────────
  function PasoRiesgos() {
    const agregar = () => upd("analisis_riesgos", [...informe!.analisis_riesgos, { riesgo: "", nivel: "medio" as const, impacto: "" }]);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader icon={AlertTriangle} title="Análisis de Riesgos" />
          <button onClick={agregar} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-orange-600">
            <Plus className="w-3.5 h-3.5" /> Agregar Riesgo
          </button>
        </div>

        <div className="space-y-3">
          {informe!.analisis_riesgos.map((item, idx) => {
            const cfg = NIVEL_RIESGO_CONFIG[item.nivel];
            return (
              <div key={idx} className="border ts-border rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={item.riesgo}
                    onChange={e => {
                      const n = [...informe!.analisis_riesgos]; n[idx] = { ...item, riesgo: e.target.value }; upd("analisis_riesgos", n);
                    }}
                    placeholder="Descripción del riesgo identificado..."
                    className="flex-1 text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
                  />
                  <select
                    value={item.nivel}
                    onChange={e => {
                      const n = [...informe!.analisis_riesgos]; n[idx] = { ...item, nivel: e.target.value as RiesgoItem["nivel"] }; upd("analisis_riesgos", n);
                    }}
                    className={`text-xs rounded-lg border ts-border px-2 py-2 font-bold ${cfg.bg} ${cfg.color} focus:outline-none`}
                  >
                    <option value="bajo">Bajo</option>
                    <option value="medio">Medio</option>
                    <option value="alto">Alto</option>
                    <option value="critico">Crítico</option>
                  </select>
                  <button onClick={() => upd("analisis_riesgos", informe!.analisis_riesgos.filter((_, i) => i !== idx))} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={item.impacto}
                  onChange={e => {
                    const n = [...informe!.analisis_riesgos]; n[idx] = { ...item, impacto: e.target.value }; upd("analisis_riesgos", n);
                  }}
                  placeholder="Impacto potencial si no se atiende..."
                  className="w-full text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 focus:outline-none"
                />
              </div>
            );
          })}
          {informe!.analisis_riesgos.length === 0 && <EmptyState icon={AlertTriangle} text="Sin riesgos registrados" />}
        </div>
      </div>
    );
  }

  // ── Paso 4: Cuadro Comparativo ─────────────────────────────────────────────
  function PasoComparativo() {
    const agregar = () => upd("cuadro_comparativo", [...informe!.cuadro_comparativo, { aspecto: "", actual: "", propuesto: "" }]);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader icon={BarChart3} title="Situación Actual vs. Propuesta" />
          <button onClick={agregar} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--ts-surface-2)] ts-text border ts-border">
            <Plus className="w-3.5 h-3.5" /> Agregar Fila
          </button>
        </div>

        {informe!.cuadro_comparativo.length > 0 && (
          <div className="border ts-border rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[var(--ts-surface-2)]">
                <tr>
                  <th className="text-left p-2 font-bold ts-text-muted">Aspecto</th>
                  <th className="text-left p-2 font-bold text-orange-600">Situación Actual</th>
                  <th className="text-left p-2 font-bold text-green-600">Propuesta TecnoSmart</th>
                  <th className="p-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {informe!.cuadro_comparativo.map((row, idx) => (
                  <tr key={idx} className="border-t ts-border">
                    <td className="p-1.5">
                      <input type="text" value={row.aspecto} onChange={e => { const n = [...informe!.cuadro_comparativo]; n[idx] = {...row, aspecto: e.target.value}; upd("cuadro_comparativo", n); }} placeholder="Aspecto" className="w-full text-xs rounded border ts-border bg-[var(--ts-surface-2)] ts-text px-2 py-1 focus:outline-none" />
                    </td>
                    <td className="p-1.5">
                      <input type="text" value={row.actual} onChange={e => { const n = [...informe!.cuadro_comparativo]; n[idx] = {...row, actual: e.target.value}; upd("cuadro_comparativo", n); }} placeholder="Estado actual" className="w-full text-xs rounded border ts-border bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400 px-2 py-1 focus:outline-none" />
                    </td>
                    <td className="p-1.5">
                      <input type="text" value={row.propuesto} onChange={e => { const n = [...informe!.cuadro_comparativo]; n[idx] = {...row, propuesto: e.target.value}; upd("cuadro_comparativo", n); }} placeholder="Propuesta" className="w-full text-xs rounded border ts-border bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 px-2 py-1 focus:outline-none" />
                    </td>
                    <td className="p-1.5">
                      <button onClick={() => upd("cuadro_comparativo", informe!.cuadro_comparativo.filter((_, i) => i !== idx))} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {informe!.cuadro_comparativo.length === 0 && <EmptyState icon={BarChart3} text="Sin comparativos agregados" />}
      </div>
    );
  }

  // ── Paso 5: Fases de Acción ─────────────────────────────────────────────────
  function PasoFases() {
    const agregar = () => upd("fases_accion", [...informe!.fases_accion, { fase: `Fase ${informe!.fases_accion.length + 1}`, descripcion: "", duracion: "" }]);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader icon={ClipboardList} title="Plan de Acción por Fases" />
          <button onClick={agregar} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600">
            <Plus className="w-3.5 h-3.5" /> Agregar Fase
          </button>
        </div>

        <div className="space-y-3">
          {informe!.fases_accion.map((fase, idx) => (
            <div key={idx} className="border ts-border rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--ts-red)] text-white text-xs font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                <input type="text" value={fase.fase} onChange={e => { const n = [...informe!.fases_accion]; n[idx] = {...fase, fase: e.target.value}; upd("fases_accion", n); }} placeholder="Nombre de la fase" className="flex-1 text-xs font-bold rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 focus:outline-none" />
                <input type="text" value={fase.duracion} onChange={e => { const n = [...informe!.fases_accion]; n[idx] = {...fase, duracion: e.target.value}; upd("fases_accion", n); }} placeholder="Duración (ej: 2 días)" className="w-32 text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 focus:outline-none" />
                <button onClick={() => upd("fases_accion", informe!.fases_accion.filter((_, i) => i !== idx))} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea rows={2} value={fase.descripcion} onChange={e => { const n = [...informe!.fases_accion]; n[idx] = {...fase, descripcion: e.target.value}; upd("fases_accion", n); }} placeholder="Descripción de las actividades a realizar en esta fase..." className="w-full text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-2 resize-none focus:outline-none" />
            </div>
          ))}
          {informe!.fases_accion.length === 0 && <EmptyState icon={ClipboardList} text="Sin fases de acción definidas" />}
        </div>
      </div>
    );
  }

  // ── Paso: Trabajos Realizados (solo final_cierre) ──────────────────────────
  function PasoTrabajos() {
    const agregar = () => upd("trabajos_realizados", [...informe!.trabajos_realizados, { descripcion: "", cantidad: "1", unidad: "und" }]);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader icon={CheckCircle2} title="Trabajos Realizados" />
          <button onClick={agregar} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600">
            <Plus className="w-3.5 h-3.5" /> Agregar Item
          </button>
        </div>

        {informe!.trabajos_realizados.length > 0 && (
          <div className="border ts-border rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[var(--ts-surface-2)]">
                <tr>
                  <th className="text-left p-2 font-bold ts-text-muted">Descripción del Trabajo</th>
                  <th className="text-left p-2 font-bold ts-text-muted w-20">Cant.</th>
                  <th className="text-left p-2 font-bold ts-text-muted w-20">Unidad</th>
                  <th className="p-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {informe!.trabajos_realizados.map((t, idx) => (
                  <tr key={idx} className="border-t ts-border">
                    <td className="p-1.5">
                      <input type="text" value={t.descripcion} onChange={e => { const n = [...informe!.trabajos_realizados]; n[idx] = {...t, descripcion: e.target.value}; upd("trabajos_realizados", n); }} placeholder="Descripción..." className="w-full text-xs rounded border ts-border bg-[var(--ts-surface-2)] ts-text px-2 py-1 focus:outline-none" />
                    </td>
                    <td className="p-1.5"><input type="text" value={t.cantidad} onChange={e => { const n = [...informe!.trabajos_realizados]; n[idx] = {...t, cantidad: e.target.value}; upd("trabajos_realizados", n); }} className="w-full text-xs rounded border ts-border bg-[var(--ts-surface-2)] ts-text px-2 py-1 focus:outline-none" /></td>
                    <td className="p-1.5"><input type="text" value={t.unidad} onChange={e => { const n = [...informe!.trabajos_realizados]; n[idx] = {...t, unidad: e.target.value}; upd("trabajos_realizados", n); }} className="w-full text-xs rounded border ts-border bg-[var(--ts-surface-2)] ts-text px-2 py-1 focus:outline-none" /></td>
                    <td className="p-1.5"><button onClick={() => upd("trabajos_realizados", informe!.trabajos_realizados.filter((_, i) => i !== idx))} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500"><Trash2 className="w-3 h-3" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {informe!.trabajos_realizados.length === 0 && <EmptyState icon={CheckCircle2} text="Sin trabajos registrados" />}
      </div>
    );
  }

  // ── Paso: Parámetros Técnicos Medidos ─────────────────────────────────────
  function PasoParametros() {
    const PARAMETROS_COMUNES = [
      "Señal (dBm)", "Latencia (ms)", "Velocidad Bajada (Mbps)", "Velocidad Subida (Mbps)",
      "Pérdida de Paquetes (%)", "Temperatura Equipo (°C)", "Voltaje Alimentación (V)",
      "Intensidad de Corriente (A)", "Cobertura WiFi (-dBm)", "Uptime del Sistema",
    ];

    const params = informe!.parametros_finales;

    return (
      <div className="space-y-4">
        <SectionHeader icon={Zap} title="Parámetros Técnicos Finales" />
        <p className="text-xs ts-text-muted">Registra las mediciones tomadas al finalizar el trabajo para documentar la calidad del servicio entregado.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PARAMETROS_COMUNES.map(param => (
            <div key={param} className="flex items-center gap-2">
              <label className="text-xs ts-text-muted w-44 shrink-0">{param}</label>
              <input
                type="text"
                value={params[param] || ""}
                onChange={e => upd("parametros_finales", { ...params, [param]: e.target.value })}
                placeholder="—"
                className="flex-1 text-xs rounded-lg border ts-border bg-[var(--ts-surface-2)] ts-text px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Paso: Evidencia Fotográfica ────────────────────────────────────────────
  function PasoFotos() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const subirFoto = async (file: File) => {
      setUploading(true);
      const ext = file.name.split(".").pop();
      const path = `campo/${orden.id}/${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from("campo").upload(path, file, { upsert: true });
      if (!error && data) {
        const { data: url } = supabase.storage.from("campo").getPublicUrl(path);
        const foto: FotoEvidencia = { url: url.publicUrl, descripcion: "", tomada_en: new Date().toISOString() };
        upd("evidencia_fotos", [...informe!.evidencia_fotos, foto]);
      }
      setUploading(false);
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader icon={Camera} title="Evidencia Fotográfica" />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--ts-surface-2)] ts-text border ts-border"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
            {uploading ? "Subiendo..." : "Agregar Foto"}
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) subirFoto(e.target.files[0]); }} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {informe!.evidencia_fotos.map((foto, idx) => (
            <div key={idx} className="relative border ts-border rounded-xl overflow-hidden group">
              <img src={foto.url} alt={foto.descripcion} className="w-full h-32 object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2">
                <input
                  type="text"
                  value={foto.descripcion}
                  onChange={e => { const n = [...informe!.evidencia_fotos]; n[idx] = {...foto, descripcion: e.target.value}; upd("evidencia_fotos", n); }}
                  placeholder="Descripción..."
                  className="w-full text-xs bg-transparent text-white placeholder-gray-400 focus:outline-none"
                />
              </div>
              <button
                onClick={() => upd("evidencia_fotos", informe!.evidencia_fotos.filter((_, i) => i !== idx))}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {informe!.evidencia_fotos.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed ts-border rounded-xl ts-text-muted">
              <Camera className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-xs">Sin fotos — toca "Agregar Foto" para subir evidencia</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Paso: Garantía ──────────────────────────────────────────────────────────
  function PasoGarantia() {
    return (
      <div className="space-y-4">
        <SectionHeader icon={Shield} title="Garantía del Servicio" />

        <div>
          <label className="field-label">Período de Garantía (meses)</label>
          <input
            type="number"
            value={informe!.garantia_meses}
            onChange={e => upd("garantia_meses", parseInt(e.target.value) || 12)}
            min={1} max={60}
            className="w-32 field-input"
          />
        </div>

        <div>
          <label className="field-label">Texto de Garantía</label>
          <textarea
            rows={5}
            value={informe!.garantia_texto}
            onChange={e => upd("garantia_texto", e.target.value)}
            className="field-input resize-none"
          />
        </div>

        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 text-xs text-blue-700 dark:text-blue-400">
          <p className="font-bold mb-1">💡 Texto sugerido:</p>
          <p className="ts-text-muted">TecnoSmart VZL garantiza todos los trabajos de instalación y configuración por un período de {informe!.garantia_meses} meses contados desde la fecha de entrega. Esta garantía cubre defectos de mano de obra e instalación. No cubre daños causados por terceros, mal uso, sobretensiones eléctricas o causas de fuerza mayor.</p>
          <button
            className="mt-2 text-blue-600 hover:underline"
            onClick={() => upd("garantia_texto", `TecnoSmart VZL garantiza todos los trabajos de instalación y configuración por un período de ${informe!.garantia_meses} meses contados desde la fecha de entrega. Esta garantía cubre defectos de mano de obra e instalación. No cubre daños causados por terceros, mal uso, sobretensiones eléctricas o causas de fuerza mayor.`)}
          >
            Usar este texto
          </button>
        </div>
      </div>
    );
  }

  // ── Paso final: Firma Digital ──────────────────────────────────────────────
  function PasoFirma() {
    return (
      <div className="space-y-4">
        <SectionHeader icon={PenTool} title="Firma Digital del Cliente" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="field-label">Nombre del Firmante</label>
            <input type="text" value={informe!.nombre_firmante} onChange={e => upd("nombre_firmante", e.target.value)} placeholder="Nombre completo" className="field-input" />
          </div>
          <div>
            <label className="field-label">Cédula de Identidad</label>
            <input type="text" value={informe!.cedula_firmante} onChange={e => upd("cedula_firmante", e.target.value)} placeholder="V-12.345.678" className="field-input" />
          </div>
          <div>
            <label className="field-label">Cargo / Representación</label>
            <input type="text" value={informe!.cargo_firmante} onChange={e => upd("cargo_firmante", e.target.value)} placeholder="Gerente, Dueño, etc." className="field-input" />
          </div>
        </div>

        {informe!.firma_cliente_url ? (
          <div className="border ts-border rounded-xl p-4 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
            <p className="text-sm font-bold text-green-600">Firma capturada correctamente</p>
            <img src={informe!.firma_cliente_url} alt="Firma del cliente" className="max-h-24 mx-auto border ts-border rounded-lg p-2" />
            <button
              onClick={() => upd("firma_cliente_url", "")}
              className="text-xs text-red-500 hover:underline"
            >
              Volver a firmar
            </button>
          </div>
        ) : (
          <FirmaDigital
            onCaptura={async (dataUrl) => {
              // Subir firma a Supabase Storage
              const blob = await fetch(dataUrl).then(r => r.blob());
              const path = `campo/${orden.id}/firma_${Date.now()}.png`;
              const { error } = await supabase.storage.from("campo").upload(path, blob, { contentType: "image/png", upsert: true });
              if (!error) {
                const { data: urlData } = supabase.storage.from("campo").getPublicUrl(path);
                upd("firma_cliente_url", urlData.publicUrl);
              }
            }}
          />
        )}
      </div>
    );
  }
}

// ── Helpers UI ─────────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-[var(--ts-red)]" />
      <h3 className="text-sm font-black ts-text">{title}</h3>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed ts-border rounded-xl ts-text-muted">
      <Icon className="w-8 h-8 mb-2 opacity-30" />
      <p className="text-xs">{text}</p>
    </div>
  );
}
