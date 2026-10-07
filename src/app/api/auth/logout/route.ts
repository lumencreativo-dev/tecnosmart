// ─────────────────────────────────────────────────────────────
// app/api/auth/logout/route.ts — Cerrar sesión
// ─────────────────────────────────────────────────────────────
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("ts_session");
  return res;
}
