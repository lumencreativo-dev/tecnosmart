import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { sendSupportTicketAckEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      cliente,
      cedula_rif,
      email_cliente,
      telefono,
      categoria_id,
      servicio,
      asunto,
      descripcion,
      respuestas_guia,
      canal_origen = "web_form",
    } = body;

    if (!cliente || !asunto) {
      return NextResponse.json(
        { error: "El nombre del cliente y el asunto son obligatorios." },
        { status: 400 }
      );
    }

    // 1. Intentar vincular automáticamente con public.clientes si no viene cliente_id
    let clienteId = body.cliente_id || null;
    let esPremium = false;
    let esVip = false;

    if (!clienteId && (cedula_rif || email_cliente || telefono)) {
      const cleanEmail = (email_cliente || "").toLowerCase().trim();
      const cleanRif = (cedula_rif || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanTel = (telefono || "").replace(/\D/g, "");

      const { data: listaClientes } = await supabase
        .from("clientes")
        .select("id, contacto, empresa, rif_cedula, email, telefono, tipo");

      if (listaClientes && listaClientes.length > 0) {
        const found = listaClientes.find((c: any) => {
          if (cleanEmail && (c.email || "").toLowerCase().trim() === cleanEmail) return true;
          if (cleanRif && (c.rif_cedula || "").toLowerCase().replace(/[^a-z0-9]/g, "") === cleanRif) return true;
          if (cleanTel.length >= 7 && (c.telefono || "").replace(/\D/g, "").includes(cleanTel)) return true;
          return false;
        });

        if (found) {
          clienteId = found.id;
          if (found.tipo === "VIP" || found.tipo === "vip") {
            esVip = true;
          }
        }
      }
    } else if (clienteId) {
      const { data: cData } = await supabase
        .from("clientes")
        .select("tipo")
        .eq("id", clienteId)
        .maybeSingle();
      if (cData && (cData.tipo === "VIP" || cData.tipo === "vip")) {
        esVip = true;
      }
    }

    // 2. Comprobar si el cliente tiene plan de soporte premium
    if (clienteId) {
      const { data: suscripciones } = await supabase
        .from("suscripciones")
        .select("id, estado")
        .eq("cliente_id", clienteId)
        .eq("estado", "activa");

      if (suscripciones && suscripciones.length > 0) {
        esPremium = true;
      }
    }

    // 3. Generar Código Oficial Correlativo TCK-2026-XXX
    const { count } = await supabase
      .from("tickets_soporte")
      .select("*", { count: "exact", head: true });

    const correlativo = (count || 0) + 1;
    const codigoTicket = `TCK-2026-${String(correlativo).padStart(3, "0")}`;
    const ticketId = `tk-${Date.now()}`;

    const textoAnalisis = `${asunto} ${descripcion || ""}`.toLowerCase();
    const esCritico = Boolean(textoAnalisis.match(/urgente|emergencia|ca[ií]do|sin servicio|sin se[ñn]al|no enciende|cortocircuito|quemado|falla total|bloquead[oa]/));
    const prioridadCalculada = esPremium ? "urgente" : (esCritico || esVip) ? "alta" : (body.prioridad || "media");

    const nuevoTicket = {
      id: ticketId,
      codigo: codigoTicket,
      cliente: cliente.trim(),
      cliente_id: clienteId,
      cedula_rif: cedula_rif ? cedula_rif.trim() : null,
      email_cliente: email_cliente ? email_cliente.trim() : null,
      telefono: telefono ? telefono.trim() : null,
      categoria_id: categoria_id || "cctv",
      servicio: servicio || categoria_id || "cctv",
      tipo_plan: esPremium || esVip ? "premium" : "basico",
      prioridad: prioridadCalculada,
      estado: "abierto",
      asunto: asunto.trim(),
      descripcion: descripcion ? descripcion.trim() : "",
      respuestas_guia: respuestas_guia || {},
      canal_origen,
      tecnico_asignado: "Por Asignar",
      created_at: new Date().toISOString(),
    };

    // 4. Guardar en Supabase
    const { error: dbError } = await supabase.from("tickets_soporte").insert(nuevoTicket);
    if (dbError) {
      console.error("Error inserting ticket in Supabase:", dbError);
      // Si la tabla no tiene las columnas opcionales aún, intentar fallback mínimo
      const { error: fallbackErr } = await supabase.from("tickets_soporte").insert({
        id: nuevoTicket.id,
        codigo: nuevoTicket.codigo,
        cliente: nuevoTicket.cliente,
        telefono: nuevoTicket.telefono,
        servicio: nuevoTicket.servicio,
        tipo_plan: nuevoTicket.tipo_plan,
        prioridad: nuevoTicket.prioridad,
        estado: nuevoTicket.estado,
        asunto: nuevoTicket.asunto,
        descripcion: nuevoTicket.descripcion,
        tecnico_asignado: nuevoTicket.tecnico_asignado,
        created_at: nuevoTicket.created_at,
      });

      if (fallbackErr) {
        console.error("Fallback insert also failed:", fallbackErr);
      }
    }

    // 5. Guardar primer mensaje en el historial del ticket
    try {
      await supabase.from("ticket_mensajes").insert({
        ticket_id: ticketId,
        remitente_tipo: "cliente",
        remitente_nombre: cliente.trim(),
        remitente_email: email_cliente || null,
        contenido: descripcion ? `${asunto}\n\n${descripcion}` : asunto,
        canal: canal_origen,
        es_privado: false,
        created_at: new Date().toISOString(),
      });
    } catch (msgErr) {
      console.warn("Could not insert initial ticket message:", msgErr);
    }

    // 6. Enviar Acuse de Recibo por Correo Automático si tiene email
    if (email_cliente && email_cliente.includes("@")) {
      try {
        await sendSupportTicketAckEmail({
          toEmail: email_cliente.trim(),
          options: {
            ticketCodigo: codigoTicket,
            clienteNombre: cliente.trim(),
            servicioNombre: categoria_id || servicio || "Servicio Técnico",
            asunto: asunto.trim(),
            descripcion: descripcion || "",
            tipoPlan: esPremium ? "premium" : "basico",
          },
        });
      } catch (ackError) {
        console.error("Error sending ack email:", ackError);
      }
    }

    return NextResponse.json({
      success: true,
      ticket: nuevoTicket,
      clienteIdentificado: Boolean(clienteId),
    });
  } catch (err: any) {
    console.error("Fatal error creating ticket:", err);
    return NextResponse.json({ error: err.message || "Error al registrar el ticket." }, { status: 500 });
  }
}
