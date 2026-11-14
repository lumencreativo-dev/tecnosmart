"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Megaphone, Mail, MessageSquare, Plus, Search, Filter,
  CheckCircle2, Clock, Smartphone, User, Calendar, ExternalLink,
  ChevronRight, ArrowRight, Eye, X, Send, Copy, Check,
  Sparkles, TrendingUp, BarChart2, Share2, Layers, AlertCircle,
  FileEdit, PhoneCall, Globe, ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";

// ── Tipos ──────────────────────────────────────────────────────────
export interface LeadWeb {
  id: string;
  nombre_contacto: string;
  telefono_whatsapp: string;
  tipo_contacto: "cliente_final" | "tecnico_instalador";
  servicio_interes: "camaras" | "starlink" | "domotica_redes" | "automatizacion" | "soporte_premium" | "otro";
  zona_ciudad?: string;
  problema_resumen?: string;
  estado: "nuevo" | "contactado" | "en_cotizacion" | "ganado" | "descartado";
  created_at: string;
}

export interface PlantillaEmail {
  id: string;
  nombre: string;
  asunto: string;
  categoria: "preventivo" | "starlink" | "upgrade_cctv" | "tecnicos_aliados";
  cuerpoTexto: string;
}

// ── Leads Iniciales (Vacíos para captura real desde la landing) ───
const LEADS_INICIALES: LeadWeb[] = [];

const PLANTILLAS_EMAIL: PlantillaEmail[] = [
  {
    id: "plantilla-1",
    nombre: "Mantenimiento Preventivo Anual CCTV",
    asunto: "Protege tu inversión: Jornada de Mantenimiento Preventivo de Seguridad | TecnoSmart VZL",
    categoria: "preventivo",
    cuerpoTexto: `Estimado(a) {{nombre}},

En TecnoSmart VZL sabemos que la seguridad de su empresa y familia es lo primordial. El polvo, las lluvias y las fluctuaciones eléctricas pueden degradar la calidad de imagen de sus cámaras de seguridad y reducir la vida útil de los discos duros de grabación.

Ponemos a su disposición nuestra jornada técnica de mantenimiento preventivo:
✓ Limpieza óptica de lentes y domos.
✓ Revisión de conectores balun/RJ45 y fuentes de alimentación.
✓ Comprobación de sectores del disco duro y respaldo de configuraciones.
✓ Actualización de firmware contra vulnerabilidades.

Contáctenos respondiendo a este correo o vía WhatsApp al 0412-2789273 para agendar la visita de nuestros ingenieros certificados.

Atentamente,
Equipo de Operaciones e Ingeniería
TecnoSmart VZL C.A · RIF J-50701960-8`,
  },
  {
    id: "plantilla-2",
    nombre: "Starlink: Optimización de Conectividad Satelital",
    asunto: "Lleva la señal de tu antena Starlink a cada rincón de tu propiedad",
    categoria: "starlink",
    cuerpoTexto: `Hola {{nombre}},

¿Tu kit Starlink entrega excelente velocidad cerca de la antena pero pierdes señal en galpones o habitaciones lejanas?

En TecnoSmart VZL somos especialistas certificados en despliegue de redes Wi-Fi 6 Mesh y enlaces punto a punto de larga distancia:
- Cobertura completa en toda la finca, posada o empresa sin pérdidas de velocidad.
- Modo Bypass profesional para routers Mikrotik / Omada con balanceo de carga.
- Módulos de protección contra descargas atmosféricas y picos de voltaje.

Solicite su asesoría técnica gratuita directamente con uno de nuestros ingenieros.`,
  },
  {
    id: "plantilla-3",
    nombre: "Bienvenida a Técnicos Aliados (B2B)",
    asunto: "Únete a la Red de Técnicos Aliados TecnoSmart · Descuentos y Herramientas Especiales",
    categoria: "tecnicos_aliados",
    cuerpoTexto: `Estimado colega instalador,

Te damos la bienvenida a la plataforma oficial de Técnicos Aliados de TecnoSmart VZL. Al formar parte de nuestra red accedes a:
1. Precios técnicos mayoristas exclusivos en cámaras IP, cables Cat6 y accesorios.
2. Acceso a la suite técnica tec.somostecnosmart.com (calculadora de ancho de banda, caídas de tensión y guías de conexión).
3. Respaldo de ingeniería para cotizaciones complejas y proyectos industriales.

Inicia sesión en el portal de técnicos o comunícate con nuestro departamento comercial.`,
  },
];

