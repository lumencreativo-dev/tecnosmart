// ─────────────────────────────────────────────────────────────
// src/lib/email/templates/teamInvite.ts
// Plantilla de Invitación Oficial al Equipo TecnoSmart Vzl
// ─────────────────────────────────────────────────────────────

import { BRAND } from "../config";
import { renderBaseLayout } from "./base";

export interface TeamInviteRoleInfo {
  id?: string;
  nombre?: string;
  descripcion?: string;
  color?: string;
}

export interface TeamInviteTemplateOptions {
  email: string;
  token: string;
  recipientName?: string;
  roleInfo?: TeamInviteRoleInfo;
  inviterName?: string;
  expirationHours?: number;
}

/**
 * Catálogo descriptivo de roles del ERP para orientar al nuevo colaborador
 */
const ROLES_INFO_MAP: Record<string, { label: string; color: string; desc: string; highlights: string[] }> = {
  admin: {
    label: "Super Admin",
    color: "#c9242b",
    desc: "Acceso total sin restricciones a todos los módulos y ajustes del sistema.",
    highlights: ["Control global de operaciones", "Gestión de roles y equipo", "Finanzas y auditoría"],
  },
  administrador: {
    label: "Administración & Finanzas",
    color: "#2563eb",
    desc: "Control de facturación SENIAT, cajas bancarias, cuentas por cobrar y tesorería.",
    highlights: ["Facturación fiscal y retenciones", "Control de cajas (Zelle, Bs., Efectivo)", "Cuentas por cobrar y pagar"],
  },
  vendedor: {
    label: "Asesor Comercial",
    color: "#059669",
    desc: "Emisión de cotizaciones formales, gestión del CRM Pipeline y atención de clientes.",
    highlights: ["Generación de presupuestos con PDF", "Pipeline de ventas y prospectos", "Catálogo de productos y precios"],
  },
  gerente: {
    label: "Gerente Operativo",
    color: "#d97706",
    desc: "Planificación de obras, logística, asignación de cuadrillas e inventario.",
    highlights: ["Calendario técnico y obras en terreno", "Asignación de cuadrillas", "Requisición de materiales"],
  },
  tecnico: {
    label: "Técnico Líder / Cuadrilla",
    color: "#9333ea",
    desc: "Acceso a la app de campo: órdenes técnicas asignadas, materiales y actas firmadas.",
    highlights: ["Misiones técnicas asignadas", "Firma digital de actas de conformidad", "Reporte de materiales de almacén"],
  },
  tecnico_aliado: {
    label: "Técnico Aliado B2B",
    color: "#06b6d4",
    desc: "Instalador independiente aliado con precios especiales en catálogo de seguridad y redes.",
    highlights: ["Precios con descuento de instalador", "Calculadora CCTV y materiales", "Soporte técnico directo"],
  },
};

