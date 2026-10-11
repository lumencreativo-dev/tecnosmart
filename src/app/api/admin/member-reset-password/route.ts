import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ ok: false, error: "El correo es requerido." }, { status: 400 });
    }

    // Solicitar restablecimiento de contraseña vía Supabase Auth
    // Redirige al usuario al portal para redefinir clave
    const origin = req.nextUrl.origin || "http://localhost:3000";
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/perfil`,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: `Enlace de restablecimiento enviado correctamente a ${email}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Error al procesar recuperación" }, { status: 500 });
  }
}
