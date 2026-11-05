import { supabase } from "@/lib/supabase/client";
import type { SolicitudStarlink } from "@/lib/types";

/**
 * Guarda una nueva solicitud de onboarding Starlink.
 * Utiliza 'solicitudes_starlink' si la tabla existe; de lo contrario utiliza 'clientes' como fallback seguro.
 */
export async function guardarSolicitudStarlink(
  solicitud: SolicitudStarlink
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // 1. Intentar guardar en la tabla especializada public.solicitudes_starlink
    const { data: solData, error: solErr } = await supabase
      .from("solicitudes_starlink")
      .insert([
        {
          nombre_completo: solicitud.nombre_completo,
          cedula_rif: solicitud.cedula_rif,
          telefono: solicitud.telefono,
          email: solicitud.email || null,
          direccion: solicitud.direccion,
          coordenadas_gps: solicitud.coordenadas_gps || null,
          plan_deseado: solicitud.plan_deseado || "Starlink Residencial",
          wifi_ssid_preferido: solicitud.wifi_ssid_preferido || null,
          wifi_password_preferido: solicitud.wifi_password_preferido || null,
          cedula_frontal_url: solicitud.cedula_frontal_url || null,
          cedula_trasera_url: solicitud.cedula_trasera_url || null,
          notas: solicitud.notas || null,
          estado: solicitud.estado || "pendiente",
          origen: solicitud.origen || "web_cliente",
        },
      ])
      .select("id")
      .single();

    if (!solErr && solData) {
      return { success: true, id: solData.id };
    }

    // 2. Si la tabla no existe aún en Supabase, guardar como fallback en 'clientes' con tag
    const metadata = {
      plan_deseado: solicitud.plan_deseado,
      coordenadas_gps: solicitud.coordenadas_gps,
      wifi_ssid_preferido: solicitud.wifi_ssid_preferido,
      wifi_password_preferido: solicitud.wifi_password_preferido,
      cedula_frontal_url: solicitud.cedula_frontal_url,
      cedula_trasera_url: solicitud.cedula_trasera_url,
      origen: solicitud.origen,
      estado: solicitud.estado || "pendiente",
    };

    const serializedNotas = `${solicitud.notas || ""}\n\n<!--STARLINK_ONBOARDING:${JSON.stringify(metadata)}-->`;

    const { data: cliData, error: cliErr } = await supabase
      .from("clientes")
      .insert([
        {
          contacto: solicitud.nombre_completo,
          empresa: solicitud.nombre_completo,
          rif_cedula: solicitud.cedula_rif,
          telefono: solicitud.telefono,
          email: solicitud.email || null,
          direccion: solicitud.direccion,
          tipo: "starlink_onboarding_pendiente" as any,
          notas: serializedNotas,
        },
      ])
      .select("id")
      .single();

    if (cliErr) {
      throw cliErr;
    }

    return { success: true, id: cliData?.id };
  } catch (err: any) {
    console.error("Error al guardar solicitud Starlink:", err);
    return { success: false, error: err.message || "Error al procesar la solicitud" };
  }
}

/**
 * Obtiene todas las solicitudes de Starlink pendientes o en proceso.
 */
export async function obtenerSolicitudesStarlink(): Promise<SolicitudStarlink[]> {
  try {
    // 1. Intentar consultar tabla dedicada
    const { data: solData, error: solErr } = await supabase
      .from("solicitudes_starlink")
      .select("*")
      .order("created_at", { ascending: false });

    if (!solErr && solData) {
      return solData as SolicitudStarlink[];
    }

    // 2. Fallback: consultar clientes con tag 'starlink_onboarding_pendiente'
    const { data: cliData, error: cliErr } = await supabase
      .from("clientes")
      .select("*")
      .ilike("notas", "%<!--STARLINK_ONBOARDING:%")
      .order("created_at", { ascending: false });

    if (!cliErr && cliData) {
      return cliData.map((c) => {
        let meta: any = {};
        if (c.notas) {
          const match = c.notas.match(/<!--STARLINK_ONBOARDING:([\s\S]*?)-->/);
          if (match && match[1]) {
            try {
              meta = JSON.parse(match[1]);
            } catch {}
          }
        }

        const notasLimpias = (c.notas || "")
          .replace(/<!--STARLINK_ONBOARDING:[\s\S]*?-->/g, "")
          .trim();

        return {
          id: c.id,
          nombre_completo: c.contacto || c.empresa || "",
          cedula_rif: c.rif_cedula || "",
          telefono: c.telefono || "",
          email: c.email || "",
          direccion: c.direccion || "",
          coordenadas_gps: meta.coordenadas_gps || "",
          plan_deseado: meta.plan_deseado || "Starlink Residencial",
          wifi_ssid_preferido: meta.wifi_ssid_preferido || "",
          wifi_password_preferido: meta.wifi_password_preferido || "",
          cedula_frontal_url: meta.cedula_frontal_url || "",
          cedula_trasera_url: meta.cedula_trasera_url || "",
          notas: notasLimpias,
          estado: meta.estado || (c.tipo === "cliente_normal" ? "activada" : "pendiente"),
          origen: meta.origen || "web_cliente",
          created_at: c.created_at,
        } as SolicitudStarlink;
      });
    }

    return [];
  } catch (err) {
    console.error("Error al obtener solicitudes Starlink:", err);
    return [];
  }
}

/**
 * Actualiza el estado de una solicitud (ej. a 'activada' o 'rechazada')
 */
export async function actualizarEstadoSolicitud(
  id: string,
  nuevoEstado: "pendiente" | "en_proceso" | "activada" | "rechazada"
): Promise<void> {
  // Intentar tabla dedicada
  const { error: solErr } = await supabase
    .from("solicitudes_starlink")
    .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (solErr) {
    // Fallback: actualizar en clientes
    const { data: c } = await supabase.from("clientes").select("notas").eq("id", id).single();
    if (c) {
      let meta: any = {};
      if (c.notas) {
        const match = c.notas.match(/<!--STARLINK_ONBOARDING:([\s\S]*?)-->/);
        if (match && match[1]) {
          try {
            meta = JSON.parse(match[1]);
          } catch {}
        }
      }
      meta.estado = nuevoEstado;
      const notasLimpias = (c.notas || "")
        .replace(/<!--STARLINK_ONBOARDING:[\s\S]*?-->/g, "")
        .trim();
      const updatedNotas = `${notasLimpias}\n\n<!--STARLINK_ONBOARDING:${JSON.stringify(meta)}-->`;

      await supabase
        .from("clientes")
        .update({
          notas: updatedNotas,
          tipo: nuevoEstado === "activada" ? "cliente_normal" : ("starlink_onboarding_pendiente" as any),
        })
        .eq("id", id);
    }
  }
}
