import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, nombre, username, cedula, telefono, direccion, password } = body;

    // 1. Validar el token de la invitación
    const { data: inv, error: invError } = await supabase
      .from("invitaciones")
      .select("*")
      .eq("token", token)
      .eq("usada", false)
      .single();

    if (invError || !inv) {
      return NextResponse.json({ ok: false, error: "La invitación no es válida o ya expiró." }, { status: 400 });
    }

    // 2. Verificar que el username no esté en uso
    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9._-]/g, "");
    const { data: usuarioExistente } = await supabase
      .from("perfiles")
      .select("id")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (usuarioExistente) {
      return NextResponse.json({ ok: false, error: `El usuario @${cleanUsername} ya está en uso.` }, { status: 400 });
    }

    // 3. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: inv.email,
      password: password,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ ok: false, error: authError?.message || "Error al registrar en Supabase Auth." }, { status: 400 });
    }

    // 4. Crear el perfil en la base de datos
    const { error: perfilError } = await supabase.from("perfiles").upsert([
      {
        id: authData.user.id,
        email: inv.email,
        username: cleanUsername,
        nombre: nombre.trim(),
        cedula: cedula.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        rol_id: inv.rol_id,
        estado: "activo",
      },
    ]);

    if (perfilError) {
      console.error("Error al crear perfil:", perfilError);
    }

    // 5. Marcar invitación como usada
    await supabase.from("invitaciones").update({ usada: true }).eq("id", inv.id);

    return NextResponse.json({ ok: true, email: inv.email });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Error interno del servidor." }, { status: 500 });
  }
}
