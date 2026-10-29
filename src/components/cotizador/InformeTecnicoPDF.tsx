// ─────────────────────────────────────────────────────────────────────────────
// src/components/cotizador/InformeTecnicoPDF.tsx
// Motor PDF para Informes Técnicos — Sprint 8
// Estilo: letterhead TecnoSmart, patrón de puntos, tablas comparativas, footer institucional
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React from "react";
import {
  Document, Page, Text, View, StyleSheet, Image,
  Font, pdf,
} from "@react-pdf/renderer";

// ── Paleta de colores TecnoSmart ──────────────────────────────────────────────
const ROJO  = "#c9242b";
const NEGRO = "#111111";
const GRIS  = "#6e6e6e";
const GRIS_LT = "#f5f7fa";
const BORDER = "#e2e6ea";
const BLANCO = "#ffffff";

// ── Estilos ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: BLANCO,
    paddingTop: 0,
    paddingBottom: 60,
    paddingHorizontal: 0,
  },

  // ── Barra lateral de puntos (watermark) ──────────────────────────────────
  dotSidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 18,
    backgroundColor: "#f0f0f0",
  },
  dotRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 18,
    paddingVertical: 6,
    paddingHorizontal: 3,
    gap: 3,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#c8c8c8",
    margin: 1.5,
  },

  // ── Área de contenido (desplazada por sidebar) ───────────────────────────
  content: {
    marginLeft: 22,
    marginRight: 24,
  },

  // ── HEADER / Membrete ─────────────────────────────────────────────────────
  header: {
    backgroundColor: ROJO,
    marginLeft: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLogoArea: {
    flexDirection: "column",
  },
  headerCompanyName: {
    color: BLANCO,
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  headerSlogan: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 7,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  headerDocInfo: {
    alignItems: "flex-end",
  },
  headerDocType: {
    color: BLANCO,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerDocNum: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  headerDate: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 7,
    marginTop: 2,
  },

  // ── Franja rojo bajo el header ────────────────────────────────────────────
  redStripe: {
    marginLeft: 22,
    height: 3,
    backgroundColor: "#a01e24",
  },

  // ── Info block cliente/técnico ────────────────────────────────────────────
  infoGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginHorizontal: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: GRIS_LT,
    borderRadius: 4,
    padding: 10,
    borderLeft: `3px solid ${ROJO}`,
  },
  infoCardLabel: {
    fontSize: 6,
    color: GRIS,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
    fontFamily: "Helvetica-Bold",
  },
  infoCardValue: {
    fontSize: 8.5,
    color: NEGRO,
    fontFamily: "Helvetica-Bold",
  },
  infoCardSub: {
    fontSize: 7.5,
    color: GRIS,
    marginTop: 1,
  },

  // ── SECCIÓN: título ───────────────────────────────────────────────────────
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginHorizontal: 20,
    marginBottom: 6,
    paddingBottom: 5,
    borderBottom: `1.5px solid ${ROJO}`,
  },
  sectionNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ROJO,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  sectionNumberText: {
    color: BLANCO,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  sectionTitleText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: NEGRO,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Body text ─────────────────────────────────────────────────────────────
  bodyText: {
    fontSize: 8.5,
    color: NEGRO,
    lineHeight: 1.6,
    marginHorizontal: 20,
  },

  // ── Bloque de diagnóstico ─────────────────────────────────────────────────
  diagnosticoBlock: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: GRIS_LT,
    borderRadius: 4,
    padding: 10,
    borderLeft: `3px solid ${ROJO}`,
  },
  diagnosticoTitulo: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: NEGRO,
    marginBottom: 4,
  },
  diagnosticoTexto: {
    fontSize: 8,
    color: GRIS,
    lineHeight: 1.5,
  },

  // ── Tabla de riesgos ──────────────────────────────────────────────────────
  tabla: {
    marginHorizontal: 20,
    marginTop: 4,
    borderRadius: 4,
    overflow: "hidden",
    border: `1px solid ${BORDER}`,
  },
  tablaHeader: {
    flexDirection: "row",
    backgroundColor: NEGRO,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tablaHeaderCell: {
    color: BLANCO,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tablaRow: {
    flexDirection: "row",
    borderBottom: `1px solid ${BORDER}`,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tablaRowAlt: {
    backgroundColor: GRIS_LT,
  },
  tablaCellText: {
    fontSize: 7.5,
    color: NEGRO,
    lineHeight: 1.4,
  },
  tablaCellMuted: {
    fontSize: 7.5,
    color: GRIS,
    lineHeight: 1.4,
  },

  // ── Badge nivel riesgo ────────────────────────────────────────────────────
  badgeBajo:    { backgroundColor: "#dcfce7", color: "#16a34a", fontSize: 6.5, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  badgeMedio:   { backgroundColor: "#fef9c3", color: "#ca8a04", fontSize: 6.5, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  badgeAlto:    { backgroundColor: "#ffedd5", color: "#ea580c", fontSize: 6.5, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  badgeCritico: { backgroundColor: "#fee2e2", color: "#dc2626", fontSize: 6.5, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },

  // ── Tabla comparativa ──────────────────────────────────────────────────────
  comparativaHeader: {
    flexDirection: "row",
    backgroundColor: NEGRO,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 4,
  },
  comparativaHeaderRojo: {
    flexDirection: "row",
    backgroundColor: ROJO,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 4,
  },
  comparativaRow: {
    flexDirection: "row",
    borderBottom: `1px solid ${BORDER}`,
    paddingVertical: 5,
    paddingHorizontal: 8,
    gap: 4,
  },
  comparativaActual: {
    backgroundColor: "#fff7ed",
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    flex: 2,
  },
  comparativaPropuesto: {
    backgroundColor: "#f0fdf4",
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    flex: 2,
  },

  // ── Fases de acción ────────────────────────────────────────────────────────
  faseItem: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 6,
    gap: 8,
  },
  faseNumero: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ROJO,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  faseNumeroText: {
    color: BLANCO,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
  },
  faseContenido: {
    flex: 1,
    backgroundColor: GRIS_LT,
    borderRadius: 4,
    padding: 8,
  },
  faseTitulo: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: NEGRO,
    marginBottom: 2,
  },
  faseDesc: {
    fontSize: 7.5,
    color: GRIS,
    lineHeight: 1.4,
  },
  faseDuracion: {
    fontSize: 7,
    color: ROJO,
    fontFamily: "Helvetica-Bold",
    marginTop: 3,
  },

  // ── Evidencia fotos ────────────────────────────────────────────────────────
  fotosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 20,
    gap: 8,
  },
  fotoItem: {
    width: "47%",
    marginBottom: 8,
  },
  fotoImg: {
    width: "100%",
    height: 110,
    borderRadius: 4,
    objectFit: "cover",
    border: `1px solid ${BORDER}`,
  },
  fotoDesc: {
    fontSize: 7,
    color: GRIS,
    marginTop: 3,
    textAlign: "center",
    fontStyle: "italic",
  },

  // ── Parámetros técnicos ───────────────────────────────────────────────────
  parametrosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 20,
    gap: 6,
  },
  parametroItem: {
    width: "47%",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: GRIS_LT,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottom: `2px solid ${ROJO}`,
  },
  parametroLabel: {
    fontSize: 7.5,
    color: GRIS,
  },
  parametroValor: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: NEGRO,
  },

  // ── Garantía ──────────────────────────────────────────────────────────────
  garantiaBox: {
    marginHorizontal: 20,
    backgroundColor: "#fff7ed",
    borderRadius: 4,
    padding: 12,
    borderLeft: `3px solid ${ROJO}`,
  },
  garantiaTitulo: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: NEGRO,
    marginBottom: 5,
  },
  garantiaTexto: {
    fontSize: 8,
    color: GRIS,
    lineHeight: 1.5,
  },

  // ── Firma ─────────────────────────────────────────────────────────────────
  firmaBox: {
    marginHorizontal: 20,
    marginTop: 8,
    flexDirection: "row",
    gap: 20,
  },
  firmaColumn: {
    flex: 1,
    alignItems: "center",
  },
  firmaImg: {
    width: 140,
    height: 60,
    objectFit: "contain",
    borderBottom: `1.5px solid ${NEGRO}`,
    marginBottom: 5,
  },
  firmaLinea: {
    width: 140,
    height: 1,
    backgroundColor: NEGRO,
    marginBottom: 5,
  },
  firmaNombre: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: NEGRO,
    textAlign: "center",
  },
  firmaCedula: {
    fontSize: 7,
    color: GRIS,
    textAlign: "center",
  },
  firmaCargo: {
    fontSize: 7,
    color: GRIS,
    textAlign: "center",
    fontStyle: "italic",
  },
  firmaSello: {
    width: 70,
    height: 70,
    borderRadius: 35,
    border: `1.5px dashed ${GRIS}`,
    alignItems: "center",
    justifyContent: "center",
  },
  firmaSelloText: {
    fontSize: 6,
    color: GRIS,
    textAlign: "center",
    fontStyle: "italic",
  },

  // ── FOOTER institucional ──────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 0,
    left: 22,
    right: 0,
    borderTop: `1.5px solid ${ROJO}`,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: BLANCO,
  },
  footerLeft: {
    flexDirection: "column",
  },
  footerCompany: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: NEGRO,
  },
  footerRIF: {
    fontSize: 6.5,
    color: GRIS,
    marginTop: 1,
  },
  footerSocial: {
    fontSize: 6.5,
    color: GRIS,
    marginTop: 1,
  },
  footerRight: {
    alignItems: "flex-end",
  },
  footerPage: {
    fontSize: 7,
    color: GRIS,
  },
  footerConfidencial: {
    fontSize: 6,
    color: "#b0b0b0",
    marginTop: 1,
    fontStyle: "italic",
  },
});

