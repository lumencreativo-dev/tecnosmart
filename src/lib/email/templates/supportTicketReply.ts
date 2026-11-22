// ─────────────────────────────────────────────────────────────
// src/lib/email/templates/supportTicketReply.ts
// Respuesta Oficial de Soporte Técnico al Cliente
// ─────────────────────────────────────────────────────────────

import { BRAND } from "../config";
import { renderBaseLayout } from "./base";

export interface SupportTicketReplyOptions {
  ticketCodigo: string;
  clienteNombre: string;
  asuntoOriginal: string;
  agenteNombre: string;
  mensajeRespuesta: string;
  estadoTicket: "en_diagnostico" | "visita_programada" | "resuelto" | "cerrado" | "abierto";
  solucion?: string;
}

const ESTADOS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  abierto: { label: "Abierto", color: "#b45309", bg: "#fef3c7", border: "#fde68a" },
  en_diagnostico: { label: "En Diagnóstico", color: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe" },
  visita_programada: { label: "Visita Programada", color: "#7e22ce", bg: "#f3e8ff", border: "#e9d5ff" },
  resuelto: { label: "Resuelto con Éxito", color: "#15803d", bg: "#dcfce7", border: "#bbf7d0" },
  cerrado: { label: "Caso Cerrado", color: "#475569", bg: "#f1f5f9", border: "#e2e8f0" },
};

export function generateSupportTicketReplyEmail({
  ticketCodigo,
  clienteNombre,
  asuntoOriginal,
  agenteNombre,
  mensajeRespuesta,
  estadoTicket,
  solucion,
}: SupportTicketReplyOptions): { subject: string; html: string; text: string } {
  const subject = `[Ticket #${ticketCodigo}] Re: ${asuntoOriginal}`;
  const estadoInfo = ESTADOS_MAP[estadoTicket] || ESTADOS_MAP.en_diagnostico;

  const waMessage = encodeURIComponent(
    `Hola ${agenteNombre}, respondo sobre la actualización de mi Ticket #${ticketCodigo}.`
  );
  const waUrl = `https://wa.me/${BRAND.whatsappNumber}?text=${waMessage}`;

  const bodyContent = `
    <!-- Barra de Estado del Ticket -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background-color:${estadoInfo.bg}; border:1px solid ${estadoInfo.border}; border-radius:20px; padding:4px 14px;">
          <span style="font-size:11px; font-weight:800; color:${estadoInfo.color}; text-transform:uppercase; letter-spacing:0.8px;">
            ${estadoInfo.label}
          </span>
        </td>
        <td style="padding-left:10px; font-size:12px; font-family:monospace; font-weight:700; color:${BRAND.colors.gray};">
          Ticket #${ticketCodigo}
        </td>
      </tr>
    </table>

    <h1 class="title" style="margin:0 0 12px 0; font-size:22px; font-weight:900; color:${BRAND.colors.black}; line-height:28px;">
      Actualización de Soporte Técnico
    </h1>

    <p style="margin:0 0 20px 0; font-size:14px; line-height:22px; color:${BRAND.colors.gray};">
      Estimado(a) <strong>${clienteNombre}</strong>, el departamento de soporte técnico de <strong>TecnoSmart</strong> ha emitido una actualización referente a su requerimiento:
    </p>

    <!-- Mensaje del Técnico / Asesor -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px; background-color:#ffffff; border:1px solid #e2e8f0; border-left:4px solid ${BRAND.colors.red}; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
      <tr>
        <td style="padding:18px 20px;">
          <div style="font-size:11px; font-weight:700; color:${BRAND.colors.gray}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">
            Respuesta de ${agenteNombre} — Área Técnica
          </div>
          <div style="font-size:14px; line-height:22px; color:#1e293b; white-space:pre-line;">
${mensajeRespuesta}
          </div>
        </td>
      </tr>
    </table>

    ${
      solucion
        ? `
    <!-- Solución Técnica / Conclusión -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px; background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:14px 18px;">
      <tr>
        <td>
          <div style="font-size:11px; font-weight:800; color:#166534; text-transform:uppercase; margin-bottom:4px;">
            ✅ Solución Aplicada / Diagnóstico Final:
          </div>
          <div style="font-size:13px; line-height:19px; color:#14532d;">
            ${solucion}
          </div>
        </td>
      </tr>
    </table>
    `
        : ""
    }

    <!-- Botón CTA WhatsApp -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn-full" style="margin-bottom:24px;">
      <tr>
        <td align="center" style="background-color:#16a34a; border-radius:12px; box-shadow:0 3px 8px rgba(22,163,74,0.25);">
          <a href="${waUrl}" target="_blank" class="btn-link" style="display:inline-block; padding:12px 24px; font-size:13px; font-weight:800; color:#ffffff; text-decoration:none;">
            💬 Continuar por WhatsApp con ${agenteNombre}
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0; font-size:11px; line-height:16px; color:#94a3b8; text-align:center;">
      Para responder por correo, simplemente responda a este mensaje manteniendo el asunto intacto.
    </p>
  `;

  const html = renderBaseLayout({
    title: `Ticket #${ticketCodigo} — Actualización`,
    preheader: `Actualización de soporte de TecnoSmart respecto al Ticket #${ticketCodigo}.`,
    bodyContent,
  });

  const text = `
Actualización de Soporte Técnico — TecnoSmart Vzl C.A.
Ticket #${ticketCodigo}
Estado: ${estadoInfo.label}
Asesor Técnico: ${agenteNombre}

Mensaje:
${mensajeRespuesta}

${solucion ? `Solución Aplicada:\n${solucion}\n` : ""}
Contacto WhatsApp de Soporte: ${BRAND.phone}
  `.trim();

  return { subject, html, text };
}
