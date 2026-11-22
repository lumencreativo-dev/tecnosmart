// ─────────────────────────────────────────────────────────────
// src/lib/email/templates/marketingPromo.ts
// Plantilla Modular de Marketing & Promoción TecnoSmart Vzl
// ─────────────────────────────────────────────────────────────

import { BRAND } from "../config";
import { renderBaseLayout } from "./base";

export interface PromoItem {
  nombre: string;
  descripcion: string;
  precio?: string;
  badge?: string; // ej. "Más Vendido", "En Stock", "Oferta"
}

export interface MarketingPromoOptions {
  titular: string;
  subtitulo: string;
  bannerTexto?: string;
  mensajePrincipal: string;
  items?: PromoItem[];
  ctaTexto?: string;
  ctaUrl?: string;
}

export function renderMarketingPromoEmail({
  titular,
  subtitulo,
  bannerTexto,
  mensajePrincipal,
  items = [],
  ctaTexto = "Consultar Disponibilidad por WhatsApp",
  ctaUrl = BRAND.whatsappUrl,
}: MarketingPromoOptions): string {
  const bodyContent = `
    <!-- Título principal -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding-bottom: 8px;">
          <h1 class="title" style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:26px; line-height:32px; font-weight:800; color:${BRAND.colors.black}; letter-spacing:-0.5px;">
            ${titular}
          </h1>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <p style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:14px; line-height:20px; font-weight:600; color:${BRAND.colors.gray};">
            ${subtitulo}
          </p>
        </td>
      </tr>
    </table>

    ${bannerTexto ? `
      <!-- BANNER DE IMPACTO -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0; background-color:${BRAND.colors.red}; border-radius:10px; overflow:hidden;">
        <tr>
          <td align="center" style="padding: 14px 20px;">
            <p style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:14px; font-weight:800; color:#ffffff; text-transform:uppercase; letter-spacing:0.8px;">
              ${bannerTexto}
            </p>
          </td>
        </tr>
      </table>
    ` : ""}

    <p style="margin:0 0 20px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:14px; line-height:22px; color:${BRAND.colors.black};">
      ${mensajePrincipal}
    </p>

    ${items.length > 0 ? `
      <!-- CUADRÍCULA DE PRODUCTOS / SERVICIOS EN OFERTA -->
      <div style="margin:0 0 24px 0;">
        ${items.map(item => `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px; background-color:#ffffff; border:1px solid ${BRAND.colors.border}; border-radius:10px; overflow:hidden;">
            <tr>
              <td style="padding:14px 18px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      ${item.badge ? `
                        <span style="display:inline-block; padding:2px 8px; background-color:${BRAND.colors.red}15; color:${BRAND.colors.red}; border-radius:4px; font-family:'Inter',sans-serif; font-size:10px; font-weight:800; text-transform:uppercase; margin-bottom:4px;">
                          ${item.badge}
                        </span>
                      ` : ""}
                      <h4 style="margin:0 0 4px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:15px; font-weight:800; color:${BRAND.colors.black};">
                        ${item.nombre}
                      </h4>
                      <p style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:12px; line-height:18px; color:${BRAND.colors.gray};">
                        ${item.descripcion}
                      </p>
                    </td>
                    ${item.precio ? `
                      <td align="right" valign="middle" style="padding-left:12px;">
                        <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:16px; font-weight:800; color:${BRAND.colors.navy}; white-space:nowrap;">
                          ${item.precio}
                        </span>
                      </td>
                    ` : ""}
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `).join("")}
      </div>
    ` : ""}

    <!-- CTA COMERCIAL -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" class="btn-full" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
            <tr>
              <td align="center" bgcolor="${BRAND.colors.red}" style="border-radius:50px; background-color:${BRAND.colors.red};">
                <a href="${ctaUrl}" target="_blank" class="btn-link" style="display:inline-block; padding:15px 32px; font-family:'Inter','Roboto',Arial,sans-serif; font-size:15px; line-height:20px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:50px; background-color:${BRAND.colors.red}; border:1px solid ${BRAND.colors.red};">
                  ${ctaTexto} &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return renderBaseLayout({
    title: titular,
    preheader: subtitulo,
    bodyContent,
  });
}
