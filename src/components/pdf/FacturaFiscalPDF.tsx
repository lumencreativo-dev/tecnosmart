import React from "react";
import { Document, Page, Text, View, StyleSheet, Image as PDFImage, Font, pdf } from "@react-pdf/renderer";
import { formatUSD, formatFecha } from "@/lib/utils";
import { ISOLOGO_ROJO_B64 } from "@/lib/assets/isologo-rojo-b64"; // Isologo rojo para la factura

const S = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  
  // Header Izquierdo (Logo e Info Empresa)
  headerLeft: { flexDirection: "column", width: "55%" },
  headerLogoRow: { flexDirection: "column", marginBottom: 8 },
  logoImg: { width: 160, height: 52, marginBottom: 6, objectFit: "contain" },
  companyName: { fontSize: 8, color: "#222222", fontWeight: 700, marginBottom: 1 },
  companyRif: { fontSize: 8, color: "#6e6e6e", fontWeight: 700, marginBottom: 2 },
  companyData: { fontSize: 8, color: "#6e6e6e", marginBottom: 2, lineHeight: 1.4 },
  
  // Header Derecho (Forma Libre / Número de Control)
  headerRight: { width: "40%", textAlign: "right" },
  formaLibre: { fontSize: 10, color: "#6e6e6e", fontWeight: 400 },
  numControlLabel: { fontSize: 10, color: "#6e6e6e", fontWeight: 400 },
  numControlVal: { fontSize: 12, fontWeight: 700, color: "#c9242b" },
  
  // Bloque Cliente y Serie
  clienteSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  clienteLeft: { width: "60%" },
  clienteText: { fontSize: 9, marginBottom: 3, fontWeight: 700 },
  clienteData: { fontWeight: 400 },
  clienteRight: { width: "35%", textAlign: "right" },
  facturaSerie: { fontSize: 10, fontWeight: 900, marginBottom: 4 },
  
  // Tabla
  table: { width: "100%", marginTop: 10 },
  tableHeader: { flexDirection: "row", borderTop: "1 solid #d9d9d9", borderBottom: "1 solid #d9d9d9", paddingVertical: 6 },
  th: { fontSize: 8, color: "#6e6e6e", fontWeight: 700 },
  tableRow: { flexDirection: "row", paddingVertical: 8, borderBottom: "1 dashed #e5e5e5" },
  td: { fontSize: 9, color: "#111111" },
  
  // Columnas
  colDesc: { width: "50%", paddingRight: 10 },
  colUM: { width: "10%", textAlign: "center" },
  colCant: { width: "10%", textAlign: "center" },
  colPrecio: { width: "15%", textAlign: "right" },
  colTotal: { width: "15%", textAlign: "right" },
  
  // Resumen Fiscal
  resumenWrapper: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, paddingTop: 10, borderTop: "1 solid #d9d9d9" },
  resumenLeft: { width: "50%", fontSize: 8, color: "#6e6e6e" },
  resumenRight: { width: "40%" },
  resumenRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  resumenLabel: { fontSize: 9, color: "#6e6e6e" },
  resumenVal: { fontSize: 9, fontWeight: 700 },
  resumenTotalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4, paddingTop: 4, borderTop: "1 solid #111" },
  resumenTotalLabel: { fontSize: 10, fontWeight: 900 },
  resumenTotalVal: { fontSize: 10, fontWeight: 900 },
  
  // Footer
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, textAlign: "center" },
  footerText: { fontSize: 8, color: "#c9242b", fontWeight: 700 }
});

