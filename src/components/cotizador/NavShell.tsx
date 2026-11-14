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
  BookOpen, Megaphone, Send, MessageSquare, Search, Zap,
  Calculator, AlertOctagon, PhoneCall, Radio, Eye
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
  // ── 1. PANEL PRINCIPAL ───────────────────────────────
  {
    id: "inicio",
    title: "PANEL PRINCIPAL",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard General" },
    ],
  },

  // ── 2. ÁREA DE VENTAS & FACTURACIÓN ─────────────────────
  {
    id: "ventas",
    title: "VENTAS & FACTURACIÓN",
    permisoGrupo: "ventas",
    items: [
      { href: "/crm",                icon: FileEdit, label: "Cotizaciones & CRM", permiso: "ventas.cotizar" },
      { href: "/facturacion",        icon: Receipt,  label: "Facturación",        permiso: "ventas.facturar" },
      { href: "/historial-facturas", icon: History,  label: "Historial de Facturas", permiso: "ventas.ver_global" },
      { href: "/clientes",          icon: Users,    label: "Directorio de Clientes", permiso: "ventas.clientes" },
      { href: "/suscripciones",     icon: Globe,    label: "Suscripciones (MRR)", permiso: "inventario.suscripciones" },
    ],
  },

  // ── 3. OPERACIONES TÉCNICAS & OBRAS ──────────────────
  {
    id: "proyectos",
    title: "OPERACIONES & OBRAS",
    permisoGrupo: "proyectos",
    items: [
      { href: "/ordenes",      icon: Wrench,         label: "Órdenes de Trabajo", permiso: "proyectos.ver_propias" },
      { href: "/agenda",       icon: Calendar,       label: "Calendario de Obras", permiso: "proyectos.agenda" },
      { href: "/cuadrillas",   icon: HardHat,        label: "Cuadrillas & Técnicos", permiso: "proyectos.asignar_cuadrillas" },
      { href: "/materiales",   icon: Boxes,          label: "Requisición de Materiales", permiso: "proyectos.materiales" },
      { href: "/actas",        icon: ClipboardCheck, label: "Actas de Entrega & Firma", permiso: "proyectos.actas" },
      { href: "/herramientas", icon: Calculator,     label: "Cálculos CCTV & Campo", permiso: "proyectos.ver_propias" },
    ],
  },

  // ── 4. ALMACÉN & CATÁLOGO TÉCNICO ────────────────────
  {
    id: "inventario",
    title: "ALMACÉN & CATÁLOGO",
    permisoGrupo: "inventario",
    items: [
      { href: "/inventario", icon: Package,     label: "Inventario de Equipos", permiso: "inventario.ver" },
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

  // ── 5. FINANZAS & TESORERÍA ──────────────────────────
  {
    id: "finanzas",
    title: "FINANZAS & TESORERÍA",
    badge: "ACTIVO",
    badgeColor: "emerald",
    permisoGrupo: "finanzas",
    items: [
      { href: "/finanzas?tab=resumen",     icon: BarChart3,  label: "Resumen & Tasas BCV", permiso: "finanzas.dashboard" },
      { href: "/finanzas?tab=cuentas",     icon: Wallet,     label: "Cuentas, Cajas & Bancos", permiso: "finanzas.cajas" },
      { href: "/finanzas?tab=cxc",         icon: Clock,      label: "Cuentas por Cobrar (CxC)", permiso: "finanzas.cxc" },
      { href: "/finanzas?tab=cxp",         icon: CreditCard, label: "Cuentas por Pagar (CxP)", permiso: "finanzas.cxp" },
      { href: "/finanzas?tab=movimientos", icon: ArrowUpDown,label: "Libro de Movimientos", permiso: "finanzas.dashboard" },
    ],
  },

  // ── 6. SOPORTE & POSTVENTA ───────────────────────────
  {
    id: "soporte",
    title: "SOPORTE & POSTVENTA",
    badge: "ACTIVO",
    badgeColor: "emerald",
    permisoGrupo: "soporte",
    items: [
      { href: "/soporte?tab=tickets",   icon: LifeBuoy,    label: "Mesa de Ayuda (Tickets)", permiso: "soporte.tickets" },
      { href: "/soporte?tab=garantias", icon: ShieldCheck, label: "Garantías & Seriales (1a)", permiso: "soporte.garantias" },
      { href: "/soporte?tab=wiki",      icon: BookOpen,    label: "Base de Conocimiento", permiso: "soporte.wiki" },
    ],
  },

  // ── 7. MARKETING & LEADS WEB ─────────────────────────
  {
    id: "marketing",
    title: "MARKETING & LEADS",
    badge: "ACTIVO",
    badgeColor: "emerald",
    permisoGrupo: "marketing",
    items: [
      { href: "/marketing?tab=leads",    icon: Megaphone,     label: "Bandeja de Leads Web", permiso: "marketing.leads" },
      { href: "/marketing?tab=whatsapp", icon: MessageSquare, label: "Enlaces WhatsApp UTM", permiso: "marketing.leads" },
      { href: "/marketing?tab=email",    icon: Send,          label: "Campañas Email (Resend)", permiso: "marketing.campanas" },
      { href: "/marketing?tab=funnel",   icon: BarChart3,     label: "Embudo de Conversión", permiso: "marketing.leads" },
    ],
  },

  // ── 8. ADMINISTRACIÓN & SISTEMA ───────────────────────
  {
    id: "configuracion",
    title: "ADMINISTRACIÓN",
    items: [
      { href: "/equipo", icon: UserCheck, label: "Mi Equipo & Roles", permiso: "administracion.roles" },
      { href: "/menu",   icon: Settings,  label: "Ajustes de Empresa", permiso: "administracion.configuracion" },
      { href: "/perfil", icon: UserIcon,  label: "Mi Perfil" },
    ],
  },
];

// ── Configuración Exclusiva de Navegación de Campo (tec.somostecnosmart.com) ─
const SECCIONES_TECNICO: SidebarSection[] = [
  {
    id: "operaciones_campo",
    title: "OPERACIONES EN CAMPO",
    items: [
      { href: "/ordenes",      icon: Wrench,         label: "Mis Órdenes de Trabajo" },
      { href: "/materiales",   icon: Boxes,          label: "Requisición de Materiales" },
      { href: "/actas",        icon: ClipboardCheck, label: "Actas de Entrega & Firma" },
      { href: "/agenda",       icon: Calendar,       label: "Calendario de Obras" },
      { href: "/herramientas", icon: Calculator,     label: "Cálculos CCTV & Campo" },
      { href: "/cuadrillas",   icon: HardHat,        label: "Mi Cuadrilla" },
    ],
  },
  {
    id: "catalogo_campo",
    title: "CONSULTA TÉCNICA",
    items: [
      { href: "/inventario",   icon: Package,        label: "Catálogo de Equipos" },
      { href: "/servicios",    icon: Wrench,         label: "Servicios & Mano de Obra" },
    ],
  },
  {
    id: "cuenta",
    title: "MI CUENTA",
    items: [
      { href: "/perfil",       icon: UserIcon,       label: "Mi Perfil Técnico" },
    ],
  },
];

// ── Configuración Exclusiva para Técnicos Aliados B2B (tec.somostecnosmart.com) ─
const SECCIONES_TECNICO_ALIADO: SidebarSection[] = [
  {
    id: "aliado_b2b",
    title: "PORTAL TÉCNICO ALIADO",
    items: [
      { href: "/ordenes",      icon: Wrench,         label: "Mis Obras & Clientes" },
      { href: "/herramientas", icon: Calculator,     label: "Cálculos CCTV & Campo" },
      { href: "/inventario",   icon: Package,        label: "Catálogo Mayorista (-15%)" },
      { href: "/soporte",      icon: LifeBuoy,       label: "Soporte & Garantías" },
    ],
  },
  {
    id: "cuenta",
    title: "MI CUENTA",
    items: [
      { href: "/perfil",       icon: UserIcon,       label: "Mi Perfil Aliado" },
    ],
  },
];

export default function NavShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const {
    usuario,
    usuarioReal,
    rolSimulado,
    setRolSimulado,
    esSimulando,
    loading: cargandoUsuario
  } = useUsuario();
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState("");
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [activePlaceholder, setActivePlaceholder] = useState<PlaceholderInfo | null>(null);
  const [isTecHost, setIsTecHost] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);

  // Detección de subdominio tec. (producción o tec.localhost:3000)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      setIsTecHost(host.startsWith("tec.") || host.startsWith("tec.localhost"));
    }
  }, []);

  // Secciones expandidas en el Sidebar Desktop
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    inicio: true,
    ventas: true,
    inventario: true,
    suscripciones: true,
    proyectos: true,
    operaciones_campo: true,
    catalogo_campo: true,
    cuenta: true,
    finanzas: false,
    soporte: false,
    marketing: false,
    configuracion: true,
  });

  // Permisos efectivos del usuario activo
  const permisosUsuario: string[] = usuario?.roles?.permisos || (usuario?.rol_id === "admin" ? ["*"] : []);

  // Perfil Técnico Operativo / Subdominio tec.
  const esTecnicoAliado = usuario?.rol_id === "tecnico_aliado";
  const esModoTecnico = isTecHost || esTecnicoAliado || usuario?.rol_id === "tecnico" || usuario?.rol_id === "lider_tecnico" || (!tienePermiso(permisosUsuario, "ventas.cotizar") && tienePermiso(permisosUsuario, "proyectos.ver_propias"));

  // Catálogo de secciones según contexto (Aliado B2B vs Campo Interno vs ERP Central)
  const seccionesActivas = esTecnicoAliado
    ? SECCIONES_TECNICO_ALIADO
    : esModoTecnico
    ? SECCIONES_TECNICO
    : SIDEBAR_SECTIONS;

  const esSuperAdminReal = usuarioReal?.rol_id === "admin" || (usuarioReal?.roles?.permisos || []).includes("*");

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
    for (const section of seccionesActivas) {
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
    if (href === "/crm" && pathname === "/nueva") return true;
    const [pathPart, queryPart] = href.split("?");
    const pathMatches = pathname === pathPart || (pathPart !== "/dashboard" && pathname.startsWith(pathPart));
    if (!pathMatches) return false;

    // Distinción precisa para CRM Pipeline vs Historial de Cotizaciones
    if (pathPart === "/crm") {
      const currentView = searchParams ? searchParams.get("view") : null;
      if (queryPart === "view=list") {
        return currentView === "list";
      }
      if (queryPart === "view=kanban") {
        return currentView === "kanban" || !currentView;
      }
      // Enlace general a /crm (ej: pestaña móvil "Ventas")
      return true;
    }

    // Distinción precisa para pestañas de Suscripciones
    if (pathPart === "/suscripciones") {
      const currentTab = searchParams ? searchParams.get("tab") : null;
      if (queryPart) {
        const expectedTab = queryPart.replace("tab=", "");
        if (currentTab) return currentTab === expectedTab;
        return expectedTab === "starlink";
      }
      return !currentTab || currentTab === "starlink";
    }

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
      label: "Facturación",
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
              <Link href={esModoTecnico ? "/ordenes" : "/dashboard"} className="flex items-center gap-2.5 group">
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
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ml-1 ${
                      esModoTecnico ? "bg-[var(--ts-red)] text-white" : "bg-[var(--ts-red-subtle)] text-[var(--ts-red)]"
                    }`}>
                      {esModoTecnico ? "CAMPO" : "ERP"}
                    </span>
                  </div>
                  <span className="text-[9px] text-[var(--ts-text-muted)] font-semibold mt-0.5">
                    {esModoTecnico ? "Técnicos & Obras" : "Venezuela"}
                  </span>
                </div>
              </Link>
            </div>

            {/* Botón CTA Superior: + Nueva Cotización (Solo en ERP Administrativo) */}
            {!esModoTecnico && tienePermiso(permisosUsuario, "ventas.cotizar") && (
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

            {/* Navegación Modular por Categorías (Acordeón ERP / Campo) */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5 scrollbar-thin">
              {seccionesActivas.map((section) => {
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
                  {cargandoUsuario ? (
                    <div className="space-y-1 py-1">
                      <div className="h-3 w-20 bg-[var(--ts-border)] rounded animate-pulse" />
                      <div className="h-2 w-14 bg-[var(--ts-border)]/60 rounded animate-pulse" />
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--ts-text-primary)] truncate group-hover:text-[var(--ts-red)] transition-colors">
                        {usuario?.nombre || "Usuario"}
                      </p>
                      <p className="text-[10px] text-[var(--ts-text-muted)] truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>{usuario?.roles?.nombre || "Personal"}</span>
                      </p>
                    </div>
                  )}
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="p-2 -ml-1 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)] rounded-xl transition-colors active:scale-95"
                  aria-label="Abrir menú de navegación"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <Link href={esModoTecnico ? "/ordenes" : "/dashboard"} className="flex items-center gap-1.5">
                  <Image
                    src="/brands/isotipo/isotipo-rojo.png"
                    alt="TecnoSmart"
                    width={26}
                    height={26}
                    className="h-6 w-auto object-contain"
                    priority
                  />
                  <span className="font-black text-sm tracking-tight text-[var(--ts-text-primary)]">
                    Tecno<span className="text-[var(--ts-red)]">Smart</span>
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                    esModoTecnico ? "bg-[var(--ts-red)] text-white" : "bg-[var(--ts-red-subtle)] text-[var(--ts-red)]"
                  }`}>
                    {esModoTecnico ? "CAMPO" : "ERP"}
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Botón SOS / Incidencia Operativa para Técnicos */}
                {esModoTecnico && (
                  <button
                    type="button"
                    onClick={() => setSosModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 h-8 rounded-lg bg-red-600/15 hover:bg-red-600/25 border border-red-600/40 text-red-500 font-black text-[11px] active:scale-95 transition-all shadow-xs"
                    title="SOS / Soporte a Ingeniería"
                  >
                    <AlertOctagon className="w-3.5 h-3.5 animate-pulse text-red-500" />
                    <span>SOS</span>
                  </button>
                )}

                {/* Acceso Rápido a Herramientas de Cálculo */}
                <Link
                  href="/herramientas"
                  className={`p-2 rounded-xl transition-colors ${
                    isActive("/herramientas")
                      ? "bg-[var(--ts-red-subtle)] text-[var(--ts-red)]"
                      : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)]"
                  }`}
                  title="Cálculos Técnicos CCTV"
                >
                  <Calculator className="w-4 h-4" />
                </Link>

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
                {/* CONMUTADOR / SIMULADOR DE ROLES (Exclusivo Super Admin) */}
                {esSuperAdminReal && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs transition-all ${
                    esSimulando
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-500"
                      : "bg-[var(--ts-surface-2)] border-[var(--ts-border)] text-[var(--ts-text-muted)] hover:border-[var(--ts-red)]/50"
                  }`}>
                    <Eye className={`w-3.5 h-3.5 ${esSimulando ? "animate-pulse text-amber-500" : "text-[var(--ts-red)]"}`} />
                    <span className="text-[10px] font-black uppercase tracking-wider hidden lg:inline">
                      {esSimulando ? "Simulando:" : "Vista:"}
                    </span>
                    <select
                      value={rolSimulado || "real"}
                      onChange={(e) => setRolSimulado(e.target.value === "real" ? null : e.target.value)}
                      className="bg-transparent text-xs font-bold text-[var(--ts-text-primary)] focus:outline-none cursor-pointer"
                      title="Probar cómo ve el ERP cada rol de la empresa"
                    >
                      <option value="real">Super Admin (Real)</option>
                      <option value="administrador">Administración & Finanzas</option>
                      <option value="vendedor">Asesor Comercial</option>
                      <option value="gerente">Gerente Operativo</option>
                      <option value="tecnico">Técnico Cuadrilla</option>
                      <option value="tecnico_aliado">Técnico Aliado B2B</option>
                    </select>
                    {esSimulando && (
                      <button
                        onClick={() => setRolSimulado(null)}
                        className="ml-0.5 p-0.5 rounded hover:bg-amber-500/20 text-amber-500 hover:text-white transition-colors"
                        title="Restablecer a Super Admin"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

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

            {/* Franja de Alerta de Simulación Activa */}
            {esSimulando && (
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2 text-xs font-bold flex items-center justify-between sticky top-14 z-20 shadow-md">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 animate-pulse shrink-0" />
                  <span>
                    Modo Simulación Activo: Estás navegando como <strong>{usuario?.roles?.nombre}</strong>. El menú y las rutas están restringidas a lo que este rol puede ver.
                  </span>
                </div>
                <button
                  onClick={() => setRolSimulado(null)}
                  className="bg-black/30 hover:bg-black/50 px-3 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer shrink-0"
                >
                  ✕ Salir de Simulación
                </button>
              </div>
            )}

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

            {/* Simulador de Rol en Móvil (Exclusivo Super Admin) */}
            {esSuperAdminReal && (
              <div className="px-3 pt-2">
                <div className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  esSimulando ? "bg-amber-500/15 border-amber-500/40" : "bg-[var(--ts-surface-2)] border-[var(--ts-border)]"
                }`}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Eye className={`w-3.5 h-3.5 shrink-0 ${esSimulando ? "text-amber-500 animate-pulse" : "text-[var(--ts-red)]"}`} />
                    <span className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase shrink-0">Vista:</span>
                    <select
                      value={rolSimulado || "real"}
                      onChange={(e) => setRolSimulado(e.target.value === "real" ? null : e.target.value)}
                      className="bg-transparent text-xs font-bold text-[var(--ts-text-primary)] focus:outline-none min-w-0 truncate"
                    >
                      <option value="real">Super Admin</option>
                      <option value="administrador">Administradora</option>
                      <option value="vendedor">Vendedor</option>
                      <option value="gerente">Gerente</option>
                      <option value="tecnico">Técnico Cuadrilla</option>
                      <option value="tecnico_aliado">Técnico Aliado B2B</option>
                    </select>
                  </div>
                  {esSimulando && (
                    <button
                      onClick={() => setRolSimulado(null)}
                      className="text-[10px] font-black text-amber-500 px-1.5 py-0.5 rounded bg-amber-500/20 shrink-0"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* CTA Nueva Cotización en Drawer (Solo ERP) */}
            {!esModoTecnico && tienePermiso(permisosUsuario, "ventas.cotizar") && (
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
              {seccionesActivas.map((section) => {
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
                  {cargandoUsuario ? (
                    <div className="space-y-1 py-1">
                      <div className="h-3 w-20 bg-[var(--ts-border)] rounded animate-pulse" />
                      <div className="h-2 w-14 bg-[var(--ts-border)]/60 rounded animate-pulse" />
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--ts-text-primary)] truncate group-hover:text-[var(--ts-red)] transition-colors">
                        {usuario?.nombre || "Usuario"}
                      </p>
                      <p className="text-[10px] text-[var(--ts-text-muted)] truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>{usuario?.roles?.nombre || "Personal"}</span>
                      </p>
                    </div>
                  )}
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
        if (esModoTecnico) {
          // Bottom Navigation Bar dedicada para Técnicos e Instaladores (5 accesos de campo)
          return (
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#131318]/95 backdrop-blur-md border-t border-[#22222c] z-40 shadow-2xl">
              <div className="flex items-center justify-around h-16 px-1">
                {/* 1. Misiones */}
                <Link
                  href="/ordenes"
                  className="flex flex-col items-center justify-center flex-1 h-full min-h-[48px] gap-1 transition-all active:scale-95"
                >
                  <div className={`p-1.5 rounded-xl transition-all ${isActive("/ordenes") ? "bg-[rgba(201,36,43,0.18)]" : ""}`}>
                    <Wrench className={`w-5 h-5 transition-colors ${isActive("/ordenes") ? "text-[#c9242b]" : "text-[#a5a5b2]"}`} />
                  </div>
                  <span className={`text-[10px] font-bold tracking-tight transition-colors ${isActive("/ordenes") ? "text-[#c9242b]" : "text-[#a5a5b2]"}`}>
                    Misiones
                  </span>
                </Link>

                {/* 2. Materiales */}
                <Link
                  href="/materiales"
                  className="flex flex-col items-center justify-center flex-1 h-full min-h-[48px] gap-1 transition-all active:scale-95"
                >
                  <div className={`p-1.5 rounded-xl transition-all ${isActive("/materiales") ? "bg-[rgba(201,36,43,0.18)]" : ""}`}>
                    <Boxes className={`w-5 h-5 transition-colors ${isActive("/materiales") ? "text-[#c9242b]" : "text-[#a5a5b2]"}`} />
                  </div>
                  <span className={`text-[10px] font-bold tracking-tight transition-colors ${isActive("/materiales") ? "text-[#c9242b]" : "text-[#a5a5b2]"}`}>
                    Materiales
                  </span>
                </Link>

                {/* 3. Cálculos CCTV & Campo */}
                <Link
                  href="/herramientas"
                  className="flex flex-col items-center justify-center flex-1 h-full min-h-[48px] gap-1 transition-all active:scale-95"
                >
                  <div className={`p-1.5 rounded-xl transition-all ${isActive("/herramientas") ? "bg-[rgba(201,36,43,0.18)]" : ""}`}>
                    <Calculator className={`w-5 h-5 transition-colors ${isActive("/herramientas") ? "text-[#c9242b]" : "text-[#a5a5b2]"}`} />
                  </div>
                  <span className={`text-[10px] font-bold tracking-tight transition-colors ${isActive("/herramientas") ? "text-[#c9242b]" : "text-[#a5a5b2]"}`}>
                    Cálculos
                  </span>
                </Link>

                {/* 4. Agenda */}
                <Link
                  href="/agenda"
                  className="flex flex-col items-center justify-center flex-1 h-full min-h-[48px] gap-1 transition-all active:scale-95"
                >
                  <div className={`p-1.5 rounded-xl transition-all ${isActive("/agenda") ? "bg-[rgba(201,36,43,0.18)]" : ""}`}>
                    <Calendar className={`w-5 h-5 transition-colors ${isActive("/agenda") ? "text-[#c9242b]" : "text-[#a5a5b2]"}`} />
                  </div>
                  <span className={`text-[10px] font-bold tracking-tight transition-colors ${isActive("/agenda") ? "text-[#c9242b]" : "text-[#a5a5b2]"}`}>
                    Agenda
                  </span>
                </Link>

                {/* 5. Actas */}
                <Link
                  href="/actas"
                  className="flex flex-col items-center justify-center flex-1 h-full min-h-[48px] gap-1 transition-all active:scale-95"
                >
                  <div className={`p-1.5 rounded-xl transition-all ${isActive("/actas") ? "bg-[rgba(201,36,43,0.18)]" : ""}`}>
                    <ClipboardCheck className={`w-5 h-5 transition-colors ${isActive("/actas") ? "text-[#c9242b]" : "text-[#a5a5b2]"}`} />
                  </div>
                  <span className={`text-[10px] font-bold tracking-tight transition-colors ${isActive("/actas") ? "text-[#c9242b]" : "text-[#a5a5b2]"}`}>
                    Actas
                  </span>
                </Link>
              </div>
            </nav>
          );
        }

        const tab2 = { href: "/crm", icon: Kanban, label: "Ventas", permiso: "ventas.crm" };
        const tab4 = { href: "/inventario", icon: Package, label: "Stock", permiso: "inventario.ver" };

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

              {/* Tab 2: Ventas */}
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

              {/* Tab 4: Stock */}
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

      {/* ══════════════════════════════════════════════
          MODAL SOS: ASISTENCIA TÉCNICA E INCIDENCIAS EN CAMPO
      ══════════════════════════════════════════════ */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#131318] border border-red-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center space-y-4">
            
            <button
              onClick={() => setSosModalOpen(false)}
              className="absolute top-4 right-4 text-[#a5a5b2] hover:text-white p-2 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-600/40 text-red-500 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">
                Soporte de Ingeniería en Obra
              </h3>
              <p className="text-xs text-[#a5a5b2] mt-1">
                ¿Tienes un bloqueo técnico en sitio (falta de energía, corte de cable, sin línea de vista Starlink)?
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <a
                href={`https://wa.me/584120000000?text=${encodeURIComponent(
                  `*🚨 REPORTE DE INCIDENCIA EN CAMPO - TECNOSMART VZL*\n*Técnico:* ${usuario?.nombre || "Técnico en Campo"}\n*Estado:* Bloqueo operativo en obra / Solicito asistencia técnica urgente con ingeniería.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-900/30"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp a Base de Ingenieros</span>
              </a>

              <a
                href="tel:+584120000000"
                className="w-full h-12 bg-[#22222c] hover:bg-[#2a2a36] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-[#333342] active:scale-95 transition-all"
              >
                <PhoneCall className="w-4 h-4 text-[#c9242b]" />
                <span>Llamada Directa a Central</span>
              </a>

              <Link
                href="/herramientas"
                onClick={() => setSosModalOpen(false)}
                className="w-full h-12 bg-[#16161f] hover:bg-[#22222c] text-[#a5a5b2] hover:text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-[#22222c] transition-all"
              >
                <Calculator className="w-4 h-4 text-[#c9242b]" />
                <span>Abrir Calculadora CCTV & Voltajes</span>
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setSosModalOpen(false)}
              className="text-[11px] font-semibold text-[#6e6e78] hover:text-white pt-2 block mx-auto"
            >
              Cerrar y volver a la misión
            </button>
          </div>
        </div>
      )}

    </div>
  );
}