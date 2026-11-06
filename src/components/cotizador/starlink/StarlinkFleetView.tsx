"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Download,
  Copy,
  Check,
  Eye,
  EyeOff,
  Wifi,
  Satellite,
  Lock,
  Crown,
  Calendar,
  MessageCircle,
  Edit,
  Grid,
  Table as TableIcon,
  Key,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Inbox,
  Share2,
  FileText,
  MapPin,
  Clock,
  Send,
  UserCheck,
  CheckCircle2,
  X,
  Pause,
  Play,
  Ban,
  Trash2,
} from "lucide-react";
import { formatUSD, formatFecha } from "@/lib/utils";
import {
  extractStarlinkData,
  isStarlinkSubscription,
  StarlinkMetadata,
  SolicitudStarlink,
} from "@/lib/types";
import { exportarStarlinkFichaPDF } from "@/components/pdf/StarlinkFichaPDF";
import { obtenerSolicitudesStarlink } from "@/lib/starlinkSolicitudes";
import StarlinkSolicitudAsistidaModal from "./StarlinkSolicitudAsistidaModal";
import StarlinkCockpitActivacionModal from "./StarlinkCockpitActivacionModal";
import type { Suscripcion, ServicioRecurrente } from "../SuscripcionesManager";

interface StarlinkFleetViewProps {
  suscripciones: Suscripcion[];
  servicios?: ServicioRecurrente[];
  onOpenNewStarlink: () => void;
  onSelectSuscripcion: (sub: Suscripcion) => void;
  onEditSuscripcion: (sub: Suscripcion) => void;
  onRefresh?: () => void;
  onCambiarEstado?: (id: string, nuevoEstado: "Activo" | "Suspendido" | "Cancelado") => Promise<void>;
  onEliminarSuscripcion?: (sub: Suscripcion) => void;
}

