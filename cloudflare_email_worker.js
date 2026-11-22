/**
 * CLOUDFLARE EMAIL WORKER — TECNOSMART VZL C.A.
 * 100% Autónomo: Reenvía a Gmail, limpia MIME, vincula cliente CRM/VIP,
 * inserta en Supabase y envía acuse oficial con SLA de 24h hábiles por Resend.
 */

const SUPABASE_URL = "https://oeydtomyjwxwpvjrrebx.supabase.co";
// Las llaves se configuran en Cloudflare Dashboard > Worker > Settings > Variables and Secrets
// SUPABASE_KEY y RESEND_API_KEY se leen desde el objeto `env` en tiempo de ejecución.

function cleanMimeText(raw) {
  if (!raw) return "";
  let clean = raw;

  // Extraer parte text/plain preferentemente si viene en multipart
  if (clean.includes("Content-Type: text/plain")) {
    const plainPart = clean.split(/Content-Type:\s*text\/plain[^\n]*\n/i)[1];
    if (plainPart) {
      const endBoundary = plainPart.search(/--[a-zA-Z0-9_-]+/);
      if (endBoundary !== -1) {
        clean = plainPart.substring(0, endBoundary);
      } else {
        clean = plainPart;
      }
    }
  }

  // Eliminar delimitadores y encabezados MIME
  clean = clean.replace(/--[a-zA-Z0-9_\-=]+--?/g, "");
  clean = clean.replace(/Content-(?:Type|Transfer-Encoding|Disposition):[^\n]*\n?/gi, "");
  clean = clean.replace(/charset="?[^"\n]+"?;?/gi, "");

  // Eliminar etiquetas HTML si existieran
  clean = clean.replace(/<style[\s\S]*?<\/style>/gi, "");
  clean = clean.replace(/<script[\s\S]*?<\/script>/gi, "");
  clean = clean.replace(/<\/div>/gi, "\n");
  clean = clean.replace(/<br\s*\/?>/gi, "\n");
  clean = clean.replace(/<p[\s\S]*?>/gi, "");
  clean = clean.replace(/<\/p>/gi, "\n\n");
  clean = clean.replace(/<[^>]+>/g, "");

  // Decodificar caracteres quoted-printable comunes
  clean = clean.replace(/=C2=A0/gi, " ");
  clean = clean.replace(/=3D/gi, "=");
  clean = clean.replace(/=\r?\n/g, "");
  clean = clean.replace(/&nbsp;/gi, " ");
  clean = clean.replace(/&amp;/gi, "&");
  clean = clean.replace(/&lt;/gi, "<");
  clean = clean.replace(/&gt;/gi, ">");
  clean = clean.replace(/&quot;/gi, '"');

  clean = clean.replace(/\r\n/g, "\n");
  clean = clean.replace(/\n{3,}/g, "\n\n");
  return clean.trim();
}

