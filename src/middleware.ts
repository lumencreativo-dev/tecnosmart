// ─────────────────────────────────────────────────────────────
// middleware.ts — Protege las rutas internas requiriendo sesión
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/nueva",
  "/cotizar",
  "/facturacion",
  "/historial-facturas",
  "/crm",
  "/clientes",
  "/inventario",
  "/importar",
  "/suscripciones",
  "/menu",
  "/novedades",
  "/equipo",
  "/perfil",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get("ts_session");

  // Redirigir URLs heredadas /cotizador/* a la versión limpia
  if (pathname === "/cotizador" || pathname === "/cotizador/dashboard") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (pathname.startsWith("/cotizador/")) {
    const cleanPath = pathname.replace("/cotizador", "");
    return NextResponse.redirect(new URL(cleanPath, req.url));
  }

  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(prefix + "/"));

  // Si no hay sesión y va a una ruta protegida
  if (!session && isProtected) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Si ya tiene sesión y está en /login, mandar al dashboard
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/cotizador/:path*",
    "/cotizador",
    "/dashboard/:path*",
    "/dashboard",
    "/nueva/:path*",
    "/nueva",
    "/facturacion/:path*",
    "/facturacion",
    "/historial-facturas/:path*",
    "/historial-facturas",
    "/crm/:path*",
    "/crm",
    "/clientes/:path*",
    "/clientes",
    "/inventario/:path*",
    "/inventario",
    "/importar/:path*",
    "/importar",
    "/suscripciones/:path*",
    "/suscripciones",
    "/menu/:path*",
    "/menu",
    "/novedades/:path*",
    "/novedades",
    "/equipo/:path*",
    "/equipo",
    "/perfil/:path*",
    "/perfil",
  ],
};
