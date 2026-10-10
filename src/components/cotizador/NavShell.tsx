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
  Settings, LogOut, ChevronDown, Sun, Moon, Monitor, Repeat
} from "lucide-react";

// ── Grupos de navegación Desktop ──────────────────────────────
const NAV_GROUPS = [
  {
    label: "Principal",
    links: [
      { href: "/cotizador/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Ventas",
    links: [
      { href: "/cotizador/nueva",             icon: FileEdit,  label: "Cotizar"     },
      { href: "/cotizador/facturacion",        icon: Receipt,   label: "Facturación" },
      { href: "/cotizador/historial-facturas", icon: History,   label: "Facturas"    },
    ],
  },
  {
    label: "Clientes",
    links: [
      { href: "/cotizador/crm",      icon: Kanban, label: "CRM"      },
      { href: "/cotizador/clientes", icon: Users,  label: "Clientes" },
      { href: "/cotizador/suscripciones", icon: Repeat, label: "Suscripciones" },
    ],
  },
  {
    label: "Inventario",
    links: [
      { href: "/cotizador/inventario", icon: Package,     label: "Inventario" },
      { href: "/cotizador/importar",   icon: UploadCloud, label: "Importar"   },
    ],
  },
];

// ── Bottom Nav Móvil (sin el FAB) ─────────────────────────────
const MOBILE_NAV = [
  { href: "/cotizador/dashboard", icon: LayoutDashboard, label: "Inicio"  },
  { href: "/cotizador/crm",       icon: Kanban,          label: "CRM"     },
  // [FAB en el centro]
  { href: "/cotizador/inventario",icon: Package,          label: "Stock"   },
  { href: "/cotizador/menu",      icon: LayoutGrid,       label: "Menú"    },
];

export default function NavShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { theme, setTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/cotizador/login");
  };

  const isActive = (href: string) => {
    if (href === "/cotizador/dashboard") return pathname === href || pathname === "/cotizador";
    return pathname.startsWith(href);
  };

  const isLoginPage = pathname === "/cotizador/login";

  const THEME_OPTIONS = [
    { key: "light",  icon: Sun,     label: "Claro"     },
    { key: "dark",   icon: Moon,    label: "Oscuro"    },
    { key: "system", icon: Monitor, label: "Automático" },
  ];

  return (
    <div className={`min-h-screen bg-[var(--ts-bg)] transition-colors duration-200 ${!isLoginPage ? "pb-20 md:pb-0" : ""}`}>

      {/* ══════════════════════════════════════════════
          HEADER DESKTOP
      ══════════════════════════════════════════════ */}
      {!isLoginPage && (
      <header className="hidden md:flex bg-[var(--ts-surface)] border-b border-[var(--ts-border)] px-4 lg:px-6 h-14 items-center justify-between sticky top-0 z-40 shadow-[var(--ts-shadow)]">

        {/* Logo */}
        <Link href="/cotizador/dashboard" className="flex items-center gap-2.5 shrink-0">
          <Image src="/isotipo-rojo.png" alt="TecnoSmart" width={32} height={32} className="h-8 w-auto object-contain" />
          <span className="bg-[var(--ts-red-subtle)] text-[var(--ts-red)] px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest hidden sm:block">
            Portal
          </span>
        </Link>

        {/* Nav agrupada */}
        <nav className="flex items-center gap-0.5">
          {NAV_GROUPS.map(group =>
            group.links.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive(href)
                    ? "bg-[var(--ts-red-subtle)] text-[var(--ts-red)]"
                    : "text-[var(--ts-text-muted)] hover:text-[var(--ts-red)] hover:bg-red-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </Link>
            ))
          )}
        </nav>

        {/* Derecha: CTA + Avatar */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/cotizador/nueva"
            className="hidden lg:flex items-center gap-1.5 bg-[var(--ts-red)] hover:bg-red-700 text-[var(--ts-text-primary)] text-xs font-bold px-3.5 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Nueva Cotización
          </Link>

          <Link href="/" className="text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] transition-colors p-2">
            <Globe className="w-4 h-4" />
          </Link>

          {/* Avatar con dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-[var(--ts-bg)] transition-colors border ${
                userMenuOpen ? "border-[var(--ts-border)] bg-[var(--ts-bg)]" : "border-transparent"
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-[var(--ts-red)] flex items-center justify-center text-[var(--ts-text-primary)] text-xs font-black">
                TS
              </div>
              <span className="text-xs font-semibold text-[var(--ts-text-primary)] hidden sm:block">admintecno</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[var(--ts-text-muted)] transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--ts-surface)] rounded-xl border border-[var(--ts-border)] shadow-xl py-1.5 z-50">
                <div className="px-4 py-2.5 border-b border-[var(--ts-border)]">
                  <p className="text-xs font-bold text-[var(--ts-text-primary)]">admintecno</p>
                  <p className="text-[10px] text-[var(--ts-text-muted)]">Portal TecnoSmart VZL</p>
                </div>
                
                {/* Theme Selector */}
                <div className="px-4 py-2 border-b border-[var(--ts-border)]">
                  <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase mb-1.5">Tema</p>
                  <div className="flex gap-1 bg-[var(--ts-surface-2)] p-1 rounded-lg border border-[var(--ts-border)]">
                    {THEME_OPTIONS.map(({ key, icon: Icon, label }) => (
                      <button
                        key={key}
                        onClick={() => setTheme(key)}
                        title={label}
                        className={`flex-1 flex justify-center items-center py-1.5 rounded-md transition-all ${
                          theme === key ? "bg-[var(--ts-surface)] shadow-sm text-[var(--ts-red)]" : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>

                <Link href="/cotizador/dashboard" onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)] transition-colors">
                  <Settings className="w-4 h-4 text-[var(--ts-text-muted)]" /> Ajustes
                </Link>
                <Link href="/cotizador/novedades" onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)] transition-colors">
                  <Sparkles className="w-4 h-4 text-[var(--ts-text-muted)]" /> Novedades
                </Link>
                <div className="border-t border-[var(--ts-border)] mt-1 pt-1">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-[var(--ts-red)] hover:bg-[var(--ts-red-subtle)] transition-colors">
                    <LogOut className="w-4 h-4" /> Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      )}

      {/* ══════════════════════════════════════════════
          CONTENIDO PRINCIPAL
      ══════════════════════════════════════════════ */}
      <main>{children}</main>

      {/* ══════════════════════════════════════════════
          BOTTOM NAV MÓVIL
      ══════════════════════════════════════════════ */}
      {!isLoginPage && (
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[var(--ts-surface)] border-t border-[var(--ts-border)] z-50 shadow-[var(--ts-shadow)]">
        <div className="flex items-end justify-around h-16 px-2">

          {/* Izquierda: 2 tabs */}
          {MOBILE_NAV.slice(0, 2).map(({ href, icon: Icon, label }) => {
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

          {/* FAB Central */}
          <div className="flex flex-col items-center justify-end flex-1 h-full pb-2.5">
            <Link href="/cotizador/nueva"
              className="w-13 h-13 w-[52px] h-[52px] bg-[var(--ts-red)] rounded-full flex items-center justify-center shadow-[var(--ts-shadow-lg)] hover:opacity-90 transition-all active:scale-95 -mt-5"
              aria-label="Nueva Cotización"
            >
              <Plus className="w-6 h-6 text-white" />
            </Link>
            <span className="text-[9px] font-bold text-[var(--ts-red)] mt-0.5">Nueva</span>
          </div>

          {/* Derecha: 2 tabs */}
          {MOBILE_NAV.slice(2).map(({ href, icon: Icon, label }) => {
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
    </div>
  );
}
