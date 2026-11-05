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
import { formatFecha } from "@/lib/utils";
import { LOGO_BLANCO_B64 } from "@/lib/assets/logo-b64";

// ── Estilos ───────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    paddingBottom: 40,
  },
  // Header rojo corporativo TecnoSmart
  header: {
    backgroundColor: "#c9242b",
    paddingHorizontal: 28,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoImg: { height: 32, width: 32 },
  headerBrand: { flexDirection: "column", justifyContent: "center" },
  logoName: { color: "#ffffff", fontSize: 13, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  logoSub: { color: "#ffcccc", fontSize: 6.5, letterSpacing: 1.2, marginTop: 1 },
  headerMeta: { flexDirection: "column", marginTop: 3 },
  headerMetaLine: { color: "#ffdddd", fontSize: 6.5, marginTop: 1 },
  headerRight: { alignItems: "flex-end" },
  docTipo: { color: "#ffffff", fontSize: 11, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  docSub: { color: "#ffcccc", fontSize: 8, marginTop: 2 },
  docFecha: { color: "#ffdddd", fontSize: 7, marginTop: 2 },

  // Introducción
  introBox: {
    marginHorizontal: 28,
    marginTop: 14,
    marginBottom: 6,
    padding: 10,
    backgroundColor: "#fef2f2",
    borderRadius: 6,
    borderLeft: "3pt solid #c9242b",
  },
  introTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#991b1b",
    marginBottom: 2,
  },
  introText: {
    fontSize: 7.5,
    color: "#4b5563",
    lineHeight: 1.3,
  },

  // Contenedor principal de tarjetas
  body: {
    paddingHorizontal: 28,
    paddingTop: 6,
    gap: 10,
  },

  // Tarjeta general
  card: {
    borderRadius: 6,
    border: "0.8pt solid #e5e7eb",
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  cardHeader: {
    backgroundColor: "#f8fafc",
    borderBottom: "0.8pt solid #e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#15803d",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  cardContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  // Grid de filas y datos
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3.5,
    borderBottom: "0.4pt solid #f1f5f9",
  },
  rowNoBorder: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3.5,
  },
  label: {
    fontSize: 7.5,
    color: "#64748b",
  },
  val: {
    fontSize: 8,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
  },
  valHighlight: {
    fontSize: 8.5,
    color: "#c9242b",
    fontFamily: "Helvetica-Bold",
  },
  valMono: {
    fontSize: 8.5,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 3,
  },

  // Caja WiFi destacada
  wifiBox: {
    flexDirection: "row",
    gap: 12,
    marginTop: 2,
  },
  wifiCol: {
    flex: 1,
    backgroundColor: "#f8fafc",
    border: "0.8pt solid #e2e8f0",
    borderRadius: 5,
    padding: 8,
  },
  wifiLabel: {
    fontSize: 6.5,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 2,
    fontFamily: "Helvetica-Bold",
  },
  wifiVal: {
    fontSize: 9.5,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
  },

  // Instrucción App
  appInstruction: {
    marginTop: 6,
    padding: 6,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    border: "0.5pt dashed #cbd5e1",
  },
  appInstructionText: {
    fontSize: 7,
    color: "#475569",
    lineHeight: 1.25,
  },

  // Tarjeta soporte y pie
  soporteCard: {
    marginTop: 6,
    padding: 10,
    backgroundColor: "#111827",
    borderRadius: 6,
  },
  soporteTitulo: {
    color: "#ffffff",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  soporteText: {
    color: "#cbd5e1",
    fontSize: 7,
    lineHeight: 1.35,
  },
  soporteChannels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTop: "0.5pt solid #374151",
  },
  channelItem: {
    color: "#f87171",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  channelSub: {
    color: "#9ca3af",
    fontSize: 6.5,
  },

  // Footer fijo
  footer: {
    position: "absolute",
    bottom: 16,
    left: 28,
    right: 28,
    borderTop: "0.5pt solid #e2e8f0",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 6.5,
    color: "#94a3b8",
  },
});

export interface StarlinkFichaProps {
  clienteNombre: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  clienteRif?: string;
  direccionInstalacion?: string;
  correoStarlink?: string;
  claveStarlink?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  planNombre?: string;
  estado?: string;
  mensualidadUSD?: number | string;
  costoBaseUSD?: number | string;
  feeSoporteUSD?: number | string;
  esVip?: boolean;
  diaCorte?: number | string;
  metodoPago?: string;
  kitSerial?: string;
  fechaEmision?: Date | string;
  correlativo?: string;
}

function StarlinkFichaDocument({
  clienteNombre,
  clienteTelefono,
  clienteEmail,
  clienteRif,
  direccionInstalacion,
  correoStarlink,
  claveStarlink,
  wifiSsid,
  wifiPassword,
  planNombre = "Starlink Residencial Venezuela",
  estado = "Activo",
  mensualidadUSD,
  costoBaseUSD,
  feeSoporteUSD = 10,
  esVip = false,
  diaCorte,
  metodoPago = "Tarjeta de Crédito / Débito Internacional",
  kitSerial,
  fechaEmision = new Date(),
  correlativo,
}: StarlinkFichaProps) {
  const diaCorteTexto = diaCorte ? `${diaCorte} de cada mes` : "Según fecha de corte oficial";
  const numMensualidad = typeof mensualidadUSD === "number" ? mensualidadUSD : parseFloat(String(mensualidadUSD || "0"));

  return (
    <Document
      title={`TecnoSmart - Ficha Starlink ${clienteNombre}`}
      author="TecnoSmart VZL C.A"
      subject="Ficha de Entrega y Acceso de Servicio Starlink"
    >
      <Page size="A4" style={S.page}>

        {/* ── HEADER CORPORATIVO TECNOSMART ── */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            <PDFImage src={LOGO_BLANCO_B64} style={S.logoImg} />
            <View style={S.headerBrand}>
              <Text style={S.logoName}>TECNO SMART VZL C.A</Text>
              <Text style={S.logoSub}>TIENDA ESPECIALIZADA · SOLUCIONES TECNOLÓGICAS</Text>
              <View style={S.headerMeta}>
                <Text style={S.headerMetaLine}>RIF: J-50701960-8  ·  Telf: 0412-2789273 / 0414-4141887</Text>
                <Text style={S.headerMetaLine}>Av. Bolívar C/C c. Páez, Edif. Sta. Eduviges II, local-02, Tinaquillo, Cojedes</Text>
              </View>
            </View>
          </View>
          <View style={S.headerRight}>
            <Text style={S.docTipo}>SERVICIO STARLINK</Text>
            <Text style={S.docSub}>Ficha de Entrega & Acceso</Text>
            {correlativo && <Text style={[S.docFecha, { fontFamily: "Helvetica-Bold" }]}>{correlativo}</Text>}
            <Text style={S.docFecha}>Fecha: {formatFecha(fechaEmision)}</Text>
          </View>
        </View>

        {/* ── MENSAJE DE BIENVENIDA ── */}
        <View style={S.introBox}>
          <Text style={S.introTitle}>¡Gracias por confiar en TecnoSmart VZL para tu internet satelital Starlink!</Text>
          <Text style={S.introText}>
            A continuación encontrarás las credenciales de acceso a tu cuenta, los datos de configuración de tu red WiFi
            y las condiciones de tu plan contratado. Conserva este documento en un lugar seguro.
          </Text>
        </View>

        <View style={S.body}>

          {/* ── 1. DATOS DEL TITULAR ── */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <Text style={S.cardTitle}>1. Datos del Titular y Ubicación</Text>
              <Text style={S.cardBadge}>Cliente Verificado</Text>
            </View>
            <View style={S.cardContent}>
              <View style={S.row}>
                <Text style={S.label}>Nombre o Razón Social:</Text>
                <Text style={S.val}>{clienteNombre.toUpperCase()}</Text>
              </View>
              {clienteRif && (
                <View style={S.row}>
                  <Text style={S.label}>Cédula / RIF:</Text>
                  <Text style={S.val}>{clienteRif}</Text>
                </View>
              )}
              {clienteTelefono && (
                <View style={S.row}>
                  <Text style={S.label}>Teléfono de Contacto:</Text>
                  <Text style={S.val}>{clienteTelefono}</Text>
                </View>
              )}
              {clienteEmail && (
                <View style={S.row}>
                  <Text style={S.label}>Correo Personal:</Text>
                  <Text style={S.val}>{clienteEmail}</Text>
                </View>
              )}
              <View style={S.rowNoBorder}>
                <Text style={S.label}>Dirección de Instalación:</Text>
                <Text style={[S.val, { maxWidth: "60%", textAlign: "right" }]}>
                  {direccionInstalacion || "Tinaquillo, Edo. Cojedes"}
                </Text>
              </View>
            </View>
          </View>

          {/* ── 2. ACCESO A LA APP OFICIAL STARLINK ── */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <Text style={S.cardTitle}>2. Acceso a la App Oficial Starlink</Text>
              <Text style={S.cardBadge}>Gestión de Cuenta</Text>
            </View>
            <View style={S.cardContent}>
              <View style={S.row}>
                <Text style={S.label}>Usuario / Correo de la Cuenta:</Text>
                <Text style={S.valMono}>{correoStarlink || "—"}</Text>
              </View>
              <View style={S.rowNoBorder}>
                <Text style={S.label}>Contraseña de la App Starlink:</Text>
                <Text style={S.valMono}>{claveStarlink || "—"}</Text>
              </View>
              <View style={S.appInstruction}>
                <Text style={S.appInstructionText}>
                  Descarga la aplicación oficial "Starlink" desde Google Play Store (Android) o App Store (iPhone).
                  Inicia sesión con el correo y contraseña indicados arriba para monitorear en tiempo real el estado de tu antena,
                  velocidad de subida/bajada y diagnósticos de conectividad satelital.
                </Text>
              </View>
            </View>
          </View>

          {/* ── 3. DATOS DE TU RED WIFI ── */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <Text style={S.cardTitle}>3. Configuración de tu Red WiFi Local</Text>
              <Text style={S.cardBadge}>Red Operativa</Text>
            </View>
            <View style={S.cardContent}>
              <View style={S.wifiBox}>
                <View style={S.wifiCol}>
                  <Text style={S.wifiLabel}>Nombre de Red (SSID):</Text>
                  <Text style={S.wifiVal}>{wifiSsid || "Starlink"}</Text>
                </View>
                <View style={S.wifiCol}>
                  <Text style={S.wifiLabel}>Contraseña de WiFi:</Text>
                  <Text style={S.wifiVal}>{wifiPassword || "—"}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── 4. PLAN CONTRATADO & CONDICIONES ── */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <Text style={S.cardTitle}>4. Plan Contratado & Facturación</Text>
              <Text style={[S.cardBadge, estado.toLowerCase() === "activo" ? undefined : { backgroundColor: "#fef3c7", color: "#b45309" }]}>
                Estado: {estado}
              </Text>
            </View>
            <View style={S.cardContent}>
              <View style={S.row}>
                <Text style={S.label}>Plan de Servicio:</Text>
                <Text style={S.val}>{planNombre}</Text>
              </View>
              <View style={S.row}>
                <Text style={S.label}>Mensualidad del Servicio:</Text>
                <Text style={S.valHighlight}>
                  {numMensualidad > 0 ? `$${numMensualidad.toFixed(2)} USD / mes` : "Según consumo / plan contratado"}
                </Text>
              </View>
              <View style={S.row}>
                <Text style={S.label}>Fecha de Facturación Mensual:</Text>
                <Text style={S.val}>{diaCorteTexto}</Text>
              </View>
              <View style={S.row}>
                <Text style={S.label}>Método de Pago:</Text>
                <Text style={S.val}>{metodoPago}</Text>
              </View>
              <View style={S.row}>
                <Text style={S.label}>Soporte y Gestión Técnica TecnoSmart:</Text>
                <Text style={S.val}>
                  {esVip ? "Acompañamiento VIP Bonificado ($0.00)" : `Incluido ($${Number(feeSoporteUSD).toFixed(2)} USD)`}
                </Text>
              </View>
              {kitSerial && (
                <View style={S.rowNoBorder}>
                  <Text style={S.label}>Serial del KIT / Terminal:</Text>
                  <Text style={S.val}>{kitSerial}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── 5. SOPORTE TÉCNICO Y ATENCIÓN ── */}
          <View style={S.soporteCard}>
            <Text style={S.soporteTitulo}>Soporte Técnico Especializado TecnoSmart VZL</Text>
            <Text style={S.soporteText}>
              Tu servicio se factura automáticamente de forma mensual. Ante cualquier duda con respecto a tu fecha de corte,
              requerimiento de cambio de contraseña, reubicación de equipo o asistencia técnica con tu conexión, comunícate
              directamente con nuestro equipo de atención:
            </Text>
            <View style={S.soporteChannels}>
              <View>
                <Text style={S.channelItem}>WhatsApp / Emergencias:</Text>
                <Text style={S.channelSub}>0412-2789273  ·  0414-4141887</Text>
              </View>
              <View>
                <Text style={S.channelItem}>Instagram Oficial:</Text>
                <Text style={S.channelSub}>@tecnosmartvzl</Text>
              </View>
              <View>
                <Text style={S.channelItem}>Correo Central:</Text>
                <Text style={S.channelSub}>tecnosmartvzla@gmail.com</Text>
              </View>
            </View>
          </View>

        </View>

        {/* ── FOOTER INSTITUCIONAL ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>
            TECNO SMART VZL C.A  ·  RIF: J-50701960-8  ·  Tienda Especializada en Tinaquillo, Cojedes
          </Text>
          <Text style={S.footerText}>
            Documento de custodia privada del cliente  ·  Pág 1 de 1
          </Text>
        </View>

      </Page>
    </Document>
  );
}

// ── Función exportadora en 1 Clic ──────────────────────────────
export async function exportarStarlinkFichaPDF(props: StarlinkFichaProps) {
  const blob = await pdf(<StarlinkFichaDocument {...props} />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  const sanitizedName = (props.clienteNombre || "Cliente").replace(/[^a-zA-Z0-9_-]/g, "_");
  a.download = `Starlink_${sanitizedName}_TecnoSmart.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default StarlinkFichaDocument;
