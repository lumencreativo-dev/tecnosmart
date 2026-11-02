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
import { LOGO_BLANCO_B64 } from "@/lib/assets/logo-b64";

// ── Estilos ───────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    paddingBottom: 60,
  },
  // Header — compacto con isotipo + texto
  header: {
    backgroundColor: "#c9242b",
    paddingHorizontal: 30,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoImg: { height: 28, width: 28 },                         // Isotipo cuadrado
  headerBrand: { flexDirection: "column", justifyContent: "center" },
  logoName: { color: "#ffffff", fontSize: 13, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  logoSub: { color: "#ffcccc", fontSize: 6, letterSpacing: 1.2, marginTop: 1 },
  headerMeta: { flexDirection: "column", marginTop: 3 },
  headerMetaLine: { color: "#ffdddd", fontSize: 6, marginTop: 1 },
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

  // Tabla Detalle
  tabla: { paddingHorizontal: 30, paddingTop: 16 },
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

  // Desglose fiscal SENIAT en columnas
  desgloseFiscalWrap: {
    paddingHorizontal: 30,
    paddingTop: 14,
  },
  fiscalThRow: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderBottom: "1pt solid #111111",
  },
  fiscalTh: {
    fontSize: 6.5,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    textAlign: "center",
    paddingHorizontal: 2,
  },
  fiscalTdRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: "#f9fafb",
    borderBottom: "0.5pt solid #d1d5db",
    borderLeft: "0.5pt solid #d1d5db",
    borderRight: "0.5pt solid #d1d5db",
  },
  fiscalTd: {
    fontSize: 7.5,
    color: "#111111",
    textAlign: "center",
    paddingHorizontal: 2,
  },

  // Resumen
  resumenWrap: {
    paddingHorizontal: 30,
    paddingTop: 14,
    alignItems: "flex-end",
  },
  resumenBox: {
    width: 240,
    borderRadius: 6,
    border: "1pt solid #d9d9d9",
    overflow: "hidden",
  },
  resumenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottom: "0.5pt solid #eeeeee",
  },
  resumenLabel: { fontSize: 8, color: "#6e6e6e" },
  resumenVal:   { fontSize: 8, color: "#111111", fontFamily: "Helvetica-Bold" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#111111",
  },
  totalLabel: { fontSize: 9, color: "#ffffff", fontFamily: "Helvetica-Bold" },
  totalVal:   { fontSize: 9, color: "#c9242b", fontFamily: "Helvetica-Bold" },

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

// ── Componente PDF ────────────────────────────────────────────
export interface CotizacionPDFProps {
  numeroCot:      string;
  fecha:          Date;
  cliente:        Cliente;
  lineas:         LineaDetalle[];
  resumen:        ResumenCotizacion;
  notas?:         string;
  esFactura?:     boolean;
  numeroFactura?: string;
  moneda?:        "USD" | "VES";
  tasaBcv?:       number;
}

