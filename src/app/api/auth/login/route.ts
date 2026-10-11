// ─────────────────────────────────────────────────────────────
// app/api/auth/login/route.ts — Autenticación por Usuario o Correo
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const MASTER_USER = "admintecno";
const MASTER_PASS = "tecnosmart.123";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { usuario, clave } = body;
    const identificador = (usuario || "").trim().toLowerCase();

    // 1. Verificación de credencial maestra inicial
    if (identificador === MASTER_USER && clave === MASTER_PASS) {
      const res = NextResponse.json({ ok: true });
      res.cookies.set("ts_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
      return res;
    }

    // 2. Determinar si es correo o nombre de usuario
    let emailDestino = identificador;

    if (!identificador.includes("@")) {
      // Es un nombre de usuario: buscar el correo asociado en perfiles
      const cleanHandle = identificador.replace(/^@/, "");
      const { data: perfil, error: perfilError } = await supabase
        .from("perfiles")
        .select("email")
        .ilike("username", cleanHandle)
        .maybeSingle();

      if (perfilError || !perfil?.email) {
        return NextResponse.json({ ok: false, error: "Usuario o correo no encontrado" }, { status: 401 });
      }

      emailDestino = perfil.email;
    }

    // 3. Autenticar contra Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: emailDestino,
      password: clave,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ ok: false, error: "Contraseña incorrecta o usuario no encontrado" }, { status: 401 });
    }

    // 4. Crear cookie de sesión segura
    const res = NextResponse.json({ ok: true, user: authData.user });
    res.cookies.set("ts_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