export default function StarlinkFleetView({
  suscripciones,
  servicios = [],
  onOpenNewStarlink,
  onSelectSuscripcion,
  onEditSuscripcion,
  onRefresh,
  onCambiarEstado,
  onEliminarSuscripcion,
}: StarlinkFleetViewProps) {
  // Sub-pestaña interna: Flota Activa vs Solicitudes por Activar
  const [subTab, setSubTab] = useState<"flota" | "solicitudes">("flota");

  // Estados de vista y filtros de la flota
  const [modoVista, setModoVista] = useState<"grid" | "table" | "vault">("grid");
  const [filtroRapido, setFiltroRapido] = useState<"todos" | "proximos" | "activos" | "vip" | "soporte">("todos");
  const [busqueda, setBusqueda] = useState("");
  const [copiado, setCopiado] = useState<string | null>(null);
  const [clavesVisibles, setClavesVisibles] = useState<Record<string, boolean>>({});
  const [generandoPDF, setGenerandoPDF] = useState<string | null>(null);

  // Estados para Solicitudes de Onboarding
  const [solicitudes, setSolicitudes] = useState<SolicitudStarlink[]>([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAsistidaModal, setShowAsistidaModal] = useState(false);
  const [solicitudCockpit, setSolicitudCockpit] = useState<SolicitudStarlink | null>(null);

  // Cargar solicitudes de onboarding
  const fetchSolicitudes = async () => {
    try {
      setCargandoSolicitudes(true);
      const data = await obtenerSolicitudesStarlink();
      setSolicitudes(data);
    } catch (err) {
      console.error("Error al cargar solicitudes:", err);
    } finally {
      setCargandoSolicitudes(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const solicitudesPendientes = useMemo(() => {
    return solicitudes.filter((s) => s.estado === "pendiente" || s.estado === "en_proceso");
  }, [solicitudes]);

  // Filtrar solo las suscripciones que corresponden a Starlink
  const starlinkSubs = useMemo(() => {
    return suscripciones.filter((s) => isStarlinkSubscription(s));
  }, [suscripciones]);

  // Copiar al portapapeles con feedback temporal
  const handleCopiar = (texto: string, clave: string) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    setCopiado(clave);
    setTimeout(() => setCopiado(null), 2000);
  };

  // Toggle de visibilidad de contraseñas
  const toggleClaveVisible = (id: string) => {
    setClavesVisibles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Helpers para fechas y cortes
  const hoy = new Date();
  const diaHoy = hoy.getDate();

  const getDiasParaCorte = (sub: Suscripcion, meta: StarlinkMetadata): { dias: number; proximoTexto: string; urgente: boolean } => {
    let diaCorteNum = Number(meta.dia_corte);
    if (!diaCorteNum || isNaN(diaCorteNum)) {
      if (sub.proximo_pago) {
        const d = new Date(sub.proximo_pago);
        diaCorteNum = d.getUTCDate();
      } else {
        return { dias: 99, proximoTexto: "No definido", urgente: false };
      }
    }

    let diff = diaCorteNum - diaHoy;
    if (diff < 0) {
      const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
      diff += diasEnMes;
    }

    const urgente = diff <= 7;
    const proximoTexto = diff === 0 ? "¡Corte hoy!" : diff === 1 ? "Corte mañana" : `Corte en ${diff} días (Día ${diaCorteNum})`;
    return { dias: diff, proximoTexto, urgente };
  };

  // Métricas calculadas para Starlink
  const metrics = useMemo(() => {
    const totalAntenas = starlinkSubs.length;
    let mrrTotal = 0;
    let gananciaSoporte = 0;
    let totalVip = 0;
    let cortesProximos = 0;

    starlinkSubs.forEach((s) => {
      const meta = extractStarlinkData(s);
      const monto = Number(s.monto || 0);
      mrrTotal += monto;

      if (meta.es_vip || monto <= 0) {
        totalVip++;
      } else {
        const fee = meta.fee_soporte !== undefined ? Number(meta.fee_soporte) : 10;
        gananciaSoporte += fee;
      }

      const { urgente } = getDiasParaCorte(s, meta);
      if (urgente && s.estado === "Activo") {
        cortesProximos++;
      }
    });

    return {
      totalAntenas,
      mrrTotal,
      gananciaSoporte,
      totalVip,
      cortesProximos,
    };
  }, [starlinkSubs]);

  // Suscripciones filtradas por búsqueda y filtro rápido
  const subsFiltradas = useMemo(() => {
    return starlinkSubs.filter((s) => {
      const meta = extractStarlinkData(s);
      const { urgente } = getDiasParaCorte(s, meta);

      // Filtro rápido
      if (filtroRapido === "proximos" && !urgente) return false;
      if (filtroRapido === "activos" && s.estado !== "Activo") return false;
      if (filtroRapido === "vip" && !meta.es_vip && Number(s.monto || 0) > 0) return false;
      if (filtroRapido === "soporte" && (meta.es_vip || Number(s.monto || 0) <= 0)) return false;

      // Buscador
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const clienteNom = (s.clientes?.empresa || s.clientes?.contacto || "").toLowerCase();
        const rif = (s.clientes?.rif_cedula || "").toLowerCase();
        const telefono = (s.clientes?.telefono || "").toLowerCase();
        const emailStarlink = (meta.correo_starlink || s.credenciales_usuario || "").toLowerCase();
        const ssid = (meta.wifi_ssid || "").toLowerCase();
        const serialKit = (meta.kit_serial || s.equipo_serial || "").toLowerCase();
        const plan = (meta.plan_starlink || s.servicios_recurrentes?.nombre || "").toLowerCase();

        const match =
          clienteNom.includes(q) ||
          rif.includes(q) ||
          telefono.includes(q) ||
          emailStarlink.includes(q) ||
          ssid.includes(q) ||
          serialKit.includes(q) ||
          plan.includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [starlinkSubs, filtroRapido, busqueda]);

  // Generador 1-click de Ficha PDF
  const handleDescargarPDF = async (s: Suscripcion, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setGenerandoPDF(s.id);
      const meta = extractStarlinkData(s);
      const clienteNombre = s.clientes?.empresa || s.clientes?.contacto || "Cliente";
      const montoNum = Number(s.monto || 0);
      const costoBase = Number(
        s.costo_base || (meta.fee_soporte ? montoNum - meta.fee_soporte : meta.es_vip ? montoNum : Math.max(0, montoNum - 10))
      );

      await exportarStarlinkFichaPDF({
        clienteNombre,
        clienteTelefono: s.clientes?.telefono,
        clienteEmail: s.clientes?.email,
        clienteRif: s.clientes?.rif_cedula,
        direccionInstalacion: meta.direccion_instalacion || s.clientes?.direccion || "Venezuela",
        correoStarlink: meta.correo_starlink || s.credenciales_usuario || "",
        claveStarlink: meta.clave_starlink || s.credenciales_clave || "",
        wifiSsid: meta.wifi_ssid || "Starlink",
        wifiPassword: meta.wifi_password || "Configurado en sitio",
        planNombre: meta.plan_starlink || s.servicios_recurrentes?.nombre || "Starlink Residencial Venezuela",
        estado: s.estado,
        mensualidadUSD: montoNum,
        costoBaseUSD: costoBase,
        feeSoporteUSD: meta.fee_soporte !== undefined ? meta.fee_soporte : meta.es_vip ? 0 : 10,
        esVip: meta.es_vip || false,
        diaCorte: meta.dia_corte,
        kitSerial: meta.kit_serial || s.equipo_serial || "",
        fechaEmision: new Date(),
      });
    } catch (err: any) {
      console.error("Error al generar PDF:", err);
      alert("Error al generar el PDF de Starlink: " + err.message);
    } finally {
      setGenerandoPDF(null);
    }
  };

  // WhatsApp rápido con resumen de la antena
  const handleWhatsApp = (s: Suscripcion, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const tel = s.clientes?.telefono?.replace(/[^0-9]/g, "");
    if (!tel) {
      alert("El cliente no tiene un teléfono registrado.");
      return;
    }
    const meta = extractStarlinkData(s);
    const nombre = s.clientes?.contacto || s.clientes?.empresa || "Cliente";
    const plan = meta.plan_starlink || s.servicios_recurrentes?.nombre || "Starlink";
    const diaCorte = meta.dia_corte ? `el día *${meta.dia_corte}* de cada mes` : "según ciclo oficial";
    const ssidInfo = meta.wifi_ssid ? `\n📶 *Red WiFi:* ${meta.wifi_ssid}` : "";

    const mensaje = encodeURIComponent(
      `Hola *${nombre}*, te saludamos de *TecnoSmart VZL* 🛰️.\n\nTe recordamos la información de tu servicio *Starlink* (${plan}):${ssidInfo}\n📅 *Fecha de Corte:* ${diaCorte}\n\nSi necesitas asistencia técnica o soporte, estamos a tu completa disposición por esta vía.\n\n_TecnoSmart VZL C.A. — Soluciones Tecnológicas_`
    );

    window.open(`https://wa.me/${tel}?text=${mensaje}`, "_blank");
  };

  const enlaceOnboarding = typeof window !== "undefined" ? `${window.location.origin}/onboarding/starlink` : "https://somostecnosmart.com/onboarding/starlink";

  return (
    <div className="space-y-6">
      {/* ── 1. SUB-TABS Y ACCIONES PRINCIPALES DE ONBOARDING ── */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-[var(--ts-surface)] border border-[var(--ts-border)] p-2.5 rounded-2xl shadow-sm">
        {/* Selector de Sub-Tab */}
        <div className="flex bg-[var(--ts-surface-2)] p-1 rounded-xl border border-[var(--ts-border)]">
          <button
            onClick={() => setSubTab("flota")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              subTab === "flota"
                ? "bg-[var(--ts-surface)] text-[var(--ts-text-primary)] shadow-sm"
                : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
            }`}
          >
            <Satellite className="w-4 h-4 text-[var(--ts-red)]" />
            <span>Antenas Activas</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] rounded-md font-black">
              {metrics.totalAntenas}
            </span>
          </button>

          <button
            onClick={() => setSubTab("solicitudes")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              subTab === "solicitudes"
                ? "bg-[var(--ts-surface)] text-[var(--ts-text-primary)] shadow-sm"
                : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
            }`}
          >
            <Inbox className="w-4 h-4 text-blue-400" />
            <span>Solicitudes por Activar</span>
            {solicitudesPendientes.length > 0 && (
              <span className="text-[10px] px-2 py-0.2 bg-[var(--ts-red)] text-white rounded-full font-black animate-pulse">
                {solicitudesPendientes.length}
              </span>
            )}
          </button>
        </div>

        {/* Botones de Onboarding & Activación */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowShareModal(true)}
            className="px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            title="Compartir enlace al cliente por WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>📲 Enlace Onboarding</span>
          </button>

          <button
            onClick={() => setShowAsistidaModal(true)}
            className="px-3.5 py-2 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-border)] text-[var(--ts-text-primary)] border border-[var(--ts-border)] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            title="Cargar solicitud asistida recibida por WhatsApp o en tienda"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>📝 Carga Asistida</span>
          </button>

          <button
            onClick={onOpenNewStarlink}
            className="px-4 py-2 bg-[var(--ts-red)] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            title="Registrar antena de forma directa con KIT serial"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Activación</span>
          </button>
        </div>
      </div>

      {/* ── 2. VISTA A: BANDEJA DE SOLICITUDES POR ACTIVAR ── */}
      {subTab === "solicitudes" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[var(--ts-surface)] border border-[var(--ts-border)] p-4 rounded-2xl">
            <div>
              <h3 className="text-sm font-black text-[var(--ts-text-primary)] flex items-center gap-2">
                <Inbox className="w-4 h-4 text-blue-400" />
                <span>Bandeja de Solicitudes Pendientes ({solicitudesPendientes.length})</span>
              </h3>
              <p className="text-xs text-[var(--ts-text-muted)] mt-0.5">
                Clientes que completaron el formulario web o cuyas solicitudes fueron cargadas por empleados
              </p>
            </div>

            <button
              onClick={fetchSolicitudes}
              className="text-xs text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] underline"
            >
              Refrescar lista
            </button>
          </div>

          {solicitudesPendientes.length === 0 ? (
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto stroke-1" />
              <h4 className="text-base font-bold text-[var(--ts-text-primary)]">¡Todo al día! No hay solicitudes pendientes</h4>
              <p className="text-xs text-[var(--ts-text-muted)] max-w-md mx-auto">
                Todas las antenas han sido activadas. Puedes compartir el enlace de onboarding a nuevos clientes o cargar una solicitud asistida.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartir Enlace Onboarding</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {solicitudesPendientes.map((sol) => (
                <div
                  key={sol.id}
                  className="bg-[var(--ts-surface)] border border-[var(--ts-border)] hover:border-blue-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-sm"
                >
                  <div className="space-y-3">
                    {/* Header Solicitud */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                          {sol.origen === "asistida_tienda" ? "Cargado por Tienda" : "Web Cliente"}
                        </span>
                        <h4 className="text-sm font-black text-[var(--ts-text-primary)] mt-1.5 line-clamp-1">
                          {sol.nombre_completo}
                        </h4>
                        <p className="text-[11px] text-[var(--ts-text-muted)] font-mono">{sol.cedula_rif}</p>
                      </div>

                      <span className="text-[10px] text-[var(--ts-text-muted)]">
                        {sol.created_at ? formatFecha(sol.created_at) : ""}
                      </span>
                    </div>

                    {/* Teléfono & Dirección */}
                    <div className="bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl p-2.5 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--ts-text-muted)]">Teléfono:</span>
                        <a
                          href={`https://wa.me/${sol.telefono.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>{sol.telefono}</span>
                        </a>
                      </div>

                      {sol.email && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--ts-border)]">
                          <span className="text-[var(--ts-text-muted)]">Email:</span>
                          <span className="font-mono text-[var(--ts-text-primary)] truncate max-w-[160px]">{sol.email}</span>
                        </div>
                      )}

                      {sol.kit_serial && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--ts-border)] bg-emerald-500/10 -mx-2.5 px-2.5 py-1">
                          <span className="text-emerald-400 font-bold text-[10px] uppercase">Serial / KIT:</span>
                          <span className="font-mono font-black text-emerald-300">{sol.kit_serial}</span>
                        </div>
                      )}

                      <div className="pt-1 border-t border-[var(--ts-border)]">
                        <span className="text-[10px] text-[var(--ts-text-muted)] block uppercase font-bold">Ubicación:</span>
                        <p className="text-[11px] text-[var(--ts-text-primary)] line-clamp-2 mt-0.5">{sol.direccion}</p>
                      </div>

                      {/* Documento Status */}
                      <div className="pt-1 border-t border-[var(--ts-border)] flex items-center justify-between text-[11px]">
                        <span className="text-[var(--ts-text-muted)]">Fotos Cédula:</span>
                        {sol.cedula_frontal_url ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Adjuntas
                          </span>
                        ) : (
                          <span className="text-amber-400 font-semibold">Pendiente foto</span>
                        )}
                      </div>
                    </div>

                    {/* Plan Solicitado */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[var(--ts-text-muted)]">Plan Solicitado:</span>
                      <span className="font-bold text-[var(--ts-text-primary)] bg-[var(--ts-surface-2)] px-2 py-0.5 rounded-lg border border-[var(--ts-border)]">
                        {sol.plan_deseado}
                      </span>
                    </div>
                  </div>

                  {/* Botón Cockpit */}
                  <div className="pt-2">
                    <button
                      onClick={() => setSolicitudCockpit(sol)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
                    >
                      <Satellite className="w-4 h-4" />
                      <span>⚡ Abrir Cockpit de Activación</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── 3. VISTA B: FLOTA DE ANTENAS ACTIVAS ── */
        <div className="space-y-6">
          {/* Métricas de la Flota */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--ts-text-muted)] mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Flota de Antenas</span>
                <Satellite className="w-4 h-4 text-[var(--ts-red)]" />
              </div>
              <div>
                <span className="text-2xl font-black text-[var(--ts-text-primary)]">{metrics.totalAntenas}</span>
                <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Antenas en sistema</p>
              </div>
            </div>

            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--ts-text-muted)] mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Facturación MRR</span>
                <span className="text-[11px] font-black text-emerald-500">USD</span>
              </div>
              <div>
                <span className="text-2xl font-black text-emerald-400">{formatUSD(metrics.mrrTotal)}</span>
                <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Facturado mensual</p>
              </div>
            </div>

            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--ts-text-muted)] mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Fee Soporte ($10)</span>
                <ShieldCheck className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <span className="text-2xl font-black text-blue-400">{formatUSD(metrics.gananciaSoporte)}</span>
                <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Ingreso soporte TecnoSmart</p>
              </div>
            </div>

            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--ts-text-muted)] mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Clientes VIP ($0)</span>
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <span className="text-2xl font-black text-amber-400">{metrics.totalVip}</span>
                <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Soporte exonerado</p>
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--ts-text-muted)] mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Cortes en 7 Días</span>
                <AlertTriangle className={`w-4 h-4 ${metrics.cortesProximos > 0 ? "text-amber-500 animate-pulse" : "text-[var(--ts-text-muted)]"}`} />
              </div>
              <div>
                <span className={`text-2xl font-black ${metrics.cortesProximos > 0 ? "text-amber-500" : "text-[var(--ts-text-primary)]"}`}>
                  {metrics.cortesProximos}
                </span>
                <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Próximos a vencer</p>
              </div>
            </div>
          </div>

          {/* Barra de Control de la Flota: Vistas y Búsqueda */}
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-[var(--ts-surface)] border border-[var(--ts-border)] p-3 rounded-2xl shadow-sm">
            {/* Selector de Modo de Vista */}
            <div className="flex items-center gap-1 bg-[var(--ts-surface-2)] p-1 rounded-xl border border-[var(--ts-border)] self-start lg:self-auto">
              <button
                onClick={() => setModoVista("grid")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  modoVista === "grid"
                    ? "bg-[var(--ts-surface)] text-[var(--ts-text-primary)] shadow-sm"
                    : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                }`}
                title="Vista de Tarjetas tipo Dispositivo"
              >
                <Grid className="w-3.5 h-3.5 text-[var(--ts-red)]" />
                <span>Tarjetas</span>
              </button>

              <button
                onClick={() => setModoVista("table")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  modoVista === "table"
                    ? "bg-[var(--ts-surface)] text-[var(--ts-text-primary)] shadow-sm"
                    : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                }`}
                title="Vista de Tabla Detallada"
              >
                <TableIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Tabla</span>
              </button>

              <button
                onClick={() => setModoVista("vault")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  modoVista === "vault"
                    ? "bg-[var(--ts-surface)] text-[var(--ts-text-primary)] shadow-sm"
                    : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                }`}
                title="Bóveda de Credenciales y Soporte Técnico"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Bóveda Soporte</span>
              </button>
            </div>

            {/* Buscador reactivo */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por cliente, correo Starlink, SSID o Serial KIT..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors placeholder:text-[var(--ts-text-muted)]"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filtros Rápidos (Pills) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)] shrink-0 px-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[var(--ts-red)]" /> Filtrar:
            </span>

            <button
              onClick={() => setFiltroRapido("todos")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                filtroRapido === "todos"
                  ? "bg-[var(--ts-red)] text-white border-[var(--ts-red)] shadow-sm"
                  : "bg-[var(--ts-surface)] text-[var(--ts-text-muted)] border-[var(--ts-border)] hover:text-[var(--ts-text-primary)]"
              }`}
            >
              Todas las Antenas ({starlinkSubs.length})
            </button>

            <button
              onClick={() => setFiltroRapido("proximos")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                filtroRapido === "proximos"
                  ? "bg-amber-500 text-black border-amber-500 font-black shadow-sm"
                  : "bg-[var(--ts-surface)] text-[var(--ts-text-muted)] border-[var(--ts-border)] hover:text-amber-400"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>⚠️ Cortes Próximos 7 Días ({metrics.cortesProximos})</span>
            </button>

            <button
              onClick={() => setFiltroRapido("activos")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                filtroRapido === "activos"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-[var(--ts-surface)] text-[var(--ts-text-muted)] border-[var(--ts-border)] hover:text-emerald-400"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>🟢 Activas</span>
            </button>

            <button
              onClick={() => setFiltroRapido("vip")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                filtroRapido === "vip"
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm"
                  : "bg-[var(--ts-surface)] text-[var(--ts-text-muted)] border-[var(--ts-border)] hover:text-amber-400"
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>👑 Clientes VIP ($0 Soporte) ({metrics.totalVip})</span>
            </button>

            <button
              onClick={() => setFiltroRapido("soporte")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                filtroRapido === "soporte"
                  ? "bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-sm"
                  : "bg-[var(--ts-surface)] text-[var(--ts-text-muted)] border-[var(--ts-border)] hover:text-blue-400"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>💼 Soporte TecnoSmart ($10) ({starlinkSubs.length - metrics.totalVip})</span>
            </button>
          </div>

          {/* Renderizado de Antenas (Grid / Table / Vault) */}
          {subsFiltradas.length === 0 ? (
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-12 text-center space-y-3">
              <Satellite className="w-12 h-12 text-[var(--ts-text-muted)] mx-auto stroke-1" />
              <h3 className="text-base font-bold text-[var(--ts-text-primary)]">No se encontraron antenas Starlink</h3>
              <p className="text-xs text-[var(--ts-text-muted)] max-w-md mx-auto">
                {busqueda
                  ? `No hay resultados para "${busqueda}". Prueba con otro término de búsqueda.`
                  : "Aún no hay antenas que coincidan con el filtro seleccionado."}
              </p>
            </div>
          ) : modoVista === "grid" ? (
            /* Tarjetas de Antenas */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {subsFiltradas.map((s) => {
                const meta = extractStarlinkData(s);
                const { urgente } = getDiasParaCorte(s, meta);
                const claveVisible = clavesVisibles[s.id] || false;
                const esCargandoPDF = generandoPDF === s.id;

                return (
                  <div
                    key={s.id}
                    onClick={() => onSelectSuscripcion(s)}
                    className="bg-[var(--ts-surface)] border border-[var(--ts-border)] hover:border-[var(--ts-red)]/50 rounded-2xl p-4 transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                  >
                    {meta.es_vip && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500/20 to-transparent px-3 py-1 rounded-bl-xl border-l border-b border-amber-500/30 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">VIP</span>
                      </div>
                    )}

                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-2 pr-12">
                        <div>
                          <h4 className="text-sm font-black text-[var(--ts-text-primary)] group-hover:text-[var(--ts-red)] transition-colors line-clamp-1">
                            {s.clientes?.empresa || s.clientes?.contacto || "Cliente sin nombre"}
                          </h4>
                          {s.clientes?.contacto && s.clientes?.empresa && (
                            <p className="text-[11px] text-[var(--ts-text-muted)] line-clamp-1">{s.clientes.contacto}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Satellite className="w-3 h-3 text-[var(--ts-red)]" />
                              {meta.plan_starlink || s.servicios_recurrentes?.nombre || "Starlink"}
                            </span>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                s.estado === "Activo"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : s.estado === "Suspendido"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}
                            >
                              {s.estado === "Suspendido" ? "⏸️ Pausada" : s.estado === "Cancelado" ? "⏹️ Cancelada" : s.estado}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Red WiFi Box */}
                      <div className="bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)] flex items-center gap-1">
                            <Wifi className="w-3 h-3 text-cyan-400" /> Red WiFi:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[var(--ts-text-primary)] font-mono text-[11px]">
                              {meta.wifi_ssid || "Sin SSID registrado"}
                            </span>
                            {meta.wifi_ssid && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopiar(meta.wifi_ssid!, `ssid-${s.id}`);
                                }}
                                className="p-1 hover:bg-[var(--ts-surface)] rounded text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] transition-colors"
                                title="Copiar SSID"
                              >
                                {copiado === `ssid-${s.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {meta.wifi_password && (
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--ts-border)]">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)] flex items-center gap-1">
                              <Key className="w-3 h-3 text-amber-400" /> Clave:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] text-[var(--ts-text-primary)]">
                                {claveVisible ? meta.wifi_password : "••••••••••••"}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleClaveVisible(s.id);
                                }}
                                className="p-1 hover:bg-[var(--ts-surface)] rounded text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] transition-colors"
                              >
                                {claveVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopiar(meta.wifi_password!, `wifi-${s.id}`);
                                }}
                                className="p-1 hover:bg-[var(--ts-surface)] rounded text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] transition-colors"
                                title="Copiar Clave"
                              >
                                {copiado === `wifi-${s.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Cuenta Starlink & Serial Hardware */}
                      <div className="space-y-1 text-xs">
                        {meta.correo_starlink && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[var(--ts-text-muted)]">Cuenta Starlink:</span>
                            <div className="flex items-center gap-1 max-w-[200px]">
                              <span className="font-mono text-[10px] text-[var(--ts-text-primary)] truncate" title={meta.correo_starlink}>
                                {meta.correo_starlink}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopiar(meta.correo_starlink!, `mail-${s.id}`);
                                }}
                                className="p-0.5 hover:bg-[var(--ts-surface-2)] rounded text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                              >
                                {copiado === `mail-${s.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                              </button>
                            </div>
                          </div>
                        )}

                        {meta.kit_serial && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[var(--ts-text-muted)]">Serial KIT:</span>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[10px] text-slate-300 bg-slate-900/60 px-1.5 py-0.2 rounded border border-slate-700">
                                {meta.kit_serial}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopiar(meta.kit_serial!, `kit-${s.id}`);
                                }}
                                className="p-0.5 hover:bg-[var(--ts-surface-2)] rounded text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                              >
                                {copiado === `kit-${s.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Facturación y Corte */}
                      <div className="pt-2 border-t border-[var(--ts-border)] flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-[var(--ts-text-muted)] block">Mensualidad</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-black text-emerald-400">{formatUSD(s.monto)}</span>
                            {meta.es_vip ? (
                              <span className="text-[9px] text-amber-400 font-bold">(VIP $0)</span>
                            ) : (
                              <span className="text-[9px] text-[var(--ts-text-muted)]">(+$10)</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-[var(--ts-text-muted)] block">Fecha de Corte</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                              urgente
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black animate-pulse"
                                : "bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)]"
                            }`}
                          >
                            {meta.dia_corte ? `Día ${meta.dia_corte}` : formatFecha(s.proximo_pago)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer de Acciones 1-Clic */}
                    <div className="mt-4 pt-3 border-t border-[var(--ts-border)] space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={(e) => handleDescargarPDF(s, e)}
                          disabled={esCargandoPDF}
                          className="col-span-2 flex items-center justify-center gap-1.5 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-red)] text-[var(--ts-text-primary)] hover:text-white border border-[var(--ts-border)] hover:border-[var(--ts-red)] py-1.5 px-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                          title="Descargar Ficha PDF para el Cliente"
                        >
                          <Download className={`w-3.5 h-3.5 ${esCargandoPDF ? "animate-spin" : "text-[var(--ts-red)] group-hover:text-white"}`} />
                          <span>{esCargandoPDF ? "Generando..." : "Ficha PDF"}</span>
                        </button>

                        <button
                          onClick={(e) => handleWhatsApp(s, e)}
                          className="flex items-center justify-center gap-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-600 py-1.5 px-2 rounded-xl text-xs font-bold transition-all"
                          title="Enviar WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WA</span>
                        </button>
                      </div>

                      {/* Controles de Estado (Pausar/Reactivar/Cancelar) y Eliminación */}
                      <div
                        className="flex items-center justify-between gap-1 pt-1 border-t border-[var(--ts-border)]/50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1">
                          {s.estado === "Activo" ? (
                            <button
                              onClick={() => onCambiarEstado?.(s.id, "Suspendido")}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                              title="Pausar antena por este mes"
                            >
                              <Pause className="w-3 h-3" />
                              <span>Pausar</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onCambiarEstado?.(s.id, "Activo")}
                              className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                              title="Reactivar antena"
                            >
                              <Play className="w-3 h-3" />
                              <span>Reactivar</span>
                            </button>
                          )}

                          {s.estado !== "Cancelado" && (
                            <button
                              onClick={() => onCambiarEstado?.(s.id, "Cancelado")}
                              className="px-2 py-1 bg-slate-800 hover:bg-red-500/20 text-[var(--ts-text-muted)] hover:text-red-400 border border-[var(--ts-border)] hover:border-red-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                              title="Cancelar suscripción"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Cancelar</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditSuscripcion(s)}
                            className="p-1 hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] rounded-lg transition-colors"
                            title="Editar antena"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEliminarSuscripcion?.(s)}
                            className="p-1 hover:bg-red-500/10 text-[var(--ts-text-muted)] hover:text-red-400 rounded-lg transition-colors"
                            title="Eliminar suscripción definitivamente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : modoVista === "table" ? (
            /* Tabla */
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)] text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
                    <tr>
                      <th className="py-3 px-4">Cliente / Contacto</th>
                      <th className="py-3 px-4">Plan Starlink</th>
                      <th className="py-3 px-4">Red WiFi (SSID)</th>
                      <th className="py-3 px-4">Cuenta Starlink</th>
                      <th className="py-3 px-4">Serial KIT</th>
                      <th className="py-3 px-4">Día de Corte</th>
                      <th className="py-3 px-4 text-right">Mensualidad</th>
                      <th className="py-3 px-4 text-center">Modalidad</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ts-border)]">
                    {subsFiltradas.map((s) => {
                      const meta = extractStarlinkData(s);
                      const { urgente } = getDiasParaCorte(s, meta);
                      const esCargandoPDF = generandoPDF === s.id;

                      return (
                        <tr
                          key={s.id}
                          onClick={() => onSelectSuscripcion(s)}
                          className="hover:bg-[var(--ts-surface-2)]/60 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4">
                            <p className="font-bold text-[var(--ts-text-primary)]">
                              {s.clientes?.empresa || s.clientes?.contacto || "Sin nombre"}
                            </p>
                            {s.clientes?.rif_cedula && (
                              <p className="text-[10px] text-[var(--ts-text-muted)]">RIF: {s.clientes.rif_cedula}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[var(--ts-text-primary)]">
                            {meta.plan_starlink || s.servicios_recurrentes?.nombre || "Starlink"}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {meta.wifi_ssid || "—"}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[var(--ts-text-muted)]">
                            {meta.correo_starlink || s.credenciales_usuario || "—"}
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px]">
                            {meta.kit_serial ? (
                              <span className="bg-slate-900/60 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                                {meta.kit_serial}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                urgente
                                  ? "bg-amber-500/20 text-amber-400 font-black"
                                  : "bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)]"
                              }`}
                            >
                              {meta.dia_corte ? `Día ${meta.dia_corte}` : formatFecha(s.proximo_pago)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-400">
                            {formatUSD(s.monto)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {meta.es_vip ? (
                              <span className="text-[9px] font-black uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                                VIP
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold uppercase bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                                +$10 Soporte
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={(e) => handleDescargarPDF(s, e)}
                                disabled={esCargandoPDF}
                                className="p-1.5 hover:bg-[var(--ts-surface-2)] text-[var(--ts-red)] rounded-lg transition-colors"
                                title="Descargar Ficha PDF"
                              >
                                <Download className={`w-4 h-4 ${esCargandoPDF ? "animate-spin" : ""}`} />
                              </button>
                              <button
                                onClick={(e) => handleWhatsApp(s, e)}
                                className="p-1.5 hover:bg-[var(--ts-surface-2)] text-emerald-400 rounded-lg transition-colors"
                                title="WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>

                              {/* Toggle Pausar / Reactivar */}
                              {s.estado === "Activo" ? (
                                <button
                                  onClick={() => onCambiarEstado?.(s.id, "Suspendido")}
                                  className="p-1.5 hover:bg-amber-500/10 text-amber-400 rounded-lg transition-colors"
                                  title="Pausar por este mes"
                                >
                                  <Pause className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => onCambiarEstado?.(s.id, "Activo")}
                                  className="p-1.5 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-colors"
                                  title="Reactivar antena"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              )}

                              {s.estado !== "Cancelado" && (
                                <button
                                  onClick={() => onCambiarEstado?.(s.id, "Cancelado")}
                                  className="p-1.5 hover:bg-red-500/10 text-[var(--ts-text-muted)] hover:text-red-400 rounded-lg transition-colors"
                                  title="Cancelar suscripción"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={() => onEditSuscripcion(s)}
                                className="p-1.5 hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => onEliminarSuscripcion?.(s)}
                                className="p-1.5 hover:bg-red-500/10 text-[var(--ts-text-muted)] hover:text-red-400 rounded-lg transition-colors"
                                title="Eliminar suscripción definitivamente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Bóveda */
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-[var(--ts-text-primary)]">
                      Bóveda de Credenciales Starlink
                    </h4>
                    <p className="text-[10px] text-[var(--ts-text-muted)]">
                      Herramienta de atención técnica rápida para copiar datos de acceso en 1 clic
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[var(--ts-text-muted)]">
                  {subsFiltradas.length} antenas
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--ts-surface)] border-b border-[var(--ts-border)] text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
                    <tr>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Cuenta Starlink</th>
                      <th className="py-3 px-4">Clave Starlink</th>
                      <th className="py-3 px-4">Red WiFi (SSID)</th>
                      <th className="py-3 px-4">Clave WiFi</th>
                      <th className="py-3 px-4 font-mono text-[10px]">Serial KIT</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ts-border)]">
                    {subsFiltradas.map((s) => {
                      const meta = extractStarlinkData(s);
                      const claveVisible = clavesVisibles[s.id] || false;
                      const esCargandoPDF = generandoPDF === s.id;

                      return (
                        <tr key={s.id} className="hover:bg-[var(--ts-surface-2)]/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-[var(--ts-text-primary)]">
                            {s.clientes?.empresa || s.clientes?.contacto}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {meta.correo_starlink ? (
                              <div className="flex items-center gap-1.5">
                                <span>{meta.correo_starlink}</span>
                                <button
                                  onClick={() => handleCopiar(meta.correo_starlink!, `mail-v-${s.id}`)}
                                  className="p-1 hover:bg-[var(--ts-surface-2)] rounded text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                                >
                                  {copiado === `mail-v-${s.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            ) : "—"}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {meta.clave_starlink ? (
                              <div className="flex items-center gap-1.5">
                                <span>{claveVisible ? meta.clave_starlink : "••••••••"}</span>
                                <button onClick={() => toggleClaveVisible(s.id)} className="p-1 text-[var(--ts-text-muted)]">
                                  {claveVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                                <button onClick={() => handleCopiar(meta.clave_starlink!, `cstar-v-${s.id}`)} className="p-1 text-[var(--ts-text-muted)]">
                                  {copiado === `cstar-v-${s.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            ) : "—"}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {meta.wifi_ssid ? (
                              <div className="flex items-center gap-1.5">
                                <span>{meta.wifi_ssid}</span>
                                <button onClick={() => handleCopiar(meta.wifi_ssid!, `ssid-v-${s.id}`)} className="p-1 text-[var(--ts-text-muted)]">
                                  {copiado === `ssid-v-${s.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            ) : "—"}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {meta.wifi_password ? (
                              <div className="flex items-center gap-1.5">
                                <span>{claveVisible ? meta.wifi_password : "••••••••"}</span>
                                <button onClick={() => handleCopiar(meta.wifi_password!, `pass-v-${s.id}`)} className="p-1 text-[var(--ts-text-muted)]">
                                  {copiado === `pass-v-${s.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            ) : "—"}
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px]">
                            {meta.kit_serial ? (
                              <span className="bg-slate-900/60 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                                {meta.kit_serial}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleDescargarPDF(s)}
                                disabled={esCargandoPDF}
                                className="px-2 py-1 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-red)] text-[var(--ts-text-primary)] hover:text-white rounded-lg text-xs font-bold transition-all border border-[var(--ts-border)] flex items-center justify-center gap-1"
                                title="Descargar Ficha PDF"
                              >
                                <Download className={`w-3.5 h-3.5 ${esCargandoPDF ? "animate-spin" : "text-[var(--ts-red)]"}`} />
                                <span>PDF</span>
                              </button>
                              <button
                                onClick={() => onEditSuscripcion(s)}
                                className="p-1.5 hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] rounded-lg transition-colors"
                                title="Editar antena"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onEliminarSuscripcion?.(s)}
                                className="p-1.5 hover:bg-red-500/10 text-[var(--ts-text-muted)] hover:text-red-400 rounded-lg transition-colors"
                                title="Eliminar suscripción definitivamente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: COMPARTIR ENLACE ONBOARDING (WHATSAPP & LINK) ── */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--ts-border)]">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-[var(--ts-text-primary)]">
                  Compartir Formulario de Onboarding
                </h3>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--ts-text-muted)] leading-relaxed">
              Envía este enlace seguro a cualquier cliente para que complete sus datos, suba las fotos de su cédula e indique su dirección de instalación.
            </p>

            <div className="p-3 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-emerald-400 truncate select-all">{enlaceOnboarding}</span>
              <button
                onClick={() => handleCopiar(enlaceOnboarding, "share-link")}
                className="px-3 py-1.5 bg-[var(--ts-surface)] hover:bg-[var(--ts-border)] text-[var(--ts-text-primary)] rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1"
              >
                {copiado === "share-link" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiado === "share-link" ? "Copiado" : "Copiar Enlace"}</span>
              </button>
            </div>

            <div className="pt-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `¡Hola! Para iniciar el registro y activación oficial de tu antena Starlink con *TecnoSmart VZL*, por favor completa tus datos en este enlace seguro:\n\n${enlaceOnboarding}\n\n¡Nos toma solo minutos activar tu servicio!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CARGAR SOLICITUD ASISTIDA (WHATSAPP / TIENDA) ── */}
      <StarlinkSolicitudAsistidaModal
        isOpen={showAsistidaModal}
        onClose={() => setShowAsistidaModal(false)}
        onSaved={async () => {
          await fetchSolicitudes();
          setSubTab("solicitudes");
          if (onRefresh) onRefresh();
        }}
      />

      {/* ── MODAL 3: COCKPIT DE ACTIVACIÓN STARLINK ── */}
      <StarlinkCockpitActivacionModal
        isOpen={Boolean(solicitudCockpit)}
        solicitud={solicitudCockpit}
        onClose={() => setSolicitudCockpit(null)}
        onActivated={async () => {
          await fetchSolicitudes();
          if (onRefresh) onRefresh();
          setSubTab("flota");
        }}
        servicios={servicios}
      />
    </div>
  );
}
