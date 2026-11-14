"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  LifeBuoy, ShieldCheck, BookOpen, Plus, Search, Filter,
  CheckCircle2, Clock, AlertTriangle, AlertOctagon, Wrench,
  Smartphone, User, Calendar, ExternalLink, ChevronRight,
  Shield, Tag, Check, MessageSquare, ArrowRight, Eye, X,
  FileText, Sparkles, HelpCircle, HardHat
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";

// ── Tipos ──────────────────────────────────────────────────────────
export interface TicketSoporte {
  id: string;
  codigo: string;
  cliente: string;
  telefono: string;
  servicio: "cctv" | "starlink" | "redes" | "domotica" | "automatizacion" | "otro";
  tipoPlan: "basico" | "premium"; // Básico (L-V horario oficina) o Premium ($5/mes 24/7 prioritario)
  prioridad: "baja" | "media" | "alta" | "urgente";
  estado: "abierto" | "en_diagnostico" | "visita_programada" | "resuelto" | "cerrado";
  asunto: string;
  descripcion: string;
  tecnicoAsignado?: string;
  fechaCreacion: string;
  fechaCierre?: string;
  solucion?: string;
}

export interface RegistroGarantia {
  id: string;
  serial: string;
  equipo: string;
  cliente: string;
  fechaInstalacion: string;
  mesesGarantia: number; // 12 meses para cámaras (1 año)
  facturaRef?: string;
  estado: "activa" | "por_vencer" | "vencida";
}

export interface ArticuloWiki {
  id: string;
  titulo: string;
  categoria: "cctv" | "redes" | "starlink" | "normativas";
  resumen: string;
  contenido: string;
  pasos?: string[];
  etiquetas: string[];
}

// ── Datos Iniciales (Vacíos para registro real) ───────────────────
const TICKETS_INICIALES: TicketSoporte[] = [];

const GARANTIAS_INICIALES: RegistroGarantia[] = [];

const WIKI_ARTICULOS: ArticuloWiki[] = [
  {
    id: "wiki-1",
    titulo: "Norma de Ponchado T568B para Cableado Estructurado",
    categoria: "redes",
    resumen: "Esquema obligatorio de colores para todo cable Cat6 UTP en instalaciones TecnoSmart.",
    contenido: "Para garantizar el cumplimiento de normativas internacionales y certificar enlaces a 1 Gbps, todo conector RJ45 debe poncharse bajo el estándar T568B:",
    pasos: [
      "1. Blanco/Naranja",
      "2. Naranja",
      "3. Blanco/Verde",
      "4. Azul",
      "5. Blanco/Azul",
      "6. Verde",
      "7. Blanco/Marrón",
      "8. Marrón",
    ],
    etiquetas: ["Cat6", "RJ45", "T568B", "Norma"],
  },
  {
    id: "wiki-2",
    titulo: "Puertos por Defecto CCTV (Hikvision & Dahua)",
    categoria: "cctv",
    resumen: "Puertos de red locales para acceso web, app móvil y streaming RTSP.",
    contenido: "Puertos estándar necesarios para direccionamiento IP y acceso desde plataformas Hik-Connect o DMSS:",
    pasos: [
      "Hikvision HTTP: Puerto 80",
      "Hikvision SDK Servidor: Puerto 8000",
      "Hikvision RTSP Stream: Puerto 554",
      "Dahua TCP: Puerto 37777",
      "Dahua HTTP: Puerto 80",
    ],
    etiquetas: ["Hikvision", "Dahua", "Puertos", "RTSP"],
  },
  {
    id: "wiki-3",
    titulo: "Activación de Modo Bypass en Antenas Starlink",
    categoria: "starlink",
    resumen: "Procedimiento para deshabilitar el Wi-Fi del router Starlink y conectar routers Mikrotik o TP-Link Omada.",
    contenido: "Al colocar un router principal de cliente o balanceador de carga, el router Starlink debe ponerse en modo puente (Bypass) desde la app:",
    pasos: [
      "1. Abrir la app Starlink conectada a la red local.",
      "2. Ir a Configuración > Avanzado > Modo Bypass (Desactivar Wi-Fi).",
      "3. Confirmar el switch. El router original apagará sus radios inalámbricas.",
      "4. Conectar el puerto Ethernet del adaptador Starlink al puerto WAN del router del cliente.",
      "5. Para revertir, se debe realizar un hard reset de fábrica (ciclo de 6 desconexiones de corriente seguidas).",
    ],
    etiquetas: ["Starlink", "Bypass", "Mikrotik", "Wi-Fi"],
  },
  {
    id: "wiki-4",
    titulo: "Cálculo de Caída de Tensión 12V DC en Cámaras de Seguridad",
    categoria: "normativas",
    resumen: "Longitud máxima recomendada para fuentes centralizadas antes de requerir transformador local.",
    contenido: "A 12V de corriente continua, el calibre del cable genera caída de voltaje apreciable a partir de 25 metros. En distancias superiores a 40 metros:",
    pasos: [
      "Usar fuentes de 12V regulables calibradas a 13.5V en origen.",
      "O preferir distribución de 24V AC o usar tecnología PoE (48V) estándar 802.3af.",
      "Verificar con multímetro que lleguen mínimo 11.2V DC en bornes de la cámara con los infrarrojos encendidos (modo noche).",
    ],
    etiquetas: ["Voltaje", "CCTV", "12V", "Cálculos"],
  },
];

