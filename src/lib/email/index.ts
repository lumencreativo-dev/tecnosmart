// ─────────────────────────────────────────────────────────────
// src/lib/email/index.ts — Hub Principal de Envíos con Resend
// Dominio Oficial: somostecnosmart.com
// ─────────────────────────────────────────────────────────────

import fs from "fs";
import path from "path";
import { Resend } from "resend";
import { BRAND, EMAIL_SENDERS } from "./config";
import { renderTeamInviteEmail, TeamInviteRoleInfo } from "./templates/teamInvite";
import { renderClientWelcomeEmail, ClientWelcomeOptions } from "./templates/clientWelcome";
import { renderStarlinkFichaEmail, StarlinkFichaOptions } from "./templates/starlinkFicha";
import { renderPasswordResetEmail } from "./templates/passwordReset";
import { renderMarketingPromoEmail, MarketingPromoOptions } from "./templates/marketingPromo";
import { generateSupportTicketAckEmail, SupportTicketAckOptions } from "./templates/supportTicketAck";
import { generateSupportTicketReplyEmail, SupportTicketReplyOptions } from "./templates/supportTicketReply";

export { BRAND, EMAIL_SENDERS };

function getApiKey(): string | null {
  let key = process.env.RESEND_API_KEY;
  // Fallback en caliente por si el proceso Next.js no se ha reiniciado tras cambiar .env.local
  if (!key || key.startsWith("re_MzMTW5Fy")) {
    try {
      const envPath = path.resolve(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const match = content.match(/RESEND_API_KEY\s*=\s*([^\r\n]+)/);
        if (match && match[1]) {
          key = match[1].trim();
        }
      }
    } catch {
      // Ignorar fallback si falla fs
    }
  }
  return key || null;
}

function getResendClient() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("⚠️ No se encontró RESEND_API_KEY configurada en las variables de entorno.");
    return null;
  }
  return new Resend(apiKey);
}

export interface SendResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Error desconocido en el servicio de correo";
}

// ─────────────────────────────────────────────────────────────
// 1. INVITACIÓN A MIEMBRO DEL EQUIPO (ENLACE MÁGICO SEGÚN ROL)
// Remitente: soporte@somostecnosmart.com
// ─────────────────────────────────────────────────────────────
export async function sendTeamInviteEmail(params: {
  toEmail: string;
  token: string;
  recipientName?: string;
  roleInfo?: TeamInviteRoleInfo;
  inviterName?: string;
}): Promise<SendResult> {
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, error: "Missing RESEND_API_KEY" };

    const html = renderTeamInviteEmail({
      email: params.toEmail,
      token: params.token,
      recipientName: params.recipientName,
      roleInfo: params.roleInfo,
      inviterName: params.inviterName,
    });

    const rolNombre = params.roleInfo?.nombre || "Colaborador";
    const subject = params.recipientName
      ? `¡Hola ${params.recipientName}! Activa tu perfil de ${rolNombre} en TecnoSmart`
      : `¡Bienvenido al equipo TecnoSmart! Activa tu perfil de ${rolNombre}`;

    const { data, error } = await resend.emails.send({
      from: EMAIL_SENDERS.SOPORTE,
      replyTo: "tecnosmartvzl@gmail.com",
      to: [params.toEmail],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error sending team invite:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error("Fatal error sending team invite:", err);
    return { success: false, error: getErrorMessage(err) };
  }
}

// ─────────────────────────────────────────────────────────────
// 2. BIENVENIDA A CLIENTE (POST-PRIMERA COMPRA)
// Remitente: hola@somostecnosmart.com
// ─────────────────────────────────────────────────────────────
export async function sendClientWelcomeEmail(params: {
  toEmail: string;
  clientName: string;
  orderSummary?: ClientWelcomeOptions["orderSummary"];
}): Promise<SendResult> {
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, error: "Missing RESEND_API_KEY" };

    const html = renderClientWelcomeEmail({
      clientName: params.clientName,
      orderSummary: params.orderSummary,
    });

    const { data, error } = await resend.emails.send({
      from: EMAIL_SENDERS.HOLA,
      replyTo: "tecnosmartvzl@gmail.com",
      to: [params.toEmail],
      subject: `¡Bienvenido a TecnoSmart Vzl! Gracias por tu compra`,
      html,
    });

    if (error) {
      console.error("Resend error sending client welcome:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error("Fatal error sending client welcome:", err);
    return { success: false, error: getErrorMessage(err) };
  }
}

