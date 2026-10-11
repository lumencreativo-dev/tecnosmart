"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard, FileEdit, Receipt, History,
  Kanban, Users, Package, UploadCloud,
  Sparkles, Globe, Plus, LayoutGrid,
  Settings, LogOut, ChevronDown, Sun, Moon, Monitor,
  Repeat, Wrench, Wallet, BarChart3, Clock, UserCheck, X,
  Calendar, ClipboardCheck, HardHat, Boxes, User as UserIcon
} from "lucide-react";
import { useUsuario } from "@/hooks/useUsuario";
import { supabase } from "@/lib/supabase/client";

import { GRUPOS_PERMISOS, tienePermiso } from "@/lib/permissions";

// ── Tipos ────────────────────────────────────────────────────────
interface PlaceholderInfo {
  title: string;
  description: string;
  icon: any;
}

interface SidebarItem {
  href: string;
  icon: any;
  label: string;
  permiso?: string;
  isPlaceholder?: boolean;
  placeholder?: PlaceholderInfo;
}

interface SidebarSection {
  title: string;
  permisoGrupo?: string;
  items: SidebarItem[];
}

// ── Configuración de Módulos (Sidebar ERP Desktop) ───────────────
const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: "HOME",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    title: "VENTAS & CLIENTES",
    permisoGrupo: "ventas",
    items: [
      { href: "/nueva",             icon: FileEdit,  label: "Cotizaciones",       permiso: "ventas.cotizar" },
      { href: "/facturacion",        icon: Receipt,   label: "Facturación",        permiso: "ventas.facturar" },
      { href: "/historial-facturas", icon: History,   label: "Historial Facturas", permiso: "ventas.ver_global" },
      { href: "/crm",               icon: Kanban,    label: "CRM Pipeline",       permiso: "ventas.crm" },
      { href: "/clientes",          icon: Users,     label: "Directorio Clientes",permiso: "ventas.clientes" },
    ],
  },
  {
    title: "INVENTARIO & RECURRENTES",
    permisoGrupo: "inventario",
    items: [
      { href: "/inventario",    icon: Package,     label: "Inventario Equipos", permiso: "inventario.ver" },
      { href: "/importar",      icon: UploadCloud, label: "Carga Masiva",       permiso: "inventario.importar" },
      { href: "/suscripciones", icon: Repeat,      label: "Suscripciones",      permiso: "inventario.suscripciones" },
    ],
  },
  {
    title: "PROYECTOS & OPERACIONES (PRÓX)",
    permisoGrupo: "proyectos",
    items: [
      {
        href: "#placeholder-misiones",
        icon: Wrench,
        label: "Órdenes de Trabajo",
        permiso: "proyectos.ver_propias",
        isPlaceholder: true,
        placeholder: {
          title: "Órdenes de Trabajo & Instalaciones",
          description: "La misión asignada al equipo técnico: fecha pautada con el cliente, dirección, alcance técnico (cámaras, Starlink, redes) y estado de avance.",
          icon: Wrench,
        },
      },
      {
        href: "#placeholder-cuadrillas",
        icon: HardHat,
        label: "Cuadrillas & Técnicos",
        permiso: "proyectos.asignar_cuadrillas",
        isPlaceholder: true,
        placeholder: {
          title: "Asignación de Cuadrillas",
          description: "Asignación del Técnico Líder responsable y Técnicos Ayudantes para cada obra o servicio en campo.",
          icon: HardHat,
        },
      },
      {
        href: "#placeholder-materiales",
        icon: Boxes,
        label: "Requisición de Materiales",
        permiso: "proyectos.materiales",
        isPlaceholder: true,
        placeholder: {
          title: "Requisición & Retorno de Materiales",
          description: "Control de cables, conectores, tuberías y accesorios que salen del inventario para la obra, con registro de lo que sobró.",
          icon: Boxes,
        },
      },
      {
        href: "#placeholder-agenda",
        icon: Calendar,
        label: "Calendario de Obras",
        permiso: "proyectos.agenda",
        isPlaceholder: true,
        placeholder: {
          title: "Agenda de Operaciones & Obras",
          description: "Vista de calendario semanal y mensual para coordinar fechas de instalación con clientes sin solapar cuadrillas.",
          icon: Calendar,
        },
      },
      {
        href: "#placeholder-actas",
        icon: ClipboardCheck,
        label: "Actas de Entrega",
        permiso: "proyectos.actas",
        isPlaceholder: true,
        placeholder: {
          title: "Actas de Entrega & Firma Digital",
          description: "Reporte fotográfico del trabajo concluido y firma digital del cliente en el teléfono certificando conformidad.",
          icon: ClipboardCheck,
        },
      },
    ],
  },
  {
    title: "FINANZAS (PRÓXIMAMENTE)",
    permisoGrupo: "finanzas",
    items: [
      {
        href: "#placeholder-cuentas",
        icon: Wallet,
        label: "Cuentas & Bancos",
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
        label: "Cuentas por Cobrar",
        permiso: "finanzas.cxc",
        isPlaceholder: true,
        placeholder: {
          title: "Cobranzas & Abonos",
          description: "Gestión de facturas a crédito, plazos de pago por cliente, recordatorios de cobro y registro de abonos parciales.",
          icon: Clock
        }
      },
    ],
  },
  {
    title: "CONFIGURACIÓN",
    items: [
      { href: "/perfil", icon: UserIcon,  label: "Mi Perfil" },
      { href: "/equipo", icon: UserCheck, label: "Mi Equipo & Roles", permiso: "administracion.roles" },
      { href: "/menu",   icon: Settings,  label: "Ajustes del Sistema" },
    ],
  },
];

