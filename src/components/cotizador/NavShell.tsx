"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard, FileEdit, Receipt, History,
  Kanban, Users, Package, UploadCloud,
  Sparkles, Globe, Plus, LayoutGrid,
  Settings, LogOut, ChevronDown, ChevronRight, Sun, Moon, Monitor,
  Repeat, Wrench, Wallet, BarChart3, Clock, UserCheck, X, Menu,
  Calendar, ClipboardCheck, HardHat, Boxes, User as UserIcon,
  CreditCard, Truck, ArrowUpDown, LifeBuoy, Ticket, ShieldCheck,
  BookOpen, Megaphone, Send, MessageSquare, Search, Zap
} from "lucide-react";
import { useUsuario } from "@/hooks/useUsuario";
import { supabase } from "@/lib/supabase/client";

import { tienePermiso } from "@/lib/permissions";

// ── Tipos ────────────────────────────────────────────────────────
export interface PlaceholderInfo {
  title: string;
  description: string;
  icon: any;
}

export interface SidebarItem {
  href: string;
  icon: any;
  label: string;
  badge?: string;
  permiso?: string;
  isPlaceholder?: boolean;
  placeholder?: PlaceholderInfo;
}

export interface SidebarSection {
  id: string;
  title: string;
  badge?: string;
  badgeColor?: "amber" | "emerald" | "gray";
  permisoGrupo?: string;
  items: SidebarItem[];
}