// ── Tipos internos ─────────────────────────────────────────────────────────────
interface PDFProps {
  orden: {
    numero: string;
    tipo_servicio?: string;
    descripcion_alcance?: string;
    direccion_obra?: string;
    cliente?: { nombre: string };
    tecnico_lider?: { nombre: string };
  };
  informe: {
    numero_informe?: string;
    tipo_informe: "inspeccion" | "final_cierre";
    fecha_informe: string;
    lugar_inspeccion: string;
    introduccion: string;
    representante?: string;
    radiografia?: { titulo: string; contenido: string }[];
    analisis_riesgos?: { riesgo: string; nivel: string; impacto: string }[];
    cuadro_comparativo?: { aspecto: string; actual: string; propuesto: string }[];
    fases_accion?: { fase: string; descripcion: string; duracion: string }[];
    trabajos_realizados?: { descripcion: string; cantidad: string; unidad: string }[];
    evidencia_fotos?: { url: string; descripcion: string }[];
    parametros_finales?: Record<string, string>;
    garantia_texto?: string;
    garantia_meses?: number;
    firma_cliente_url?: string;
    nombre_firmante?: string;
    cedula_firmante?: string;
    cargo_firmante?: string;
  };
}

// ── Componentes parciales ─────────────────────────────────────────────────────

