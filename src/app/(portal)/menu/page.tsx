"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileEdit, Receipt, History, Kanban, Users,
  Package, UploadCloud, Sparkles, Settings,
  LogOut, ChevronRight, BarChart2, LayoutDashboard, Repeat,
  Wrench, HardHat, Boxes, Calendar, ClipboardCheck, Globe, Shield,
  Building2, Percent, CheckCircle2, Save, RefreshCw, Key,
  Mail, Cloud, ShieldCheck, Database, Layers, ArrowRight,
  LifeBuoy, Megaphone, Wallet, Search, ExternalLink, Sliders
} from "lucide-react";

import { useUsuario } from "@/hooks/useUsuario";
import { tienePermiso } from "@/lib/permissions";

// ── Catálogo de Todos los Módulos Reestructurados ──────────────
const CATALOGO_MODULOS = [
  {
    categoria: "1. Cockpit Ejecutivo",
    color: "border-red-500/30 bg-red-500/5",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard General", desc: "KPIs, facturación y operaciones del día" },
    ],
  },
  {
    categoria: "2. Ventas & Clientes",
    color: "border-blue-500/30 bg-blue-500/5",
    permiso: "ventas.cotizar",
    items: [
      { href: "/nueva",             icon: FileEdit, label: "Nueva Cotización", desc: "Wizard de presupuestos multidivisa" },
      { href: "/crm?view=list",     icon: History,  label: "Historial Cotizaciones", desc: "Seguimiento y duplicación de propuestas" },
      { href: "/facturacion",        icon: Receipt,  label: "Facturación SENIAT", desc: "Emisión fiscal y notas de entrega" },
      { href: "/historial-facturas", icon: History,  label: "Historial Facturas", desc: "Libro de ventas y retenciones" },
      { href: "/crm",               icon: Kanban,   label: "CRM Pipeline", desc: "Tablero de oportunidades comerciales" },
      { href: "/clientes",          icon: Users,    label: "Directorio Clientes", desc: "Ficha 360° y clientes frecuentes" },
    ],
  },
  {
    categoria: "3. Inventario & Catálogo",
    color: "border-purple-500/30 bg-purple-500/5",
    permiso: "inventario.ver",
    items: [
      { href: "/inventario", icon: Package,     label: "Inventario Equipos", desc: "Stock, costos, precios y márgenes" },
      { href: "/servicios",  icon: Wrench,      label: "Servicios & Mano de Obra", desc: "Tarifario de instalación y fibra" },
      { href: "/importar",   icon: UploadCloud, label: "Carga Masiva (CSV)", desc: "Actualización de listas de precios" },
    ],
  },
  {
    categoria: "4. Suscripciones (MRR)",
    color: "border-emerald-500/30 bg-emerald-500/5",
    permiso: "inventario.suscripciones",
    items: [
      { href: "/suscripciones?tab=starlink", icon: Globe,  label: "Flota Starlink", desc: "Terminales satelitales y planes" },
      { href: "/suscripciones?tab=activas",  icon: Repeat, label: "Streaming & Cuentas", desc: "Spotify y servicios digitales" },
      { href: "/suscripciones?tab=catalogo", icon: Boxes,  label: "Otras Suscripciones", desc: "Pólizas de soporte y dominios" },
    ],
  },
  {
    categoria: "5. Proyectos & Operaciones (BETA)",
    color: "border-amber-500/30 bg-amber-500/5",
    permiso: "proyectos.ver_propias",
    items: [
      { href: "/ordenes",    icon: Wrench,         label: "Órdenes de Trabajo", desc: "Misiones técnicas y asignaciones" },
      { href: "/cuadrillas", icon: HardHat,        label: "Cuadrillas & Técnicos", desc: "Líderes de obra y ayudantes" },
      { href: "/materiales", icon: Boxes,          label: "Requisición Materiales", desc: "Salidas de insumos y cable" },
      { href: "/agenda",     icon: Calendar,       label: "Calendario de Obras", desc: "Cronograma de visitas técnicas" },
      { href: "/actas",      icon: ClipboardCheck, label: "Actas de Entrega", desc: "Conformidad y firma digital" },
    ],
  },
  {
    categoria: "6. Configuración & Seguridad",
    color: "border-gray-500/30 bg-gray-500/5",
    items: [
      { href: "/equipo",     icon: Shield,         label: "Mi Equipo & Roles", desc: "Permisos granulares y usuarios" },
      { href: "/perfil",     icon: Users,          label: "Mi Perfil", desc: "Datos de acceso y contraseña" },
      { href: "/novedades",  icon: Sparkles,       label: "Novedades & Changelog", desc: "Historial de versiones del sistema" },
    ],
  },
];

