// ─────────────────────────────────────────────────────────────
// src/lib/email.ts — Compatibilidad hacia atrás
// Reexporta la arquitectura modular oficial de somostecnosmart.com
// ─────────────────────────────────────────────────────────────

export * from "./email/index";

// Adaptador para llamadas legacy a sendWelcomeEmail
import { sendClientWelcomeEmail } from "./email/index";

export async function sendWelcomeEmail(toEmail: string, clientName: string) {
  return sendClientWelcomeEmail({ toEmail, clientName });
}
