// ─────────────────────────────────────────────────────────────────────────────
// src/components/cotizador/ActasManager.tsx
// Centro de Actas de Entrega, Informes Técnicos & Firmas Digitales — Sprint 8
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ClipboardCheck, FileText, Download, Search, CheckCircle2,
  Clock, Eye, User, Calendar, Shield, ExternalLink, RefreshCw,
  PenTool, AlertTriangle, Layers, X, MapPin
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";
import { tienePermiso } from "@/lib/permissions";
import { descargarInformePDF } from "./InformeTecnicoPDF";

interface InformeConOrden {
  id: string;
  orden_id: string;
  tipo_informe: "inspeccion" | "final_cierre";
  numero_informe: string | null;
  estado: "borrador" | "finalizado" | "entregado";
  fecha_informe: string;
  lugar_inspeccion: string | null;
  introduccion: string | null;
  radiografia: any[];
  analisis_riesgos: any[];
  cuadro_comparativo: any[];
  fases_accion: any[];
  trabajos_realizados: any[];
  evidencia_fotos: any[];
  parametros_finales: Record<string, string>;
  firma_cliente_url: string | null;
  nombre_firmante: string | null;
  cedula_firmante: string | null;
  cargo_firmante: string | null;
  garantia_texto: string | null;
  garantia_meses: number;
  created_at: string;
  orden?: {
    numero: string;
    tipo_servicio: string;
    direccion_obra?: string;
    cliente?: { nombre: string };
    tecnico_lider?: { nombre: string };
  };
}

const FILTROS = [
  { key: "todos", label: "Todas las Actas" },
  { key: "inspeccion", label: "Informes de Inspección" },
  { key: "final_cierre", label: "Actas de Cierre Final" },
  { key: "firmadas", label: "Con Firma Digital" },
  { key: "pendientes_firma", label: "Pendientes por Firma" },
];

