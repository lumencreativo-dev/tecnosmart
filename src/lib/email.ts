import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(toEmail: string, clientName: string) {
  try {
    const htmlContent = `
<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>¡Bienvenido a TecnoSmart!</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    table, td, div, h1, p, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; display: block; }
    a { text-decoration: none; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }

    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; max-width: 100% !important; }
      .px-mobile { padding-left: 24px !important; padding-right: 24px !important; }
      .title { font-size: 28px !important; line-height: 36px !important; }
      .btn-full { width: 100% !important; display: block !important; }
      .btn-link { display: block !important; padding: 16px 20px !important; }
      .stack { display: block !important; width: 100% !important; text-align: center !important; }
      .stack-pad { padding-bottom: 16px !important; }
      .hide-mobile { display: none !important; }
      .center-mobile { text-align: center !important; }
    }
  </style>
</head>

<body style="margin:0; padding:0; background-color:#f8fafc; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif;">

  <!-- Preheader (texto de vista previa en la bandeja de entrada) -->
  <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">
    Tu cuenta en TecnoSmart fue creada con éxito. Ya puedes comenzar.
    &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <!--[if mso]>
        <table role="presentation" align="center" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td>
        <![endif]-->

        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background-color:#ffffff; border:1px solid #d9d9d9; border-radius:16px; overflow:hidden;">

          <!-- Barra de acento superior -->
          <tr>
            <td height="6" style="height:6px; line-height:6px; font-size:0; background-color:#c9242b;">&nbsp;</td>
          </tr>

          <!-- HEADER / LOGO -->
          <tr>
            <td align="center" class="px-mobile" style="padding:36px 40px 24px 40px; background-color:#ffffff;">
              <a href="https://tecnosmart.vercel.app/" target="_blank" style="text-decoration:none;">
                <img src="https://tecnosmart.vercel.app/logo-color.png" width="180" alt="TecnoSmart Vzl" style="display:block; width:180px; max-width:100%; height:auto; border:0; margin:0 auto; font-family:Arial,sans-serif; font-size:22px; font-weight:bold; color:#c9242b;">
              </a>
            </td>
          </tr>

          <!-- Línea divisoria -->
          <tr>
            <td class="px-mobile" style="padding:0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td height="1" style="height:1px; line-height:1px; font-size:0; background-color:#d9d9d9;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- TÍTULO -->
          <tr>
            <td align="center" class="px-mobile" style="padding:40px 40px 8px 40px;">
              <h1 class="title" style="margin:0; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:34px; line-height:42px; font-weight:800; color:#111111; letter-spacing:-0.5px;">
                ¡Bienvenido a <span style="color:#c9242b;">TecnoSmart</span>!
              </h1>
            </td>
          </tr>

          <!-- SUBTÍTULO -->
          <tr>
            <td align="center" class="px-mobile" style="padding:8px 40px 0 40px;">
              <p style="margin:0; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:16px; line-height:24px; font-weight:600; color:#6e6e6e;">
                ¡Gracias por confiar en nosotros!
              </p>
            </td>
          </tr>

          <!-- CUERPO -->
          <tr>
            <td class="px-mobile" style="padding:28px 40px 8px 40px;">
              <p style="margin:0 0 16px 0; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:16px; line-height:26px; color:#111111;">
                Hola <strong>${clientName}</strong>,
              </p>
              <p style="margin:0 0 16px 0; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:16px; line-height:26px; color:#111111;">
                Te damos la bienvenida y te agradecemos por formar parte de la familia <strong>TecnoSmart</strong>. Hemos registrado exitosamente tus datos en nuestro sistema.
              </p>
              <p style="margin:0 0 16px 0; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:16px; line-height:26px; color:#6e6e6e;">
                Recuerda que estamos a tu entera disposición para todo lo que necesites relacionado con la tecnología:
              </p>
              <ul style="margin:0 0 16px 0; padding-left: 20px; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:15px; line-height:24px; color:#111111;">
                <li>Asesorías tecnológicas</li>
                <li>Servicios de streaming</li>
                <li>Instalaciones de cámaras de seguridad</li>
                <li>Automatizaciones</li>
              </ul>
              <p style="margin:0; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:16px; line-height:26px; color:#6e6e6e;">
                Nuestro compromiso es brindarte soluciones eficientes y de la más alta calidad.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" class="px-mobile" style="padding:32px 40px 16px 40px;">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://wa.me/584122789273" style="height:54px; v-text-anchor:middle; width:240px;" arcsize="50%" stroke="f" fillcolor="#c9242b">
                <w:anchorlock/>
                <center style="color:#ffffff; font-family:Arial,sans-serif; font-size:16px; font-weight:bold;">Contáctanos por WhatsApp</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-- -->
              <table role="presentation" class="btn-full" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td align="center" bgcolor="#c9242b" style="border-radius:50px; background-color:#c9242b;">
                    <a href="https://wa.me/584122789273" target="_blank" class="btn-link" style="display:inline-block; padding:16px 32px; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:16px; line-height:22px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:50px; background-color:#c9242b; border:1px solid #c9242b;">
                      Contáctanos por WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
              <!--<![endif]-->
            </td>
          </tr>

          <!-- NOTA TEMPORAL: Bloque de texto de apoyo bajo el botón oculto -->
          <!-- Texto de apoyo bajo el botón -->
          <!--
          <tr>
            <td align="center" class="px-mobile" style="padding:0 40px 40px 40px;">
              <p style="margin:0; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:13px; line-height:20px; color:#6e6e6e;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="https://tecnosmart.vercel.app/" target="_blank" style="color:#05235b; text-decoration:underline; word-break:break-all;">https://tecnosmart.vercel.app/</a>
              </p>
            </td>
          </tr>
          -->

          <!-- Línea divisoria -->
          <tr>
            <td class="px-mobile" style="padding:0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td height="1" style="height:1px; line-height:1px; font-size:0; background-color:#d9d9d9;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- BLOQUE DE AYUDA -->
          <tr>
            <td align="center" class="px-mobile" style="padding:28px 40px 36px 40px; background-color:#ffffff;">
              <p style="margin:0 0 6px 0; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:15px; line-height:22px; font-weight:700; color:#111111;">
                ¿Necesitas ayuda?
              </p>
              <p style="margin:0; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:14px; line-height:22px; color:#6e6e6e;">
                Escríbenos a
                <a href="mailto:tecnosmartvzla@gmail.com" style="color:#c9242b; font-weight:600; text-decoration:none;">tecnosmartvzla@gmail.com</a>
                y te responderemos lo antes posible.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td class="px-mobile" style="background-color:#05235b; padding:36px 40px;">

              <!-- Logo footer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <span style="font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:22px; line-height:28px; font-weight:800; color:#ffffff; letter-spacing:-0.3px;">
                      Tecno<span style="color:#ffffff; opacity:0.85;">Smart Vzl</span>
                    </span>
                  </td>
                </tr>

                <!-- Redes sociales -->
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                      <tr>
                        <td style="padding:0 6px;">
                          <a href="https://www.facebook.com/tecnosmartvzla" target="_blank" style="display:inline-block; padding:8px 14px; border:1px solid #ffffff; border-radius:50px; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:12px; line-height:16px; font-weight:600; color:#ffffff; text-decoration:none;">Facebook</a>
                        </td>
                        <td style="padding:0 6px;">
                          <a href="https://www.instagram.com/tecnosmartvzla" target="_blank" style="display:inline-block; padding:8px 14px; border:1px solid #ffffff; border-radius:50px; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:12px; line-height:16px; font-weight:600; color:#ffffff; text-decoration:none;">Instagram</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Línea -->
                <tr>
                  <td style="padding-bottom:20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td height="1" style="height:1px; line-height:1px; font-size:0; background-color:#d9d9d9; opacity:0.35;">&nbsp;</td></tr>
                    </table>
                  </td>
                </tr>

                <!-- Contacto -->
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <p style="margin:0; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:13px; line-height:22px; color:#d9d9d9;">
                      <a href="mailto:tecnosmartvzla@gmail.com" style="color:#ffffff; text-decoration:none;">tecnosmartvzla@gmail.com</a>
                      &nbsp;&nbsp;|&nbsp;&nbsp;
                      <a href="tel:+584122789273" style="color:#ffffff; text-decoration:none;">0412-2789273</a>
                    </p>
                    <p style="margin:6px 0 0 0; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:13px; line-height:20px; color:#d9d9d9;">
                      RIF: J-50701960-8<br>
                      Av. Bolívar C/C c. Páez, Edif. Sta. Eduviges II, local-02, Tinaquillo, Edo. Cojedes.
                    </p>
                  </td>
                </tr>

                <!-- Derechos y desuscripción -->
                <tr>
                  <td align="center">
                    <p style="margin:0 0 10px 0; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:12px; line-height:18px; color:#d9d9d9;">
                      &copy; 2026 TecnoSmart Vzl. Todos los derechos reservados.
                    </p>
                    <p style="margin:0; font-family:'Inter','Roboto','Montserrat',Arial,sans-serif; font-size:12px; line-height:18px; color:#d9d9d9;">
                      Recibiste este correo porque te registraste en nuestra base de datos.
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
</html>
    `;

    const data = await resend.emails.send({
      from: 'TecnoSmart <onboarding@resend.dev>', // Por ahora usas el de dev de resend, luego lo cambias por el tuyo verificado (ej: hola@tecnosmart.com)
      to: [toEmail],
      subject: '¡Bienvenido a TecnoSmart Vzl!',
      html: htmlContent,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}
