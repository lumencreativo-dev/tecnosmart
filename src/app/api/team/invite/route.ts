import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTeamInviteEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, token, rolId, inviterName, nombre } = body;

    if (!email || !token) {
      return NextResponse.json(
        { ok: false, error: "El email y el token de invitación son obligatorios." },
        { status: 400 }
      );
    }

    // 1. Obtener detalles del rol asignado para enriquecer el email
    let roleInfo: { id?: string; nombre?: string; descripcion?: string; color?: string } | undefined = undefined;

    if (rolId) {
      const { data: rolData } = await supabase
        .from("roles")
        .select("id, nombre, descripcion, color")
        .eq("id", rolId)
        .single();

      if (rolData) {
        roleInfo = rolData;
      } else {
        roleInfo = { id: rolId, nombre: rolId };
      }
    }

    // 2. Enviar email formal de invitación con Resend
    const result = await sendTeamInviteEmail({
      toEmail: email,
      token,
      recipientName: nombre || undefined,
      roleInfo,
      inviterName: inviterName || "Administración TecnoSmart",
    });

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error || "No se pudo despachar el correo de invitación." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Invitación enviada con éxito a ${email}.`,
      data: result.data,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error interno al procesar invitación.";
    console.error("Error en /api/team/invite:", err);
    return NextResponse.json(
      { ok: false, error: errorMsg },
      { status: 500 }
    );
  }
}
