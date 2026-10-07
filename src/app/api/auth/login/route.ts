// ─────────────────────────────────────────────────────────────
// app/api/auth/login/route.ts — API de autenticación simple
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";

const VALID_USER = "admintecno";
const VALID_PASS = "tecnosmart.123";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { usuario, clave } = body;

  if (usuario === VALID_USER && clave === VALID_PASS) {
    const res = NextResponse.json({ ok: true });
    // Cookie de sesión (7 días)
    res.cookies.set("ts_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });
    return res;
  }

  return NextResponse.json({ ok: false, error: "Credenciales incorrectas" }, { status: 401 });
}