// ── Jerarquías del Sistema TecnoSmart ─────────────────────────
const ROLES_JERARQUIA = [
  { nivel: "L1", nombre: "Super Admin / Dueño", badge: "Acceso Total", color: "bg-red-500/10 text-[var(--ts-red)] border-red-500/20", desc: "Control financiero absoluto, configuración de sistema y borrado." },
  { nivel: "L2", nombre: "Gerente Operativo", badge: "Operaciones", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", desc: "Gestión de obras, cotizaciones, aprobación de materiales e inventario." },
  { nivel: "L3", nombre: "Administración & Finanzas", badge: "SENIAT & Caja", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", desc: "Facturación fiscal, cobranzas, cuentas por cobrar y conciliación." },
  { nivel: "L4", nombre: "Asesor Comercial / Ventas", badge: "Comercial", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", desc: "Cotizaciones, CRM y clientes (costos de adquisición ocultos)." },
  { nivel: "L5", nombre: "Técnico Líder / Cuadrilla", badge: "Campo", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", desc: "Recepción de órdenes de trabajo, check-in, materiales y actas con firma." },
];

export default function MenuPage() {
  const router = useRouter();
  const { usuario } = useUsuario();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"configuracion" | "modulos">("configuracion");
  const [searchModulos, setSearchModulos] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState(false);

  // Permisos efectivos
  const permisosUsuario: string[] = usuario?.roles?.permisos || (usuario?.rol_id === "admin" ? ["*"] : []);
  const esAdmin = usuario?.rol_id === "admin" || permisosUsuario.includes("*");

  // Estado de Configuración del Sistema (Persistido)
  const [config, setConfig] = useState({
    razonSocial: "TecnoSmart VZL C.A",
    rif: "J-50701960-8",
    telefono: "+58 412-1234567",
    email: "ventas@somostecnosmart.com",
    direccion: "Av. Principal Tinaquillo, Cojedes / Cobertura Valencia y Carabobo",
    diasValidezCotizacion: 7,
    descuentoMaximoVentas: 15,
    alicuotaIva: 16,
    prefijoFactura: "FAC",
    prefijoNotaEntrega: "NE",
    tasaMargenPct: 0,
    modoFacturasPdf: "color", // color | monocromatico
    notaGarantiaDefault: "Garantía de instalación técnica por 90 días continuos. Equipos sujetos a garantía del fabricante (1 año en CCTV y Starlink).",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ts_sistema_config");
      if (saved) {
        setConfig(prev => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleGuardarConfig = () => {
    setGuardando(true);
    try {
      localStorage.setItem("ts_sistema_config", JSON.stringify(config));
      setMensajeGuardado(true);
      setTimeout(() => setMensajeGuardado(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--ts-bg)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-28">

        {/* ── Header Principal con Selector de Tabs ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[var(--ts-red-subtle)] text-[var(--ts-red)] rounded-xl">
                <Settings className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--ts-text-primary)]">
                Centro de Configuración & Hub
              </h1>
            </div>
            <p className="text-xs text-[var(--ts-text-muted)] mt-1">
              Parametrización global de la empresa, jerarquías de roles y catálogo del ERP.
            </p>
          </div>

          {/* Switcher de Vistas */}
          <div className="flex bg-[var(--ts-surface)] border border-[var(--ts-border)] p-1 rounded-xl shadow-xs self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("configuracion")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "configuracion"
                  ? "bg-[var(--ts-red)] text-white shadow-xs"
                  : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Configuración</span>
            </button>
            <button
              onClick={() => setActiveTab("modulos")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "modulos"
                  ? "bg-[var(--ts-red)] text-white shadow-xs"
                  : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Todos los Módulos</span>
            </button>
          </div>
        </div>

        {/* ── Tarjeta de Usuario Activo ── */}
        <div className="bg-[var(--ts-surface)] rounded-2xl border border-[var(--ts-border)] p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-base shrink-0 overflow-hidden shadow-xs"
              style={{ backgroundColor: usuario?.roles?.color || "var(--ts-red)" }}
            >
              {usuario?.avatar_url ? (
                <img src={usuario.avatar_url} alt={usuario.nombre} className="w-full h-full object-cover" />
              ) : (
                <span>{usuario?.nombre ? usuario.nombre.substring(0, 2).toUpperCase() : "TS"}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-[var(--ts-text-primary)]">{usuario?.nombre || "admintecno"}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                  Activo
                </span>
              </div>
              <p className="text-xs text-[var(--ts-text-muted)] mt-0.5">
                Rol: <strong className="text-[var(--ts-text-primary)]">{usuario?.roles?.nombre || "Administrador"}</strong> · @{usuario?.username || "usuario"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/perfil"
              className="flex-1 sm:flex-initial text-center px-3 py-2 rounded-xl border border-[var(--ts-border)] text-xs font-bold text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)] transition-colors"
            >
              Mi Perfil
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-red-500/10 text-[var(--ts-red)] text-xs font-bold hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            TAB 1: CONFIGURACIÓN INTEGRAL DEL SISTEMA
        ══════════════════════════════════════════════ */}
        {activeTab === "configuracion" && (
          <div className="space-y-6">

            {/* Aviso de feedback al guardar */}
            {mensajeGuardado && (
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Configuración de TecnoSmart actualizada correctamente.</span>
              </div>
            )}

            {/* Bloque 1: Parámetros Comerciales & Tasas */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Percent className="w-4 h-4 text-[var(--ts-red)]" />
                <h3 className="text-sm font-black text-[var(--ts-text-primary)] uppercase tracking-wider">
                  Parámetros Comerciales & Cotizaciones
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="field-label">Validez de Presupuestos (Días)</label>
                  <select
                    value={config.diasValidezCotizacion}
                    onChange={(e) => setConfig({ ...config, diasValidezCotizacion: Number(e.target.value) })}
                    className="field-input"
                  >
                    <option value={3}>3 días continuos</option>
                    <option value={5}>5 días continuos</option>
                    <option value={7}>7 días continuos (Recomendado)</option>
                    <option value={15}>15 días continuos</option>
                    <option value={30}>30 días continuos</option>
                  </select>
                  <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">Días antes de que el presupuesto expire.</p>
                </div>

                <div>
                  <label className="field-label">Descuento Comercial Máximo (%)</label>
                  <input
                    type="number"
                    value={config.descuentoMaximoVentas}
                    onChange={(e) => setConfig({ ...config, descuentoMaximoVentas: Number(e.target.value) })}
                    className="field-input"
                    min={0}
                    max={50}
                  />
                  <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">Límite para asesores antes de requerir admin.</p>
                </div>

                <div>
                  <label className="field-label">Margen sobre Tasa Oficial (%)</label>
                  <input
                    type="number"
                    value={config.tasaMargenPct}
                    onChange={(e) => setConfig({ ...config, tasaMargenPct: Number(e.target.value) })}
                    className="field-input"
                    step={0.5}
                  />
                  <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">Ajuste cambiario comercial sobre BCV.</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--ts-border)]">
                <label className="field-label">Cláusula de Garantía Predeterminada (PDF)</label>
                <textarea
                  value={config.notaGarantiaDefault}
                  onChange={(e) => setConfig({ ...config, notaGarantiaDefault: e.target.value })}
                  rows={2}
                  className="field-input resize-none"
                />
              </div>
            </div>

            {/* Bloque 2: Datos Fiscales & SENIAT */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-[var(--ts-red)]" />
                <h3 className="text-sm font-black text-[var(--ts-text-primary)] uppercase tracking-wider">
                  Datos Fiscales & Parámetros SENIAT
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="field-label">Razón Social</label>
                  <input
                    type="text"
                    value={config.razonSocial}
                    onChange={(e) => setConfig({ ...config, razonSocial: e.target.value })}
                    className="field-input font-bold"
                  />
                </div>

                <div>
                  <label className="field-label">RIF Fiscal</label>
                  <input
                    type="text"
                    value={config.rif}
                    onChange={(e) => setConfig({ ...config, rif: e.target.value })}
                    className="field-input font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="field-label">Prefijo Facturas</label>
                  <input
                    type="text"
                    value={config.prefijoFactura}
                    onChange={(e) => setConfig({ ...config, prefijoFactura: e.target.value })}
                    className="field-input uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="field-label">Alícuota IVA (%)</label>
                  <input
                    type="number"
                    value={config.alicuotaIva}
                    onChange={(e) => setConfig({ ...config, alicuotaIva: Number(e.target.value) })}
                    className="field-input font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="field-label">Teléfono Comercial</label>
                  <input
                    type="text"
                    value={config.telefono}
                    onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                    className="field-input"
                  />
                </div>

                <div>
                  <label className="field-label">Dirección Fiscal & Operativa</label>
                  <input
                    type="text"
                    value={config.direccion}
                    onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                    className="field-input"
                  />
                </div>
              </div>
            </div>

            {/* Bloque 3: Jerarquía de Roles y Control de Acceso */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--ts-red)]" />
                  <h3 className="text-sm font-black text-[var(--ts-text-primary)] uppercase tracking-wider">
                    Estructura Jerárquica de Roles
                  </h3>
                </div>

                <Link
                  href="/equipo"
                  className="flex items-center gap-1.5 text-xs font-bold text-[var(--ts-red)] hover:underline"
                >
                  <span>Administrar Usuarios & Permisos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ROLES_JERARQUIA.map((r, i) => (
                  <div key={i} className="p-3 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)]/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-[var(--ts-border)] text-[var(--ts-text-muted)]">
                        {r.nivel}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${r.color}`}>
                        {r.badge}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[var(--ts-text-primary)]">{r.nombre}</p>
                    <p className="text-[10px] text-[var(--ts-text-muted)] mt-1 leading-snug">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloque 4: Integraciones Cloud */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Cloud className="w-4 h-4 text-[var(--ts-red)]" />
                <h3 className="text-sm font-black text-[var(--ts-text-primary)] uppercase tracking-wider">
                  Infraestructura Cloud Activa
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-[var(--ts-text-primary)]">Supabase DB & Auth</p>
                      <p className="text-[10px] text-[var(--ts-text-muted)]">Postgres · Storage Activo</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                    Online
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs font-bold text-[var(--ts-text-primary)]">Resend Email</p>
                      <p className="text-[10px] text-[var(--ts-text-muted)]">3,000 envíos/mes gratis</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600">
                    Activo
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="text-xs font-bold text-[var(--ts-text-primary)]">Cloudflare + Vercel</p>
                      <p className="text-[10px] text-[var(--ts-text-muted)]">DNS, CDN & Next.js Edge</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600">
                    Protegido
                  </span>
                </div>
              </div>
            </div>

            {/* Botón de Guardado Flotante / Fijo */}
            {esAdmin && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleGuardarConfig}
                  disabled={guardando}
                  className="flex items-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 text-white font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{guardando ? "Guardando..." : "Guardar Ajustes de Sistema"}</span>
                </button>
              </div>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 2: DIRECTORIO VISUAL DE TODOS LOS MÓDULOS
        ══════════════════════════════════════════════ */}
        {activeTab === "modulos" && (
          <div className="space-y-6">

            {/* Buscador de Módulos */}
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchModulos}
                onChange={(e) => setSearchModulos(e.target.value)}
                placeholder="Filtrar cualquier módulo por nombre o descripción..."
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface)] text-[var(--ts-text-primary)] placeholder:text-[var(--ts-text-muted)] focus:outline-none focus:border-[var(--ts-red)] shadow-xs"
              />
            </div>

            {/* Grid de Secciones */}
            <div className="space-y-6">
              {CATALOGO_MODULOS.map((seccion, sIdx) => {
                if (seccion.permiso && !tienePermiso(permisosUsuario, seccion.permiso)) return null;

                const itemsFiltrados = seccion.items.filter(it => {
                  if (!searchModulos) return true;
                  const term = searchModulos.toLowerCase();
                  return it.label.toLowerCase().includes(term) || it.desc.toLowerCase().includes(term);
                });

                if (itemsFiltrados.length === 0) return null;

                return (
                  <div key={sIdx} className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-xs">
                    <h3 className="text-xs font-black text-[var(--ts-text-muted)] uppercase tracking-widest mb-4">
                      {seccion.categoria}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {itemsFiltrados.map((item, itIdx) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={itIdx}
                            href={item.href}
                            className="flex items-start gap-3 p-3.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)]/60 hover:bg-[var(--ts-surface-2)] hover:border-[var(--ts-red)]/30 transition-all group"
                          >
                            <div className="p-2 rounded-lg bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[var(--ts-text-primary)] group-hover:text-[var(--ts-red)] group-hover:border-[var(--ts-red)]/30 transition-colors shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[var(--ts-text-primary)] group-hover:text-[var(--ts-red)] transition-colors truncate">
                                {item.label}
                              </p>
                              <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5 line-clamp-2">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ── Footer Branding ── */}
        <div className="text-center mt-10">
          <p className="text-[10px] text-[var(--ts-text-muted)] font-medium">
            TecnoSmart VZL C.A · RIF J-50701960-8 · Tinaquillo, Cojedes
          </p>
          <p className="text-[9px] text-[var(--ts-text-muted)]/70 mt-0.5">Portal Interno ERP Modular v3.3</p>
        </div>

      </div>
    </div>
  );
}