function CotizacionDocument({
  numeroCot,
  fecha,
  cliente,
  lineas,
  resumen,
  notas,
  esFactura,
  numeroFactura,
  moneda,
  tasaBcv,
}: CotizacionPDFProps) {
  const vencimiento = new Date(fecha);
  vencimiento.setDate(vencimiento.getDate() + 15);

  const docTitle = esFactura ? (numeroFactura ?? numeroCot) : numeroCot;

  // Manejo de moneda y factor de conversión
  const isVES = (moneda || resumen.moneda) === "VES";
  const currentTasaBcv = tasaBcv || resumen.tasaBcv || 0;
  const factor = isVES && currentTasaBcv > 0 ? currentTasaBcv : 1;

  const fmt = (usdVal: number) => {
    const converted = usdVal * factor;
    if (isVES) {
      return "Bs. " + converted.toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return "$" + converted.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Cálculos consistentes
  const baseImponible = typeof resumen.baseImponible === "number"
    ? resumen.baseImponible
    : Math.max(0, resumen.subtotal - (resumen.descuento || 0));

  const ivaPct = typeof resumen.ivaPct === "number" ? resumen.ivaPct : 16;
  const aplicaIva = resumen.aplicaIva ?? true;
  const ivaMonto = typeof resumen.ivaMonto === "number"
    ? resumen.ivaMonto
    : (aplicaIva ? baseImponible * (ivaPct / 100) : 0);

  const totalPresupuesto = typeof resumen.total === "number" && resumen.total > 0
    ? resumen.total
    : baseImponible + ivaMonto;

  const retIvaMonto = resumen.retencionIvaMonto || 0;
  const retIslrMonto = resumen.retencionIslrMonto || 0;
  const totalNeto = typeof resumen.totalNeto === "number"
    ? resumen.totalNeto
    : Math.max(0, totalPresupuesto - retIvaMonto - retIslrMonto);

  const tieneRetIva = Boolean(resumen.aplicaRetenciones && resumen.aplicaRetencionIva && retIvaMonto > 0);
  const tieneRetIslr = Boolean(resumen.aplicaRetenciones && resumen.aplicaRetencionIslr && retIslrMonto > 0);
  const tieneAlgunaRetencion = tieneRetIva || tieneRetIslr;

  return (
    <Document
      title={`TecnoSmart - ${docTitle}`}
      author="TecnoSmart VZL"
      subject={esFactura ? "Factura de Servicios" : "Cotización de Servicios"}
    >
      <Page size="A4" style={S.page}>

        {/* ── HEADER ── */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            <PDFImage src={LOGO_BLANCO_B64} style={S.logoImg} />
            <View style={S.headerBrand}>
              <Text style={S.logoName}>TECNO SMART VZL C.A</Text>
              <Text style={S.logoSub}>TIENDA ESPECIALIZADA · SOLUCIONES TECNOLÓGICAS</Text>
              <View style={S.headerMeta}>
                <Text style={S.headerMetaLine}>RIF: J-50701960-8  ·  Telf: 0412-2789273  ·  tecnosmartvzla@gmail.com</Text>
                <Text style={S.headerMetaLine}>Av. Bolívar C/C c. Páez, Edif. Sta. Eduviges II, local-02, Tinaquillo, Cojedes</Text>
              </View>
            </View>
          </View>
          <View style={S.headerRight}>
            <Text style={[S.cotNum, esFactura ? { color: "#ffffff" } : undefined]}>
              {esFactura ? "FACTURA" : "COTIZACIÓN"}
            </Text>
            <Text style={[S.cotNum, { fontSize: 11, marginTop: 2 }]}>
              {docTitle}
            </Text>
            <Text style={S.cotFecha}>Fecha: {formatFecha(fecha)}</Text>
            {!esFactura && (
              <Text style={[S.cotFecha, { marginTop: 1 }]}>Válido hasta: {formatFecha(vencimiento)}</Text>
            )}
            <Text style={[S.cotFecha, { marginTop: 2, fontFamily: "Helvetica-Bold", color: "#ffffff" }]}>
              Moneda: {isVES ? "Bolívares (Bs.)" : "Dólares (USD)"}
            </Text>
            {isVES && currentTasaBcv > 0 && (
              <Text style={[S.cotFecha, { color: "#ffdddd", fontSize: 7 }]}>
                Tasa BCV: Bs. {currentTasaBcv.toFixed(2)}
              </Text>
            )}
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
            <Text style={[S.th, S.colUnit]}>{isVES ? "P. Unit. (Bs.)" : "P. Unit."}</Text>
            <Text style={[S.th, S.colSub]}>{isVES ? "Subtotal (Bs.)" : "Subtotal"}</Text>
          </View>

          {/* Filas */}
          {lineas.map((l, i) => (
            <View key={l.id} style={i % 2 !== 0 ? [S.tdRow, S.tdRowAlt] : [S.tdRow]}>
              <Text style={[S.td, S.colN]}>{i + 1}</Text>
              <Text style={[S.td, S.colDesc]}>{l.descripcion}</Text>
              <Text style={[S.td, S.colCant]}>{l.cantidad}</Text>
              <Text style={[S.td, S.colUnit]}>{fmt(l.precio_unitario)}</Text>
              <Text style={[S.td, S.colSub]}>{fmt(l.cantidad * l.precio_unitario)}</Text>
            </View>
          ))}
        </View>

        {/* ── CUADRO DE DESGLOSE Y LIQUIDACIÓN FISCAL (ESTILO SENIAT) ── */}
        <View style={S.desgloseFiscalWrap}>
          <Text style={S.seccionTitulo}>Cuadro de Desglose y Liquidación Tributaria</Text>
          <View style={S.fiscalThRow}>
            <Text style={[S.fiscalTh, { flex: 1.2 }]}>Base Imponible</Text>
            <Text style={[S.fiscalTh, { flex: 0.8 }]}>% Alíc. IVA</Text>
            <Text style={[S.fiscalTh, { flex: 1.1 }]}>Monto IVA (+)</Text>
            <Text style={[S.fiscalTh, { flex: 1.2 }]}>Total Presupuesto</Text>
            {tieneRetIva && (
              <>
                <Text style={[S.fiscalTh, { flex: 0.8 }]}>% Ret. IVA</Text>
                <Text style={[S.fiscalTh, { flex: 1.1, backgroundColor: "#991b1b" }]}>IVA Retenido (-)</Text>
              </>
            )}
            {tieneRetIslr && (
              <>
                <Text style={[S.fiscalTh, { flex: 0.8 }]}>% Ret. ISLR</Text>
                <Text style={[S.fiscalTh, { flex: 1.1, backgroundColor: "#991b1b" }]}>ISLR Retenido (-)</Text>
              </>
            )}
            {tieneAlgunaRetencion && (
              <Text style={[S.fiscalTh, { flex: 1.3, backgroundColor: "#15803d" }]}>Total Neto a Cobrar</Text>
            )}
          </View>
          <View style={S.fiscalTdRow}>
            <Text style={[S.fiscalTd, { flex: 1.2 }]}>{fmt(baseImponible)}</Text>
            <Text style={[S.fiscalTd, { flex: 0.8 }]}>
              {aplicaIva ? `${ivaPct}%` : "0% (Exento)"}
            </Text>
            <Text style={[S.fiscalTd, { flex: 1.1 }]}>
              {aplicaIva ? `+${fmt(ivaMonto)}` : "—"}
            </Text>
            <Text style={[S.fiscalTd, { flex: 1.2, fontFamily: "Helvetica-Bold" }]}>
              {fmt(totalPresupuesto)}
            </Text>
            {tieneRetIva && (
              <>
                <Text style={[S.fiscalTd, { flex: 0.8 }]}>{resumen.retencionIvaPct}%</Text>
                <Text style={[S.fiscalTd, { flex: 1.1, color: "#c9242b", fontFamily: "Helvetica-Bold" }]}>
                  -{fmt(retIvaMonto)}
                </Text>
              </>
            )}
            {tieneRetIslr && (
              <>
                <Text style={[S.fiscalTd, { flex: 0.8 }]}>{resumen.retencionIslrPct}%</Text>
                <Text style={[S.fiscalTd, { flex: 1.1, color: "#c9242b", fontFamily: "Helvetica-Bold" }]}>
                  -{fmt(retIslrMonto)}
                </Text>
              </>
            )}
            {tieneAlgunaRetencion && (
              <Text style={[S.fiscalTd, { flex: 1.3, color: "#15803d", fontFamily: "Helvetica-Bold" }]}>
                {fmt(totalNeto)}
              </Text>
            )}
          </View>
        </View>

        {/* ── RESUMEN ── */}
        <View style={S.resumenWrap}>
          <View style={S.resumenBox}>
            <View style={S.resumenRow}>
              <Text style={S.resumenLabel}>Base Imponible</Text>
              <Text style={S.resumenVal}>{fmt(baseImponible)}</Text>
            </View>
            {resumen.descuento > 0 && (
              <View style={S.resumenRow}>
                <Text style={S.resumenLabel}>Descuento</Text>
                <Text style={S.resumenVal}>- {fmt(resumen.descuento)}</Text>
              </View>
            )}
            <View style={S.resumenRow}>
              <Text style={S.resumenLabel}>
                (+) IVA ({aplicaIva ? `${ivaPct}%` : "Exento"})
              </Text>
              <Text style={[S.resumenVal, { color: aplicaIva ? "#111111" : "#6e6e6e" }]}>
                {aplicaIva ? `+ ${fmt(ivaMonto)}` : "—"}
              </Text>
            </View>
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>TOTAL PRESUPUESTO</Text>
              <Text style={S.totalVal}>{fmt(totalPresupuesto)}</Text>
            </View>
            {tieneAlgunaRetencion && (
              <>
                {tieneRetIva && (
                  <View style={S.resumenRow}>
                    <Text style={[S.resumenLabel, { color: "#c9242b" }]}>(-) Ret. IVA ({resumen.retencionIvaPct}%):</Text>
                    <Text style={[S.resumenVal, { color: "#c9242b" }]}>- {fmt(retIvaMonto)}</Text>
                  </View>
                )}
                {tieneRetIslr && (
                  <View style={S.resumenRow}>
                    <Text style={[S.resumenLabel, { color: "#c9242b" }]}>(-) Ret. ISLR ({resumen.retencionIslrPct}%):</Text>
                    <Text style={[S.resumenVal, { color: "#c9242b" }]}>- {fmt(retIslrMonto)}</Text>
                  </View>
                )}
                <View style={[S.totalRow, { backgroundColor: "#15803d" }]}>
                  <Text style={S.totalLabel}>TOTAL NETO A COBRAR</Text>
                  <Text style={[S.totalVal, { color: "#ffffff" }]}>{fmt(totalNeto)}</Text>
                </View>
              </>
            )}
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
              <Text style={S.pagoVal}>{fmt(resumen.anticipo)}</Text>
            </View>
            <View style={S.pagoRow}>
              <Text style={S.pagoLabel}>Saldo — 30% (contra entrega)</Text>
              <Text style={S.pagoVal}>{fmt(resumen.saldo)}</Text>
            </View>
            <Text style={S.pagoNote}>
              El saldo puede cancelarse en 4 cuotas semanales en un plazo de 1 mes (4 cuotas de {fmt(resumen.saldo / 4)}).
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
            isVES && currentTasaBcv > 0
              ? `• Precios expresados en Bolívares (Bs.) calculados según tasa oficial del Banco Central de Venezuela (BCV: Bs. ${currentTasaBcv.toFixed(2)} / USD).`
              : "• Los precios están expresados en dólares americanos (USD). En caso de pago en bolívares, se calculará a la tasa oficial del Banco Central de Venezuela (BCV) del día de pago.",
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
  const fileName = props.esFactura ? (props.numeroFactura ?? props.numeroCot) : props.numeroCot;
  a.download = `${fileName}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default CotizacionDocument;
