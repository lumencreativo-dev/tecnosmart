import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { sendSupportTicketReplyEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      ticketId,
      ticketCodigo,
      clienteEmail,
      clienteNombre,
      asuntoOriginal,
      agenteNombre,
      mensajeRespuesta,
      nuevoEstado = "en_diagnostico",
      solucion,
      enviarEmail = true,
      esNotaInterna = false,
    } = body;

    if (!ticketId || !mensajeRespuesta) {
      return NextResponse.json(
        { error: "El ID del ticket y el mensaje de respuesta son requeridos." },
        { status: 400 }
      );
    }

    // 1. Guardar mensaje en el historial del ticket (ticket_mensajes)
    const { error: msgErr } = await supabase.from("ticket_mensajes").insert({
      ticket_id: ticketId,
      remitente_tipo: esNotaInterna ? "nota_interna" : "agente",
      remitente_nombre: agenteNombre || "Soporte Técnico TecnoSmart",
      remitente_email: "soporte@somostecnosmart.com",
      contenido: mensajeRespuesta.trim(),
      canal: esNotaInterna ? "panel" : "email",
      es_privado: esNotaInterna,
      created_at: new Date().toISOString(),
    });

    if (msgErr) {
      console.warn("Could not insert ticket message:", msgErr);
    }

    // 2. Si no es nota interna y el cliente tiene correo, enviar por Resend
    let emailResult: any = null;
    if (!esNotaInterna && enviarEmail && clienteEmail && clienteEmail.includes("@")) {
      emailResult = await sendSupportTicketReplyEmail({
        toEmail: clienteEmail.trim(),
        options: {
          ticketCodigo: ticketCodigo || "TCK",
          clienteNombre: clienteNombre || "Cliente",
          asuntoOriginal: asuntoOriginal || "Soporte Técnico",
          agenteNombre: agenteNombre || "TecnoSmart Soporte",
          mensajeRespuesta: mensajeRespuesta.trim(),
          estadoTicket: nuevoEstado,
          solucion: solucion || undefined,
        },
      });
    }

    // 3. Actualizar estado del ticket en Supabase
    const updateData: any = {
      estado: nuevoEstado,
    };
    if (solucion) updateData.solucion = solucion;
    if (nuevoEstado === "resuelto" || nuevoEstado === "cerrado") {
      updateData.fecha_cierre = new Date().toISOString();
    }

    await supabase.from("tickets_soporte").update(updateData).eq("id", ticketId);

    return NextResponse.json({
      success: true,
      emailResult,
    });
  } catch (err: any) {
    console.error("Error processing ticket reply:", err);
    return NextResponse.json({ error: err.message || "Error al procesar la respuesta." }, { status: 500 });
  }
}
