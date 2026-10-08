import React from "react";
import { Document, Page, Text, View, StyleSheet, Image as PDFImage, Font, pdf } from "@react-pdf/renderer";
import { formatUSD, formatFecha } from "@/lib/utils";
import { LOGO_BLANCO_B64 } from "@/lib/assets/logo-b64"; // Reusamos el logo base64

const S = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  
  // Header Izquierdo (Logo e Info Empresa)
  headerLeft: { flexDirection: "column", width: "55%" },
  headerLogoRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  logoImg: { width: 36, height: 36, marginRight: 8 },
  brandTitle: { fontSize: 15, fontWeight: 900, color: "#c9242b" },
  brandSub: { fontSize: 8, color: "#6e6e6e", fontWeight: 700, marginTop: 1 },
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
  tasaBcv: number;
  subtotalBs: number;
  ivaBs: number;
  igtfBs: number;
  totalBs: number;
  aplicaIgtf: boolean;
}

export const FacturaFiscalDocument = ({
  numeroFactura,
  numeroControl,
  fecha,
  cliente,
  lineas,
  tasaBcv,
  subtotalBs,
  ivaBs,
  igtfBs,
  totalBs,
  aplicaIgtf
}: FacturaFiscalProps) => {
  return (
    <Document title={`Factura Fiscal - ${numeroFactura}`}>
      <Page size="A4" style={S.page}>
        
        {/* ── HEADER ── */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            {/* Fila: logo + nombre de marca */}
            <View style={S.headerLogoRow}>
              <PDFImage src={LOGO_BLANCO_B64} style={S.logoImg} />
              <View>
                <Text style={S.brandTitle}>TECNOSMART VZL</Text>
                <Text style={S.brandSub}>RIF: J-50701960-8</Text>
              </View>
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
            // Conversión a Bolívares por ítem
            const precioUnitBs = linea.precio_unitario * tasaBcv;
            const subtotalLineBs = precioUnitBs * linea.cantidad;
            return (
              <View key={i} style={S.tableRow}>
                <Text style={[S.td, S.colDesc]}>{linea.descripcion}</Text>
                <Text style={[S.td, S.colUM]}>UND</Text>
                <Text style={[S.td, S.colCant]}>{linea.cantidad}</Text>
                <Text style={[S.td, S.colPrecio]}>{formatBs(precioUnitBs)}</Text>
                <Text style={[S.td, S.colTotal]}>{formatBs(subtotalLineBs)}</Text>
              </View>
            );
          })}
        </View>

        {/* ── RESUMEN FISCAL (Bolívares) ── */}
        <View style={S.resumenWrapper}>
          <View style={S.resumenLeft}>
            <Text>ESTE DOCUMENTO VA SIN TACHADURA NI ENMIENDA</Text>
            <Text style={{ marginTop: 10 }}>Tasa oficial de cambio BCV del día: {tasaBcv.toLocaleString("es-VE")} Bs/USD</Text>
          </View>
          <View style={S.resumenRight}>
            <View style={S.resumenRow}>
              <Text style={S.resumenLabel}>BASE IMPONIBLE:</Text>
              <Text style={S.resumenVal}>{formatBs(subtotalBs)}</Text>
            </View>
            <View style={S.resumenRow}>
              <Text style={S.resumenLabel}>IVA ({ivaBs > 0 ? "16%" : "0%"}):</Text>
              <Text style={S.resumenVal}>{formatBs(ivaBs)}</Text>
            </View>
            {aplicaIgtf && (
              <View style={S.resumenRow}>
                <Text style={S.resumenLabel}>IGTF (3%):</Text>
                <Text style={S.resumenVal}>{formatBs(igtfBs)}</Text>
              </View>
            )}
            <View style={S.resumenTotalRow}>
              <Text style={S.resumenTotalLabel}>TOTAL A PAGAR:</Text>
              <Text style={S.resumenTotalVal}>{formatBs(totalBs)}</Text>
            </View>
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
