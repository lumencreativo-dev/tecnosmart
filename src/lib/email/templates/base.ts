// ─────────────────────────────────────────────────────────────
// src/lib/email/templates/base.ts — Layout Base Responsive Bulletproof
// ─────────────────────────────────────────────────────────────

import { BRAND } from "../config";

export interface BaseLayoutOptions {
  title: string;
  preheader: string;
  bodyContent: string;
}

export function renderBaseLayout({ title, preheader, bodyContent }: BaseLayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    table, td, div, h1, p, a, span { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; display: block; }
    a { text-decoration: none; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }

    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
      .px-mobile { padding-left: 20px !important; padding-right: 20px !important; }
      .title { font-size: 26px !important; line-height: 32px !important; }
      .btn-full { width: 100% !important; display: block !important; }
      .btn-link { display: block !important; padding: 14px 20px !important; text-align: center !important; }
      .stack { display: block !important; width: 100% !important; text-align: center !important; }
      .stack-pad { padding-bottom: 16px !important; }
      .hide-mobile { display: none !important; }
      .center-mobile { text-align: center !important; }
    }
  </style>
</head>

<body style="margin:0; padding:0; background-color:${BRAND.colors.background}; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif;">

  <!-- Preheader invisible para bandeja de entrada -->
  <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">
    ${preheader}
    &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.colors.background};">
    <tr>
      <td align="center" style="padding: 32px 12px;">

        <!--[if mso]>
        <table role="presentation" align="center" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td>
        <![endif]-->

        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background-color:#ffffff; border:1px solid ${BRAND.colors.border}; border-radius:16px; overflow:hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">

          <!-- Barra de acento rojo institucional superior -->
          <tr>
            <td height="5" style="height:5px; line-height:5px; font-size:0; background-color:${BRAND.colors.red};">&nbsp;</td>
          </tr>

          <!-- HEADER / LOGO TECNOSMART -->
          <tr>
            <td align="center" class="px-mobile" style="padding: 32px 40px 20px 40px; background-color:#ffffff;">
              <a href="${BRAND.baseUrl}" target="_blank" style="text-decoration:none; display:inline-block;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center">
                      <img src="${BRAND.logoUrl}" width="190" alt="${BRAND.name}" style="display:block; width:190px; max-width:100%; height:auto; border:0; margin:0 auto;" />
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>

          <!-- Línea divisoria elegante -->
          <tr>
            <td class="px-mobile" style="padding: 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td height="1" style="height:1px; line-height:1px; font-size:0; background-color:${BRAND.colors.border};">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- CONTENIDO ESPECÍFICO DE CADA EMAIL -->
          <tr>
            <td class="px-mobile" style="padding: 32px 40px 24px 40px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- SECCIÓN DE ATENCIÓN DIRECTA -->
          <tr>
            <td class="px-mobile" style="padding: 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td height="1" style="height:1px; line-height:1px; font-size:0; background-color:${BRAND.colors.border};">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" class="px-mobile" style="padding: 24px 40px; background-color:#ffffff;">
              <p style="margin:0 0 6px 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:14px; line-height:20px; font-weight:700; color:${BRAND.colors.black};">
                ¿Necesitas asistencia técnica o soporte?
              </p>
              <p style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:13px; line-height:20px; color:${BRAND.colors.gray};">
                Escríbenos directamente a nuestro WhatsApp oficial: 
                <a href="${BRAND.whatsappUrl}" target="_blank" style="color:${BRAND.colors.red}; font-weight:700; text-decoration:none;">${BRAND.phone}</a>
                o visítanos en nuestro portal <a href="${BRAND.baseUrl}" target="_blank" style="color:${BRAND.colors.navy}; font-weight:600; text-decoration:underline;">${BRAND.domain}</a>.
              </p>
            </td>
          </tr>

          <!-- FOOTER CORPORATIVO (AZUL MARINO #05235b) -->
          <tr>
            <td class="px-mobile" style="background-color:${BRAND.colors.navy}; padding: 32px 40px;">

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <!-- Nombre y Sello Oficial -->
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <span style="font-family:'Inter','Roboto',Arial,sans-serif; font-size:18px; line-height:24px; font-weight:800; color:#ffffff; letter-spacing:-0.3px;">
                      Tecno<span style="color:${BRAND.colors.red};">Smart</span> <span style="font-size:12px; font-weight:600; opacity:0.85; text-transform:uppercase; letter-spacing:1px;">Vzl</span>
                    </span>
                  </td>
                </tr>

                <!-- Botones Redes Sociales -->
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 0 6px;">
                          <a href="${BRAND.socials.instagram}" target="_blank" style="display:inline-block; padding: 6px 14px; border: 1px solid rgba(255,255,255,0.4); border-radius: 50px; font-family:'Inter','Roboto',Arial,sans-serif; font-size:11px; line-height:16px; font-weight:600; color:#ffffff; text-decoration:none;">Instagram</a>
                        </td>
                        <td style="padding: 0 6px;">
                          <a href="${BRAND.socials.facebook}" target="_blank" style="display:inline-block; padding: 6px 14px; border: 1px solid rgba(255,255,255,0.4); border-radius: 50px; font-family:'Inter','Roboto',Arial,sans-serif; font-size:11px; line-height:16px; font-weight:600; color:#ffffff; text-decoration:none;">Facebook</a>
                        </td>
                        <td style="padding: 0 6px;">
                          <a href="${BRAND.whatsappUrl}" target="_blank" style="display:inline-block; padding: 6px 14px; border: 1px solid rgba(255,255,255,0.4); border-radius: 50px; font-family:'Inter','Roboto',Arial,sans-serif; font-size:11px; line-height:16px; font-weight:600; color:#ffffff; text-decoration:none;">WhatsApp</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Línea atenuada -->
                <tr>
                  <td style="padding-bottom: 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td height="1" style="height:1px; line-height:1px; font-size:0; background-color:#ffffff; opacity:0.18;">&nbsp;</td></tr>
                    </table>
                  </td>
                </tr>

                <!-- Datos Fiscales Venezuela -->
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <p style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:12px; line-height:18px; color:#d9d9d9;">
                      <strong>${BRAND.legalName}</strong> &bull; RIF: <strong>${BRAND.rif}</strong>
                    </p>
                    <p style="margin:4px 0 0 0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:11px; line-height:16px; color:#b0b8c6;">
                      ${BRAND.address}
                    </p>
                  </td>
                </tr>

                <!-- Derechos y Aviso -->
                <tr>
                  <td align="center">
                    <p style="margin:0; font-family:'Inter','Roboto',Arial,sans-serif; font-size:11px; line-height:16px; color:#8f9bb3;">
                      &copy; 2026 ${BRAND.name}. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>

        <!--[if mso]>
        </td></tr></table>
        <![endif]-->

      </td>
    </tr>
  </table>

</body>
</html>`;
}
