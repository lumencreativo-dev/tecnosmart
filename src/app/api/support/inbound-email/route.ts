import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { sendSupportTicketAckEmail } from "@/lib/email";
import { limpiarTextoMime } from "@/lib/utils";

// Clave secreta para autorizar llamadas desde Cloudflare Email Worker
const INBOUND_SECRET = process.env.INBOUND_EMAIL_SECRET || "ts_inbound_secret_2026";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("x-inbound-secret");
    const body = await req.json();

    // Validar token de seguridad (opcional en desarrollo, recomendado en producción)
    if (authHeader && authHeader !== INBOUND_SECRET && body.secret !== INBOUND_SECRET) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const fromEmail = (body.from || "").toLowerCase().trim();
    const fromName = body.fromName || fromEmail.split("@")[0] || "Cliente";
    const subject = (body.subject || "Consulta de Soporte").trim();
    const rawContent = (body.text || body.html || "").trim();
    const messageContent = limpiarTextoMime(rawContent);

    if (!fromEmail || !messageContent) {
      return NextResponse.json(
        { error: "Remitente y contenido del mensaje requeridos." },
        { status: 400 }
      );
    }

    // ── 1. DETECCIÓN DE HILO: ¿Es una respuesta a un ticket existente? ──
    const ticketMatch = subject.match(/\[Ticket\s+#?(TCK-\d{4}-\d+)\]/i);

    if (ticketMatch && ticketMatch[1]) {
      const codigoTicket = ticketMatch[1].toUpperCase();

      // Buscar el ticket existente
      const { data: ticketExistente } = await supabase
        .from("tickets_soporte")
        .select("id, codigo, estado, cliente")
        .eq("codigo", codigoTicket)
        .maybeSingle();

      if (ticketExistente) {
        // Insertar respuesta al hilo existente
        await supabase.from("ticket_mensajes").insert({
          ticket_id: ticketExistente.id,
          remitente_tipo: "cliente",
          remitente_nombre: fromName,
          remitente_email: fromEmail,
          contenido: messageContent,
          canal: "email",
          es_privado: false,
          created_at: new Date().toISOString(),
        });

        // Si estaba resuelto o cerrado, reabrirlo
        if (ticketExistente.estado === "resuelto" || ticketExistente.estado === "cerrado") {
          await supabase
            .from("tickets_soporte")
            .update({ estado: "abierto" })
            .eq("id", ticketExistente.id);
        }

        return NextResponse.json({
          success: true,
          action: "reply_appended",
          ticketCodigo: ticketExistente.codigo,
        });
      }
    }

    // ── 2. CASO CORREO NUEVO: Crear un ticket desde el correo entrante ──

    // 2.1 Buscar si el remitente coincide con un cliente registrado en CRM
    let clienteId: string | null = null;
    let clienteNombre = fromName;
    let clienteTelefono: string | null = null;
    let esPremium = false;
    let esVip = false;
    let servicioDetectado = "cctv"; // Por defecto

    const { data: found } = await supabase
      .from("clientes")
      .select("id, contacto, empresa, email, telefono, tipo")
      .ilike("email", fromEmail)
      .maybeSingle();

    if (found) {
      clienteId = found.id;
      clienteNombre = found.contacto || found.empresa || fromName;
      clienteTelefono = found.telefono || null;
      if (found.tipo === "VIP" || found.tipo === "vip") {
        esVip = true;
      }

      // Verificar si tiene plan premium
      const { data: subs } = await supabase
        .from("suscripciones")
        .select("id")
        .eq("cliente_id", found.id)
        .eq("estado", "activa");

      if (subs && subs.length > 0) {
        esPremium = true;
      }
    }

    // 2.2 Detección Heurística Inteligente del Servicio por Palabras Clave
    const textoAnalisis = `${subject} ${messageContent}`.toLowerCase();
    if (textoAnalisis.match(/starlink|satelital|satelite|antena|bélgica|megas|bypass|router/)) {
      servicioDetectado = "starlink";
    } else if (textoAnalisis.match(/camara|cámara|dvr|nvr|hikvision|dahua|hik-connect|dmss|grabador|pantalla/)) {
      servicioDetectado = "cctv";
    } else if (textoAnalisis.match(/porton|portón|motor|brazo|corredizo|cremallera|control remoto|receptor/)) {
      servicioDetectado = "automatizacion";
    } else if (textoAnalisis.match(/cable|utp|switch|mikrotik|omada|wifi|wi-fi|redes|fibra/)) {
      servicioDetectado = "redes";
    } else if (textoAnalisis.match(/cerradura|biometrico|biométrico|alarma|sensor|acceso/)) {
      servicioDetectado = "domotica";
    } else if (textoAnalisis.match(/garantia|garantía|defecto|quemado|factura|dañado/)) {
      servicioDetectado = "garantia";
    }

    // Heurística de Criticidad e Incidencias Graves
    const esCritico = Boolean(textoAnalisis.match(/urgente|emergencia|ca[ií]do|sin servicio|sin se[ñn]al|no enciende|cortocircuito|quemado|falla total|bloquead[oa]/));
    const prioridadDeterminada = esPremium ? "urgente" : (esCritico || esVip) ? "alta" : "media";

    // 2.3 Generar Correlativo Oficial TCK-2026-XXX
    const { count } = await supabase
      .from("tickets_soporte")
      .select("*", { count: "exact", head: true });

    const correlativo = (count || 0) + 1;
    const codigoTicket = `TCK-2026-${String(correlativo).padStart(3, "0")}`;
    const ticketId = `tk-${Date.now()}`;

    const nuevoTicket = {
      id: ticketId,
      codigo: codigoTicket,
      cliente: clienteNombre,
      cliente_id: clienteId,
      email_cliente: fromEmail,
      telefono: clienteTelefono,
      categoria_id: servicioDetectado,
      servicio: servicioDetectado,
      tipo_plan: esPremium || esVip ? "premium" : "basico",
      prioridad: prioridadDeterminada,
      estado: "abierto",
      asunto: subject,
      descripcion: messageContent,
      canal_origen: "email",
      tecnico_asignado: "Por Asignar",
      created_at: new Date().toISOString(),
    };

    await supabase.from("tickets_soporte").insert(nuevoTicket);

    // 2.4 Guardar mensaje inicial en el historial
    await supabase.from("ticket_mensajes").insert({
      ticket_id: ticketId,
      remitente_tipo: "cliente",
      remitente_nombre: fromName,
      remitente_email: fromEmail,
      contenido: `${subject}\n\n${messageContent}`,
      canal: "email",
      es_privado: false,
      created_at: new Date().toISOString(),
    });

    // 2.5 Enviar Acuse de Recibo Automático al remitente
    try {
      await sendSupportTicketAckEmail({
        toEmail: fromEmail,
        options: {
          ticketCodigo: codigoTicket,
          clienteNombre,
          servicioNombre: servicioDetectado,
          asunto: subject,
          descripcion: messageContent,
          tipoPlan: esPremium ? "premium" : "basico",
        },
      });
    } catch (ackErr) {
      console.warn("Could not send ack email to inbound sender:", ackErr);
    }

    return NextResponse.json({
      success: true,
      action: "ticket_created",
      ticket: nuevoTicket,
    });
  } catch (err: any) {
    console.error("Error processing inbound email:", err);
    return NextResponse.json(
      { error: err.message || "Error al procesar el correo entrante." },
      { status: 500 }
    );
  }
}
