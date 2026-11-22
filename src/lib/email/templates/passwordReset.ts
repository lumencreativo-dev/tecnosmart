// ─────────────────────────────────────────────────────────────
// src/lib/email/templates/passwordReset.ts
// Plantilla de Recuperación de Contraseña para Empleados
// ─────────────────────────────────────────────────────────────

import { BRAND } from "../config";
import { renderBaseLayout } from "./base";

export interface PasswordResetOptions {
  email: string;
  resetUrl: string;
  expirationMinutes?: number;
}

export function renderPasswordResetEmail({
  email,
  resetUrl,
  expirationMinutes = 30,
}: PasswordResetOptions): string {
  const bodyContent = `
    <!-- Título principal -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding-bottom: 8px;">
          <h1 class="title" style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:26px; line-height:32px; font-weight:800; color:${BRAND.colors.black}; letter-spacing:-0.5px;">
            Restablecer Contraseña de Acceso
          </h1>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <p style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:14px; line-height:20px; font-weight:600; color:${BRAND.colors.gray};">
            Portal Operativo Interno &bull; <strong style="color:${BRAND.colors.navy};">TecnoSmart Vzl</strong>
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:14px; line-height:22px; color:${BRAND.colors.black};">
      Hemos recibido una solicitud para restablecer la contraseña asociada a tu cuenta de empleado (<strong>${email}</strong>).
    </p>

    <p style="margin:0 0 24px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:14px; line-height:22px; color:${BRAND.colors.black};">
      Para ingresar una nueva contraseña y recuperar tu acceso al portal, haz clic en el siguiente botón:
    </p>

    <!-- BOTÓN CTA RESTABLECER -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" class="btn-full" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
            <tr>
              <td align="center" bgcolor="${BRAND.colors.navy}" style="border-radius:50px; background-color:${BRAND.colors.navy};">
                <a href="${resetUrl}" target="_blank" class="btn-link" style="display:inline-block; padding:15px 32px; font-family:'Inter','Roboto',Arial,sans-serif; font-size:15px; line-height:20px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:50px; background-color:${BRAND.colors.navy}; border:1px solid ${BRAND.colors.navy};">
                  Restablecer mi Contraseña
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- AVISO DE SEGURIDAD -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff1f2; border:1px solid #ffe4e6; border-radius:10px; margin-bottom:20px;">
      <tr>
        <td style="padding: 14px 18px;">
          <p style="margin:0 0 4px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:12px; font-weight:700; color:#9f1239;">
            🛡️ Seguridad de la Cuenta
          </p>
          <p style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:12px; line-height:18px; color:#881337;">
            Este enlace caduca automáticamente en <strong>${expirationMinutes} minutos</strong>. Si tú no realizaste esta solicitud, puedes ignorar este mensaje; tu contraseña actual continuará siendo segura.
          </p>
        </td>
      </tr>
    </table>
  `;

  return renderBaseLayout({
    title: `Restablecer contraseña — Portal TecnoSmart Vzl`,
    preheader: `Solicitud de recuperación de contraseña para tu cuenta de empleado en TecnoSmart Vzl.`,
    bodyContent,
  });
}