export default function SoporteManager() {
  const { usuario } = useUsuario();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"tickets" | "garantias" | "wiki">("tickets");

  useEffect(() => {
    const t = searchParams?.get("tab");
    if (t && ["tickets", "garantias", "wiki"].includes(t)) {
      setActiveTab(t as any);
    }
  }, [searchParams]);

  // Estado Tickets
  const [tickets, setTickets] = useState<TicketSoporte[]>(TICKETS_INICIALES);
  const [searchTicket, setSearchTicket] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("todos");
  const [modalNuevoTicket, setModalNuevoTicket] = useState(false);
  const [ticketSeleccionado, setTicketSeleccionado] = useState<TicketSoporte | null>(null);

  // Formulario nuevo ticket
  const [formCliente, setFormCliente] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formServicio, setFormServicio] = useState<TicketSoporte["servicio"]>("cctv");
  const [formTipoPlan, setFormTipoPlan] = useState<TicketSoporte["tipoPlan"]>("basico");
  const [formPrioridad, setFormPrioridad] = useState<TicketSoporte["prioridad"]>("media");
  const [formAsunto, setFormAsunto] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formTecnico, setFormTecnico] = useState("");

  // Estado Garantías
  const [garantias, setGarantias] = useState<RegistroGarantia[]>(GARANTIAS_INICIALES);
  const [searchGarantia, setSearchGarantia] = useState("");
  const [modalNuevaGarantia, setModalNuevaGarantia] = useState(false);
  const [formSerial, setFormSerial] = useState("");
  const [formEquipo, setFormEquipo] = useState("");
  const [formClienteGarantia, setFormClienteGarantia] = useState("");
  const [formFacturaRef, setFormFacturaRef] = useState("");

  // Cargar datos persistidos en localStorage si existen
  useEffect(() => {
    try {
      const savedTickets = localStorage.getItem("ts_soporte_tickets");
      if (savedTickets) setTickets(JSON.parse(savedTickets));

      const savedGarantias = localStorage.getItem("ts_soporte_garantias");
      if (savedGarantias) setGarantias(JSON.parse(savedGarantias));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const guardarTicketsLocal = (nuevos: TicketSoporte[]) => {
    setTickets(nuevos);
    try {
      localStorage.setItem("ts_soporte_tickets", JSON.stringify(nuevos));
    } catch (e) {
      console.error(e);
    }
  };

  const guardarGarantiasLocal = (nuevas: RegistroGarantia[]) => {
    setGarantias(nuevas);
    try {
      localStorage.setItem("ts_soporte_garantias", JSON.stringify(nuevas));
    } catch (e) {
      console.error(e);
    }
  };

  // Crear Ticket
  const handleCrearTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCliente || !formAsunto) return;

    const correlativo = tickets.length + 1;
    const nuevo: TicketSoporte = {
      id: "tk-" + Date.now(),
      codigo: `TCK-2026-${String(correlativo).padStart(3, "0")}`,
      cliente: formCliente,
      telefono: formTelefono,
      servicio: formServicio,
      tipoPlan: formTipoPlan,
      prioridad: formPrioridad,
      estado: "abierto",
      asunto: formAsunto,
      descripcion: formDescripcion,
      tecnicoAsignado: formTecnico || "Por Asignar",
      fechaCreacion: new Date().toISOString().replace("T", " ").substring(0, 16),
    };

    guardarTicketsLocal([nuevo, ...tickets]);
    setModalNuevoTicket(false);

    // Reset form
    setFormCliente("");
    setFormTelefono("");
    setFormAsunto("");
    setFormDescripcion("");
    setFormTecnico("");
  };

  // Cambiar Estado Ticket
  const handleCambiarEstadoTicket = (ticketId: string, nuevoEstado: TicketSoporte["estado"]) => {
    const actualizados = tickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          estado: nuevoEstado,
          fechaCierre: nuevoEstado === "resuelto" || nuevoEstado === "cerrado" 
            ? new Date().toISOString().replace("T", " ").substring(0, 16) 
            : undefined,
        };
      }
      return t;
    });
    guardarTicketsLocal(actualizados);
    if (ticketSeleccionado && ticketSeleccionado.id === ticketId) {
      setTicketSeleccionado({ ...ticketSeleccionado, estado: nuevoEstado });
    }
  };

  // Crear Garantía
  const handleCrearGarantia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSerial || !formEquipo || !formClienteGarantia) return;

    const nueva: RegistroGarantia = {
      id: "gar-" + Date.now(),
      serial: formSerial.toUpperCase().trim(),
      equipo: formEquipo,
      cliente: formClienteGarantia,
      fechaInstalacion: new Date().toISOString().split("T")[0],
      mesesGarantia: 12, // Política oficial: 1 año de garantía
      facturaRef: formFacturaRef || undefined,
      estado: "activa",
    };

    guardarGarantiasLocal([nueva, ...garantias]);
    setModalNuevaGarantia(false);

    setFormSerial("");
    setFormEquipo("");
    setFormClienteGarantia("");
    setFormFacturaRef("");
  };

  // Filtrado de Tickets
  const ticketsFiltrados = useMemo(() => {
    return tickets.filter((t) => {
      const cumpleFiltroEstado = filtroEstado === "todos" || t.estado === filtroEstado;
      const cumpleFiltroPrioridad = filtroPrioridad === "todos" || t.prioridad === filtroPrioridad;
      const term = searchTicket.toLowerCase();
      const cumpleSearch =
        t.codigo.toLowerCase().includes(term) ||
        t.cliente.toLowerCase().includes(term) ||
        t.asunto.toLowerCase().includes(term) ||
        t.telefono.includes(term);

      return cumpleFiltroEstado && cumpleFiltroPrioridad && cumpleSearch;
    });
  }, [tickets, searchTicket, filtroEstado, filtroPrioridad]);

  // Filtrado de Garantías
  const garantiasFiltradas = useMemo(() => {
    return garantias.filter((g) => {
      const term = searchGarantia.toLowerCase();
      return (
        g.serial.toLowerCase().includes(term) ||
        g.equipo.toLowerCase().includes(term) ||
        g.cliente.toLowerCase().includes(term) ||
        (g.facturaRef && g.facturaRef.toLowerCase().includes(term))
      );
    });
  }, [garantias, searchGarantia]);

  // Contadores KPI
  const kpiAbiertos = tickets.filter((t) => t.estado === "abierto" || t.estado === "en_diagnostico").length;
  const kpiUrgentes = tickets.filter((t) => t.prioridad === "urgente" && t.estado !== "resuelto" && t.estado !== "cerrado").length;
  const kpiPremium = tickets.filter((t) => t.tipoPlan === "premium").length;
  const kpiGarantiasActivas = garantias.filter((g) => g.estado === "activa").length;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--ts-bg)] pb-28 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Encabezado y Selector de Tabs ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--ts-text-primary)]">
                Soporte Técnico, Garantías & Postventa
              </h1>
            </div>
            <p className="text-xs text-[var(--ts-text-muted)] mt-1">
              Atención de incidencias, trazabilidad de seriales (1 año de garantía en cámaras) y base técnica.
            </p>
          </div>

          {/* Switcher de Vistas */}
          <div className="flex bg-[var(--ts-surface)] border border-[var(--ts-border)] p-1 rounded-xl shadow-xs self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("tickets")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "tickets"
                  ? "bg-[var(--ts-red)] text-white shadow-xs"
                  : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Tickets ({tickets.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("garantias")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "garantias"
                  ? "bg-[var(--ts-red)] text-white shadow-xs"
                  : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Garantías & Seriales</span>
            </button>
            <button
              onClick={() => setActiveTab("wiki")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "wiki"
                  ? "bg-[var(--ts-red)] text-white shadow-xs"
                  : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Base Técnica (Wiki)</span>
            </button>
          </div>
        </div>

        {/* ── KPIs Rápidos ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] p-3.5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-[var(--ts-text-muted)] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Tickets Activos</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl font-black text-[var(--ts-text-primary)]">{kpiAbiertos}</p>
            <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">En cola de atención</p>
          </div>

          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] p-3.5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-[var(--ts-text-muted)] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Prioridad Urgente</span>
              <AlertOctagon className="w-4 h-4 text-[var(--ts-red)]" />
            </div>
            <p className="text-xl font-black text-[var(--ts-red)]">{kpiUrgentes}</p>
            <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Requieren atención inmediata</p>
          </div>

          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] p-3.5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-[var(--ts-text-muted)] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Clientes Plan $5/mes</span>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-xl font-black text-purple-600 dark:text-purple-400">{kpiPremium}</p>
            <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Soporte prioritario</p>
          </div>

          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] p-3.5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-[var(--ts-text-muted)] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Garantías Vigentes</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{kpiGarantiasActivas}</p>
            <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Equipos bajo 1 año de respaldo</p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            TAB 1: MESA DE AYUDA (TICKETS)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            {/* Barra de Filtros y Acción */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTicket}
                  onChange={(e) => setSearchTicket(e.target.value)}
                  placeholder="Buscar por código, cliente, problema..."
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
                  <option value="abierto">Abiertos</option>
                  <option value="en_diagnostico">En Diagnóstico</option>
                  <option value="visita_programada">Visita Programada</option>
                  <option value="resuelto">Resueltos</option>
                </select>

                <select
                  value={filtroPrioridad}
                  onChange={(e) => setFiltroPrioridad(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] font-medium"
                >
                  <option value="todos">Todas las Prioridades</option>
                  <option value="urgente">Urgente</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>

                <button
                  onClick={() => setModalNuevoTicket(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[var(--ts-red)] hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Ticket</span>
                </button>
              </div>
            </div>

            {/* Listado de Tickets */}
            <div className="grid grid-cols-1 gap-3">
              {ticketsFiltrados.length === 0 ? (
                <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-10 text-center text-[var(--ts-text-muted)]">
                  <LifeBuoy className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  <p className="text-sm font-bold text-[var(--ts-text-primary)]">No hay tickets registrados con estos filtros</p>
                  <p className="text-xs mt-1">Crea un nuevo ticket o ajusta tu búsqueda.</p>
                </div>
              ) : (
                ticketsFiltrados.map((t) => (
                  <div
                    key={t.id}
                    className="bg-[var(--ts-surface)] border border-[var(--ts-border)] hover:border-cyan-500/40 rounded-2xl p-4 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono font-black text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg">
                          {t.codigo}
                        </span>

                        {t.tipoPlan === "premium" ? (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Plan $5/mes (Prioritario)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[var(--ts-text-muted)] bg-[var(--ts-surface-2)] px-2 py-0.5 rounded-full">
                            Soporte Estándar (L-V)
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            t.prioridad === "urgente"
                              ? "bg-red-500/10 text-[var(--ts-red)] border border-red-500/20"
                              : t.prioridad === "alta"
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              : "bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)]"
                          }`}
                        >
                          {t.prioridad}
                        </span>

                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            t.estado === "resuelto"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : t.estado === "en_diagnostico"
                              ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          }`}
                        >
                          {t.estado.replace("_", " ")}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-[var(--ts-text-primary)] mb-1">
                        {t.asunto}
                      </h3>
                      <p className="text-xs text-[var(--ts-text-muted)] line-clamp-2 mb-2">
                        {t.descripcion}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--ts-text-muted)]">
                        <span className="flex items-center gap-1 font-semibold text-[var(--ts-text-primary)]">
                          <User className="w-3.5 h-3.5 text-cyan-600" />
                          {t.cliente}
                        </span>
                        {t.telefono && (
                          <a
                            href={`https://wa.me/58${t.telefono.replace(/\D/g, "").replace(/^0/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-emerald-600 hover:underline"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            {t.telefono}
                          </a>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {t.fechaCreacion}
                        </span>
                        {t.tecnicoAsignado && (
                          <span className="flex items-center gap-1 bg-[var(--ts-surface-2)] px-2 py-0.5 rounded-md">
                            <HardHat className="w-3.5 h-3.5 text-amber-500" />
                            {t.tecnicoAsignado}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <select
                        value={t.estado}
                        onChange={(e) => handleCambiarEstadoTicket(t.id, e.target.value as TicketSoporte["estado"])}
                        className="text-xs px-2.5 py-1.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] font-bold cursor-pointer"
                      >
                        <option value="abierto">Abierto</option>
                        <option value="en_diagnostico">En Diagnóstico</option>
                        <option value="visita_programada">Visita Programada</option>
                        <option value="resuelto">Resuelto</option>
                        <option value="cerrado">Cerrado</option>
                      </select>

                      <button
                        onClick={() => setTicketSeleccionado(t)}
                        className="p-2 rounded-xl border border-[var(--ts-border)] hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2: GARANTÍAS & SERIALES (1 AÑO EN CÁMARAS)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "garantias" && (
          <div className="space-y-4">
            {/* Banner Oficial de Política de Garantía */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Política Oficial TecnoSmart: 1 Año de Garantía en Cámaras & Equipos CCTV
                </h4>
                <p className="text-xs text-[var(--ts-text-muted)] mt-0.5">
                  Todo equipo instalado cuenta con 365 días continuos de respaldo ante defectos de fábrica. No cubre descargas atmosféricas directas o manipulación no autorizada.
                </p>
              </div>
            </div>

            {/* Barra de Búsqueda y Botón Registro */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchGarantia}
                  onChange={(e) => setSearchGarantia(e.target.value)}
                  placeholder="Buscar por número de serial, modelo o cliente..."
                  className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] placeholder:text-[var(--ts-text-muted)] focus:outline-none focus:border-[var(--ts-red)] font-mono"
                />
              </div>

              <button
                onClick={() => setModalNuevaGarantia(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--ts-red)] hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors self-end sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Serial de Obra</span>
              </button>
            </div>

            {/* Tabla de Seriales */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)] text-[var(--ts-text-muted)] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4">Serial / S/N</th>
                      <th className="py-3 px-4">Equipo / Modelo</th>
                      <th className="py-3 px-4">Cliente Asignado</th>
                      <th className="py-3 px-4">Fecha Instalación</th>
                      <th className="py-3 px-4">Vigencia</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ts-border)]">
                    {garantiasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[var(--ts-text-muted)]">
                          No se encontraron registros de seriales bajo este criterio.
                        </td>
                      </tr>
                    ) : (
                      garantiasFiltradas.map((g) => (
                        <tr key={g.id} className="hover:bg-[var(--ts-surface-2)]/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[var(--ts-text-primary)]">
                            {g.serial}
                          </td>
                          <td className="py-3 px-4 font-medium text-[var(--ts-text-primary)]">
                            {g.equipo}
                            {g.facturaRef && (
                              <span className="block text-[10px] text-[var(--ts-text-muted)] font-mono">
                                Factura: {g.facturaRef}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[var(--ts-text-muted)] font-semibold">
                            {g.cliente}
                          </td>
                          <td className="py-3 px-4 text-[var(--ts-text-muted)]">
                            {g.fechaInstalacion}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[var(--ts-text-primary)]">
                            12 meses (1 año)
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                g.estado === "activa"
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                  : g.estado === "por_vencer"
                                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                  : "bg-red-500/10 text-[var(--ts-red)] border border-red-500/20"
                              }`}
                            >
                              {g.estado.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 3: BASE DE CONOCIMIENTO (WIKI TÉCNICA)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "wiki" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WIKI_ARTICULOS.map((art) => (
                <div
                  key={art.id}
                  className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                        {art.categoria}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-[var(--ts-text-muted)]">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Ficha Técnica</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-[var(--ts-text-primary)] mb-1">
                      {art.titulo}
                    </h3>
                    <p className="text-xs text-[var(--ts-text-muted)] mb-3">
                      {art.resumen}
                    </p>

                    <div className="bg-[var(--ts-surface-2)] p-3 rounded-xl border border-[var(--ts-border)] mb-3">
                      <p className="text-xs text-[var(--ts-text-primary)] font-medium mb-2">
                        {art.contenido}
                      </p>
                      {art.pasos && (
                        <ul className="space-y-1 text-xs font-mono text-[var(--ts-text-muted)]">
                          {art.pasos.map((paso, pIdx) => (
                            <li key={pIdx} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                              <span>{paso}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--ts-border)]">
                    {art.etiquetas.map((tag, tIdx) => (
                      <span key={tIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Modal Nuevo Ticket ── */}
      {modalNuevoTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl w-full max-w-lg p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-[var(--ts-border)] pb-3">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-black text-[var(--ts-text-primary)]">Abrir Nuevo Ticket Técnico</h3>
              </div>
              <button
                onClick={() => setModalNuevoTicket(false)}
                className="p-1 rounded-lg text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearTicket} className="space-y-3">
              <div>
                <label className="field-label">Cliente / Razón Social *</label>
                <input
                  type="text"
                  required
                  value={formCliente}
                  onChange={(e) => setFormCliente(e.target.value)}
                  placeholder="Ej. Abasto San Juan / Residencia Don Pedro"
                  className="field-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    placeholder="0412-1234567"
                    className="field-input font-mono"
                  />
                </div>

                <div>
                  <label className="field-label">Servicio Afectado</label>
                  <select
                    value={formServicio}
                    onChange={(e) => setFormServicio(e.target.value as any)}
                    className="field-input"
                  >
                    <option value="cctv">CCTV / Cámaras</option>
                    <option value="starlink">Starlink</option>
                    <option value="redes">Redes & Cableado</option>
                    <option value="domotica">Domótica & Control de Acceso</option>
                    <option value="automatizacion">Automatizaciones</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Tipo de Plan</label>
                  <select
                    value={formTipoPlan}
                    onChange={(e) => setFormTipoPlan(e.target.value as any)}
                    className="field-input font-bold"
                  >
                    <option value="basico">Soporte Estándar (L-V)</option>
                    <option value="premium">Plan Premium $5/mes (Prioridad)</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Prioridad</label>
                  <select
                    value={formPrioridad}
                    onChange={(e) => setFormPrioridad(e.target.value as any)}
                    className="field-input"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente (Falla Total)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">Asunto / Falla Reportada *</label>
                <input
                  type="text"
                  required
                  value={formAsunto}
                  onChange={(e) => setFormAsunto(e.target.value)}
                  placeholder="Ej. Grabador reinicia constantemente tras bajón"
                  className="field-input"
                />
              </div>

              <div>
                <label className="field-label">Descripción Detallada</label>
                <textarea
                  rows={3}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Explique las pruebas realizadas, síntomas o fotos provistas..."
                  className="field-input resize-none"
                />
              </div>

              <div>
                <label className="field-label">Técnico Asignado</label>
                <input
                  type="text"
                  value={formTecnico}
                  onChange={(e) => setFormTecnico(e.target.value)}
                  placeholder="Ej. Cuadrilla 1 / Ing. Técnico"
                  className="field-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--ts-border)]">
                <button
                  type="button"
                  onClick={() => setModalNuevoTicket(false)}
                  className="px-4 py-2 text-xs font-bold text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Registrar Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Registrar Serial / Garantía ── */}
      {modalNuevaGarantia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-[var(--ts-border)] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-[var(--ts-text-primary)]">Registrar Serial en Garantía</h3>
              </div>
              <button
                onClick={() => setModalNuevaGarantia(false)}
                className="p-1 rounded-lg text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearGarantia} className="space-y-3">
              <div>
                <label className="field-label">Serial del Fabricante (S/N) *</label>
                <input
                  type="text"
                  required
                  value={formSerial}
                  onChange={(e) => setFormSerial(e.target.value)}
                  placeholder="Ej. HK-DS2CD2043-98214"
                  className="field-input font-mono font-bold"
                />
              </div>

              <div>
                <label className="field-label">Equipo / Modelo *</label>
                <input
                  type="text"
                  required
                  value={formEquipo}
                  onChange={(e) => setFormEquipo(e.target.value)}
                  placeholder="Ej. Cámara IP 4MP Domo Antivandálico"
                  className="field-input"
                />
              </div>

              <div>
                <label className="field-label">Cliente / Ubicación *</label>
                <input
                  type="text"
                  required
                  value={formClienteGarantia}
                  onChange={(e) => setFormClienteGarantia(e.target.value)}
                  placeholder="Ej. Supermercado El Ahorro Tinaquillo"
                  className="field-input"
                />
              </div>

              <div>
                <label className="field-label">Factura / Nota de Entrega Ref.</label>
                <input
                  type="text"
                  value={formFacturaRef}
                  onChange={(e) => setFormFacturaRef(e.target.value)}
                  placeholder="Ej. FAC-0095"
                  className="field-input font-mono uppercase"
                />
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                Se registrará con 12 meses continuos de garantía oficial TecnoSmart a partir de hoy.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--ts-border)]">
                <button
                  type="button"
                  onClick={() => setModalNuevaGarantia(false)}
                  className="px-4 py-2 text-xs font-bold text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Guardar Garantía
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Detalle de Ticket ── */}
      {ticketSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl w-full max-w-lg p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-[var(--ts-border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-cyan-600 bg-cyan-500/10 px-2 py-0.5 rounded-lg">
                  {ticketSeleccionado.codigo}
                </span>
                <h3 className="text-sm font-bold text-[var(--ts-text-primary)] truncate max-w-xs">
                  {ticketSeleccionado.cliente}
                </h3>
              </div>
              <button
                onClick={() => setTicketSeleccionado(null)}
                className="p-1 rounded-lg text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[10px] text-[var(--ts-text-muted)] font-bold uppercase tracking-wider">Asunto</p>
                <p className="text-sm font-bold text-[var(--ts-text-primary)] mt-0.5">{ticketSeleccionado.asunto}</p>
              </div>

              <div>
                <p className="text-[10px] text-[var(--ts-text-muted)] font-bold uppercase tracking-wider">Descripción del Problema</p>
                <p className="text-xs text-[var(--ts-text-muted)] mt-1 p-3 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)]">
                  {ticketSeleccionado.descripcion}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="text-[10px] text-[var(--ts-text-muted)] font-bold uppercase">Plan de Servicio</p>
                  <p className="font-bold text-[var(--ts-text-primary)] mt-0.5">
                    {ticketSeleccionado.tipoPlan === "premium" ? "Plan Premium $5/mes (24/7 Prioritario)" : "Soporte Estándar (L-V Oficina)"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-[var(--ts-text-muted)] font-bold uppercase">Técnico Asignado</p>
                  <p className="font-bold text-[var(--ts-text-primary)] mt-0.5">{ticketSeleccionado.tecnicoAsignado || "No asignado"}</p>
                </div>
              </div>

              {ticketSeleccionado.solucion && (
                <div className="pt-2">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Solución Técnica Aplicada</p>
                  <p className="text-xs text-[var(--ts-text-primary)] mt-1 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    {ticketSeleccionado.solucion}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--ts-border)] mt-4">
              <button
                onClick={() => setTicketSeleccionado(null)}
                className="px-4 py-2 bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] font-bold text-xs rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