// ── Configuración Maestra de Módulos (Sidebar ERP Desktop & Móvil) ─
const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: "inicio",
    title: "1. INICIO",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard General" },
    ],
  },
  {
    id: "ventas",
    title: "2. VENTAS & CLIENTES",
    permisoGrupo: "ventas",
    items: [
      { href: "/nueva",             icon: FileEdit, label: "Cotizaciones", permiso: "ventas.cotizar" },
      { href: "/crm?view=list",     icon: History,  label: "Historial de Cotizaciones", permiso: "ventas.cotizar" },
      { href: "/facturacion",        icon: Receipt,  label: "Facturación SENIAT", permiso: "ventas.facturar" },
      { href: "/historial-facturas", icon: History,  label: "Historial de Facturas", permiso: "ventas.ver_global" },
      { href: "/crm",               icon: Kanban,   label: "CRM Pipeline", permiso: "ventas.crm" },
      { href: "/clientes",          icon: Users,    label: "Directorio de Clientes", permiso: "ventas.clientes" },
    ],
  },
  {
    id: "inventario",
    title: "3. INVENTARIO & CATÁLOGO",
    permisoGrupo: "inventario",
    items: [
      { href: "/inventario", icon: Package,     label: "Inventario Equipos", permiso: "inventario.ver" },
      { href: "/servicios",  icon: Wrench,      label: "Servicios & Mano de Obra", permiso: "inventario.ver" },
      { href: "/importar",   icon: UploadCloud, label: "Carga Masiva (CSV)", permiso: "inventario.importar" },
      {
        href: "#placeholder-kardex",
        icon: ArrowUpDown,
        label: "Kardex & Movimientos",
        badge: "PRÓX",
        permiso: "inventario.gestionar",
        isPlaceholder: true,
        placeholder: {
          title: "Kardex y Trazabilidad de Almacén",
          description: "Historial auditable de entradas por compra, salidas a proyectos técnicos, devoluciones y ajustes por merma.",
          icon: ArrowUpDown
        }
      },
      {
        href: "#placeholder-proveedores",
        icon: Truck,
        label: "Proveedores & Compras",
        badge: "PRÓX",
        permiso: "inventario.gestionar",
        isPlaceholder: true,
        placeholder: {
          title: "Directorio de Proveedores y Compras",
          description: "Control de órdenes de compra a mayoristas de tecnología, registro de facturas recibidas y cálculo automático de costo promedio.",
          icon: Truck
        }
      },
    ],
  },
  {
    id: "suscripciones",
    title: "4. SUSCRIPCIONES (MRR)",
    permisoGrupo: "inventario",
    items: [
      { href: "/suscripciones?tab=starlink", icon: Globe,  label: "Flota Starlink", permiso: "inventario.suscripciones" },
      { href: "/suscripciones?tab=activas",  icon: Repeat, label: "Spotify & Streaming", permiso: "inventario.suscripciones" },
      { href: "/suscripciones?tab=catalogo", icon: Boxes,  label: "Otras Suscripciones", permiso: "inventario.suscripciones" },
    ],
  },
  {
    id: "proyectos",
    title: "5. PROYECTOS & OPERACIONES",
    badge: "BETA",
    badgeColor: "amber",
    permisoGrupo: "proyectos",
    items: [
      { href: "/ordenes",    icon: Wrench,         label: "Órdenes de Trabajo", permiso: "proyectos.ver_propias" },
      { href: "/cuadrillas", icon: HardHat,        label: "Cuadrillas & Técnicos", permiso: "proyectos.asignar_cuadrillas" },
      { href: "/materiales", icon: Boxes,          label: "Requisición de Materiales", permiso: "proyectos.materiales" },
      { href: "/agenda",     icon: Calendar,       label: "Calendario de Obras", permiso: "proyectos.agenda" },
      { href: "/actas",      icon: ClipboardCheck, label: "Actas de Entrega", permiso: "proyectos.actas" },
    ],
  },
  {
    id: "finanzas",
    title: "6. FINANZAS & TESORERÍA",
    badge: "PRÓX",
    badgeColor: "gray",
    permisoGrupo: "finanzas",
    items: [
      {
        href: "#placeholder-cuentas",
        icon: Wallet,
        label: "Cuentas, Cajas & Bancos",
        permiso: "finanzas.cajas",
        isPlaceholder: true,
        placeholder: {
          title: "Cuentas, Cajas & Bancos",
          description: "Control de flujo de caja y saldos en tiempo real de cuentas Zelle, Efectivo USD, Pago Móvil y Bancos Nacionales.",
          icon: Wallet
        }
      },
      {
        href: "#placeholder-finanzas",
        icon: BarChart3,
        label: "Resumen Financiero",
        permiso: "finanzas.dashboard",
        isPlaceholder: true,
        placeholder: {
          title: "Rentabilidad & Flujo de Caja",
          description: "Reportes automatizados de ganancias, pérdidas, costos operativos y margen neto de la empresa en USD y Bs.",
          icon: BarChart3
        }
      },
      {
        href: "#placeholder-cxc",
        icon: Clock,
        label: "Cuentas por Cobrar (CxC)",
        permiso: "finanzas.cxc",
        isPlaceholder: true,
        placeholder: {
          title: "Cobranzas & Abonos",
          description: "Gestión de facturas a crédito, plazos de pago por cliente, recordatorios de cobro y registro de abonos parciales.",
          icon: Clock
        }
      },
      {
        href: "#placeholder-cxp",
        icon: CreditCard,
        label: "Cuentas por Pagar (CxP)",
        permiso: "finanzas.dashboard",
        isPlaceholder: true,
        placeholder: {
          title: "Cuentas por Pagar & Gastos Operativos",
          description: "Gestión de viáticos, compras de insumos para obras y pagos pendientes a proveedores.",
          icon: CreditCard
        }
      },
    ],
  },
  {
    id: "soporte",
    title: "7. SOPORTE & POSTVENTA",
    badge: "NUEVO",
    badgeColor: "emerald",
    permisoGrupo: "soporte",
    items: [
      {
        href: "#placeholder-tickets",
        icon: LifeBuoy,
        label: "Tickets de Soporte",
        isPlaceholder: true,
        placeholder: {
          title: "Mesa de Ayuda & Incidencias",
          description: "Recepción y seguimiento de incidencias técnicas reportadas por clientes (CCTV sin señal, falla de enlace Starlink, etc.) con SLA de atención.",
          icon: LifeBuoy
        }
      },
      {
        href: "#placeholder-garantias",
        icon: ShieldCheck,
        label: "Garantías & Seriales",
        isPlaceholder: true,
        placeholder: {
          title: "Trazabilidad de Garantías",
          description: "Registro de números de serie instalados por cliente y comprobación rápida de validez de garantías técnicas.",
          icon: ShieldCheck
        }
      },
      {
        href: "#placeholder-wiki",
        icon: BookOpen,
        label: "Base de Conocimiento",
        isPlaceholder: true,
        placeholder: {
          title: "Wikis & Procedimientos Técnicos",
          description: "Manuales rápidos de configuración para técnicos: diagramas de conexión, configuración de DVRs y parametrización de routers.",
          icon: BookOpen
        }
      },
    ],
  },
  {
    id: "marketing",
    title: "8. MARKETING & LEADS",
    badge: "NUEVO",
    badgeColor: "emerald",
    permisoGrupo: "marketing",
    items: [
      {
        href: "#placeholder-leads",
        icon: Megaphone,
        label: "Solicitudes Web Landing",
        isPlaceholder: true,
        placeholder: {
          title: "Bandeja de Leads Web",
          description: "Captura en tiempo real de los clientes potenciales que rellenan el formulario de asesoría en somostecnosmart.com.",
          icon: Megaphone
        }
      },
      {
        href: "#placeholder-resend",
        icon: Send,
        label: "Campañas Resend (Email)",
        isPlaceholder: true,
        placeholder: {
          title: "Campañas de Correo con Resend",
          description: "Envío automatizado de recordatorios de pago, newsletters y promociones especiales sin costo con la API de Resend.",
          icon: Send
        }
      },
      {
        href: "#placeholder-whatsapp",
        icon: MessageSquare,
        label: "Enlaces WhatsApp Business",
        isPlaceholder: true,
        placeholder: {
          title: "Generador de Enlaces WhatsApp",
          description: "Creación de enlaces inteligentes con mensajes preconfigurados para campañas en Instagram y seguimiento comercial.",
          icon: MessageSquare
        }
      },
    ],
  },
  {
    id: "configuracion",
    title: "9. CONFIGURACIÓN",
    items: [
      { href: "/menu",   icon: Settings,  label: "Centro de Ajustes" },
      { href: "/equipo", icon: UserCheck, label: "Mi Equipo & Roles", permiso: "administracion.roles" },
      { href: "/perfil", icon: UserIcon,  label: "Mi Perfil" },
    ],
  },
];

