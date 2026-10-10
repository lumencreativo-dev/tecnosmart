"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileEdit, Receipt, History, Kanban, Users,
  Package, UploadCloud, Sparkles, Settings,
  LogOut, ChevronRight, BarChart2, LayoutDashboard, Repeat
} from "lucide-react";

// ── Secciones del Menú (estilo Rial) ─────────────────────────
const SECCIONES = [
  {
    titulo: "Comercial",
    items: [
      { href: "/cotizador/nueva",             icon: FileEdit,        label: "Cotizar",    desc: "Nueva cotización"     },
      { href: "/cotizador/facturacion",        icon: Receipt,         label: "Facturar",   desc: "Emitir factura"       },
      { href: "/cotizador/historial-facturas", icon: History,         label: "Facturas",   desc: "Historial"            },
      { href: "/cotizador/crm",               icon: Kanban,          label: "CRM",        desc: "Pipeline de ventas"   },
    ],
  },
  {
    titulo: "Gestión",
    items: [
      { href: "/cotizador/clientes",  icon: Users,       label: "Clientes",   desc: "Directorio VIP"   },
      { href: "/cotizador/suscripciones", icon: Repeat, label: "Suscribir", desc: "Suscripciones y cobros" },
      { href: "/cotizador/inventario",icon: Package,     label: "Inventario", desc: "Stock y productos" },
      { href: "/cotizador/importar",  icon: UploadCloud, label: "Importar",   desc: "Carga masiva CSV" },
      { href: "/cotizador/dashboard", icon: BarChart2,   label: "Dashboard",  desc: "Métricas"         },
    ],
  },
  {
    titulo: "Sistema",
    items: [
      { href: "/cotizador/novedades", icon: Sparkles,         label: "Novedades",  desc: "Actualizaciones del sistema" },
      { href: "/cotizador/dashboard", icon: Settings,         label: "Ajustes",    desc: "Configuración global"        },
    ],
  },
];

export default function MenuPage() {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/cotizador/login");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--ts-bg)]">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-[var(--ts-text-primary)]">Menú</h1>
          <Link href="/cotizador/dashboard"
            className="w-9 h-9 bg-[var(--ts-surface)] rounded-full border border-[var(--ts-border)] flex items-center justify-center shadow-sm hover:bg-[var(--ts-bg)] transition-colors"
          >
            <Settings className="w-4.5 h-4.5 w-[18px] h-[18px] text-[var(--ts-text-muted)]" />
          </Link>
        </div>

        {/* ── Tarjeta de Usuario ── */}
        <div className="relative mb-6" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="w-full bg-[var(--ts-surface)] rounded-2xl border border-[var(--ts-border)] p-4 flex items-center gap-4 shadow-sm active:scale-[0.99] transition-all"
          >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9242b] to-[#8b0000] flex items-center justify-center text-[var(--ts-text-primary)] font-black text-lg shrink-0">
              TS
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-black text-[var(--ts-text-primary)]">admintecno</p>
              <p className="text-xs text-[var(--ts-text-muted)] font-medium">Portal Interno · TecnoSmart VZL C.A.</p>
            </div>
            <ChevronRight className={`w-4 h-4 text-[var(--ts-text-muted)] transition-transform ${profileOpen ? "rotate-90" : ""}`} />
          </button>

          {/* Dropdown de perfil */}
          {profileOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[var(--ts-surface)] rounded-2xl border border-[var(--ts-border)] shadow-2xl overflow-hidden z-20">
              <div className="p-2">
                <Link href="/cotizador/novedades" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--ts-bg)] transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-[var(--ts-text-muted)]" />
                  <span className="text-sm font-semibold text-[var(--ts-text-primary)]">Novedades</span>
                </Link>
                <Link href="/cotizador/dashboard" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--ts-bg)] transition-colors"
                >
                  <Settings className="w-4 h-4 text-[var(--ts-text-muted)]" />
                  <span className="text-sm font-semibold text-[var(--ts-text-primary)]">Ajustes del sistema</span>
                </Link>
                <div className="border-t border-[var(--ts-border-2)] mt-1 pt-1">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-[var(--ts-red)]" />
                    <span className="text-sm font-bold text-[var(--ts-red)]">Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Secciones ── */}
        {SECCIONES.map(seccion => (
          <div key={seccion.titulo} className="mb-6">
            <h2 className="text-xs font-black text-[#9e9e9e] uppercase tracking-widest mb-3 px-1">
              {seccion.titulo}
            </h2>

            {/* Grid de iconos */}
            <div className="grid grid-cols-4 gap-3">
              {seccion.items.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href + label}
                  href={href}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-full aspect-square bg-[var(--ts-surface)] rounded-2xl border border-[var(--ts-border)] flex items-center justify-center shadow-sm group-active:scale-95 group-hover:border-[var(--ts-red)]/30 group-hover:bg-red-50 transition-all">
                    <Icon className="w-6 h-6 text-[var(--ts-text-primary)] group-hover:text-[var(--ts-red)] transition-colors" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#555] text-center leading-tight group-hover:text-[var(--ts-red)] transition-colors">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* ── Footer branding ── */}
        <div className="text-center mt-8">
          <p className="text-[10px] text-[#c0c0c0] font-medium">
            TecnoSmart VZL C.A · RIF J-50701960-8
          </p>
          <p className="text-[9px] text-[#d0d0d0] mt-0.5">Portal Interno v1.7</p>
        </div>

      </div>
    </div>
  );
}
