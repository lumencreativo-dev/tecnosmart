// ─────────────────────────────────────────────────────────────
// middleware.ts — Enrutamiento inteligente por subdominio y protección de rutas
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
  "/servicios",
  "/importar",
  "/suscripciones",
  "/menu",
  "/novedades",
  "/equipo",
  "/perfil",
  "/ordenes",
  "/cuadrillas",
  "/actas",
  "/agenda",
  "/materiales",
  "/herramientas",
  "/finanzas",
  "/soporte",
  "/marketing",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get("ts_session");
  const host = (req.headers.get("host") || "").toLowerCase();

  // Detección de subdominios (soporta producción y localhost)
  const isApp = host.startsWith("app.") || host.startsWith("app.localhost");
  const isTec = host.startsWith("tec.") || host.startsWith("tec.localhost");

  // Redirigir URLs heredadas /cotizador/* a la versión limpia
  if (pathname === "/cotizador" || pathname === "/cotizador/dashboard") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (pathname.startsWith("/cotizador/")) {
    const cleanPath = pathname.replace("/cotizador", "");
    return NextResponse.redirect(new URL(cleanPath, req.url));
  }

  // ── 1. COMPORTAMIENTO EN LA RAÍZ "/" SEGÚN SUBDOMINIO ──
  if (pathname === "/") {
    if (isTec) {
      // Subdominio de Técnicos (tec.somostecnosmart.com o tec.localhost:3000)
      if (!session) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      return NextResponse.redirect(new URL("/ordenes", req.url));
    }

    if (isApp) {
      // Subdominio del ERP (app.somostecnosmart.com o app.localhost:3000)
      if (!session) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Dominio raíz (somostecnosmart.com o localhost:3000): muestra la Landing Page pública
    return NextResponse.next();
  }

  // ── 2. SI YA TIENE SESIÓN Y ENTRA A /login ──
  if (session && pathname === "/login") {
    if (isTec) {
      return NextResponse.redirect(new URL("/ordenes", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // ── 3. REDIRECCIÓN EN EL SUBDOMINIO DE TÉCNICOS ──
  if (isTec && pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/ordenes", req.url));
  }

  // ── 4. PROTECCIÓN DE RUTAS PRIVADAS ──
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (!session && isProtected) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
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
    "/materiales/:path*",
    "/materiales",
    "/cuadrillas/:path*",
    "/cuadrillas",
    "/ordenes/:path*",
    "/ordenes",
    "/agenda/:path*",
    "/agenda",
    "/actas/:path*",
    "/actas",
    "/servicios/:path*",
    "/servicios",
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
    "/finanzas/:path*",
    "/finanzas",
    "/soporte/:path*",
    "/soporte",
    "/marketing/:path*",
    "/marketing",
  ],
};