const formatBs = (num: number) => {
  return "Bs. " + num.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export interface FacturaFiscalProps {
  numeroFactura: string;
  numeroControl: string;
  fecha: Date;
  cliente: any;
  lineas: any[];
  moneda?: "USD" | "VES";
  mostrarNotaBcv?: boolean;
  tasaBcv?: number;
  subtotalBs?: number;
  ivaBs?: number;
  ivaPct?: number;
  igtfBs?: number;
  igtfPct?: number;
  totalBs?: number;
  subtotalUsd?: number;
  ivaUsd?: number;
  igtfUsd?: number;
  totalUsd?: number;
  aplicaIgtf: boolean;
  aplicaRetencionIva?: boolean;
  retencionIvaPct?: number;
  retencionIvaBs?: number;
  retencionIvaUsd?: number;
  aplicaRetencionIslr?: boolean;
  retencionIslrPct?: number;
  retencionIslrBs?: number;
  retencionIslrUsd?: number;
  totalNetoBs?: number;
  totalNetoUsd?: number;
}

export const FacturaFiscalDocument = ({
  numeroFactura,
  numeroControl,
  fecha,
  cliente,
  lineas,
  moneda = "VES",
  mostrarNotaBcv,
  tasaBcv = 1,
  subtotalBs = 0,
  ivaBs = 0,
  ivaPct = 16,
  igtfBs = 0,
  igtfPct = 3,
  totalBs = 0,
  subtotalUsd = 0,
  ivaUsd = 0,
  igtfUsd = 0,
  totalUsd = 0,
  aplicaIgtf,
  aplicaRetencionIva,
  retencionIvaPct = 75,
  retencionIvaBs = 0,
  retencionIvaUsd = 0,
  aplicaRetencionIslr,
  retencionIslrPct = 2,
  retencionIslrBs = 0,
  retencionIslrUsd = 0,
  totalNetoBs,
  totalNetoUsd,
}: FacturaFiscalProps) => {
  const esUSD = moneda === "USD";

  // Si no se especifica explícitamente, en USD se oculta la nota BCV y en VES se muestra si hay tasa
  const debeMostrarNotaBcv = mostrarNotaBcv !== undefined ? mostrarNotaBcv : !esUSD;

  const fmt = (num: number) => {
    if (esUSD) {
      return formatUSD(num);
    }
    return formatBs(num);
  };

  // Montos a renderizar según moneda
  const displaySubtotal = esUSD ? subtotalUsd : subtotalBs;
  const displayIva = esUSD ? ivaUsd : ivaBs;
  const displayIgtf = esUSD ? igtfUsd : igtfBs;
  const displayTotal = esUSD ? totalUsd : totalBs;
  const displayRetIva = esUSD ? retencionIvaUsd : retencionIvaBs;
  const displayRetIslr = esUSD ? retencionIslrUsd : retencionIslrBs;
  const displayTotalNeto = esUSD
    ? (totalNetoUsd ?? Math.max(0, displayTotal - displayRetIva - displayRetIslr))
    : (totalNetoBs ?? Math.max(0, displayTotal - displayRetIva - displayRetIslr));

  return (
    <Document title={`Factura Fiscal - ${numeroFactura}`}>
      <Page size="A4" style={S.page}>
        
        {/* ── HEADER ── */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            {/* Isologo + info empresa */}
            <View style={S.headerLogoRow}>
              <PDFImage src={ISOLOGO_ROJO_B64} style={S.logoImg} />
              <Text style={S.companyName}>TECNO SMART VZL C.A</Text>
              <Text style={S.companyRif}>RIF: J-50701960-8</Text>
            </View>
            {/* Dirección debajo del logo */}
            <Text style={S.companyData}>Av. Bolívar C/C c. Páez, Edif. Sta. Eduviges II, local-02</Text>
            <Text style={S.companyData}>Tinaquillo, Edo. Cojedes</Text>
            <Text style={S.companyData}>Tel: 0412-2789273  ·  tecnosmartvzla@gmail.com</Text>
          </View>
          <View style={S.headerRight}>
            <Text style={S.formaLibre}>FORMA LIBRE</Text>
            <Text style={S.numControlLabel}>NUMERO DE CONTROL</Text>
            <Text style={S.numControlVal}>{numeroControl}</Text>
          </View>
        </View>

        {/* ── CLIENTE E INFO FACTURA ── */}
        <View style={S.clienteSection}>
          <View style={S.clienteLeft}>
            <Text style={S.clienteText}>CLIENTE: <Text style={S.clienteData}>{cliente?.empresa || cliente?.contacto}</Text></Text>
            <Text style={S.clienteText}>RIF/CÉDULA: <Text style={S.clienteData}>{cliente?.rif_cedula || "—"}</Text></Text>
            <Text style={S.clienteText}>DIRECCIÓN FISCAL: <Text style={S.clienteData}>{cliente?.direccion || "—"}</Text></Text>
            <Text style={S.clienteText}>TELÉFONO: <Text style={S.clienteData}>{cliente?.telefono || "—"}</Text></Text>
          </View>
          <View style={S.clienteRight}>
            <Text style={S.facturaSerie}>FACTURA SERIE N° {numeroFactura}</Text>
            <Text style={[S.facturaSerie, { fontSize: 9 }]}>FECHA DE EMISIÓN: {formatFecha(fecha)}</Text>
            <Text style={[S.facturaSerie, { fontSize: 8, color: "#6e6e6e", marginTop: 2 }]}>
              MONEDA: {esUSD ? "DÓLARES AMERICANOS (USD)" : "BOLÍVARES (VES)"}
            </Text>
          </View>
        </View>

        {/* ── TABLA DE DETALLES ── */}
        <View style={S.table}>
          <View style={S.tableHeader}>
            <Text style={[S.th, S.colDesc]}>DESCRIPCIÓN</Text>
            <Text style={[S.th, S.colUM]}>UM</Text>
            <Text style={[S.th, S.colCant]}>CANTIDAD</Text>
            <Text style={[S.th, S.colPrecio]}>PRECIO UNITARIO</Text>
            <Text style={[S.th, S.colTotal]}>TOTAL NETO</Text>
          </View>
          
          {lineas.map((linea, i) => {
            const precioUnit = esUSD 
              ? Number(linea.precio_unitario || 0) 
              : Number(linea.precio_unitario || 0) * (tasaBcv || 1);
            const subtotalLine = precioUnit * Number(linea.cantidad || 1);
            return (
              <View key={i} style={S.tableRow}>
                <Text style={[S.td, S.colDesc]}>{linea.descripcion}</Text>
                <Text style={[S.td, S.colUM]}>UND</Text>
                <Text style={[S.td, S.colCant]}>{linea.cantidad}</Text>
                <Text style={[S.td, S.colPrecio]}>{fmt(precioUnit)}</Text>
                <Text style={[S.td, S.colTotal]}>{fmt(subtotalLine)}</Text>
              </View>
            );
          })}
        </View>

        {/* ── RESUMEN FISCAL (Moneda Seleccionada) ── */}
        <View style={S.resumenWrapper}>
          <View style={S.resumenLeft}>
            <Text>ESTE DOCUMENTO VA SIN TACHADURA NI ENMIENDA</Text>
            
            {/* Solo se imprime la tasa del BCV si NO es factura en USD y debeMostrarNotaBcv es true */}
            {debeMostrarNotaBcv && tasaBcv > 0 ? (
              <Text style={{ marginTop: 10 }}>
                Tasa oficial de cambio BCV del día: {tasaBcv.toLocaleString("es-VE")} Bs/USD
              </Text>
            ) : null}

            {Boolean(aplicaRetencionIva || aplicaRetencionIslr) && (
              <View style={{ marginTop: 8, padding: 4, backgroundColor: "#f8fafc", borderRadius: 3, border: "0.5 solid #cbd5e1" }}>
                <Text style={{ fontSize: 7, fontWeight: 700, color: "#334155" }}>SUJETO A RETENCIÓN FISCAL (CONTRIBUYENTE ESPECIAL)</Text>
                <Text style={{ fontSize: 6.5, color: "#64748b", marginTop: 1 }}>
                  El cliente retiene impuestos según normativa SENIAT y emite comprobante de retención.
                </Text>
              </View>
            )}
          </View>
          <View style={S.resumenRight}>
            <View style={S.resumenRow}>
              <Text style={S.resumenLabel}>BASE IMPONIBLE:</Text>
              <Text style={S.resumenVal}>{fmt(displaySubtotal)}</Text>
            </View>
            <View style={S.resumenRow}>
              <Text style={S.resumenLabel}>IVA ({displayIva > 0 ? `${ivaPct}%` : "0%"}):</Text>
              <Text style={S.resumenVal}>{fmt(displayIva)}</Text>
            </View>
            {aplicaIgtf && displayIgtf > 0 && (
              <View style={S.resumenRow}>
                <Text style={S.resumenLabel}>IGTF ({igtfPct}%):</Text>
                <Text style={S.resumenVal}>{fmt(displayIgtf)}</Text>
              </View>
            )}
            <View style={S.resumenTotalRow}>
              <Text style={S.resumenTotalLabel}>TOTAL A PAGAR:</Text>
              <Text style={S.resumenTotalVal}>{fmt(displayTotal)}</Text>
            </View>
            {Boolean(aplicaRetencionIva && displayRetIva > 0) && (
              <View style={[S.resumenRow, { marginTop: 4 }]}>
                <Text style={{ fontSize: 8, color: "#c9242b" }}>(-) RET. IVA ({retencionIvaPct}%):</Text>
                <Text style={{ fontSize: 8, fontWeight: 700, color: "#c9242b" }}>-{fmt(displayRetIva)}</Text>
              </View>
            )}
            {Boolean(aplicaRetencionIslr && displayRetIslr > 0) && (
              <View style={S.resumenRow}>
                <Text style={{ fontSize: 8, color: "#c9242b" }}>(-) RET. ISLR ({retencionIslrPct}%):</Text>
                <Text style={{ fontSize: 8, fontWeight: 700, color: "#c9242b" }}>-{fmt(displayRetIslr)}</Text>
              </View>
            )}
            {Boolean((aplicaRetencionIva && displayRetIva > 0) || (aplicaRetencionIslr && displayRetIslr > 0)) && (
              <View style={[S.resumenTotalRow, { borderTop: "1 solid #166534", marginTop: 4, paddingTop: 4, backgroundColor: "#f0fdf4" }]}>
                <Text style={[S.resumenTotalLabel, { color: "#166534", fontSize: 9 }]}>TOTAL NETO A COBRAR:</Text>
                <Text style={[S.resumenTotalVal, { color: "#166534", fontSize: 9 }]}>
                  {fmt(displayTotalNeto)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={S.footer}>
          <Text style={S.footerText}>ORIGINAL - CLIENTE</Text>
        </View>

      </Page>
    </Document>
  );
};

export async function exportarFacturaFiscalPDF(props: FacturaFiscalProps) {
  const blob = await pdf(<FacturaFiscalDocument {...props} />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${props.numeroFactura}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
