// ─────────────────────────────────────────────────────────────
// src/lib/email/templates/supportTicketAck.ts
// Acuse de Recibo Inmediato de Ticket de Soporte Técnico
// ─────────────────────────────────────────────────────────────

import { BRAND } from "../config";
import { renderBaseLayout } from "./base";

export interface SupportTicketAckOptions {
  ticketCodigo: string;
  clienteNombre: string;
  servicioNombre: string;
  asunto: string;
  descripcion?: string;
  tipoPlan?: "basico" | "premium";
}

export function generateSupportTicketAckEmail({
  ticketCodigo,
  clienteNombre,
  servicioNombre,
  asunto,
  descripcion,
  tipoPlan = "basico",
}: SupportTicketAckOptions): { subject: string; html: string; text: string } {
  const subject = `[Ticket #${ticketCodigo}] Solicitud Recibida — TecnoSmart Soporte`;
  const isPremium = tipoPlan === "premium";

  const waMessage = encodeURIComponent(
    `Hola TecnoSmart, escribo sobre mi Ticket #${ticketCodigo} (${asunto}). Necesito atención técnica.`
  );
  const waUrl = `https://wa.me/${BRAND.whatsappNumber}?text=${waMessage}`;

  const bodyContent = `
    <!-- Badge de Estado -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background-color:#e0f2fe; border:1px solid #7dd3fc; border-radius:20px; padding:4px 14px;">
          <span style="font-size:11px; font-weight:800; color:#0369a1; text-transform:uppercase; letter-spacing:0.8px;">
            Ticket Generado con Éxito
          </span>
        </td>
        ${
          isPremium
            ? `
        <td style="padding-left:8px;">
          <span style="background-color:#f3e8ff; border:1px solid #d8b4fe; border-radius:20px; padding:4px 14px; font-size:11px; font-weight:800; color:#7e22ce; text-transform:uppercase;">
            ⚡ Plan Premium 24/7
          </span>
        </td>
        `
            : ""
        }
      </tr>
    </table>

    <!-- Título Principal -->
    <h1 class="title" style="margin:0 0 12px 0; font-size:24px; font-weight:900; color:${BRAND.colors.black}; line-height:30px;">
      Hemos recibido tu solicitud de soporte
    </h1>

    <p style="margin:0 0 20px 0; font-size:14px; line-height:22px; color:${BRAND.colors.gray};">
      Estimado(a) <strong>${clienteNombre}</strong>, tu caso ha sido registrado en nuestra plataforma técnica bajo el número correlativo oficial:
    </p>

    <!-- Caja Destacada del Ticket -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px; background-color:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid ${BRAND.colors.red}; border-radius:12px; overflow:hidden;">
      <tr>
        <td style="padding:18px 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size:11px; font-weight:700; color:${BRAND.colors.gray}; text-transform:uppercase; letter-spacing:0.5px; padding-bottom:4px;">
                Número de Ticket
              </td>
            </tr>
            <tr>
              <td style="font-size:20px; font-weight:900; font-family:monospace; color:${BRAND.colors.red}; padding-bottom:12px;">
                ${ticketCodigo}
              </td>
            </tr>
            <tr>
              <td style="font-size:11px; font-weight:700; color:${BRAND.colors.gray}; text-transform:uppercase; letter-spacing:0.5px; padding-bottom:4px;">
                Servicio Afectado
              </td>
            </tr>
            <tr>
              <td style="font-size:13px; font-weight:700; color:${BRAND.colors.black}; padding-bottom:12px;">
                ${servicioNombre}
              </td>
            </tr>
            <tr>
              <td style="font-size:11px; font-weight:700; color:${BRAND.colors.gray}; text-transform:uppercase; letter-spacing:0.5px; padding-bottom:4px;">
                Falla / Asunto Reportado
              </td>
            </tr>
            <tr>
              <td style="font-size:13px; font-weight:600; color:${BRAND.colors.black};">
                ${asunto}
              </td>
            </tr>
            ${
              descripcion
                ? `
            <tr>
              <td style="font-size:12px; color:${BRAND.colors.gray}; padding-top:8px; line-height:18px; font-style:italic;">
                "${descripcion.slice(0, 200)}${descripcion.length > 200 ? "..." : ""}"
              </td>
            </tr>
            `
                : ""
            }
          </table>
        </td>
      </tr>
    </table>

    <!-- Tiempos de Respuesta (SLA) -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px; background-color:#f1f5f9; border-radius:10px; padding:12px 16px;">
      <tr>
        <td style="font-size:12px; line-height:18px; color:#334155;">
          <strong>⏱️ Tiempo estimado de respuesta:</strong><br>
          ${
            isPremium
              ? "Plan Premium 24/7 — Atención prioritaria en menos de 1 hora."
              : "Soporte Estándar — Nuestro departamento técnico responderá tu solicitud en <strong>alrededor de 24 horas en días hábiles</strong> (Lunes a Viernes de 8:00 AM a 5:00 PM)."
          }
        </td>
      </tr>
    </table>

    <!-- Botón CTA WhatsApp Directo -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-full" style="margin-bottom:24px;">
      <tr>
        <td align="center" style="background-color:#16a34a; border-radius:12px; box-shadow:0 3px 8px rgba(22,163,74,0.25);">
          <a href="${waUrl}" target="_blank" class="btn-link" style="display:inline-block; padding:14px 28px; font-size:13px; font-weight:800; color:#ffffff; text-decoration:none; letter-spacing:0.3px;">
            💬 Chatear con Soporte por WhatsApp
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0; font-size:11px; line-height:16px; color:#94a3b8; text-align:center;">
      Si deseas agregar información o enviar fotografías del equipo, puedes responder directamente a este correo o contactarnos vía WhatsApp mencionando tu número de ticket.
    </p>
  `;

  const html = renderBaseLayout({
    title: `Ticket #${ticketCodigo} Recibido`,
    preheader: `Tu solicitud sobre ${servicioNombre} ha sido recibida bajo el ticket #${ticketCodigo}.`,
    bodyContent,
  });

  const text = `
Hemos recibido tu solicitud de soporte — TecnoSmart Vzl C.A.
Número de Ticket: ${ticketCodigo}
Servicio: ${servicioNombre}
Asunto: ${asunto}
Cliente: ${clienteNombre}

Un asesor técnico atenderá tu solicitud en alrededor de 24 horas en días hábiles (Lunes a Viernes de 8:00 AM a 5:00 PM).
Puedes contactar a soporte técnico directo por WhatsApp al: ${BRAND.phone}
  `.trim();

  return { subject, html, text };
}