// ─────────────────────────────────────────────────────────────
// 3. FICHA TÉCNICA Y CREDENCIALES STARLINK
// Remitente: starlink@somostecnosmart.com
// ─────────────────────────────────────────────────────────────
export async function sendStarlinkFichaEmail(params: {
  toEmail: string;
  options: StarlinkFichaOptions;
}): Promise<SendResult> {
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, error: "Missing RESEND_API_KEY" };

    const html = renderStarlinkFichaEmail(params.options);

    const { data, error } = await resend.emails.send({
      from: EMAIL_SENDERS.STARLINK,
      replyTo: "tecnosmartvzl@gmail.com",
      to: [params.toEmail],
      subject: `📡 Ficha Técnica & Credenciales de tu Servicio Starlink — TecnoSmart`,
      html,
    });

    if (error) {
      console.error("Resend error sending starlink credentials:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error("Fatal error sending starlink credentials:", err);
    return { success: false, error: getErrorMessage(err) };
  }
}

// ─────────────────────────────────────────────────────────────
// 4. RESTABLECER CONTRASEÑA DE EMPLEADO
// Remitente: soporte@somostecnosmart.com
// ─────────────────────────────────────────────────────────────
export async function sendPasswordResetEmail(params: {
  toEmail: string;
  resetUrl: string;
  expirationMinutes?: number;
}): Promise<SendResult> {
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, error: "Missing RESEND_API_KEY" };

    const html = renderPasswordResetEmail({
      email: params.toEmail,
      resetUrl: params.resetUrl,
      expirationMinutes: params.expirationMinutes,
    });

    const { data, error } = await resend.emails.send({
      from: EMAIL_SENDERS.SOPORTE,
      replyTo: "tecnosmartvzl@gmail.com",
      to: [params.toEmail],
      subject: `Restablecer tu contraseña de acceso — Portal TecnoSmart Vzl`,
      html,
    });

    if (error) {
      console.error("Resend error sending password reset:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error("Fatal error sending password reset:", err);
    return { success: false, error: getErrorMessage(err) };
  }
}

// ─────────────────────────────────────────────────────────────
// 5. CAMPAÑAS COMERCIALES Y MARKETING
// Remitente: contacto@somostecnosmart.com
// ─────────────────────────────────────────────────────────────
export async function sendMarketingPromoEmail(params: {
  toEmail: string;
  options: MarketingPromoOptions;
}): Promise<SendResult> {
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, error: "Missing RESEND_API_KEY" };

    const html = renderMarketingPromoEmail(params.options);

    const { data, error } = await resend.emails.send({
      from: EMAIL_SENDERS.CONTACTO,
      replyTo: "tecnosmartvzl@gmail.com",
      to: [params.toEmail],
      subject: params.options.titular,
      html,
    });

    if (error) {
      console.error("Resend error sending marketing promo:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error("Fatal error sending marketing promo:", err);
    return { success: false, error: getErrorMessage(err) };
  }
}

// ─────────────────────────────────────────────────────────────
// 6. ACUSE DE RECIBO AUTOMÁTICO DE TICKET DE SOPORTE
// Remitente: soporte@somostecnosmart.com
// ─────────────────────────────────────────────────────────────
export async function sendSupportTicketAckEmail(params: {
  toEmail: string;
  options: SupportTicketAckOptions;
}): Promise<SendResult> {
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, error: "Missing RESEND_API_KEY" };

    const { subject, html, text } = generateSupportTicketAckEmail(params.options);

    const { data, error } = await resend.emails.send({
      from: EMAIL_SENDERS.SOPORTE,
      replyTo: "soporte@somostecnosmart.com",
      to: [params.toEmail],
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Resend error sending ticket ack:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error("Fatal error sending ticket ack:", err);
    return { success: false, error: getErrorMessage(err) };
  }
}

// ─────────────────────────────────────────────────────────────
// 7. RESPUESTA OFICIAL DE SOPORTE TÉCNICO AL CLIENTE
// Remitente: soporte@somostecnosmart.com
// ─────────────────────────────────────────────────────────────
export async function sendSupportTicketReplyEmail(params: {
  toEmail: string;
  options: SupportTicketReplyOptions;
}): Promise<SendResult> {
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, error: "Missing RESEND_API_KEY" };

    const { subject, html, text } = generateSupportTicketReplyEmail(params.options);

    const { data, error } = await resend.emails.send({
      from: EMAIL_SENDERS.SOPORTE,
      replyTo: "soporte@somostecnosmart.com",
      to: [params.toEmail],
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Resend error sending ticket reply:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error("Fatal error sending ticket reply:", err);
    return { success: false, error: getErrorMessage(err) };
  }
}