// Sidebar de puntos (decoración lateral)
const DotSidebar = ({ pageHeight = 841 }: { pageHeight?: number }) => {
  const dotsPerColumn = Math.floor(pageHeight / 8);
  return (
    <View style={S.dotSidebar}>
      {Array.from({ length: dotsPerColumn }).map((_, i) => (
        <View key={i} style={S.dot} />
      ))}
    </View>
  );
};

// Número de sección
const SeccionTitulo = ({ numero, titulo }: { numero: number; titulo: string }) => (
  <View style={S.sectionTitle}>
    <View style={S.sectionNumber}>
      <Text style={S.sectionNumberText}>{numero}</Text>
    </View>
    <Text style={S.sectionTitleText}>{titulo}</Text>
  </View>
);

// Badge nivel de riesgo
const NivelBadge = ({ nivel }: { nivel: string }) => {
  const estilos: Record<string, any> = {
    bajo: S.badgeBajo,
    medio: S.badgeMedio,
    alto: S.badgeAlto,
    critico: S.badgeCritico,
  };
  const labels: Record<string, string> = { bajo: "BAJO", medio: "MEDIO", alto: "ALTO", critico: "CRÍTICO" };
  return <Text style={estilos[nivel] || S.badgeMedio}>{labels[nivel] || nivel.toUpperCase()}</Text>;
};

