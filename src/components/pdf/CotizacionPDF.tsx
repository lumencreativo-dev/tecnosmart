"use client";
/* eslint-disable @typescript-eslint/no-require-imports */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Image as PDFImage,
} from "@react-pdf/renderer";
import type { Cliente, LineaDetalle, ResumenCotizacion } from "@/lib/types";
import { formatFecha } from "@/lib/utils";

// ── Estilos ───────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    paddingBottom: 60,
  },
  // Header — más compacto
  header: {
    backgroundColor: "#c9242b",
    paddingHorizontal: 30,
    paddingVertical: 12,          // ← reducido de 20 → 12
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "column", justifyContent: "center" },
  logoImg: { height: 22, marginBottom: 3 },  // ← reducido de 35 → 22
  logoSub: { color: "#ffcccc", fontSize: 6.5, letterSpacing: 1.2 },
  headerMeta: { flexDirection: "column", marginTop: 4 },
  headerMetaLine: { color: "#ffdddd", fontSize: 6.5, marginTop: 1 },
  headerRight: { alignItems: "flex-end" },
  cotNum: { color: "#ffffff", fontSize: 13, fontFamily: "Helvetica-Bold" },
  cotFecha: { color: "#ffcccc", fontSize: 8, marginTop: 2 },

  // Sección cliente
  seccion: { paddingHorizontal: 30, paddingTop: 16 },
  seccionTitulo: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#6e6e6e",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
    borderBottom: "1pt solid #d9d9d9",
    paddingBottom: 4,
  },
  clienteGrid: { flexDirection: "row", gap: 20 },
  clienteCol: { flex: 1 },
  clienteLabel: { fontSize: 7, color: "#6e6e6e", marginBottom: 1 },
  clienteVal: { fontSize: 9, color: "#111111", fontFamily: "Helvetica-Bold" },

  // Tabla
  tabla: { paddingHorizontal: 30, paddingTop: 20 },
  thRow: {
    flexDirection: "row",
    backgroundColor: "#111111",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  th: { fontSize: 7, color: "#ffffff", fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  tdRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottom: "0.5pt solid #e5e7eb",
  },
  tdRowAlt: { backgroundColor: "#f8fafc" },
  td: { fontSize: 8, color: "#111111" },
  colN:    { width: "5%" },
  colDesc: { width: "45%" },
  colCant: { width: "12%", textAlign: "right" },
  colUnit: { width: "19%", textAlign: "right" },
  colSub:  { width: "19%", textAlign: "right" },

  // Resumen
  resumenWrap: {
    paddingHorizontal: 30,
    paddingTop: 16,
    alignItems: "flex-end",
  },
  resumenBox: {
    width: 230,
    borderRadius: 6,
    border: "1pt solid #d9d9d9",
    overflow: "hidden",
  },
  resumenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottom: "0.5pt solid #eeeeee",
  },
  resumenLabel: { fontSize: 8, color: "#6e6e6e" },
  resumenVal:   { fontSize: 8, color: "#111111", fontFamily: "Helvetica-Bold" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#111111",
  },
  totalLabel: { fontSize: 10, color: "#ffffff", fontFamily: "Helvetica-Bold" },
  totalVal:   { fontSize: 10, color: "#c9242b", fontFamily: "Helvetica-Bold" },

  // Esquema de pago
  pagoBox: {
    marginHorizontal: 30,
    marginTop: 12,
    backgroundColor: "#fff5f5",
    border: "1pt solid #c9242b",
    borderRadius: 6,
    padding: 10,
  },
  pagoTitulo: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#c9242b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  pagoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  pagoLabel: { fontSize: 8, color: "#111111" },
  pagoVal:   { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#111111" },
  pagoNote:  { fontSize: 7, color: "#6e6e6e", marginTop: 2 },

  // Garantías / Pie
  garantias: {
    marginHorizontal: 30,
    marginTop: 14,
    borderTop: "1pt solid #d9d9d9",
    paddingTop: 10,
  },
  garantiaTitulo: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#6e6e6e",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
  },
  garantiaItem: { fontSize: 7, color: "#6e6e6e", marginBottom: 3 },
  garantiaDot:  { color: "#c9242b" },

  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTop: "1pt solid #d9d9d9",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: "#6e6e6e" },
});

