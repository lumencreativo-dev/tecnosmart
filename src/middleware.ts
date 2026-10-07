// ─────────────────────────────────────────────────────────────
// middleware.ts — Protege /cotizador/* requiriendo sesión
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const session = req.cookies.get("ts_session");

  // Si no hay sesión y está intentando acceder al cotizador (excepto login)
  if (!session && req.nextUrl.pathname !== "/cotizador/login") {
    const loginUrl = new URL("/cotizador/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Si ya tiene sesión y está en la página de login, redirigir al cotizador
  if (session && req.nextUrl.pathname === "/cotizador/login") {
    return NextResponse.redirect(new URL("/cotizador", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cotizador/:path*"],
};