// ── Bottom Nav Móvil ─────────────────────────────────────────────
const MOBILE_NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  { href: "/crm",       icon: Kanban,          label: "CRM",   permiso: "ventas.crm" },
  { href: "/inventario",icon: Package,         label: "Stock", permiso: "inventario.ver" },
  { href: "/menu",      icon: LayoutGrid,      label: "Menú" },
];

export default function NavShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { theme, setTheme } = useTheme();
  const { usuario } = useUsuario();
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [activePlaceholder, setActivePlaceholder] = useState<PlaceholderInfo | null>(null);

  // Permisos efectivos del usuario activo
  const permisosUsuario: string[] = usuario?.roles?.permisos || (usuario?.rol_id === "admin" ? ["*"] : []);

  // Evitar hydration mismatch asegurando renderizado de tema solo en cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    if (href === "/dashboard") return pathname === href || pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const isLoginPage = pathname === "/login";

  const THEME_OPTIONS = [
    { key: "light",  icon: Sun,     label: "Claro" },
    { key: "dark",   icon: Moon,    label: "Oscuro" },
    { key: "system", icon: Monitor, label: "Automático" },
  ];

  return (
    <div className={`min-h-screen bg-[var(--ts-bg)] transition-colors duration-200 ${!isLoginPage ? "pb-20 md:pb-0" : ""}`}>

      {!isLoginPage ? (
        <div className="flex min-h-screen">

          {/* ══════════════════════════════════════════════
              SIDEBAR DESKTOP (ERP STYLE / FINA INSPIRADO)
          ══════════════════════════════════════════════ */}
          <aside className="hidden md:flex flex-col w-64 bg-[var(--ts-surface)] border-r border-[var(--ts-border)] fixed top-0 bottom-0 left-0 z-40 shadow-[var(--ts-shadow)]">
            
            {/* Header del Sidebar: Logo */}
            <div className="p-5 flex items-center justify-between border-b border-[var(--ts-border)]">
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <Image src="/isotipo-rojo.png" alt="TecnoSmart" width={32} height={32} className="h-7 w-auto object-contain" />
                <span className="font-black text-sm tracking-tight text-[var(--ts-text-primary)]">
                  Tecno<span className="text-[var(--ts-red)]">Smart</span>
                </span>
                <span className="bg-[var(--ts-red-subtle)] text-[var(--ts-red)] px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ml-1">
                  ERP
                </span>
              </Link>
            </div>

            {/* Botón CTA Superior: + Nueva Cotización (Solo con facultad de cotizar) */}
            {tienePermiso(permisosUsuario, "ventas.cotizar") && (
              <div className="p-4 pb-2">
                <Link
                  href="/nueva"
                  className="w-full flex items-center justify-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Cotización</span>
                </Link>
              </div>
            )}

            {/* Navegación por Grupos con Control de Acceso por Permisos */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin">
              {SIDEBAR_SECTIONS.map((section, idx) => {
                // Filtrar los items accesibles según los permisos del usuario activo
                const itemsVisibles = section.items.filter((item) => {
                  if (!item.permiso) return true;
                  return tienePermiso(permisosUsuario, item.permiso);
                });

                // Si la sección no tiene ningún ítem visible para este rol, ocultar la sección completa
                if (itemsVisibles.length === 0) return null;

                return (
                  <div key={idx}>
                    <p className="px-3 text-[10px] font-black tracking-wider text-[var(--ts-text-muted)] uppercase mb-1.5 opacity-70">
                      {section.title}
                    </p>
                    <div className="space-y-0.5">
                      {itemsVisibles.map((item: any, itemIdx) => {
                        const Icon = item.icon;
                        const isPlaceholder = Boolean(item.isPlaceholder);
                        const active = !isPlaceholder && isActive(item.href);

                        if (isPlaceholder) {
                          return (
                            <button
                              key={itemIdx}
                              onClick={() => setActivePlaceholder(item.placeholder || null)}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)] hover:text-[var(--ts-text-primary)] transition-all text-left group"
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                                <span>{item.label}</span>
                              </div>
                              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-[var(--ts-border)] text-[var(--ts-text-muted)]">
                                Próx
                              </span>
                            </button>
                          );
                        }

                        return (
                          <Link
                            key={itemIdx}
                            href={item.href}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                              active
                                ? "bg-[var(--ts-red-subtle)] text-[var(--ts-red)] font-bold shadow-xs"
                                : "text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)] hover:text-[var(--ts-text-primary)]"
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${active ? "text-[var(--ts-red)]" : "opacity-70"}`} />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
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
              CONTENIDO CENTRAL CON HEADER SUPERIOR
          ══════════════════════════════════════════════ */}
          <div className="flex-1 md:pl-64 flex flex-col min-w-0">
            
            {/* Header Superior Minimalista */}
            <header className="hidden md:flex h-14 bg-[var(--ts-surface)] border-b border-[var(--ts-border)] px-6 items-center justify-between sticky top-0 z-30 shadow-xs">
              <div className="flex items-center gap-2 text-xs text-[var(--ts-text-muted)] font-medium">
                <span>TecnoSmart Portal</span>
                <span>/</span>
                <span className="text-[var(--ts-text-primary)] font-bold capitalize">
                  {pathname.split("/").pop() || "Dashboard"}
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
          BOTTOM NAV MÓVIL (ESTILO RIAL CON FAB)
      ══════════════════════════════════════════════ */}
      {!isLoginPage && (
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[var(--ts-surface)] border-t border-[var(--ts-border)] z-50 shadow-[var(--ts-shadow)]">
          <div className="flex items-end justify-around h-16 px-2">

            {/* Izquierda: tabs visibles */}
            {MOBILE_NAV.slice(0, 2).map(({ href, icon: Icon, label, permiso }: any) => {
              if (permiso && !tienePermiso(permisosUsuario, permiso)) return null;
              const active = isActive(href);
              return (
                <Link key={href} href={href}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors"
                >
                  <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-[var(--ts-red-subtle)]" : ""}`}>
                    <Icon className={`w-5 h-5 transition-colors ${active ? "text-[var(--ts-red)]" : "text-[var(--ts-text-muted)]"}`} />
                  </div>
                  <span className={`text-[9px] font-bold transition-colors ${active ? "text-[var(--ts-red)]" : "text-[var(--ts-text-muted)]"}`}>
                    {label}
                  </span>
                </Link>
              );
            })}

            {/* FAB Central (Solo con facultad de cotizar) */}
            {tienePermiso(permisosUsuario, "ventas.cotizar") ? (
              <div className="flex flex-col items-center justify-end flex-1 h-full pb-2.5">
                <Link href="/nueva"
                  className="w-[52px] h-[52px] bg-[var(--ts-red)] rounded-full flex items-center justify-center shadow-[var(--ts-shadow-lg)] hover:opacity-90 transition-all active:scale-95 -mt-5"
                  aria-label="Nueva Cotización"
                >
                  <Plus className="w-6 h-6 text-white" />
                </Link>
                <span className="text-[9px] font-bold text-[var(--ts-red)] mt-0.5">Nueva</span>
              </div>
            ) : null}

            {/* Derecha: tabs visibles */}
            {MOBILE_NAV.slice(2).map(({ href, icon: Icon, label, permiso }: any) => {
              if (permiso && !tienePermiso(permisosUsuario, permiso)) return null;
              const active = isActive(href);
              return (
                <Link key={href} href={href}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors"
                >
                  <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-[var(--ts-red-subtle)]" : ""}`}>
                    <Icon className={`w-5 h-5 transition-colors ${active ? "text-[var(--ts-red)]" : "text-[var(--ts-text-muted)]"}`} />
                  </div>
                  <span className={`text-[9px] font-bold transition-colors ${active ? "text-[var(--ts-red)]" : "text-[var(--ts-text-muted)]"}`}>
                    {label}
                  </span>
                </Link>
              );
            })}

          </div>
        </nav>
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