export function renderTeamInviteEmail({
  email,
  token,
  recipientName,
  roleInfo,
  inviterName = "El equipo de Administración",
  expirationHours = 48,
}: TeamInviteTemplateOptions): string {
  const roleId = (roleInfo?.id || "").toLowerCase();
  const roleMeta = ROLES_INFO_MAP[roleId] || {
    label: roleInfo?.nombre || "Colaborador del Equipo",
    color: roleInfo?.color || BRAND.colors.red,
    desc: roleInfo?.descripcion || "Acceso asignado al portal interno de TecnoSmart Vzl.",
    highlights: ["Acceso a herramientas internas de trabajo", "Panel de gestión operativa"],
  };

  const nombreParam = recipientName ? `&nombre=${encodeURIComponent(recipientName)}` : "";
  const inviteUrl = `${BRAND.baseUrl}/registro?token=${encodeURIComponent(token)}${nombreParam}`;

  const bodyContent = `
    <!-- Título principal -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding-bottom: 8px;">
          <h1 class="title" style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:28px; line-height:34px; font-weight:800; color:${BRAND.colors.black}; letter-spacing:-0.5px;">
            ¡Te damos la bienvenida al equipo!
          </h1>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <p style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:15px; line-height:22px; font-weight:600; color:${BRAND.colors.gray};">
            Invitación oficial para unirte a la plataforma de <strong style="color:${BRAND.colors.red};">TecnoSmart Vzl</strong>
          </p>
        </td>
      </tr>
    </table>

    <!-- Mensaje introductorio -->
    <p style="margin:0 0 16px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:15px; line-height:24px; color:${BRAND.colors.black};">
      ${recipientName ? `Hola <strong>${recipientName}</strong>,` : `Hola,`}
    </p>
    <p style="margin:0 0 20px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:15px; line-height:24px; color:${BRAND.colors.black};">
      <strong>${inviterName}</strong> te ha invitado a formar parte del equipo operativo de <strong>TecnoSmart</strong> con acceso directo al sistema interno de gestión.
    </p>

    <!-- TARJETA DEL ROL ASIGNADO -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0; background-color:#ffffff; border:1px solid ${BRAND.colors.border}; border-left: 5px solid ${roleMeta.color}; border-radius:12px; overflow:hidden;">
      <tr>
        <td style="padding: 20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <span style="display:inline-block; padding: 4px 10px; background-color:${roleMeta.color}15; color:${roleMeta.color}; border: 1px solid ${roleMeta.color}30; border-radius: 6px; font-family:'Inter','Roboto',Arial,sans-serif; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">
                  Rol Asignado
                </span>
                <h3 style="margin:0 0 6px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:18px; line-height:24px; font-weight:800; color:${BRAND.colors.black};">
                  ${roleMeta.label}
                </h3>
                <p style="margin:0 0 14px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; line-height:20px; color:${BRAND.colors.gray};">
                  ${roleMeta.desc}
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin:0 0 8px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:12px; font-weight:700; text-transform:uppercase; color:${BRAND.colors.black}; letter-spacing:0.5px;">
                  Facultades principales de tu perfil:
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  ${roleMeta.highlights.map(h => `
                    <tr>
                      <td style="padding: 3px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; line-height:18px; color:${BRAND.colors.black};">
                        <span style="color:${roleMeta.color}; font-weight:bold; margin-right:8px;">&#10003;</span> ${h}
                      </td>
                    </tr>
                  `).join("")}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- INSTRUCCIONES DEL ENLACE MÁGICO -->
    <p style="margin:0 0 20px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:14px; line-height:22px; color:${BRAND.colors.black};">
      Para activar tu cuenta, haz clic en el siguiente botón. Podrás definir tu nombre formal, nombre de usuario y tu contraseña segura de acceso:
    </p>

    <!-- BOTÓN CTA ENLACE MÁGICO -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${inviteUrl}" style="height:50px; v-text-anchor:middle; width:280px;" arcsize="50%" stroke="f" fillcolor="${BRAND.colors.red}">
            <w:anchorlock/>
            <center style="color:#ffffff; font-family:Arial,sans-serif; font-size:15px; font-weight:bold;">Completar Perfil y Activar Cuenta</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-- -->
          <table role="presentation" class="btn-full" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
            <tr>
              <td align="center" bgcolor="${BRAND.colors.red}" style="border-radius:50px; background-color:${BRAND.colors.red};">
                <a href="${inviteUrl}" target="_blank" class="btn-link" style="display:inline-block; padding:15px 32px; font-family:'Inter','Roboto',Arial,sans-serif; font-size:15px; line-height:20px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:50px; background-color:${BRAND.colors.red}; border:1px solid ${BRAND.colors.red};">
                  Completar Perfil y Activar Cuenta &rarr;
                </a>
              </td>
            </tr>
          </table>
          <!--<![endif]-->
        </td>
      </tr>
    </table>

    <!-- NOTA DE SEGURIDAD Y CADUCIDAD -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffbeb; border:1px solid #fef3c7; border-radius:10px; margin-bottom:20px;">
      <tr>
        <td style="padding: 14px 18px;">
          <p style="margin:0 0 4px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:12px; font-weight:700; color:#92400e;">
            🔒 Aviso Importante de Seguridad
          </p>
          <p style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:12px; line-height:18px; color:#78350f;">
            Este enlace es personal e intransferible, asociado exclusivamente a la cuenta <strong>${email}</strong>. Tiene una vigencia de <strong>${expirationHours} horas</strong> y sólo puede ser utilizado una única vez.
          </p>
        </td>
      </tr>
    </table>

    <!-- Respaldo URL en texto plano -->
    <p style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:12px; line-height:18px; color:${BRAND.colors.gray}; word-break:break-all;">
      Si el botón no abre correctamente, copia y pega el siguiente enlace directo en tu navegador web:<br />
      <a href="${inviteUrl}" target="_blank" style="color:${BRAND.colors.navy}; text-decoration:underline;">${inviteUrl}</a>
    </p>
  `;

  return renderBaseLayout({
    title: recipientName
      ? `¡Hola ${recipientName}! Te invitamos al equipo de TecnoSmart Vzl`
      : `Invitación a formar parte del equipo de TecnoSmart Vzl`,
    preheader: recipientName
      ? `${recipientName}, te han invitado a unirte a TecnoSmart Vzl como ${roleMeta.label}. Haz clic para completar tu perfil.`
      : `Te han invitado a unirte a TecnoSmart Vzl como ${roleMeta.label}. Haz clic para completar tu perfil.`,
    bodyContent,
  });
}
