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
  LifeBuoy, Megaphone, Wallet, Search, ExternalLink, Sliders, BookOpen,
  DollarSign, Truck, Download, Upload, Smartphone, Check, HelpCircle
} from "lucide-react";

import { useUsuario } from "@/hooks/useUsuario";
import { tienePermiso } from "@/lib/permissions";
import ProtectedView from "@/components/cotizador/ProtectedView";

// ── Catálogo de Todos los Módulos Reestructurados ──────────────
const CATALOGO_MODULOS = [
  {
    categoria: "Panel Principal",
    color: "border-red-500/30 bg-red-500/5",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard General", desc: "KPIs, facturación y operaciones del día" },
    ],
  },
  {
    categoria: "Comercial & Ventas",
    color: "border-blue-500/30 bg-blue-500/5",
    permiso: "ventas.cotizar",
    items: [
      { href: "/crm",                icon: FileEdit, label: "Cotizaciones & CRM", desc: "Wizard de presupuestos multidivisa y pipeline Kanban" },
      { href: "/facturacion",        icon: Receipt,  label: "Facturación SENIAT", desc: "Emisión de facturas fiscales y notas de entrega" },
      { href: "/historial-facturas", icon: History,  label: "Historial de Facturas", desc: "Libro de ventas, cobros y retenciones" },
      { href: "/clientes",          icon: Users,    label: "Directorio de Clientes", desc: "Ficha 360°, RIFs y clientes frecuentes" },
      { href: "/suscripciones",     icon: Globe,    label: "Suscripciones (MRR)", desc: "Flota Starlink, streaming y contratos recurrentes" },
    ],
  },
  {
    categoria: "Operaciones & Obras",
    color: "border-amber-500/30 bg-amber-500/5",
    permiso: "proyectos.ver_propias",
    items: [
      { href: "/ordenes",      icon: Wrench,         label: "Órdenes de Trabajo", desc: "Misiones técnicas y asignaciones en campo" },
      { href: "/agenda",       icon: Calendar,       label: "Calendario de Obras", desc: "Cronograma de visitas e instalaciones" },
      { href: "/cuadrillas",   icon: HardHat,        label: "Cuadrillas & Técnicos", desc: "Líderes de obra y ayudantes de cuadrilla" },
      { href: "/materiales",   icon: Boxes,          label: "Requisición Materiales", desc: "Salidas de insumos y cable de almacén" },
      { href: "/actas",        icon: ClipboardCheck, label: "Actas de Entrega", desc: "Conformidad, fotos de obra y firma digital" },
      { href: "/herramientas", icon: Wrench,         label: "Cálculos CCTV & Campo", desc: "Calculadora de ancho de banda y voltajes" },
    ],
  },
  {
    categoria: "Almacén & Catálogo",
    color: "border-purple-500/30 bg-purple-500/5",
    permiso: "inventario.ver",
    items: [
      { href: "/inventario", icon: Package,     label: "Inventario de Equipos", desc: "Stock, costos de compra, precios y márgenes" },
      { href: "/servicios",  icon: Wrench,      label: "Servicios & Mano de Obra", desc: "Tarifario oficial de instalación y fibra" },
      { href: "/importar",   icon: UploadCloud, label: "Carga Masiva (CSV)", desc: "Actualización de listas de precios mayoristas" },
    ],
  },
  {
    categoria: "Finanzas & Tesorería",
    color: "border-emerald-500/30 bg-emerald-500/5",
    permiso: "finanzas.dashboard",
    items: [
      { href: "/finanzas?tab=cuentas", icon: Wallet, label: "Cuentas, Cajas & Bancos", desc: "Flujo de caja Zelle, Efectivo USD, Pago Móvil y Bancos" },
      { href: "/finanzas?tab=resumen", icon: BarChart2, label: "Dashboard Financiero & BCV", desc: "Tasas oficiales, márgenes y rentabilidad neta" },
      { href: "/finanzas?tab=cxc", icon: History, label: "Cuentas por Cobrar (CxC)", desc: "Control de facturas a crédito y abonos parciales" },
      { href: "/finanzas?tab=cxp", icon: Receipt, label: "Cuentas por Pagar (CxP)", desc: "Honorarios de cuadrillas y compras a proveedores" },
    ],
  },
  {
    categoria: "Soporte & Postventa",
    color: "border-cyan-500/30 bg-cyan-500/5",
    permiso: "soporte.tickets",
    items: [
      { href: "/soporte?tab=tickets", icon: LifeBuoy, label: "Mesa de Ayuda (Tickets)", desc: "Recepción de incidencias técnicas y fallas con SLA" },
      { href: "/soporte?tab=garantias", icon: ShieldCheck, label: "Garantías & Seriales (1a)", desc: "Trazabilidad de números de serie y garantías (1 año CCTV)" },
      { href: "/soporte?tab=wiki", icon: BookOpen, label: "Base de Conocimiento", desc: "Manuales técnicos y diagramas de conexión" },
    ],
  },
  {
    categoria: "Marketing & Leads Web",
    color: "border-pink-500/30 bg-pink-500/5",
    permiso: "marketing.leads",
    items: [
      { href: "/marketing?tab=leads", icon: Megaphone, label: "Bandeja de Leads Web", desc: "Prospectos capturados desde somostecnosmart.com" },
      { href: "/marketing?tab=whatsapp", icon: Smartphone, label: "Enlaces WhatsApp UTM", desc: "Generador de enlaces con atribución publicitaria" },
      { href: "/marketing?tab=email", icon: Mail, label: "Campañas Email (Resend)", desc: "Recordatorios de mantenimiento y promociones" },
      { href: "/marketing?tab=funnel", icon: BarChart2, label: "Embudo de Conversión", desc: "Métricas de conversión de prospectos a clientes" },
    ],
  },
  {
    categoria: "Administración & Sistema",
    color: "border-gray-500/30 bg-gray-500/5",
    items: [
      { href: "/equipo",     icon: Shield,         label: "Mi Equipo & Roles", desc: "Permisos granulares y control de accesos" },
      { href: "/menu",       icon: Settings,       label: "Ajustes de Empresa", desc: "Parametrización SENIAT, IVA y cotizaciones" },
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
  { nivel: "L6", nombre: "Técnico Aliado B2B", badge: "Aliado Mayorista", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20", desc: "Instalador independiente aliado. Acceso a tec.somostecnosmart.com con precios técnicos, cálculos CCTV y comisiones de referidos." },
];

export default function MenuPage() {
  const router = useRouter();
  const { usuario, loading } = useUsuario();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"configuracion" | "modulos">("configuracion");
  const [searchModulos, setSearchModulos] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState(false);

  // Permisos efectivos
  const permisosUsuario: string[] = usuario?.roles?.permisos || (usuario?.rol_id === "admin" ? ["*"] : []);
  const esAdmin = usuario?.rol_id === "admin" || permisosUsuario.includes("*");

  // Estado de Configuración Exhaustiva del Sistema (Persistido)
  const [config, setConfig] = useState({
    // 1. Identidad & Fiscal (Datos oficiales aprobados)
    razonSocial: "TecnoSmart VZL C.A",
    rif: "J-50701960-8",
    telefono: "0412-2789273",
    emailContacto: "contacto@somostecnosmart.com",
    emailFinanzas: "contacto@somostecnosmart.com",
    emailSoporte: "soporte@somostecnosmart.com",
    direccion: "Av. Principal Tinaquillo, Cojedes / Cobertura Valencia y Carabobo",

    // 2. Políticas Comerciales & Cotizador
    diasValidezCotizacion: 7,
    descuentoMaximoVentas: 0, // Pendiente por definir por administración
    alicuotaIva: 16,
    monedaPrincipal: "USD",
    tasaMargenPct: 0,
    notaLegalCotizacion: "Presupuesto sujeto a disponibilidad de stock. Precios expresados en USD pagaderos en bolívares a la tasa oficial BCV del día de la transferencia o pago en divisas.",

    // 3. Facturación Fiscal SENIAT & Numeración
    prefijoFactura: "FAC",
    correlativoFactura: 1,
    prefijoNotaEntrega: "NE",
    correlativoNotaEntrega: 1,
    modoFacturasPdf: "color", // color | monocromatico
    notaGarantiaDefault: "Garantía de 1 año en cámaras. Soporte personalizado de lunes a viernes en horario de oficina.",

    // 4. Operaciones en Campo & Viáticos (Pendientes por definir con cifras reales)
    tarifaViaticoLocalUSD: 0,
    tarifaViaticoForaneoUSD: 0,
    porcentajeComisionCuadrilla: 0,
    requiereFirmaActaObligatoria: true,
    horarioAtencion: "Lunes a Viernes en horario de oficina",

    // 5. Programa Técnicos Aliados (B2B)
    descuentoTecnicoMayoristaPct: 0,
    comisionReferidoPct: 0,
    portalTecnicosUrl: "https://tec.somostecnosmart.com",

    // 6. Conectividad & APIs
    whatsappOficial: "0412-2789273",
    dominioResend: "somostecnosmart.com",
    estadoSupabase: "Conectado",
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

  const handleExportarBackup = () => {
    const backupData = {
      config,
      exportadoEn: new Date().toISOString(),
      version: "3.3",
      empresa: "TecnoSmart VZL C.A",
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tecnosmart_config_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestaurarBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.config) {
          setConfig(prev => ({ ...prev, ...parsed.config }));
          localStorage.setItem("ts_sistema_config", JSON.stringify(parsed.config));
        } else {
          setConfig(prev => ({ ...prev, ...parsed }));
          localStorage.setItem("ts_sistema_config", JSON.stringify(parsed));
        }
        setMensajeGuardado(true);
        setTimeout(() => setMensajeGuardado(false), 3000);
      } catch (err) {
        alert("Archivo de configuración no válido.");
      }
    };
    reader.readAsText(file);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <ProtectedView
      permiso="administracion.configuracion"
      modulo="Centro de Configuración & Ajustes"
    >
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
              Parametrización global de la empresa, políticas comerciales, SENIAT, operaciones y catálogo del ERP.
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
              <span>Configuración General</span>
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
              <span>Directorio de Módulos</span>
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
            {loading ? (
              <div className="space-y-1.5 py-1">
                <div className="h-4 w-32 bg-[var(--ts-border)] rounded animate-pulse" />
                <div className="h-3 w-40 bg-[var(--ts-border)]/60 rounded animate-pulse" />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-[var(--ts-text-primary)]">{usuario?.nombre || "Usuario"}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    Activo
                  </span>
                </div>
                <p className="text-xs text-[var(--ts-text-muted)] mt-0.5">
                  Rol: <strong className="text-[var(--ts-text-primary)]">{usuario?.roles?.nombre || "Personal"}</strong> · @{usuario?.username || "usuario"}
                </p>
              </div>
            )}
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
                <span>Configuración de TecnoSmart actualizada y sincronizada correctamente.</span>
              </div>
            )}

            {/* ── SECCIÓN 1: IDENTIDAD & DATOS FISCALES ── */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-[var(--ts-red)]" />
                <h3 className="text-sm font-black text-[var(--ts-text-primary)] uppercase tracking-wider">
                  1. Identidad Corporativa & Datos Fiscales
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="field-label">Razón Social Oficial</label>
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
                  <label className="field-label">Teléfono / WhatsApp Central</label>
                  <input
                    type="text"
                    value={config.telefono}
                    onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                    className="field-input font-mono"
                  />
                </div>

                <div>
                  <label className="field-label">Correo Oficial de Contacto</label>
                  <input
                    type="email"
                    value={config.emailContacto}
                    onChange={(e) => setConfig({ ...config, emailContacto: e.target.value })}
                    className="field-input"
                  />
                </div>

                <div>
                  <label className="field-label">Correo de Finanzas / Pagos</label>
                  <input
                    type="email"
                    value={config.emailFinanzas}
                    onChange={(e) => setConfig({ ...config, emailFinanzas: e.target.value })}
                    className="field-input"
                  />
                </div>

                <div>
                  <label className="field-label">Correo de Soporte Técnico</label>
                  <input
                    type="email"
                    value={config.emailSoporte}
                    onChange={(e) => setConfig({ ...config, emailSoporte: e.target.value })}
                    className="field-input"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="field-label">Dirección Fiscal & Cobertura Operativa</label>
                <input
                  type="text"
                  value={config.direccion}
                  onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                  className="field-input"
                />
              </div>
            </div>

            {/* ── SECCIÓN 2: POLÍTICAS COMERCIALES & COTIZACIONES ── */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Percent className="w-4 h-4 text-[var(--ts-red)]" />
                <h3 className="text-sm font-black text-[var(--ts-text-primary)] uppercase tracking-wider">
                  2. Políticas Comerciales & Cotizador
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="field-label">Validez de Cotizaciones (Días)</label>
                  <select
                    value={config.diasValidezCotizacion}
                    onChange={(e) => setConfig({ ...config, diasValidezCotizacion: Number(e.target.value) })}
                    className="field-input font-bold"
                  >
                    <option value={3}>3 días continuos</option>
                    <option value={5}>5 días continuos</option>
                    <option value={7}>7 días continuos (Estándar)</option>
                    <option value={15}>15 días continuos</option>
                    <option value={30}>30 días continuos</option>
                  </select>
                  <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">Plazo de reserva de precios y equipos.</p>
                </div>

                <div>
                  <label className="field-label">Descuento Comercial Máximo (%)</label>
                  <input
                    type="number"
                    value={config.descuentoMaximoVentas}
                    onChange={(e) => setConfig({ ...config, descuentoMaximoVentas: Number(e.target.value) })}
                    className="field-input font-bold"
                    min={0}
                    max={50}
                  />
                  <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">Límite para asesores antes de requerir aprobación.</p>
                </div>

                <div>
                  <label className="field-label">Margen sobre Tasa BCV (%)</label>
                  <input
                    type="number"
                    value={config.tasaMargenPct}
                    onChange={(e) => setConfig({ ...config, tasaMargenPct: Number(e.target.value) })}
                    className="field-input font-bold"
                    step={0.5}
                  />
                  <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">Ajuste cambiario de seguridad sobre tasa BCV.</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="field-label">Cláusula Legal Predeterminada en Cotizaciones (PDF)</label>
                <textarea
                  value={config.notaLegalCotizacion}
                  onChange={(e) => setConfig({ ...config, notaLegalCotizacion: e.target.value })}
                  rows={2}
                  className="field-input resize-none"
                />
              </div>
            </div>

            {/* ── SECCIÓN 3: FACTURACIÓN FISCAL SENIAT & NUMERACIÓN ── */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-4 h-4 text-[var(--ts-red)]" />
                <h3 className="text-sm font-black text-[var(--ts-text-primary)] uppercase tracking-wider">
                  3. Parámetros SENIAT, Facturación & Garantías
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="field-label">Prefijo Facturas Fiscales</label>
                  <input
                    type="text"
                    value={config.prefijoFactura}
                    onChange={(e) => setConfig({ ...config, prefijoFactura: e.target.value.toUpperCase() })}
                    className="field-input font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="field-label">Correlativo Siguiente Factura</label>
                  <input
                    type="number"
                    value={config.correlativoFactura}
                    onChange={(e) => setConfig({ ...config, correlativoFactura: Number(e.target.value) })}
                    className="field-input font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="field-label">Prefijo Notas de Entrega</label>
                  <input
                    type="text"
                    value={config.prefijoNotaEntrega}
                    onChange={(e) => setConfig({ ...config, prefijoNotaEntrega: e.target.value.toUpperCase() })}
                    className="field-input font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="field-label">Alícuota IVA Vigente (%)</label>
                  <input
                    type="number"
                    value={config.alicuotaIva}
                    onChange={(e) => setConfig({ ...config, alicuotaIva: Number(e.target.value) })}
                    className="field-input font-bold"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="field-label">Cláusula Oficial de Garantía en Facturas</label>
                <textarea
                  value={config.notaGarantiaDefault}
                  onChange={(e) => setConfig({ ...config, notaGarantiaDefault: e.target.value })}
                  rows={2}
                  className="field-input resize-none"
                />
              </div>
            </div>

            {/* ── SECCIÓN 4: OPERACIONES EN CAMPO & VIÁTICOS ── */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-4 h-4 text-[var(--ts-red)]" />
                <h3 className="text-sm font-black text-[var(--ts-text-primary)] uppercase tracking-wider">
                  4. Operaciones en Campo, Cuadrillas & Viáticos
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="field-label">Viático Zona Local (Tinaquillo / Cojedes) USD</label>
                  <input
                    type="number"
                    value={config.tarifaViaticoLocalUSD}
                    onChange={(e) => setConfig({ ...config, tarifaViaticoLocalUSD: Number(e.target.value) })}
                    className="field-input font-bold"
                  />
                  <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">Cubre traslados urbanos en zona base.</p>
                </div>

                <div>
                  <label className="field-label">Viático Zona Foránea (Valencia / Caracas) USD</label>
                  <input
                    type="number"
                    value={config.tarifaViaticoForaneoUSD}
                    onChange={(e) => setConfig({ ...config, tarifaViaticoForaneoUSD: Number(e.target.value) })}
                    className="field-input font-bold"
                  />
                  <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">Combustible y peajes para obras foráneas.</p>
                </div>

                <div>
                  <label className="field-label">Comisión de Mano de Obra Cuadrilla (%)</label>
                  <input
                    type="number"
                    value={config.porcentajeComisionCuadrilla}
                    onChange={(e) => setConfig({ ...config, porcentajeComisionCuadrilla: Number(e.target.value) })}
                    className="field-input font-bold"
                  />
                  <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">% liquidado al líder técnico y ayudantes.</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="field-label">Horario de Operaciones Técnicas</label>
                <input
                  type="text"
                  value={config.horarioAtencion}
                  onChange={(e) => setConfig({ ...config, horarioAtencion: e.target.value })}
                  className="field-input"
                />
              </div>
            </div>

            {/* ── SECCIÓN 5: PROGRAMA TÉCNICOS ALIADOS B2B ── */}
            <div className="bg-[var(--ts-surface)] border border-cyan-500/20 bg-cyan-500/5 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-cyan-600" />
                  <h3 className="text-sm font-black text-[var(--ts-text-primary)] uppercase tracking-wider">
                    5. Programa de Técnicos Aliados (B2B)
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-600 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                  tec.somostecnosmart.com
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Descuento Catálogo Técnico Mayorista (%)</label>
                  <input
                    type="number"
                    value={config.descuentoTecnicoMayoristaPct}
                    onChange={(e) => setConfig({ ...config, descuentoTecnicoMayoristaPct: Number(e.target.value) })}
                    className="field-input font-bold"
                  />
                  <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">
                    Margen especial aplicado sobre precios de venta al público en el portal de técnicos.
                  </p>
                </div>

                <div>
                  <label className="field-label">Comisión por Referir Nuevos Clientes (%)</label>
                  <input
                    type="number"
                    value={config.comisionReferidoPct}
                    onChange={(e) => setConfig({ ...config, comisionReferidoPct: Number(e.target.value) })}
                    className="field-input font-bold"
                  />
                  <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">
                    Bono otorgado al técnico aliado al derivar una instalación completada con éxito.
                  </p>
                </div>
              </div>
            </div>

            {/* ── SECCIÓN 6: INFRAESTRUCTURA CLOUD & CONECTIVIDAD ── */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Cloud className="w-4 h-4 text-[var(--ts-red)]" />
                <h3 className="text-sm font-black text-[var(--ts-text-primary)] uppercase tracking-wider">
                  6. Infraestructura Cloud & Servicios Activos
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-[var(--ts-text-primary)]">Supabase Database & Auth</p>
                      <p className="text-[10px] text-[var(--ts-text-muted)]">PostgreSQL · Storage Activo</p>
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
                      <p className="text-xs font-bold text-[var(--ts-text-primary)]">Resend Email API</p>
                      <p className="text-[10px] text-[var(--ts-text-muted)]">somostecnosmart.com (DKIM)</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600">
                    Verificado
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="text-xs font-bold text-[var(--ts-text-primary)]">Cloudflare + Vercel</p>
                      <p className="text-[10px] text-[var(--ts-text-muted)]">app. y tec.somostecnosmart.com</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600">
                    Protegido
                  </span>
                </div>
              </div>
            </div>

            {/* ── SECCIÓN 7: RESPALDO & MANTENIMIENTO ── */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-[var(--ts-red)]" />
                <h3 className="text-sm font-black text-[var(--ts-text-primary)] uppercase tracking-wider">
                  7. Respaldo de Configuración & Mantenimiento
                </h3>
              </div>
              <p className="text-xs text-[var(--ts-text-muted)] mb-4">
                Exporta una copia de seguridad en formato JSON con todos los ajustes de la empresa o restaura un respaldo previo.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportarBackup}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[var(--ts-text-primary)] rounded-xl text-xs font-bold transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Exportar Respaldo JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[var(--ts-text-primary)] rounded-xl text-xs font-bold transition-colors"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Restaurar desde JSON</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleRestaurarBackup}
                  accept=".json"
                  className="hidden"
                />
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
    </ProtectedView>
  );
}