export default function NavShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const { usuario } = useUsuario();
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState("");
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [activePlaceholder, setActivePlaceholder] = useState<PlaceholderInfo | null>(null);

  // Secciones expandidas en el Sidebar Desktop
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    inicio: true,
    ventas: true,
    inventario: true,
    suscripciones: true,
    proyectos: true,
    finanzas: false,
    soporte: false,
    marketing: false,
    configuracion: true,
  });

  // Permisos efectivos del usuario activo
  const permisosUsuario: string[] = usuario?.roles?.permisos || (usuario?.rol_id === "admin" ? ["*"] : []);

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cerrar Drawer y Quick Actions automáticamente al cambiar de ruta
  useEffect(() => {
    setDrawerOpen(false);
    setQuickActionsOpen(false);
    setDrawerSearch("");
  }, [pathname, searchParams]);

  // Auto-expandir la sección correspondiente a la ruta activa
  useEffect(() => {
    for (const section of SIDEBAR_SECTIONS) {
      const match = section.items.some(it => {
        if (it.isPlaceholder) return false;
        const [cleanHref] = it.href.split("?");
        return pathname.startsWith(cleanHref);
      });
      if (match) {
        setExpandedSections(prev => ({ ...prev, [section.id]: true }));
      }
    }
  }, [pathname]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    const [pathPart, queryPart] = href.split("?");
    const pathMatches = pathname === pathPart || (pathPart !== "/dashboard" && pathname.startsWith(pathPart));
    if (!pathMatches) return false;
    if (queryPart && searchParams) {
      const currentQuery = searchParams.toString();
      return currentQuery.includes(queryPart);
    }
    return true;
  };

  const isLoginPage = pathname === "/login";

  const THEME_OPTIONS = [
    { key: "light",  icon: Sun,     label: "Claro" },
    { key: "dark",   icon: Moon,    label: "Oscuro" },
    { key: "system", icon: Monitor, label: "Automático" },
  ];

  // Acciones Rápidas para el Botón Central Flotante Móvil (+)
  const ACCIONES_RAPIDAS = [
    {
      label: "Nueva Cotización",
      desc: "Crear propuesta comercial",
      href: "/nueva",
      icon: FileEdit,
      color: "bg-red-500/10 text-[var(--ts-red)] border-red-500/20",
      permiso: "ventas.cotizar",
    },
    {
      label: "Facturación SENIAT",
      desc: "Emitir factura o venta",
      href: "/facturacion",
      icon: Receipt,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      permiso: "ventas.facturar",
    },
    {
      label: "Registrar Cliente",
      desc: "Alta de contacto o empresa",
      href: "/clientes",
      icon: Users,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      permiso: "ventas.clientes",
    },
    {
      label: "Orden de Trabajo",
      desc: "Crear misión técnica",
      href: "/ordenes",
      icon: Wrench,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      permiso: "proyectos.crear_ordenes",
    },
    {
      label: "Consultar Stock",
      desc: "Ver precios y existencias",
      href: "/inventario",
      icon: Package,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      permiso: "inventario.ver",
    },
    {
      label: "Flota Starlink",
      desc: "Terminales y suscripciones",
      href: "/suscripciones?tab=starlink",
      icon: Globe,
      color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      permiso: "inventario.suscripciones",
    },
  ];

  const badgeStyles = (badgeColor?: string) => {
    switch (badgeColor) {
      case "amber":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800";
      case "emerald":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700";
    }
  };

  return (
    <div className={`min-h-screen bg-[var(--ts-bg)] transition-colors duration-200 ${!isLoginPage ? "pb-20 md:pb-0" : ""}`}>

      {!isLoginPage ? (
        <div className="flex min-h-screen">

          {/* ══════════════════════════════════════════════
              SIDEBAR DESKTOP (ERP MODULAR · HUB & SPOKE)
          ══════════════════════════════════════════════ */}
          <aside className="hidden md:flex flex-col w-64 bg-[var(--ts-surface)] border-r border-[var(--ts-border)] fixed top-0 bottom-0 left-0 z-40 shadow-[var(--ts-shadow)]">
            
            {/* Header del Sidebar: Logo */}
            <div className="p-4 flex items-center justify-between border-b border-[var(--ts-border)]">
              <Link href="/dashboard" className="flex items-center gap-2.5 group">
                <Image
                  src="/brands/isotipo/isotipo-rojo.png"
                  alt="TecnoSmart"
                  width={30}
                  height={30}
                  className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
                />
                <div className="flex flex-col leading-none">
                  <div className="flex items-center gap-1">
                    <span className="font-black text-sm tracking-tight text-[var(--ts-text-primary)]">
                      Tecno<span className="text-[var(--ts-red)]">Smart</span>
                    </span>
                    <span className="bg-[var(--ts-red-subtle)] text-[var(--ts-red)] px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ml-1">
                      ERP
                    </span>
                  </div>
                  <span className="text-[9px] text-[var(--ts-text-muted)] font-semibold mt-0.5">Venezuela</span>
                </div>
              </Link>
            </div>

            {/* Botón CTA Superior: + Nueva Cotización */}
            {tienePermiso(permisosUsuario, "ventas.cotizar") && (
              <div className="p-3 pb-2">
                <Link
                  href="/nueva"
                  className="w-full flex items-center justify-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Cotización</span>
                </Link>
              </div>
            )}

            {/* Navegación Modular por Categorías (Acordeón ERP) */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5 scrollbar-thin">
              {SIDEBAR_SECTIONS.map((section) => {
                const itemsVisibles = section.items.filter((item) => {
                  if (!item.permiso) return true;
                  return tienePermiso(permisosUsuario, item.permiso);
                });

                if (itemsVisibles.length === 0) return null;

                const isExpanded = expandedSections[section.id] ?? true;
                const sectionHasActive = itemsVisibles.some(it => !it.isPlaceholder && isActive(it.href));

                return (
                  <div key={section.id} className="rounded-xl transition-colors">
                    {/* Header de Categoría Clicable para Colapsar/Expandir */}
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-left rounded-lg hover:bg-[var(--ts-surface-2)] transition-colors group"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-[10px] font-black tracking-wider uppercase transition-colors truncate ${
                          sectionHasActive ? "text-[var(--ts-red)]" : "text-[var(--ts-text-muted)] group-hover:text-[var(--ts-text-primary)]"
                        }`}>
                          {section.title}
                        </span>
                        {section.badge && (
                          <span className={`text-[7px] font-black uppercase px-1.5 py-0.2 border rounded-full shrink-0 ${badgeStyles(section.badgeColor)}`}>
                            {section.badge}
                          </span>
                        )}
                      </div>
                      <ChevronDown className={`w-3 h-3 text-[var(--ts-text-muted)] transition-transform duration-200 shrink-0 ${
                        isExpanded ? "rotate-0" : "-rotate-90 opacity-60"
                      }`} />
                    </button>

                    {/* Sub-módulos Desplegables */}
                    {isExpanded && (
                      <div className="mt-1 space-y-0.5 pl-1 border-l-2 border-[var(--ts-border-2)] ml-2.5">
                        {itemsVisibles.map((item, itemIdx) => {
                          const Icon = item.icon;
                          const isPlaceholder = Boolean(item.isPlaceholder);
                          const active = !isPlaceholder && isActive(item.href);

                          if (isPlaceholder) {
                            return (
                              <button
                                key={itemIdx}
                                onClick={() => setActivePlaceholder(item.placeholder || null)}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)] hover:text-[var(--ts-text-primary)] transition-all text-left group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Icon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                                  <span className="truncate">{item.label}</span>
                                </div>
                                <span className="text-[7px] font-black uppercase px-1 py-0.2 rounded bg-[var(--ts-border)] text-[var(--ts-text-muted)] shrink-0 ml-1">
                                  {item.badge || "Próx"}
                                </span>
                              </button>
                            );
                          }

                          return (
                            <Link
                              key={itemIdx}
                              href={item.href}
                              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                                active
                                  ? "bg-[var(--ts-red-subtle)] text-[var(--ts-red)] font-bold shadow-xs"
                                  : "font-medium text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)] hover:text-[var(--ts-text-primary)]"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-[var(--ts-red)]" : "opacity-70"}`} />
                                <span className="truncate">{item.label}</span>
                              </div>
                              {active && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--ts-red)] shrink-0" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer del Sidebar: Perfil y Salir */}
            <div className="p-3 border-t border-[var(--ts-border)] bg-[var(--ts-surface-2)]">
              <div className="flex items-center justify-between">
                <Link
                  href="/perfil"
                  className="flex items-center gap-2.5 min-w-0 p-1 rounded-xl hover:bg-[var(--ts-surface)] transition-all flex-1 group"
                  title="Ver Mi Perfil"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden shadow-2xs"
                    style={{ backgroundColor: usuario?.roles?.color || "var(--ts-red)" }}
                  >
                    {usuario?.avatar_url ? (
                      <img src={usuario.avatar_url} alt={usuario.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <span>{usuario?.nombre ? usuario.nombre.substring(0, 2).toUpperCase() : "TS"}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--ts-text-primary)] truncate group-hover:text-[var(--ts-red)] transition-colors">
                      {usuario?.nombre || "admintecno"}
                    </p>
                    <p className="text-[10px] text-[var(--ts-text-muted)] truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{usuario?.roles?.nombre || "Admin Principal"}</span>
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="p-1.5 rounded-lg text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface)] transition-colors"
                    title="Alternar tema"
                  >
                    {mounted ? (
                      theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-[var(--ts-text-muted)] hover:text-[var(--ts-red)] hover:bg-[var(--ts-surface)] transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </aside>

          {/* ══════════════════════════════════════════════
              CONTENIDO CENTRAL CON HEADERS (DESKTOP & MÓVIL)
          ══════════════════════════════════════════════ */}
          <div className="flex-1 md:pl-64 flex flex-col min-w-0">
            
            {/* Header Móvil Superior (Sticky) */}
            <header className="flex md:hidden h-14 bg-[var(--ts-surface)] border-b border-[var(--ts-border)] px-3 items-center justify-between sticky top-0 z-30 shadow-xs">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="p-2 -ml-1 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)] rounded-xl transition-colors active:scale-95"
                  aria-label="Abrir menú de navegación"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Image
                    src="/brands/isotipo/isotipo-rojo.png"
                    alt="TecnoSmart"
                    width={28}
                    height={28}
                    className="h-6 w-auto object-contain"
                    priority
                  />
                  <span className="font-black text-sm tracking-tight text-[var(--ts-text-primary)]">
                    Tecno<span className="text-[var(--ts-red)]">Smart</span>
                  </span>
                  <span className="bg-[var(--ts-red-subtle)] text-[var(--ts-red)] px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                    ERP
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Theme Toggle rápido móvil */}
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)] rounded-xl transition-colors"
                  title="Alternar tema"
                >
                  {mounted ? (
                    theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                </button>

                {/* Avatar Perfil Móvil */}
                <Link
                  href="/perfil"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden shadow-2xs border border-[var(--ts-border)]"
                  style={{ backgroundColor: usuario?.roles?.color || "var(--ts-red)" }}
                  title="Mi Perfil"
                >
                  {usuario?.avatar_url ? (
                    <img src={usuario.avatar_url} alt={usuario.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <span>{usuario?.nombre ? usuario.nombre.substring(0, 2).toUpperCase() : "TS"}</span>
                  )}
                </Link>
              </div>
            </header>

            {/* Header Desktop Minimalista */}
            <header className="hidden md:flex h-14 bg-[var(--ts-surface)] border-b border-[var(--ts-border)] px-6 items-center justify-between sticky top-0 z-30 shadow-xs">
              <div className="flex items-center gap-2 text-xs text-[var(--ts-text-muted)] font-medium">
                <span>TecnoSmart Portal</span>
                <span>/</span>
                <span className="text-[var(--ts-text-primary)] font-bold capitalize">
                  {pathname.split("/").filter(Boolean).pop() || "Dashboard"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center gap-1.5 text-xs text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] px-2.5 py-1.5 rounded-lg hover:bg-[var(--ts-surface-2)] transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Ver Web Pública</span>
                </Link>

                <div className="h-4 w-[1px] bg-[var(--ts-border)]" />

                {/* Theme Selector Rápido */}
                <div className="flex gap-0.5 bg-[var(--ts-surface-2)] p-0.5 rounded-lg border border-[var(--ts-border)]">
                  {THEME_OPTIONS.map(({ key, icon: Icon, label }) => {
                    const isSelected = mounted && theme === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setTheme(key)}
                        title={label}
                        className={`p-1 rounded-md transition-all ${
                          isSelected ? "bg-[var(--ts-surface)] shadow-xs text-[var(--ts-red)]" : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0">
              {children}
            </main>

          </div>

        </div>
      ) : (
        /* Login directo sin Sidebar */
        <main>{children}</main>
      )}

      {/* ══════════════════════════════════════════════
          DRAWER LATERAL MÓVIL DESLIZABLE (APP MODULAR)
      ══════════════════════════════════════════════ */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop oscurecido */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Panel Deslizable */}
          <div className="relative w-80 max-w-[86vw] bg-[var(--ts-surface)] border-r border-[var(--ts-border)] z-50 flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-250">
            
            {/* Header del Drawer Móvil */}
            <div className="p-4 flex items-center justify-between border-b border-[var(--ts-border)] bg-[var(--ts-surface)]">
              <Link href="/dashboard" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2">
                <Image
                  src="/brands/isotipo/isotipo-rojo.png"
                  alt="TecnoSmart"
                  width={28}
                  height={28}
                  className="h-6 w-auto object-contain"
                />
                <span className="font-black text-sm tracking-tight text-[var(--ts-text-primary)]">
                  Tecno<span className="text-[var(--ts-red)]">Smart</span>
                </span>
                <span className="bg-[var(--ts-red-subtle)] text-[var(--ts-red)] px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                  ERP
                </span>
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)] rounded-lg transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buscador Rápido de Módulos en Móvil */}
            <div className="p-3 border-b border-[var(--ts-border)] bg-[var(--ts-surface-2)]">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-[var(--ts-text-muted)] absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  placeholder="Buscar módulo o función..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[var(--ts-border)] bg-[var(--ts-surface)] text-[var(--ts-text-primary)] placeholder:text-[var(--ts-text-muted)] focus:outline-none focus:border-[var(--ts-red)]"
                />
                {drawerSearch && (
                  <button
                    onClick={() => setDrawerSearch("")}
                    className="absolute right-2.5 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* CTA Nueva Cotización en Drawer */}
            {tienePermiso(permisosUsuario, "ventas.cotizar") && (
              <div className="p-3 pb-1">
                <Link
                  href="/nueva"
                  onClick={() => setDrawerOpen(false)}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Cotización</span>
                </Link>
              </div>
            )}

            {/* Lista Modular con Filtro */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 scrollbar-thin">
              {SIDEBAR_SECTIONS.map((section) => {
                const itemsVisibles = section.items.filter((item) => {
                  if (item.permiso && !tienePermiso(permisosUsuario, item.permiso)) return false;
                  if (!drawerSearch) return true;
                  const term = drawerSearch.toLowerCase();
                  return item.label.toLowerCase().includes(term) || section.title.toLowerCase().includes(term);
                });

                if (itemsVisibles.length === 0) return null;

                return (
                  <div key={section.id} className="bg-[var(--ts-surface-2)]/50 rounded-xl p-2 border border-[var(--ts-border)]/50">
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <span className="text-[10px] font-black tracking-wider text-[var(--ts-text-muted)] uppercase">
                        {section.title}
                      </span>
                      {section.badge && (
                        <span className={`text-[7px] font-black uppercase px-1.5 py-0.2 border rounded-full ${badgeStyles(section.badgeColor)}`}>
                          {section.badge}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {itemsVisibles.map((item, itemIdx) => {
                        const Icon = item.icon;
                        const isPlaceholder = Boolean(item.isPlaceholder);
                        const active = !isPlaceholder && isActive(item.href);

                        if (isPlaceholder) {
                          return (
                            <button
                              key={itemIdx}
                              onClick={() => {
                                setDrawerOpen(false);
                                setActivePlaceholder(item.placeholder || null);
                              }}
                              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface)] hover:text-[var(--ts-text-primary)] transition-all text-left group"
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                                <span>{item.label}</span>
                              </div>
                              <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded bg-[var(--ts-border)] text-[var(--ts-text-muted)]">
                                {item.badge || "Próx"}
                              </span>
                            </button>
                          );
                        }

                        return (
                          <Link
                            key={itemIdx}
                            href={item.href}
                            onClick={() => setDrawerOpen(false)}
                            className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-all ${
                              active
                                ? "bg-[var(--ts-red)] text-white font-bold shadow-xs"
                                : "font-medium text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface)] hover:text-[var(--ts-text-primary)]"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${active ? "text-white" : "opacity-70"}`} />
                              <span>{item.label}</span>
                            </div>
                            {active && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer del Drawer */}
            <div className="p-3 border-t border-[var(--ts-border)] bg-[var(--ts-surface-2)]">
              <div className="flex items-center justify-between">
                <Link
                  href="/perfil"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-2.5 min-w-0 p-1 rounded-xl hover:bg-[var(--ts-surface)] transition-all flex-1 group"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden shadow-2xs"
                    style={{ backgroundColor: usuario?.roles?.color || "var(--ts-red)" }}
                  >
                    {usuario?.avatar_url ? (
                      <img src={usuario.avatar_url} alt={usuario.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <span>{usuario?.nombre ? usuario.nombre.substring(0, 2).toUpperCase() : "TS"}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--ts-text-primary)] truncate group-hover:text-[var(--ts-red)] transition-colors">
                      {usuario?.nombre || "admintecno"}
                    </p>
                    <p className="text-[10px] text-[var(--ts-text-muted)] truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{usuario?.roles?.nombre || "Usuario"}</span>
                    </p>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-[var(--ts-text-muted)] hover:text-[var(--ts-red)] hover:bg-[var(--ts-surface)] transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          BOTTOM NAV MÓVIL (ERGONOMÍA CON ACCIONES RÁPIDAS)
      ══════════════════════════════════════════════ */}
      {!isLoginPage && (() => {
        const esTecnico = usuario?.rol_id === "tecnico" || (!tienePermiso(permisosUsuario, "ventas.cotizar") && tienePermiso(permisosUsuario, "proyectos.ver_propias"));

        const tab2 = esTecnico
          ? { href: "/ordenes", icon: Wrench, label: "Misiones" }
          : { href: "/crm", icon: Kanban, label: "Ventas", permiso: "ventas.crm" };

        const tab4 = esTecnico
          ? { href: "/agenda", icon: Calendar, label: "Agenda" }
          : { href: "/inventario", icon: Package, label: "Stock", permiso: "inventario.ver" };

        return (
          <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[var(--ts-surface)] border-t border-[var(--ts-border)] z-40 shadow-[var(--ts-shadow)]">
            <div className="flex items-end justify-around h-16 px-2">

              {/* Tab 1: Inicio */}
              <Link
                href="/dashboard"
                className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors"
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive("/dashboard") ? "bg-[var(--ts-red-subtle)]" : ""}`}>
                  <LayoutDashboard className={`w-5 h-5 transition-colors ${isActive("/dashboard") ? "text-[var(--ts-red)]" : "text-[var(--ts-text-muted)]"}`} />
                </div>
                <span className={`text-[9px] font-bold transition-colors ${isActive("/dashboard") ? "text-[var(--ts-red)]" : "text-[var(--ts-text-muted)]"}`}>
                  Inicio
                </span>
              </Link>

              {/* Tab 2: Ventas / Misiones */}
              <Link
                href={tab2.href}
                className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors"
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive(tab2.href) ? "bg-[var(--ts-red-subtle)]" : ""}`}>
                  <tab2.icon className={`w-5 h-5 transition-colors ${isActive(tab2.href) ? "text-[var(--ts-red)]" : "text-[var(--ts-text-muted)]"}`} />
                </div>
                <span className={`text-[9px] font-bold transition-colors ${isActive(tab2.href) ? "text-[var(--ts-red)]" : "text-[var(--ts-text-muted)]"}`}>
                  {tab2.label}
                </span>
              </Link>

              {/* Botón Central Flotante [+] (Abre Hoja de Acciones Rápidas) */}
              <div className="flex flex-col items-center justify-end flex-1 h-full pb-2.5">
                <button
                  type="button"
                  onClick={() => setQuickActionsOpen(true)}
                  className="w-[52px] h-[52px] bg-[var(--ts-red)] hover:bg-red-700 active:scale-95 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 transition-all -mt-5"
                  aria-label="Acciones Rápidas"
                >
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </button>
                <span className="text-[9px] font-black text-[var(--ts-red)] mt-0.5">Acción</span>
              </div>

              {/* Tab 4: Stock / Agenda */}
              <Link
                href={tab4.href}
                className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors"
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive(tab4.href) ? "bg-[var(--ts-red-subtle)]" : ""}`}>
                  <tab4.icon className={`w-5 h-5 transition-colors ${isActive(tab4.href) ? "text-[var(--ts-red)]" : "text-[var(--ts-text-muted)]"}`} />
                </div>
                <span className={`text-[9px] font-bold transition-colors ${isActive(tab4.href) ? "text-[var(--ts-red)]" : "text-[var(--ts-text-muted)]"}`}>
                  {tab4.label}
                </span>
              </Link>

              {/* Tab 5: Menú / Drawer */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors"
                aria-label="Abrir Menú"
              >
                <div className="p-1.5 rounded-xl">
                  <LayoutGrid className="w-5 h-5 text-[var(--ts-text-muted)]" />
                </div>
                <span className="text-[9px] font-bold text-[var(--ts-text-muted)]">
                  Módulos
                </span>
              </button>

            </div>
          </nav>
        );
      })()}

      {/* ══════════════════════════════════════════════
          ACTION SHEET: ACCIONES RÁPIDAS MÓVIL
      ══════════════════════════════════════════════ */}
      {quickActionsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            onClick={() => setQuickActionsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          <div className="relative w-full max-w-lg bg-[var(--ts-surface)] border-t border-[var(--ts-border)] rounded-t-3xl p-5 shadow-2xl z-50 animate-in slide-in-from-bottom duration-250">
            <div className="w-12 h-1 bg-[var(--ts-border)] rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[var(--ts-red)]" />
                <h3 className="text-sm font-black text-[var(--ts-text-primary)]">Acciones Rápidas</h3>
              </div>
              <button
                onClick={() => setQuickActionsOpen(false)}
                className="p-1 rounded-lg text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {ACCIONES_RAPIDAS.map((action, i) => {
                if (action.permiso && !tienePermiso(permisosUsuario, action.permiso)) return null;
                const Icon = action.icon;
                return (
                  <Link
                    key={i}
                    href={action.href}
                    onClick={() => setQuickActionsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)]/60 hover:bg-[var(--ts-surface-2)] active:scale-95 transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${action.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--ts-text-primary)] group-hover:text-[var(--ts-red)] transition-colors truncate">
                        {action.label}
                      </p>
                      <p className="text-[10px] text-[var(--ts-text-muted)] truncate">
                        {action.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MODAL ESTILO RIAL: MÓDULO EN DESARROLLO
      ══════════════════════════════════════════════ */}
      {activePlaceholder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-center">
            
            <button
              onClick={() => setActivePlaceholder(null)}
              className="absolute top-4 right-4 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icono temático */}
            <div className="w-12 h-12 rounded-full bg-[var(--ts-red-subtle)] text-[var(--ts-red)] flex items-center justify-center mx-auto mb-4">
              <activePlaceholder.icon className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-[var(--ts-text-primary)] mb-2">
              {activePlaceholder.title}
            </h3>

            <p className="text-xs text-[var(--ts-text-muted)] leading-relaxed mb-6">
              {activePlaceholder.description}
            </p>

            <button
              onClick={() => setActivePlaceholder(null)}
              className="w-full py-2.5 px-4 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-border)] border border-[var(--ts-border)] text-[var(--ts-text-primary)] text-xs font-bold rounded-xl transition-all active:scale-95"
            >
              Entendido
            </button>

          </div>
        </div>
      )}

    </div>
  );
}