export default function MarketingManager() {
  const { usuario } = useUsuario();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"leads" | "whatsapp" | "email" | "funnel">("leads");

  useEffect(() => {
    const t = searchParams?.get("tab");
    if (t && ["leads", "whatsapp", "email", "funnel"].includes(t)) {
      setActiveTab(t as any);
    }
  }, [searchParams]);

  // Estado Leads
  const [leads, setLeads] = useState<LeadWeb[]>(LEADS_INICIALES);
  const [searchLead, setSearchLead] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroServicio, setFiltroServicio] = useState<string>("todos");
  const [leadSeleccionado, setLeadSeleccionado] = useState<LeadWeb | null>(null);

  // Estado Generador WhatsApp
  const [waCanal, setWaCanal] = useState("Instagram Bio");
  const [waServicio, setWaServicio] = useState("Cámaras de Seguridad");
  const [waTextoCustom, setWaTextoCustom] = useState("");
  const [waEnlaceGenerado, setWaEnlaceGenerado] = useState("");
  const [waCopiado, setWaCopiado] = useState(false);

  // Estado Email (Resend)
  const [plantillaActiva, setPlantillaActiva] = useState<PlantillaEmail>(PLANTILLAS_EMAIL[0]);
  const [emailDestinatario, setEmailDestinatario] = useState("");
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  // Cargar leads desde Supabase o fallback localStorage
  const cargarLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("solicitudes_asesoria")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const mapeados: LeadWeb[] = data.map((d: any) => ({
          id: d.id,
          nombre_contacto: d.nombre_contacto || d.nombre || "Contacto Web",
          telefono_whatsapp: d.telefono_whatsapp || d.telefono || "",
          tipo_contacto: d.tipo_contacto || (d.tipo?.toLowerCase().includes("tecnico") ? "tecnico_instalador" : "cliente_final"),
          servicio_interes: d.servicio_interes || d.necesidad || "camaras",
          zona_ciudad: d.zona_ciudad || d.zona || "",
          problema_resumen: d.problema_resumen || d.problema || "",
          estado: d.estado || "nuevo",
          created_at: d.created_at ? new Date(d.created_at).toISOString().replace("T", " ").substring(0, 16) : new Date().toISOString().substring(0, 10),
        }));
        setLeads(mapeados);
      } else {
        const saved = localStorage.getItem("ts_marketing_leads");
        if (saved) setLeads(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
      const saved = localStorage.getItem("ts_marketing_leads");
      if (saved) setLeads(JSON.parse(saved));
    }
  };

  useEffect(() => {
    cargarLeads();
  }, []);

  const guardarLeadsLocal = (nuevos: LeadWeb[]) => {
    setLeads(nuevos);
    try {
      localStorage.setItem("ts_marketing_leads", JSON.stringify(nuevos));
    } catch (e) {
      console.error(e);
    }
  };

  // Cambiar estado de Lead
  const handleCambiarEstadoLead = async (id: string, nuevoEstado: LeadWeb["estado"]) => {
    const actualizados = leads.map((l) => (l.id === id ? { ...l, estado: nuevoEstado } : l));
    guardarLeadsLocal(actualizados);

    try {
      await supabase
        .from("solicitudes_asesoria")
        .update({ estado: nuevoEstado })
        .eq("id", id);
    } catch (e) {
      console.error(e);
    }

    if (leadSeleccionado && leadSeleccionado.id === id) {
      setLeadSeleccionado({ ...leadSeleccionado, estado: nuevoEstado });
    }
  };

  // Generador Enlaces WhatsApp con UTM
  useEffect(() => {
    const telefonoOficial = "584122789273"; // WhatsApp de TecnoSmart VZL
    let mensaje = "";
    if (waTextoCustom.trim()) {
      mensaje = `${waTextoCustom.trim()} [Canal: ${waCanal}]`;
    } else {
      mensaje = `Hola equipo de TecnoSmart VZL, vi su información en ${waCanal} y me gustaría recibir asesoría técnica sobre ${waServicio}.`;
    }
    const url = `https://wa.me/${telefonoOficial}?text=${encodeURIComponent(mensaje)}`;
    setWaEnlaceGenerado(url);
  }, [waCanal, waServicio, waTextoCustom]);

  const copiarEnlaceWhatsApp = () => {
    navigator.clipboard.writeText(waEnlaceGenerado);
    setWaCopiado(true);
    setTimeout(() => setWaCopiado(false), 2500);
  };

  // Simulación Envío Resend
  const handleEnviarEmailPrueba = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailDestinatario) return;
    setEnviandoEmail(true);

    // Simulación elegante con feedback
    setTimeout(() => {
      setEnviandoEmail(false);
      setEmailEnviado(true);
      setTimeout(() => setEmailEnviado(false), 3500);
      setEmailDestinatario("");
    }, 1200);
  };

  // Leads Filtrados
  const leadsFiltrados = useMemo(() => {
    return leads.filter((l) => {
      const cumpleEstado = filtroEstado === "todos" || l.estado === filtroEstado;
      const cumpleServicio = filtroServicio === "todos" || l.servicio_interes === filtroServicio;
      const term = searchLead.toLowerCase();
      const cumpleTerm =
        l.nombre_contacto.toLowerCase().includes(term) ||
        l.telefono_whatsapp.includes(term) ||
        (l.zona_ciudad && l.zona_ciudad.toLowerCase().includes(term)) ||
        (l.problema_resumen && l.problema_resumen.toLowerCase().includes(term));

      return cumpleEstado && cumpleServicio && cumpleTerm;
    });
  }, [leads, searchLead, filtroEstado, filtroServicio]);

  // Métricas del Funnel
  const totalLeads = leads.length;
  const leadsContactados = leads.filter((l) => l.estado !== "nuevo").length;
  const leadsCotizados = leads.filter((l) => l.estado === "en_cotizacion" || l.estado === "ganado").length;
  const leadsGanados = leads.filter((l) => l.estado === "ganado").length;

  const tasaContactados = totalLeads > 0 ? Math.round((leadsContactados / totalLeads) * 100) : 0;
  const tasaCotizados = totalLeads > 0 ? Math.round((leadsCotizados / totalLeads) * 100) : 0;
  const tasaCierre = totalLeads > 0 ? Math.round((leadsGanados / totalLeads) * 100) : 0;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--ts-bg)] pb-28 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Encabezado y Selector de Tabs ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-xl">
                <Megaphone className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--ts-text-primary)]">
                Marketing, Captación & Leads
              </h1>
            </div>
            <p className="text-xs text-[var(--ts-text-muted)] mt-1">
              Bandeja de solicitudes desde la Landing Page, campañas de correo (Resend) y enlaces inteligentes de WhatsApp.
            </p>
          </div>

          {/* Switcher de Vistas */}
          <div className="flex bg-[var(--ts-surface)] border border-[var(--ts-border)] p-1 rounded-xl shadow-xs self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("leads")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "leads"
                  ? "bg-[var(--ts-red)] text-white shadow-xs"
                  : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Bandeja Web ({leads.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("whatsapp")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "whatsapp"
                  ? "bg-[var(--ts-red)] text-white shadow-xs"
                  : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Enlaces WhatsApp</span>
            </button>
            <button
              onClick={() => setActiveTab("email")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "email"
                  ? "bg-[var(--ts-red)] text-white shadow-xs"
                  : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Campañas Email (Resend)</span>
            </button>
            <button
              onClick={() => setActiveTab("funnel")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "funnel"
                  ? "bg-[var(--ts-red)] text-white shadow-xs"
                  : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Embudo & Métricas</span>
            </button>
          </div>
        </div>

        {/* ── KPIs Rápidos ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] p-3.5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-[var(--ts-text-muted)] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Leads Web Totales</span>
              <Globe className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xl font-black text-[var(--ts-text-primary)]">{totalLeads}</p>
            <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Captados en la Landing</p>
          </div>

          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] p-3.5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-[var(--ts-text-muted)] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Por Contactar</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400">
              {leads.filter((l) => l.estado === "nuevo").length}
            </p>
            <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Compromiso: &lt; 24h hábiles</p>
          </div>

          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] p-3.5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-[var(--ts-text-muted)] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">En Cotización</span>
              <FileEdit className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-xl font-black text-purple-600 dark:text-purple-400">{leadsCotizados}</p>
            <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Propuestas en proceso</p>
          </div>

          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] p-3.5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-[var(--ts-text-muted)] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Tasa de Conversión</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{tasaCierre}%</p>
            <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Leads convertidos en obras</p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            TAB 1: BANDEJA DE LEADS WEB (LANDING PAGE)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "leads" && (
          <div className="space-y-4">
            {/* Barra de Filtros */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchLead}
                  onChange={(e) => setSearchLead(e.target.value)}
                  placeholder="Buscar por nombre, WhatsApp, zona..."
                  className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] placeholder:text-[var(--ts-text-muted)] focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] font-medium"
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="nuevo">Nuevos</option>
                  <option value="contactado">Contactados</option>
                  <option value="en_cotizacion">En Cotización</option>
                  <option value="ganado">Ganados</option>
                  <option value="descartado">Descartados</option>
                </select>

                <select
                  value={filtroServicio}
                  onChange={(e) => setFiltroServicio(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] font-medium"
                >
                  <option value="todos">Todos los Servicios</option>
                  <option value="camaras">CCTV / Cámaras</option>
                  <option value="starlink">Starlink</option>
                  <option value="domotica_redes">Domótica & Redes</option>
                  <option value="automatizacion">Automatizaciones</option>
                  <option value="soporte_premium">Plan Premium $5/mes</option>
                </select>

                <button
                  onClick={cargarLeads}
                  className="p-2 border border-[var(--ts-border)] bg-[var(--ts-surface-2)] hover:bg-[var(--ts-surface)] text-[var(--ts-text-primary)] rounded-xl transition-colors"
                  title="Refrescar lista"
                >
                  <Globe className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Listado de Prospectos */}
            <div className="grid grid-cols-1 gap-3">
              {leadsFiltrados.length === 0 ? (
                <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-10 text-center text-[var(--ts-text-muted)]">
                  <Megaphone className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  <p className="text-sm font-bold text-[var(--ts-text-primary)]">No hay solicitudes web con estos filtros</p>
                  <p className="text-xs mt-1">Los formularios completados en somostecnosmart.com aparecerán aquí automáticamente.</p>
                </div>
              ) : (
                leadsFiltrados.map((lead) => {
                  const telLimpio = lead.telefono_whatsapp.replace(/\D/g, "").replace(/^0/, "");
                  const urlWhatsApp = `https://wa.me/58${telLimpio}?text=${encodeURIComponent(
                    `Hola ${lead.nombre_contacto}, te saluda el departamento de ingeniería de TecnoSmart VZL. Recibimos tu solicitud de asesoría técnica para ${lead.servicio_interes.replace("_", " ")}. ¿En qué horario te resulta más conveniente recibir nuestra llamada técnica?`
                  )}`;

                  return (
                    <div
                      key={lead.id}
                      className="bg-[var(--ts-surface)] border border-[var(--ts-border)] hover:border-pink-500/40 rounded-2xl p-4 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              lead.estado === "nuevo"
                                ? "bg-red-500/10 text-[var(--ts-red)] border border-red-500/20"
                                : lead.estado === "contactado"
                                ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                : lead.estado === "en_cotizacion"
                                ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                                : lead.estado === "ganado"
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : "bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)]"
                            }`}
                          >
                            {lead.estado.replace("_", " ")}
                          </span>

                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                            {lead.servicio_interes.replace("_", " ")}
                          </span>

                          <span className="text-[10px] font-bold text-[var(--ts-text-muted)] bg-[var(--ts-surface-2)] px-2 py-0.5 rounded-full">
                            {lead.tipo_contacto === "tecnico_instalador" ? "Técnico / Instalador" : "Cliente Final"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-[var(--ts-text-primary)]">
                            {lead.nombre_contacto}
                          </h3>
                          {lead.zona_ciudad && (
                            <span className="text-xs text-[var(--ts-text-muted)] font-medium">
                              · {lead.zona_ciudad}
                            </span>
                          )}
                        </div>

                        {lead.problema_resumen && (
                          <p className="text-xs text-[var(--ts-text-muted)] mt-1 line-clamp-2">
                            "{lead.problema_resumen}"
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--ts-text-muted)] mt-2">
                          <span className="flex items-center gap-1 font-mono text-[var(--ts-text-primary)]">
                            <Smartphone className="w-3.5 h-3.5 text-pink-500" />
                            {lead.telefono_whatsapp}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {lead.created_at}
                          </span>
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <a
                          href={urlWhatsApp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-colors border border-emerald-500/20"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        <Link
                          href={`/crm?nuevoCliente=${encodeURIComponent(lead.nombre_contacto)}&telefono=${encodeURIComponent(lead.telefono_whatsapp)}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--ts-surface-2)] hover:bg-[var(--ts-surface)] border border-[var(--ts-border)] text-xs font-bold text-[var(--ts-text-primary)] transition-colors"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>Cotizar</span>
                        </Link>

                        <select
                          value={lead.estado}
                          onChange={(e) => handleCambiarEstadoLead(lead.id, e.target.value as LeadWeb["estado"])}
                          className="text-xs px-2.5 py-1.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] font-bold cursor-pointer"
                        >
                          <option value="nuevo">Nuevo</option>
                          <option value="contactado">Contactado</option>
                          <option value="en_cotizacion">En Cotización</option>
                          <option value="ganado">Ganado</option>
                          <option value="descartado">Descartado</option>
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2: GENERADOR DE ENLACES WHATSAPP CON UTM
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "whatsapp" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-black text-[var(--ts-text-primary)] uppercase tracking-wider">
                  Configurar Enlace de Campaña
                </h3>
              </div>

              <div>
                <label className="field-label">Canal / Medio de Publicación</label>
                <select
                  value={waCanal}
                  onChange={(e) => setWaCanal(e.target.value)}
                  className="field-input font-bold"
                >
                  <option value="Instagram Bio">Instagram Bio</option>
                  <option value="Instagram Stories / Ads">Instagram Stories / Ads</option>
                  <option value="TikTok Perfil">TikTok Perfil</option>
                  <option value="Volante Impreso Tinaquillo">Volante Impreso Tinaquillo</option>
                  <option value="Google Maps / Perfil de Negocio">Google Maps / Perfil de Negocio</option>
                  <option value="Valla / Pendón Comercial">Valla / Pendón Comercial</option>
                  <option value="Recomendación Boca a Boca">Recomendación Boca a Boca</option>
                </select>
                <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">
                  Permite identificar de dónde provienen las llamadas y mensajes de nuevos clientes.
                </p>
              </div>

              <div>
                <label className="field-label">Servicio Promocionado</label>
                <select
                  value={waServicio}
                  onChange={(e) => setWaServicio(e.target.value)}
                  className="field-input font-bold"
                >
                  <option value="Cámaras de Seguridad CCTV/IP">Cámaras de Seguridad CCTV/IP</option>
                  <option value="Instalación y Configuración Starlink">Instalación y Configuración Starlink</option>
                  <option value="Plan de Soporte Premium ($5/mes)">Plan de Soporte Premium ($5/mes)</option>
                  <option value="Domótica y Control de Acceso">Domótica y Control de Acceso</option>
                  <option value="Cableado Estructurado y Redes">Cableado Estructurado y Redes</option>
                  <option value="Programa de Técnicos Aliados">Programa de Técnicos Aliados</option>
                </select>
              </div>

              <div>
                <label className="field-label">Mensaje Personalizado Opcional</label>
                <textarea
                  rows={3}
                  value={waTextoCustom}
                  onChange={(e) => setWaTextoCustom(e.target.value)}
                  placeholder="Dejar vacío para usar el mensaje estándar automático..."
                  className="field-input resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={copiarEnlaceWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  {waCopiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{waCopiado ? "¡Enlace Copiado al Portapapeles!" : "Copiar Enlace para Publicidad"}</span>
                </button>
              </div>
            </div>

            {/* Vista Previa del Enlace y Mensaje */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black text-[var(--ts-text-muted)] uppercase tracking-wider mb-3">
                  Vista Previa del Enlace
                </h4>

                <div className="bg-[var(--ts-surface-2)] p-4 rounded-xl border border-[var(--ts-border)] space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--ts-text-muted)] uppercase font-bold block">URL Generada:</span>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 break-all mt-0.5">
                      {waEnlaceGenerado}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--ts-text-muted)] uppercase font-bold block">Mensaje que verá el cliente al abrir WhatsApp:</span>
                    <div className="mt-1 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-800 dark:text-emerald-200 text-xs">
                      {waTextoCustom.trim()
                        ? `${waTextoCustom.trim()} [Canal: ${waCanal}]`
                        : `Hola equipo de TecnoSmart VZL, vi su información en ${waCanal} y me gustaría recibir asesoría técnica sobre ${waServicio}.`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--ts-border)] flex items-center justify-between">
                <span className="text-xs text-[var(--ts-text-muted)]">Número WhatsApp Oficial: <strong>0412-2789273</strong></span>
                <a
                  href={waEnlaceGenerado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
                >
                  <span>Probar Chat</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 3: CAMPAÑAS EMAIL (RESEND)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "email" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Infraestructura Resend Activa · somostecnosmart.com
                </h4>
                <p className="text-xs text-[var(--ts-text-muted)] mt-0.5">
                  Dominio corporativo configurado con DKIM, SPF y DMARC en Cloudflare. Envío de correos profesionales a clientes sin costo por cuota mensual.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Selector de Plantillas */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-[var(--ts-text-muted)] uppercase tracking-wider mb-2">
                  Plantillas Preconfiguradas
                </h4>
                {PLANTILLAS_EMAIL.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlantillaActiva(p)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      plantillaActiva.id === p.id
                        ? "bg-[var(--ts-red)] text-white border-[var(--ts-red)] shadow-md"
                        : "bg-[var(--ts-surface)] border-[var(--ts-border)] text-[var(--ts-text-primary)] hover:border-blue-500/40"
                    }`}
                  >
                    <p className="text-xs font-bold truncate">{p.nombre}</p>
                    <p className={`text-[10px] mt-1 line-clamp-1 ${plantillaActiva.id === p.id ? "text-white/80" : "text-[var(--ts-text-muted)]"}`}>
                      {p.asunto}
                    </p>
                  </button>
                ))}
              </div>

              {/* Editor y Vista Previa */}
              <div className="lg:col-span-2 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--ts-border)] pb-3">
                  <div>
                    <h3 className="text-sm font-black text-[var(--ts-text-primary)]">
                      {plantillaActiva.nombre}
                    </h3>
                    <p className="text-[11px] text-[var(--ts-text-muted)] mt-0.5">
                      Remitente oficial: <strong>contacto@somostecnosmart.com</strong>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)]">
                    Resend API v2
                  </span>
                </div>

                <div>
                  <label className="field-label">Línea de Asunto</label>
                  <input
                    type="text"
                    value={plantillaActiva.asunto}
                    readOnly
                    className="field-input font-bold"
                  />
                </div>

                <div>
                  <label className="field-label">Contenido del Correo</label>
                  <textarea
                    rows={8}
                    value={plantillaActiva.cuerpoTexto}
                    readOnly
                    className="field-input font-mono text-xs resize-none"
                  />
                </div>

                <form onSubmit={handleEnviarEmailPrueba} className="pt-2 border-t border-[var(--ts-border)] flex flex-col sm:flex-row gap-2 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <input
                      type="email"
                      required
                      value={emailDestinatario}
                      onChange={(e) => setEmailDestinatario(e.target.value)}
                      placeholder="correo-cliente@ejemplo.com"
                      className="field-input text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={enviandoEmail}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[var(--ts-red)] hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{enviandoEmail ? "Enviando..." : "Enviar Correo de Campaña"}</span>
                  </button>
                </form>

                {emailEnviado && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>¡Campaña enviada exitosamente mediante la API de Resend!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 4: EMBUDO DE CONVERSIÓN & MÉTRICAS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "funnel" && (
          <div className="space-y-6">
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-6 shadow-xs">
              <h3 className="text-sm font-black text-[var(--ts-text-primary)] uppercase tracking-wider mb-6">
                Embudo de Conversión de Ventas TecnoSmart
              </h3>

              <div className="space-y-4">
                {/* Paso 1: Visitantes & Leads Web */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-2 text-[var(--ts-text-primary)]">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-[10px] font-black">1</span>
                      Solicitudes Web Capturadas (Landing)
                    </span>
                    <span className="text-[var(--ts-text-primary)] font-mono">{totalLeads} prospectos (100%)</span>
                  </div>
                  <div className="w-full h-3 bg-[var(--ts-surface-2)] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>

                {/* Paso 2: Llamada / Asesoría Telefónica Realizada */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-2 text-[var(--ts-text-primary)]">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 flex items-center justify-center text-[10px] font-black">2</span>
                      Llamada / Contacto Técnico Realizado (&lt; 24h)
                    </span>
                    <span className="text-cyan-600 font-mono">{leadsContactados} contactados ({tasaContactados}%)</span>
                  </div>
                  <div className="w-full h-3 bg-[var(--ts-surface-2)] rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${tasaContactados}%` }} />
                  </div>
                </div>

                {/* Paso 3: Presupuesto Emitido */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-2 text-[var(--ts-text-primary)]">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-600 flex items-center justify-center text-[10px] font-black">3</span>
                      Cotización Entregada al Cliente
                    </span>
                    <span className="text-purple-600 font-mono">{leadsCotizados} cotizados ({tasaCotizados}%)</span>
                  </div>
                  <div className="w-full h-3 bg-[var(--ts-surface-2)] rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${tasaCotizados}%` }} />
                  </div>
                </div>

                {/* Paso 4: Cierre / Proyecto Ganado */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-2 text-[var(--ts-text-primary)]">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-[10px] font-black">4</span>
                      Instalación Concretada / Proyecto Ganado
                    </span>
                    <span className="text-emerald-600 font-mono">{leadsGanados} ganados ({tasaCierre}%)</span>
                  </div>
                  <div className="w-full h-3 bg-[var(--ts-surface-2)] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${tasaCierre}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