export default function ActasManager() {
  const { usuario } = useUsuario();
  const permisosUsuario: string[] = usuario?.roles?.permisos || (usuario?.rol_id === "admin" ? ["*"] : []);
  const puedeVer = tienePermiso(permisosUsuario, "proyectos.actas");

  const [informes, setInformes] = useState<InformeConOrden[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [descargandoId, setDescargandoId] = useState<string | null>(null);
  const [informeSeleccionado, setInformeSeleccionado] = useState<InformeConOrden | null>(null);

  const cargarInformes = useCallback(async () => {
    setLoading(true);

    // 1. Cargar informes técnicos
    const { data, error } = await supabase
      .from("informes_tecnicos")
      .select(`
        *,
        orden:ordenes_trabajo!informes_tecnicos_orden_id_fkey(
          numero,
          tipo_servicio,
          direccion_obra,
          cliente_id,
          eliminada,
          tecnico_lider:perfiles!ordenes_trabajo_tecnico_lider_id_fkey(nombre)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    // 2. Cruzar con tabla de clientes
    const { data: clientesData } = await supabase
      .from("clientes")
      .select("id, empresa, contacto")
      .limit(1000);

    const mapaCli: Record<string, string> = {};
    (clientesData || []).forEach(c => {
      mapaCli[c.id] = c.empresa ? (c.contacto ? `${c.empresa} (${c.contacto})` : c.empresa) : (c.contacto || "Cliente");
    });

    if (!error && data) {
      const procesados = (data as any[])
        .filter(inf => !inf.orden?.eliminada)
        .map(inf => ({
        ...inf,
        orden: {
          ...inf.orden,
          cliente: inf.orden?.cliente_id && mapaCli[inf.orden.cliente_id]
            ? { nombre: mapaCli[inf.orden.cliente_id] }
            : undefined
        }
      }));
      setInformes(procesados as InformeConOrden[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    cargarInformes();
  }, [cargarInformes]);

  // Descargar PDF con el motor oficial
  const handleDescargar = async (inf: InformeConOrden) => {
    setDescargandoId(inf.id);
    try {
      await descargarInformePDF({
        orden: {
          numero: inf.orden?.numero || "OT-000",
          tipo_servicio: inf.orden?.tipo_servicio,
          direccion_obra: inf.lugar_inspeccion || inf.orden?.direccion_obra,
          cliente: inf.orden?.cliente,
          tecnico_lider: inf.orden?.tecnico_lider,
        },
        informe: {
          numero_informe: inf.numero_informe || `INF-${inf.orden?.numero || "DOC"}`,
          tipo_informe: inf.tipo_informe,
          fecha_informe: inf.fecha_informe,
          lugar_inspeccion: inf.lugar_inspeccion || inf.orden?.direccion_obra || "",
          introduccion: inf.introduccion || "",
          radiografia: inf.radiografia || [],
          analisis_riesgos: inf.analisis_riesgos || [],
          cuadro_comparativo: inf.cuadro_comparativo || [],
          fases_accion: inf.fases_accion || [],
          trabajos_realizados: inf.trabajos_realizados || [],
          evidencia_fotos: inf.evidencia_fotos || [],
          parametros_finales: inf.parametros_finales || {},
          garantia_texto: inf.garantia_texto || "",
          garantia_meses: inf.garantia_meses || 12,
          firma_cliente_url: inf.firma_cliente_url || undefined,
          nombre_firmante: inf.nombre_firmante || undefined,
          cedula_firmante: inf.cedula_firmante || undefined,
          cargo_firmante: inf.cargo_firmante || undefined,
        },
      });
    } catch (e) {
      console.error("Error al descargar PDF:", e);
    }
    setDescargandoId(null);
  };

  // Filtrado
  const informesFiltrados = useMemo(() => {
    return informes.filter(i => {
      const q = query.toLowerCase();
      const matchQuery =
        !query ||
        (i.numero_informe || "").toLowerCase().includes(q) ||
        (i.orden?.numero || "").toLowerCase().includes(q) ||
        (i.orden?.cliente?.nombre || "").toLowerCase().includes(q) ||
        (i.nombre_firmante || "").toLowerCase().includes(q) ||
        (i.orden?.tipo_servicio || "").toLowerCase().includes(q);

      const matchFiltro =
        filtroTipo === "todos"
          ? true
          : filtroTipo === "inspeccion"
          ? i.tipo_informe === "inspeccion"
          : filtroTipo === "final_cierre"
          ? i.tipo_informe === "final_cierre"
          : filtroTipo === "firmadas"
          ? Boolean(i.firma_cliente_url)
          : filtroTipo === "pendientes_firma"
          ? !i.firma_cliente_url
          : true;

      return matchQuery && matchFiltro;
    });
  }, [informes, query, filtroTipo]);

  // Métricas
  const totalActas = informes.length;
  const actasFirmadas = informes.filter(i => i.firma_cliente_url).length;
  const actasInspeccion = informes.filter(i => i.tipo_informe === "inspeccion").length;
  const actasCierre = informes.filter(i => i.tipo_informe === "final_cierre").length;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black ts-text flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-[var(--ts-red)]" /> Actas de Entrega & Informes Técnicos
            </h1>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              BETA
            </span>
          </div>
          <p className="text-xs ts-text-muted mt-0.5">
            Archivo oficial de informes de inspección previa, actas de cierre y firmas de conformidad
          </p>
        </div>

        <button
          onClick={cargarInformes}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border ts-border ts-text hover:bg-[var(--ts-surface-2)] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Métricas Globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="ts-surface rounded-2xl p-4 border ts-border">
          <span className="text-xs font-bold ts-text-muted uppercase">Total Informes</span>
          <div className="text-2xl font-black ts-text mt-1">{totalActas}</div>
          <div className="text-[11px] ts-text-muted mt-0.5">Documentos técnicos creados</div>
        </div>

        <div className="ts-surface rounded-2xl p-4 border ts-border">
          <span className="text-xs font-bold text-green-600 uppercase">Con Firma Digital</span>
          <div className="text-2xl font-black text-green-600 mt-1">{actasFirmadas}</div>
          <div className="text-[11px] ts-text-muted mt-0.5">Certificados por el cliente</div>
        </div>

        <div className="ts-surface rounded-2xl p-4 border ts-border">
          <span className="text-xs font-bold text-purple-600 uppercase">Inspecciones</span>
          <div className="text-2xl font-black text-purple-600 mt-1">{actasInspeccion}</div>
          <div className="text-[11px] ts-text-muted mt-0.5">Diagnósticos previos</div>
        </div>

        <div className="ts-surface rounded-2xl p-4 border ts-border">
          <span className="text-xs font-bold text-[var(--ts-red)] uppercase">Cierres Finales</span>
          <div className="text-2xl font-black text-[var(--ts-red)] mt-1">{actasCierre}</div>
          <div className="text-[11px] ts-text-muted mt-0.5">Obras concluidas</div>
        </div>
      </div>

      {/* Buscador y Pestañas */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ts-text-muted" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por acta, OT, cliente, firmante o servicio..."
            className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border ts-border bg-[var(--ts-surface)] ts-text focus:outline-none focus:ring-1 focus:ring-[var(--ts-red)]"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {FILTROS.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltroTipo(f.key)}
              className={`text-xs px-3 py-2 rounded-xl transition-all whitespace-nowrap font-medium ${
                filtroTipo === f.key
                  ? "bg-[var(--ts-red)] text-white font-bold"
                  : "ts-surface border ts-border ts-text-muted hover:ts-text"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Actas */}
      {loading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-8 h-8 animate-spin ts-text-muted" />
        </div>
      ) : informesFiltrados.length === 0 ? (
        <div className="ts-surface rounded-2xl border ts-border flex flex-col items-center justify-center py-16 ts-text-muted">
          <FileText className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">No se encontraron informes técnicos</p>
          <p className="text-xs mt-1">Genera un informe desde el módulo de Órdenes de Trabajo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {informesFiltrados.map(inf => {
            const esInspeccion = inf.tipo_informe === "inspeccion";
            const estaFirmada = Boolean(inf.firma_cliente_url);
            const isDownloading = descargandoId === inf.id;

            return (
              <div
                key={inf.id}
                className="ts-surface rounded-2xl border ts-border p-4 flex flex-col justify-between hover:border-[var(--ts-red)]/50 transition-all shadow-xs"
              >
                <div>
                  {/* Badges superiores */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        esInspeccion
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600"
                          : "bg-red-100 dark:bg-red-900/30 text-[var(--ts-red)]"
                      }`}
                    >
                      {esInspeccion ? "Informe de Inspección" : "Acta de Cierre Final"}
                    </span>

                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        estaFirmada
                          ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600"
                      }`}
                    >
                      <PenTool className="w-2.5 h-2.5" />
                      {estaFirmada ? "Firmada" : "Sin Firma"}
                    </span>
                  </div>

                  {/* Título y Orden */}
                  <div className="mb-2">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold ts-text">
                      <span className="text-[var(--ts-red)]">{inf.orden?.numero || "OT"}</span>
                      {inf.numero_informe && (
                        <span className="ts-text-muted">· {inf.numero_informe}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-black ts-text mt-0.5 truncate">
                      {inf.orden?.tipo_servicio || "Servicio Técnico"}
                    </h3>
                  </div>

                  {/* Cliente y Ubicación */}
                  <div className="space-y-1 text-xs py-2 border-y ts-border mb-3">
                    {inf.orden?.cliente?.nombre && (
                      <div className="flex items-center gap-1.5 ts-text font-medium truncate">
                        <User className="w-3 h-3 ts-text-muted shrink-0" />
                        <span className="truncate">{inf.orden.cliente.nombre}</span>
                      </div>
                    )}

                    {(inf.lugar_inspeccion || inf.orden?.direccion_obra) && (
                      <div className="flex items-center gap-1.5 ts-text-muted truncate text-[11px]">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{inf.lugar_inspeccion || inf.orden?.direccion_obra}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] ts-text-muted pt-1">
                      <span>Técnico: <strong className="ts-text">{inf.orden?.tecnico_lider?.nombre || "Asignado"}</strong></span>
                      <span>{new Date(inf.fecha_informe).toLocaleDateString("es-VE")}</span>
                    </div>
                  </div>

                  {/* Firmante si está firmado */}
                  {estaFirmada && (
                    <div className="p-2 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 text-[11px] mb-3">
                      <span className="text-green-700 dark:text-green-400 font-bold block">
                        ✓ Firmado por: {inf.nombre_firmante || "Cliente"}
                      </span>
                      {inf.cedula_firmante && (
                        <span className="text-[10px] text-green-600 dark:text-green-500">
                          C.I. {inf.cedula_firmante} · {inf.cargo_firmante || "Titular"}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setInformeSeleccionado(inf)}
                    className="text-xs font-bold px-3 py-2 rounded-xl border ts-border ts-text hover:bg-[var(--ts-surface-2)] transition-all flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver</span>
                  </button>

                  <button
                    onClick={() => handleDescargar(inf)}
                    disabled={isDownloading}
                    className="text-xs font-bold px-3 py-2 rounded-xl bg-[var(--ts-red)] hover:bg-red-700 text-white transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className={`w-3.5 h-3.5 ${isDownloading ? "animate-bounce" : ""}`} />
                    <span>{isDownloading ? "Generando..." : "Descargar PDF"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detalle / Vista Previa de Acta */}
      {informeSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="ts-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-5 border-b ts-border flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[var(--ts-red)]">
                  {informeSeleccionado.orden?.numero} · {informeSeleccionado.numero_informe || "Acta"}
                </span>
                <h2 className="text-base font-black ts-text">
                  {informeSeleccionado.tipo_informe === "inspeccion"
                    ? "Informe de Inspección Técnica"
                    : "Acta de Cierre & Conformidad"}
                </h2>
              </div>
              <button
                onClick={() => setInformeSeleccionado(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--ts-surface-2)] ts-text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {informeSeleccionado.introduccion && (
                <div>
                  <span className="font-bold uppercase text-[10px] ts-text-muted block mb-1">Introducción</span>
                  <p className="p-3 rounded-xl bg-[var(--ts-surface-2)] ts-text leading-relaxed">
                    {informeSeleccionado.introduccion}
                  </p>
                </div>
              )}

              {/* Firma del cliente si existe */}
              <div>
                <span className="font-bold uppercase text-[10px] ts-text-muted block mb-1">Firma del Cliente</span>
                {informeSeleccionado.firma_cliente_url ? (
                  <div className="p-4 rounded-xl border ts-border text-center bg-white space-y-2">
                    <img
                      src={informeSeleccionado.firma_cliente_url}
                      alt="Firma"
                      className="max-h-24 mx-auto object-contain"
                    />
                    <div className="border-t pt-2 text-gray-800">
                      <p className="font-bold">{informeSeleccionado.nombre_firmante || "Cliente"}</p>
                      <p className="text-[11px] text-gray-500">
                        {informeSeleccionado.cedula_firmante ? `C.I. ${informeSeleccionado.cedula_firmante}` : ""}
                        {informeSeleccionado.cargo_firmante ? ` · ${informeSeleccionado.cargo_firmante}` : ""}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border-2 border-dashed ts-border text-center ts-text-muted italic">
                    Sin firma digital registrada
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t ts-border flex justify-end gap-2">
              <button
                onClick={() => setInformeSeleccionado(null)}
                className="text-xs px-4 py-2 rounded-xl border ts-border ts-text hover:bg-[var(--ts-surface-2)]"
              >
                Cerrar
              </button>
              <button
                onClick={() => handleDescargar(informeSeleccionado)}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-[var(--ts-red)] text-white hover:bg-red-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
