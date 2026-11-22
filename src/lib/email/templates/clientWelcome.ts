// ─────────────────────────────────────────────────────────────
// src/lib/email/templates/clientWelcome.ts
// Plantilla de Bienvenida a Clientes Post-Compra TecnoSmart Vzl
// ─────────────────────────────────────────────────────────────

import { BRAND } from "../config";
import { renderBaseLayout } from "./base";

export interface ClientWelcomeOptions {
  clientName: string;
  orderSummary?: {
    tipoOperacion?: string; // ej. "Compra de Equipos", "Instalación", "Servicio Técnico"
    numeroReferencia?: string;
  };
}

export function renderClientWelcomeEmail({ clientName, orderSummary }: ClientWelcomeOptions): string {
  const bodyContent = `
    <!-- Título principal -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding-bottom: 8px;">
          <h1 class="title" style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:28px; line-height:34px; font-weight:800; color:${BRAND.colors.black}; letter-spacing:-0.5px;">
            ¡Gracias por tu compra en <span style="color:${BRAND.colors.red};">TecnoSmart</span>!
          </h1>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <p style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:15px; line-height:22px; font-weight:600; color:${BRAND.colors.gray};">
            Te damos una cálida bienvenida a nuestra familia tecnológica.
          </p>
        </td>
      </tr>
    </table>

    <!-- Saludo -->
    <p style="margin:0 0 16px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:15px; line-height:24px; color:${BRAND.colors.black};">
      Estimado(a) <strong>${clientName}</strong>,
    </p>
    <p style="margin:0 0 16px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:15px; line-height:24px; color:${BRAND.colors.black};">
      Queremos agradecerte por confiar en <strong>TecnoSmart Vzl</strong> para tus soluciones tecnológicas. Hemos registrado tus datos exitosamente en nuestra plataforma para respaldar tu garantía y brindarte soporte prioritario continuo.
    </p>

    ${orderSummary ? `
      <!-- Resumen de referencia -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0; background-color:#ffffff; border:1px solid ${BRAND.colors.border}; border-radius:10px; overflow:hidden;">
        <tr>
          <td style="padding: 16px 20px; background-color:${BRAND.colors.background}; border-bottom: 1px solid ${BRAND.colors.border};">
            <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:12px; font-weight:700; text-transform:uppercase; color:${BRAND.colors.gray}; letter-spacing:0.5px;">
              Detalles de tu Registro
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 20px;">
            <p style="margin:0 0 6px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:14px; color:${BRAND.colors.black};">
              <strong>Concepto:</strong> ${orderSummary.tipoOperacion || "Solución Tecnológica"}
            </p>
            ${orderSummary.numeroReferencia ? `
              <p style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; color:${BRAND.colors.gray};">
                <strong>N° de Referencia:</strong> #${orderSummary.numeroReferencia}
              </p>
            ` : ""}
          </td>
        </tr>
      </table>
    ` : ""}

    <!-- Cuadrícula de Servicios Disponibles -->
    <div style="margin:0 0 24px 0;">
      <p style="margin:0 0 12px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:14px; font-weight:700; color:${BRAND.colors.black};">
        Recuerda que cuentas con nosotros para:
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="50%" valign="top" style="padding-right: 8px; padding-bottom: 12px;">
            <div style="background-color:${BRAND.colors.background}; border:1px solid ${BRAND.colors.border}; border-radius:8px; padding:12px 14px;">
              <strong style="display:block; font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; color:${BRAND.colors.black}; margin-bottom:4px;">📡 Internet Starlink</strong>
              <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:12px; color:${BRAND.colors.gray}; line-height:16px; display:block;">Instalación, soporte y gestión de flota satelital.</span>
            </div>
          </td>
          <td width="50%" valign="top" style="padding-left: 8px; padding-bottom: 12px;">
            <div style="background-color:${BRAND.colors.background}; border:1px solid ${BRAND.colors.border}; border-radius:8px; padding:12px 14px;">
              <strong style="display:block; font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; color:${BRAND.colors.black}; margin-bottom:4px;">📹 Cámaras y CCTV</strong>
              <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:12px; color:${BRAND.colors.gray}; line-height:16px; display:block;">Sistemas de seguridad y monitoreo remoto 24/7.</span>
            </div>
          </td>
        </tr>
        <tr>
          <td width="50%" valign="top" style="padding-right: 8px;">
            <div style="background-color:${BRAND.colors.background}; border:1px solid ${BRAND.colors.border}; border-radius:8px; padding:12px 14px;">
              <strong style="display:block; font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; color:${BRAND.colors.black}; margin-bottom:4px;">🤖 Automatizaciones</strong>
              <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:12px; color:${BRAND.colors.gray}; line-height:16px; display:block;">Hogares y negocios inteligentes con control por app.</span>
            </div>
          </td>
          <td width="50%" valign="top" style="padding-left: 8px;">
            <div style="background-color:${BRAND.colors.background}; border:1px solid ${BRAND.colors.border}; border-radius:8px; padding:12px 14px;">
              <strong style="display:block; font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; color:${BRAND.colors.black}; margin-bottom:4px;">⚡ Redes y Cableado</strong>
              <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:12px; color:${BRAND.colors.gray}; line-height:16px; display:block;">Wi-Fi de alta cobertura y enlaces punto a punto.</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Contacto WhatsApp -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 16px 0;">
      <tr>
        <td align="center">
          <table role="presentation" class="btn-full" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
            <tr>
              <td align="center" bgcolor="${BRAND.colors.red}" style="border-radius:50px; background-color:${BRAND.colors.red};">
                <a href="${BRAND.whatsappUrl}" target="_blank" class="btn-link" style="display:inline-block; padding:15px 32px; font-family:'Inter','Roboto',Arial,sans-serif; font-size:15px; line-height:20px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:50px; background-color:${BRAND.colors.red}; border:1px solid ${BRAND.colors.red};">
                  Hablar con un Asesor por WhatsApp
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return renderBaseLayout({
    title: `¡Bienvenido a TecnoSmart Vzl! Gracias por tu compra`,
    preheader: `Hola ${clientName}, confirmamos el registro de tu compra en TecnoSmart Vzl. Estamos para servirte.`,
    bodyContent,
  });
}