// ── DOCUMENTO PRINCIPAL ───────────────────────────────────────────────────────
export function InformeTecnicoPDF({ orden, informe }: PDFProps) {
  const esInspeccion = informe.tipo_informe === "inspeccion";
  const tipoLabel = esInspeccion ? "INFORME DE INSPECCIÓN TÉCNICA" : "INFORME DE CIERRE & ENTREGA";
  const fecha = informe.fecha_informe
    ? new Date(informe.fecha_informe + "T12:00:00").toLocaleDateString("es-VE", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  return (
    <Document title={`${tipoLabel} — ${orden.numero}`} author="TecnoSmart VZL" creator="TecnoSmart ERP v2">
      <Page size="A4" style={S.page}>
        {/* Sidebar de puntos */}
        <DotSidebar />

        {/* ── MEMBRETE ── */}
        <View style={S.header}>
          <View style={S.headerLogoArea}>
            <Text style={S.headerCompanyName}>TECNOSMART VZL</Text>
            <Text style={S.headerSlogan}>SOLUCIONES TECNOLÓGICAS • SEGURIDAD • CONECTIVIDAD</Text>
          </View>
          <View style={S.headerDocInfo}>
            <Text style={S.headerDocType}>{tipoLabel}</Text>
            <Text style={S.headerDocNum}>{informe.numero_informe || orden.numero}</Text>
            <Text style={S.headerDate}>{fecha} • {informe.lugar_inspeccion || orden.direccion_obra}</Text>
          </View>
        </View>
        <View style={S.redStripe} />

        {/* ── INFO CLIENTE / TÉCNICO ── */}
        <View style={S.infoGrid}>
          <View style={S.infoCard}>
            <Text style={S.infoCardLabel}>Cliente / Representante</Text>
            <Text style={S.infoCardValue}>{orden.cliente?.nombre || "—"}</Text>
            <Text style={S.infoCardSub}>{informe.lugar_inspeccion || orden.direccion_obra || "—"}</Text>
          </View>
          <View style={S.infoCard}>
            <Text style={S.infoCardLabel}>Tipo de Servicio</Text>
            <Text style={S.infoCardValue}>{orden.tipo_servicio || "—"}</Text>
            <Text style={S.infoCardSub}>Orden: {orden.numero}</Text>
          </View>
          <View style={S.infoCard}>
            <Text style={S.infoCardLabel}>Representante Técnico</Text>
            <Text style={S.infoCardValue}>{informe.representante || orden.tecnico_lider?.nombre || "—"}</Text>
            <Text style={S.infoCardSub}>TecnoSmart VZL</Text>
          </View>
        </View>

        {/* ── SECCIÓN 1: INTRODUCCIÓN ── */}
        {informe.introduccion && (
          <>
            <SeccionTitulo numero={1} titulo="Introducción" />
            <Text style={S.bodyText}>{informe.introduccion}</Text>
          </>
        )}

        {/* ── SECCIÓN 2: DIAGNÓSTICO (solo inspección) ── */}
        {esInspeccion && informe.radiografia && informe.radiografia.length > 0 && (
          <>
            <SeccionTitulo numero={2} titulo="Diagnóstico del Sitio" />
            {informe.radiografia.map((bloque, i) => (
              <View key={i} style={S.diagnosticoBlock}>
                <Text style={S.diagnosticoTitulo}>{bloque.titulo}</Text>
                <Text style={S.diagnosticoTexto}>{bloque.contenido}</Text>
              </View>
            ))}
          </>
        )}

        {/* ── SECCIÓN 3: ANÁLISIS DE RIESGOS (solo inspección) ── */}
        {esInspeccion && informe.analisis_riesgos && informe.analisis_riesgos.length > 0 && (
          <>
            <SeccionTitulo numero={3} titulo="Análisis de Riesgos Identificados" />
            <View style={S.tabla}>
              <View style={S.tablaHeader}>
                <Text style={[S.tablaHeaderCell, { flex: 3 }]}>Riesgo Identificado</Text>
                <Text style={[S.tablaHeaderCell, { flex: 1 }]}>Nivel</Text>
                <Text style={[S.tablaHeaderCell, { flex: 3 }]}>Impacto Potencial</Text>
              </View>
              {informe.analisis_riesgos.map((r, i) => (
                <View key={i} style={[S.tablaRow, i % 2 === 1 ? S.tablaRowAlt : {}]}>
                  <Text style={[S.tablaCellText, { flex: 3 }]}>{r.riesgo}</Text>
                  <View style={{ flex: 1 }}>
                    <NivelBadge nivel={r.nivel} />
                  </View>
                  <Text style={[S.tablaCellMuted, { flex: 3 }]}>{r.impacto}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── SECCIÓN 4: CUADRO COMPARATIVO (solo inspección) ── */}
        {esInspeccion && informe.cuadro_comparativo && informe.cuadro_comparativo.length > 0 && (
          <>
            <SeccionTitulo numero={4} titulo="Situación Actual vs. Propuesta TecnoSmart" />
            <View style={S.tabla}>
              <View style={S.comparativaHeader}>
                <Text style={[S.tablaHeaderCell, { flex: 2 }]}>Aspecto</Text>
                <Text style={[S.tablaHeaderCell, { flex: 2, color: "#f97316" }]}>Situación Actual</Text>
                <Text style={[S.tablaHeaderCell, { flex: 2, color: "#4ade80" }]}>Propuesta TecnoSmart</Text>
              </View>
              {informe.cuadro_comparativo.map((row, i) => (
                <View key={i} style={[S.comparativaRow, i % 2 === 1 ? S.tablaRowAlt : {}]}>
                  <Text style={[S.tablaCellText, { flex: 2, fontFamily: "Helvetica-Bold" }]}>{row.aspecto}</Text>
                  <View style={[S.comparativaActual, { flex: 2 }]}>
                    <Text style={[S.tablaCellMuted, { color: "#c2410c" }]}>{row.actual}</Text>
                  </View>
                  <View style={[S.comparativaPropuesto, { flex: 2 }]}>
                    <Text style={[S.tablaCellMuted, { color: "#15803d" }]}>{row.propuesto}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── SECCIÓN 5: FASES (solo inspección) ── */}
        {esInspeccion && informe.fases_accion && informe.fases_accion.length > 0 && (
          <>
            <SeccionTitulo numero={5} titulo="Plan de Acción por Fases" />
            {informe.fases_accion.map((fase, i) => (
              <View key={i} style={S.faseItem}>
                <View style={S.faseNumero}>
                  <Text style={S.faseNumeroText}>{i + 1}</Text>
                </View>
                <View style={S.faseContenido}>
                  <Text style={S.faseTitulo}>{fase.fase}</Text>
                  <Text style={S.faseDesc}>{fase.descripcion}</Text>
                  {fase.duracion && <Text style={S.faseDuracion}>⏱ {fase.duracion}</Text>}
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── SECCIÓN 2: TRABAJOS REALIZADOS (solo final_cierre) ── */}
        {!esInspeccion && informe.trabajos_realizados && informe.trabajos_realizados.length > 0 && (
          <>
            <SeccionTitulo numero={2} titulo="Trabajos Ejecutados" />
            <View style={S.tabla}>
              <View style={S.tablaHeader}>
                <Text style={[S.tablaHeaderCell, { flex: 4 }]}>Descripción del Trabajo</Text>
                <Text style={[S.tablaHeaderCell, { flex: 1 }]}>Cant.</Text>
                <Text style={[S.tablaHeaderCell, { flex: 1 }]}>Unidad</Text>
              </View>
              {informe.trabajos_realizados.map((t, i) => (
                <View key={i} style={[S.tablaRow, i % 2 === 1 ? S.tablaRowAlt : {}]}>
                  <Text style={[S.tablaCellText, { flex: 4 }]}>{t.descripcion}</Text>
                  <Text style={[S.tablaCellText, { flex: 1, textAlign: "center" }]}>{t.cantidad}</Text>
                  <Text style={[S.tablaCellMuted, { flex: 1, textAlign: "center" }]}>{t.unidad}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── SECCIÓN 3: PARÁMETROS TÉCNICOS (solo final_cierre) ── */}
        {!esInspeccion && informe.parametros_finales && Object.keys(informe.parametros_finales).filter(k => informe.parametros_finales![k]).length > 0 && (
          <>
            <SeccionTitulo numero={3} titulo="Parámetros Técnicos Medidos al Cierre" />
            <View style={S.parametrosGrid}>
              {Object.entries(informe.parametros_finales)
                .filter(([, v]) => v)
                .map(([k, v], i) => (
                  <View key={i} style={S.parametroItem}>
                    <Text style={S.parametroLabel}>{k}</Text>
                    <Text style={S.parametroValor}>{v}</Text>
                  </View>
                ))}
            </View>
          </>
        )}

        {/* ── SECCIÓN: EVIDENCIA FOTOGRÁFICA ── */}
        {informe.evidencia_fotos && informe.evidencia_fotos.length > 0 && (
          <>
            <SeccionTitulo numero={esInspeccion ? 6 : 4} titulo="Evidencia Fotográfica" />
            <View style={S.fotosGrid}>
              {informe.evidencia_fotos.map((foto, i) => (
                <View key={i} style={S.fotoItem}>
                  <Image src={foto.url} style={S.fotoImg} />
                  {foto.descripcion && <Text style={S.fotoDesc}>{foto.descripcion}</Text>}
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── SECCIÓN: GARANTÍA (solo final_cierre) ── */}
        {!esInspeccion && informe.garantia_texto && (
          <>
            <SeccionTitulo numero={5} titulo="Términos de Garantía" />
            <View style={S.garantiaBox}>
              <Text style={S.garantiaTitulo}>Garantía de {informe.garantia_meses || 12} Meses</Text>
              <Text style={S.garantiaTexto}>{informe.garantia_texto}</Text>
            </View>
          </>
        )}

        {/* ── SECCIÓN: FIRMA DIGITAL ── */}
        <SeccionTitulo numero={esInspeccion ? 7 : 6} titulo="Conformidad & Firma del Cliente" />
        <View style={S.firmaBox}>
          {/* Firma técnico */}
          <View style={S.firmaColumn}>
            <View style={S.firmaLinea} />
            <Text style={S.firmaNombre}>{orden.tecnico_lider?.nombre || "Técnico TecnoSmart"}</Text>
            <Text style={S.firmaCargo}>Representante Técnico</Text>
            <Text style={S.firmaCargo}>TecnoSmart VZL</Text>
          </View>

          {/* Firma cliente */}
          <View style={S.firmaColumn}>
            {informe.firma_cliente_url ? (
              <Image src={informe.firma_cliente_url} style={S.firmaImg} />
            ) : (
              <View style={S.firmaLinea} />
            )}
            <Text style={S.firmaNombre}>{informe.nombre_firmante || "___________________________"}</Text>
            {informe.cedula_firmante && <Text style={S.firmaCedula}>C.I. {informe.cedula_firmante}</Text>}
            <Text style={S.firmaCargo}>{informe.cargo_firmante || "Representante del Cliente"}</Text>
          </View>

          {/* Espacio para sello */}
          <View style={S.firmaColumn}>
            <View style={S.firmaSello}>
              <Text style={S.firmaSelloText}>SELLO{"\n"}EMPRESA</Text>
            </View>
          </View>
        </View>

        {/* ── FOOTER INSTITUCIONAL ── */}
        <View style={S.footer} fixed>
          <View style={S.footerLeft}>
            <Text style={S.footerCompany}>TECNOSMART VZL</Text>
            <Text style={S.footerRIF}>RIF: J-XXXXXXXXX-X • tecnologiasmartvzl@gmail.com</Text>
            <Text style={S.footerSocial}>@tecnosmartven • +58 424-000-0000</Text>
          </View>
          <View style={S.footerRight}>
            <Text style={S.footerPage} render={({ pageNumber, totalPages }) => `Pág. ${pageNumber} de ${totalPages}`} />
            <Text style={S.footerConfidencial}>Documento generado por TecnoSmart ERP</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ── Función auxiliar: generar y descargar el PDF ──────────────────────────────
export async function descargarInformePDF(props: PDFProps): Promise<void> {
  const blob = await pdf(<InformeTecnicoPDF {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const tipoLabel = props.informe.tipo_informe === "inspeccion" ? "Inspeccion" : "CierreFinal";
  a.href = url;
  a.download = `TecnoSmart_${tipoLabel}_${props.orden.numero}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