// ── Helpers ───────────────────────────────────────────────────
const usd = (n: number) =>
  "$" +
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ── Componente PDF ────────────────────────────────────────────
interface CotizacionPDFProps {
  numeroCot:   string;
  fecha:       Date;
  cliente:     Cliente;
  lineas:      LineaDetalle[];
  resumen:     ResumenCotizacion;
  notas?:      string;
}

function CotizacionDocument({
  numeroCot,
  fecha,
  cliente,
  lineas,
  resumen,
  notas,
}: CotizacionPDFProps) {
  const vencimiento = new Date(fecha);
  vencimiento.setDate(vencimiento.getDate() + 15);

  return (
    <Document
      title={`TecnoSmart - ${numeroCot}`}
      author="TecnoSmart VZL"
      subject="Cotización de Servicios"
    >
      <Page size="A4" style={S.page}>

        {/* ── HEADER ── */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            <PDFImage src="/logo-blanco.png" style={S.logoImg} />
            <Text style={S.logoSub}>
              DISTRIBUIDOR OFICIAL · SOLUCIONES TECNOLÓGICAS
            </Text>
            <View style={S.headerMeta}>
              <Text style={S.headerMetaLine}>RIF: J-50701960-8  |  Telf: 0412-2789273</Text>
              <Text style={S.headerMetaLine}>tecnosmartvzla@gmail.com</Text>
              <Text style={S.headerMetaLine}>Av. Bolívar C/C c. Páez, Edif. Sta. Eduviges II, local-02, Tinaquillo, Cojedes</Text>
            </View>
          </View>
          <View style={S.headerRight}>
            <Text style={S.cotNum}>{numeroCot}</Text>
            <Text style={S.cotFecha}>
              Fecha: {formatFecha(fecha)}
            </Text>
            <Text style={[S.cotFecha, { marginTop: 1 }]}>
              Válido hasta: {formatFecha(vencimiento)}
            </Text>
          </View>
        </View>

        {/* ── DATOS DEL CLIENTE ── */}
        <View style={S.seccion}>
          <Text style={S.seccionTitulo}>Datos del Cliente</Text>
          <View style={S.clienteGrid}>
            <View style={S.clienteCol}>
              <Text style={S.clienteLabel}>Empresa / Razón Social</Text>
              <Text style={S.clienteVal}>{cliente.empresa || "—"}</Text>
              <Text style={[S.clienteLabel, { marginTop: 6 }]}>RIF / Cédula</Text>
              <Text style={S.clienteVal}>{cliente.rif_cedula || "—"}</Text>
            </View>
            <View style={S.clienteCol}>
              <Text style={S.clienteLabel}>Contacto</Text>
              <Text style={S.clienteVal}>{cliente.contacto}</Text>
              <Text style={[S.clienteLabel, { marginTop: 6 }]}>Teléfono</Text>
              <Text style={S.clienteVal}>{cliente.telefono || "—"}</Text>
            </View>
            <View style={S.clienteCol}>
              <Text style={S.clienteLabel}>Email</Text>
              <Text style={S.clienteVal}>{cliente.email || "—"}</Text>
              <Text style={[S.clienteLabel, { marginTop: 6 }]}>Dirección</Text>
              <Text style={S.clienteVal}>{cliente.direccion || "—"}</Text>
            </View>
          </View>
        </View>

        {/* ── TABLA DESAGREGADA ── */}
        <View style={S.tabla}>
          <Text style={S.seccionTitulo}>Detalle del Presupuesto</Text>

          {/* Encabezado */}
          <View style={S.thRow}>
            <Text style={[S.th, S.colN]}>#</Text>
            <Text style={[S.th, S.colDesc]}>Descripción</Text>
            <Text style={[S.th, S.colCant]}>Cant.</Text>
            <Text style={[S.th, S.colUnit]}>P. Unit.</Text>
            <Text style={[S.th, S.colSub]}>Subtotal</Text>
          </View>

          {/* Filas */}
          {lineas.map((l, i) => (
            <View key={l.id} style={i % 2 !== 0 ? [S.tdRow, S.tdRowAlt] : [S.tdRow]}>
              <Text style={[S.td, S.colN]}>{i + 1}</Text>
              <Text style={[S.td, S.colDesc]}>{l.descripcion}</Text>
              <Text style={[S.td, S.colCant]}>{l.cantidad}</Text>
              <Text style={[S.td, S.colUnit]}>{usd(l.precio_unitario)}</Text>
              <Text style={[S.td, S.colSub]}>{usd(l.cantidad * l.precio_unitario)}</Text>
            </View>
          ))}
        </View>

        {/* ── RESUMEN ── */}
        <View style={S.resumenWrap}>
          <View style={S.resumenBox}>
            <View style={S.resumenRow}>
              <Text style={S.resumenLabel}>Subtotal</Text>
              <Text style={S.resumenVal}>{usd(resumen.subtotal)}</Text>
            </View>
            {resumen.descuento > 0 && (
              <View style={S.resumenRow}>
                <Text style={S.resumenLabel}>Descuento</Text>
                <Text style={S.resumenVal}>- {usd(resumen.descuento)}</Text>
              </View>
            )}
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>TOTAL</Text>
              <Text style={S.totalVal}>{usd(resumen.total)}</Text>
            </View>
          </View>
        </View>

        {/* ── ESQUEMA DE PAGO 70/30 ── */}
        {resumen.aplicaEsquemaPago && (
          <View style={S.pagoBox}>
            <Text style={S.pagoTitulo}>
              ★ Esquema de Pago Recomendado
            </Text>
            <View style={S.pagoRow}>
              <Text style={S.pagoLabel}>Anticipo — 70% (inicio de proyecto)</Text>
              <Text style={S.pagoVal}>{usd(resumen.anticipo)}</Text>
            </View>
            <View style={S.pagoRow}>
              <Text style={S.pagoLabel}>Saldo — 30% (contra entrega)</Text>
              <Text style={S.pagoVal}>{usd(resumen.saldo)}</Text>
            </View>
            <Text style={S.pagoNote}>
              El saldo puede cancelarse en 4 cuotas semanales en un plazo de 1 mes.
            </Text>
          </View>
        )}

        {/* ── NOTAS ── */}
        {notas && (
          <View style={[S.seccion, { marginTop: 12 }]}>
            <Text style={S.seccionTitulo}>Notas / Observaciones</Text>
            <Text style={{ fontSize: 8, color: "#6e6e6e" }}>{notas}</Text>
          </View>
        )}

        {/* ── GARANTÍAS ── */}
        <View style={S.garantias}>
          <Text style={S.garantiaTitulo}>Condiciones & Garantías</Text>
          {[
            "• Equipos: 1 año de garantía de fábrica (Hikvision).",
            "• Instalación: 2 años de garantía bajo materiales y mano de obra TecnoSmart.",
            "• Redes estructuradas: Hasta 5 años de garantía bajo protocolo TecnoSmart.",
            "• Cotización válida por 15 días hábiles a partir de la fecha de emisión.",
            "• Los precios están expresados en dólares americanos (USD).",
          ].map((g) => (
            <Text key={g} style={S.garantiaItem}>
              {g}
            </Text>
          ))}
        </View>

        {/* ── FOOTER ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>TECNO SMART VZL C.A  ·  RIF: J-50701960-8  ·  Telf: 0412-2789273  ·  tecnosmartvzla@gmail.com</Text>
          <Text style={S.footerText}>{numeroCot}</Text>
        </View>
      </Page>
    </Document>
  );
}

// ── Función exportadora ───────────────────────────────────────
export async function exportarCotizacionPDF(props: CotizacionPDFProps) {
  const blob = await pdf(<CotizacionDocument {...props} />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${props.numeroCot}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default CotizacionDocument;
