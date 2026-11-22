// ─────────────────────────────────────────────────────────────
// src/lib/email/templates/starlinkFicha.ts
// Ficha Técnica de Entrega de Kit Starlink TecnoSmart Vzl
// ─────────────────────────────────────────────────────────────

import { BRAND } from "../config";
import { renderBaseLayout } from "./base";

export interface StarlinkFichaOptions {
  clientName: string;
  modalidad?: "flota_administrada" | "cuenta_propia";
  kitSerial?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  diaCorte?: string | number;
  planNombre?: string;
  montoMensual?: number;
  ubicacion?: string;
  // Solo para cuenta propia del cliente (si él autogestiona su cuenta en SpaceX)
  cuentaClienteEmail?: string;
}

export function renderStarlinkFichaEmail({
  clientName,
  modalidad = "flota_administrada",
  kitSerial = "N/A",
  wifiSsid = "TecnoSmart_Starlink",
  wifiPassword = "••••••••",
  diaCorte = 5,
  planNombre = "Starlink Satelital Residencial / Itinerante",
  montoMensual,
  ubicacion,
  cuentaClienteEmail,
}: StarlinkFichaOptions): string {
  const esAdministrado = modalidad === "flota_administrada";

  const bodyContent = `
    <!-- Título principal -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding-bottom: 8px;">
          <h1 class="title" style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:26px; line-height:32px; font-weight:800; color:${BRAND.colors.black}; letter-spacing:-0.5px;">
            Ficha Técnica & Credenciales Starlink
          </h1>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <p style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:15px; line-height:22px; font-weight:600; color:${BRAND.colors.gray};">
            Entrega formal de conectividad para <strong style="color:${BRAND.colors.navy};">${clientName}</strong>
          </p>
        </td>
      </tr>
    </table>

    <!-- Badge de Modalidad -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
      <tr>
        <td>
          <span style="display:inline-block; padding: 4px 10px; background-color:${esAdministrado ? "#05235b15" : "#05966915"}; color:${esAdministrado ? BRAND.colors.navy : "#059669"}; border: 1px solid ${esAdministrado ? "#05235b30" : "#05966930"}; border-radius: 6px; font-family:'Inter','Roboto',Arial,sans-serif; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">
            ${esAdministrado ? "📡 Servicio Gestionado por TecnoSmart" : "⚡ Activación de Cuenta Autogestionada"}
          </span>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:14px; line-height:22px; color:${BRAND.colors.black};">
      ${esAdministrado
        ? "Tu kit de internet satelital <strong>Starlink</strong> está activo y respaldado por nuestro centro de operaciones. A continuación tienes los parámetros para conectarte a tu red Wi-Fi y los datos de tu ciclo de facturación:"
        : "Tu kit de internet satelital <strong>Starlink</strong> ha sido configurado y activado exitosamente. A continuación tienes los datos de conectividad de tu equipo:"}
    </p>

    <!-- TARJETA PRINCIPAL DE CREDENCIALES -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0; background-color:#ffffff; border:1px solid ${BRAND.colors.border}; border-radius:12px; overflow:hidden;">
      <tr>
        <td style="padding:14px 20px; background-color:${BRAND.colors.navy};">
          <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:12px; font-weight:800; text-transform:uppercase; color:#ffffff; letter-spacing:0.8px;">
            📡 Credenciales de Red Wi-Fi
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding:20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 7px 0; border-bottom: 1px dashed ${BRAND.colors.border};">
                <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; color:${BRAND.colors.gray};">Nombre de Red (SSID):</span>
              </td>
              <td align="right" style="padding: 7px 0; border-bottom: 1px dashed ${BRAND.colors.border};">
                <strong style="font-family:monospace; font-size:14px; color:${BRAND.colors.black}; background:#f1f5f9; padding:2px 8px; border-radius:4px;">${wifiSsid}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 7px 0; border-bottom: 1px dashed ${BRAND.colors.border};">
                <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; color:${BRAND.colors.gray};">Contraseña Wi-Fi:</span>
              </td>
              <td align="right" style="padding: 7px 0; border-bottom: 1px dashed ${BRAND.colors.border};">
                <strong style="font-family:monospace; font-size:14px; color:${BRAND.colors.red}; background:#fef2f2; padding:2px 8px; border-radius:4px;">${wifiPassword}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 7px 0; border-bottom: 1px dashed ${BRAND.colors.border};">
                <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; color:${BRAND.colors.gray};">Serial del Kit / Antena:</span>
              </td>
              <td align="right" style="padding: 7px 0; border-bottom: 1px dashed ${BRAND.colors.border};">
                <strong style="font-family:monospace; font-size:13px; color:${BRAND.colors.black};">${kitSerial}</strong>
              </td>
            </tr>

            ${esAdministrado ? `
              <!-- DATOS DE FACTURACIÓN TECNOSMART (SOLO FLOTA ADMINISTRADA) -->
              <tr>
                <td style="padding: 7px 0; border-bottom: 1px dashed ${BRAND.colors.border};">
                  <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; color:${BRAND.colors.gray};">Día de Corte Mensual:</span>
                </td>
                <td align="right" style="padding: 7px 0; border-bottom: 1px dashed ${BRAND.colors.border};">
                  <strong style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; color:${BRAND.colors.black};">Día ${diaCorte} de cada mes</strong>
                </td>
              </tr>
              <tr>
                <td style="padding: 7px 0; border-bottom: 1px dashed ${BRAND.colors.border};">
                  <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; color:${BRAND.colors.gray};">Plan Asignado:</span>
                </td>
                <td align="right" style="padding: 7px 0; border-bottom: 1px dashed ${BRAND.colors.border};">
                  <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; font-weight:600; color:${BRAND.colors.black};">${planNombre}</span>
                </td>
              </tr>
              ${montoMensual ? `
              <tr>
                <td style="padding: 7px 0; border-bottom: 1px dashed ${BRAND.colors.border};">
                  <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; color:${BRAND.colors.gray};">Canon Mensual:</span>
                </td>
                <td align="right" style="padding: 7px 0; border-bottom: 1px dashed ${BRAND.colors.border};">
                  <strong style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:15px; color:${BRAND.colors.navy};">$${montoMensual.toFixed(2)} USD / mes</strong>
                </td>
              </tr>
              ` : ""}
            ` : `
              <!-- CASO CUENTA PROPIA -->
              ${cuentaClienteEmail ? `
              <tr>
                <td style="padding: 7px 0; border-bottom: 1px dashed ${BRAND.colors.border};">
                  <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; color:${BRAND.colors.gray};">Cuenta Starlink Autogestionada:</span>
                </td>
                <td align="right" style="padding: 7px 0; border-bottom: 1px dashed ${BRAND.colors.border};">
                  <span style="font-family:monospace; font-size:13px; color:${BRAND.colors.black};">${cuentaClienteEmail}</span>
                </td>
              </tr>
              ` : ""}
            `}

            ${ubicacion ? `
            <tr>
              <td style="padding: 7px 0;">
                <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; color:${BRAND.colors.gray};">Ubicación Registrada:</span>
              </td>
              <td align="right" style="padding: 7px 0;">
                <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; color:${BRAND.colors.black};">${ubicacion}</span>
              </td>
            </tr>
            ` : ""}
          </table>
        </td>
      </tr>
    </table>

    <!-- NOTA EXPLICATIVA DE LA MODALIDAD -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${esAdministrado ? "#f0fdf4" : "#f8fafc"}; border:1px solid ${esAdministrado ? "#bbf7d0" : BRAND.colors.border}; border-radius:10px; margin-bottom:20px;">
      <tr>
        <td style="padding: 14px 18px;">
          <p style="margin:0 0 4px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:12px; font-weight:700; color:${esAdministrado ? "#166534" : BRAND.colors.black};">
            ${esAdministrado ? "🛡️ Soporte VIP y Gestión Integral Activa" : "ℹ️ Información de tu Servicio"}
          </p>
          <p style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:12px; line-height:18px; color:${esAdministrado ? "#14532d" : BRAND.colors.gray};">
            ${esAdministrado
              ? "Este servicio es operado y respaldado 100% por TecnoSmart Vzl. No requieres tarjetas internacionales ni gestiones complejas; nuestro equipo monitorea la antena y procesa los pagos para asegurar tu conectividad continua."
              : "Tu equipo ha quedado operativo para que gestiones tus consumos y pagos directamente con el proveedor satelital."}
          </p>
        </td>
      </tr>
    </table>

    <!-- RECOMENDACIONES TÉCNICAS -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border:1px solid ${BRAND.colors.border}; border-radius:10px; margin-bottom:20px;">
      <tr>
        <td style="padding: 16px 20px;">
          <p style="margin:0 0 6px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; font-weight:700; color:${BRAND.colors.black};">
            💡 Recomendaciones de Estabilidad:
          </p>
          <ul style="margin:0; padding-left:18px; font-family:'Inter','Roboto',Arial,sans-serif; font-size:12px; line-height:20px; color:${BRAND.colors.gray};">
            <li>Mantén el router conectado a un protector de voltaje o UPS.</li>
            <li>No presiones el botón de reset de fábrica sin la asistencia de nuestro equipo técnico.</li>
            <li>La antena requiere vista despejada 360° al cielo para evitar micro-cortes.</li>
          </ul>
        </td>
      </tr>
    </table>
  `;

  return renderBaseLayout({
    title: `Ficha Técnica de Servicio Starlink — TecnoSmart Vzl`,
    preheader: `Credenciales de tu red Wi-Fi: ${wifiSsid}. Entrega formal de servicio por TecnoSmart Vzl.`,
    bodyContent,
  });
}