export default {
  // Manejador web (responde 200 en vista previa de Cloudflare)
  async fetch(request, env, ctx) {
    return new Response("TecnoSmart Email Inbound Worker — Activo y Funcionando", { status: 200 });
  },

  // Manejador oficial para los correos que lleguen a soporte@somostecnosmart.com
  async email(message, env, ctx) {
    const supabaseKey = env?.SUPABASE_KEY || "";
    const resendApiKey = env?.RESEND_API_KEY || "";

    // 1. Reenviar copia de respaldo a Gmail
    try {
      await message.forward("tecnosmartvzl@gmail.com");
    } catch (e) {
      console.warn("No se pudo reenviar copia a Gmail:", e);
    }

    // 2. Extraer remitente y asunto
    const from = message.from;
    const to = message.to;
    const subject = message.headers.get("subject") || "Consulta de Soporte Técnico";

    // 3. Extraer y sanear contenido del cuerpo
    let bodyText = "";
    try {
      const rawText = await new Response(message.raw).text();
      bodyText = cleanMimeText(rawText);
      if (!bodyText) {
        bodyText = `Mensaje recibido de ${from}: ${subject}`;
      }
    } catch (err) {
      bodyText = `Mensaje recibido de ${from}: ${subject}`;
    }

    // 4. Buscar si el remitente ya es un cliente registrado en CRM o VIP
    let clienteId = null;
    let clienteNombre = from.split("@")[0];
    let telefono = null;
    let prioridad = "media";
    let tipoPlan = "basico";

    try {
      const cliRes = await fetch(`${SUPABASE_URL}/rest/v1/clientes?email=ilike.${encodeURIComponent(from)}&select=id,contacto,empresa,telefono,tipo&limit=1`, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        }
      });
      const cliData = await cliRes.json();
      if (cliData && cliData.length > 0) {
        const found = cliData[0];
        clienteId = found.id;
        clienteNombre = found.contacto || found.empresa || clienteNombre;
        telefono = found.telefono || null;
        if (found.tipo === "VIP" || found.tipo === "vip") {
          prioridad = "alta";
          tipoPlan = "premium";
        }
      }
    } catch (e) {
      console.warn("No se pudo verificar cliente en CRM:", e);
    }

    // 5. Detección Inteligente del Servicio por Palabras Clave
    const lower = `${subject} ${bodyText}`.toLowerCase();
    let servicio = "cctv";
    if (lower.match(/starlink|satelital|antena|bypass|router/)) servicio = "starlink";
    else if (lower.match(/porton|portón|motor|brazo|control/)) servicio = "automatizacion";
    else if (lower.match(/wifi|wi-fi|red|cable|switch|mikrotik/)) servicio = "redes";
    else if (lower.match(/cerradura|biometrico|biométrico|alarma/)) servicio = "domotica";
    else if (lower.match(/garantia|garantía|defecto|factura/)) servicio = "garantia";

    // Heurística de Criticidad e Incidencias Graves
    const esCritico = Boolean(lower.match(/urgente|emergencia|ca[ií]do|sin servicio|sin se[ñn]al|no enciende|cortocircuito|quemado|falla total|bloquead[oa]/));
    if (esCritico && prioridad !== "urgente") {
      prioridad = "alta";
    }

    // 6. Generar Identificadores
    const ticketId = `tk-${Date.now()}`;
    const correlativo = String(Math.floor(Math.random() * 900) + 100);
    const codigoTicket = `TCK-2026-${correlativo}`;

    // 7. Insertar DIRECTAMENTE en Supabase (tickets_soporte)
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/tickets_soporte`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          id: ticketId,
          codigo: codigoTicket,
          cliente: clienteNombre,
          cliente_id: clienteId,
          email_cliente: from,
          telefono: telefono,
          asunto: subject,
          descripcion: bodyText.slice(0, 2000),
          servicio,
          categoria_id: servicio,
          canal_origen: "email",
          estado: "abierto",
          prioridad,
          tipo_plan: tipoPlan,
          created_at: new Date().toISOString(),
        }),
      });

      // Insertar en historial de mensajes
      await fetch(`${SUPABASE_URL}/rest/v1/ticket_mensajes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          remitente_tipo: "cliente",
          remitente_nombre: clienteNombre,
          remitente_email: from,
          contenido: bodyText.slice(0, 2000),
          canal: "email",
          es_privado: false,
          created_at: new Date().toISOString(),
        }),
      });
    } catch (dbErr) {
      console.error("Error guardando en Supabase desde Worker:", dbErr);
    }

    // 8. Enviar Acuse Oficial al Cliente vía Resend con SLA de 24h hábiles
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "TecnoSmart Soporte <soporte@somostecnosmart.com>",
          reply_to: "soporte@somostecnosmart.com",
          to: [from],
          subject: `[Ticket #${codigoTicket}] Solicitud Recibida — TecnoSmart Soporte`,
          text: `Estimado(a) ${clienteNombre},

Hemos recibido correctamente su correo respecto a: "${subject}".
Su requerimiento ha sido ingresado en nuestro sistema técnico bajo el correlativo oficial: #${codigoTicket}.

⏱️ Tiempo Estimado de Respuesta:
Nuestro equipo técnico responderá su solicitud en alrededor de 24 horas en días hábiles (Lunes a Viernes de 8:00 AM a 5:00 PM).

💬 Atención Inmediata por WhatsApp:
Si requiere asistencia prioritaria en tiempo real o desea enviar fotos/videos de sus equipos, puede escribirnos directamente al WhatsApp oficial:
https://wa.me/584122789273?text=Hola%20TecnoSmart,%20escribo%20sobre%20mi%20Ticket%20%23${codigoTicket}

Atentamente,
Mesa de Ayuda & Soporte Técnico
TecnoSmart VZL C.A.`,
        }),
      });
    } catch (resendErr) {
      console.error("Error enviando acuse vía Resend:", resendErr);
    }
  },
};
