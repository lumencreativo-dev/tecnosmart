"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  LifeBuoy, ShieldCheck, BookOpen, Plus, Search, Filter,
  CheckCircle2, Clock, AlertTriangle, AlertOctagon, Wrench,
  Smartphone, User, Calendar, ExternalLink, ChevronRight,
  Shield, Tag, Check, MessageSquare, ArrowRight, Eye, X,
  FileText, Sparkles, HelpCircle, HardHat, Wifi, Camera,
  Network, Cpu, KeyRound, Mail, Send, Settings, Loader2,
  Lock, RefreshCw, Crown, Edit3, Link2, Unlink, Building2,
  Phone, MapPin, CheckCircle, UserPlus, Archive, RotateCcw
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUsuario } from "@/hooks/useUsuario";
import { limpiarTextoMime } from "@/lib/utils";

// ── Tipos ──────────────────────────────────────────────────────────
export interface TicketSoporte {
  id: string;
  codigo: string;
  cliente: string;
  cliente_id?: string | null;
  cedula_rif?: string | null;
  email_cliente?: string | null;
  telefono: string;
  servicio: string;
  categoria_id?: string;
  tipoPlan: "basico" | "premium";
  prioridad: "baja" | "media" | "alta" | "urgente";
  estado: "abierto" | "en_diagnostico" | "visita_programada" | "resuelto" | "cerrado";
  asunto: string;
  descripcion: string;
  respuestas_guia?: Record<string, string>;
  tecnicoAsignado?: string;
  fechaCreacion: string;
  fechaCierre?: string;
  solucion?: string;
  canal_origen?: string;
  notas_internas?: string;
}

export interface CategoriaSoporte {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  descripcion?: string;
  activo?: boolean;
  orden?: number;
}

export interface MensajeTicket {
  id: string;
  ticket_id: string;
  remitente_tipo: "cliente" | "agente" | "sistema" | "nota_interna";
  remitente_nombre: string;
  remitente_email?: string;
  contenido: string;
  canal: string;
  es_privado: boolean;
  created_at: string;
}

export interface RegistroGarantia {
  id: string;
  serial: string;
  equipo: string;
  cliente: string;
  fechaInstalacion: string;
  mesesGarantia: number;
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

const CATEGORIAS_DEFAULT: CategoriaSoporte[] = [
  { id: "starlink", nombre: "Starlink / Internet Satelital", icono: "Wifi", color: "#6366f1", descripcion: "Fallas de conexión, router, antenas satelitales y soporte de flota.", activo: true, orden: 1 },
  { id: "cctv", nombre: "Seguridad Electrónica & CCTV", icono: "Camera", color: "#c9242b", descripcion: "Cámaras de seguridad, DVR, NVR, fuentes y monitoreo móvil.", activo: true, orden: 2 },
  { id: "redes", nombre: "Redes & Cableado Estructurado", icono: "Network", color: "#06b6d4", descripcion: "Switches, routers Mikrotik, puntos Cat6 y Wi-Fi.", activo: true, orden: 3 },
  { id: "automatizacion", nombre: "Automatización & Portones", icono: "Cpu", color: "#10b981", descripcion: "Motores corredizos, brazos abatibles y controles.", activo: true, orden: 4 },
  { id: "domotica", nombre: "Domótica & Control de Acceso", icono: "KeyRound", color: "#8b5cf6", descripcion: "Cerraduras inteligentes, biométricos y alarmas.", activo: true, orden: 5 },
  { id: "garantia", nombre: "Garantía Oficial de Hardware", icono: "ShieldCheck", color: "#f59e0b", descripcion: "Validación de 1 año de garantía en cámaras y equipos.", activo: true, orden: 6 },
  { id: "otro", nombre: "Consultas Generales & Otro", icono: "LifeBuoy", color: "#64748b", descripcion: "Otras solicitudes técnicas o comerciales.", activo: true, orden: 99 },
];

const WIKI_ARTICULOS: ArticuloWiki[] = [
  {
    id: "wiki-1",
    titulo: "Norma de Ponchado T568B para Cableado Estructurado",
    categoria: "redes",
    resumen: "Esquema obligatorio de colores para todo cable Cat6 UTP en instalaciones TecnoSmart.",
    contenido: "Para garantizar el cumplimiento de normativas internacionales y certificar enlaces a 1 Gbps, todo conector RJ45 debe poncharse bajo el estándar T568B:",
    pasos: [
      "1. Blanco/Naranja", "2. Naranja", "3. Blanco/Verde", "4. Azul",
      "5. Blanco/Azul", "6. Verde", "7. Blanco/Marrón", "8. Marrón",
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

  // Categorías
  const [categorias, setCategorias] = useState<CategoriaSoporte[]>(CATEGORIAS_DEFAULT);
  const [modalCategorias, setModalCategorias] = useState(false);
  const [nuevaCatNombre, setNuevaCatNombre] = useState("");
  const [nuevaCatId, setNuevaCatId] = useState("");
  const [nuevaCatColor, setNuevaCatColor] = useState("#c9242b");
  const [nuevaCatDesc, setNuevaCatDesc] = useState("");

  // Estado Tickets
  const [tickets, setTickets] = useState<TicketSoporte[]>([]);
  const [vistaTickets, setVistaTickets] = useState<"activos" | "atendidos" | "todos">("activos");
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [searchTicket, setSearchTicket] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("todos");
  const [filtroServicio, setFiltroServicio] = useState<string>("todos");
  const [modalNuevoTicket, setModalNuevoTicket] = useState(false);
  const [ticketSeleccionado, setTicketSeleccionado] = useState<TicketSoporte | null>(null);

  // Formulario nuevo ticket interno
  const [formCliente, setFormCliente] = useState("");
  const [formCedulaRif, setFormCedulaRif] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formServicio, setFormServicio] = useState<string>("cctv");
  const [formTipoPlan, setFormTipoPlan] = useState<TicketSoporte["tipoPlan"]>("basico");
  const [formPrioridad, setFormPrioridad] = useState<TicketSoporte["prioridad"]>("media");
  const [formAsunto, setFormAsunto] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formTecnico, setFormTecnico] = useState("");

  // Hilo de mensajes & Respuesta
  const [mensajesTicket, setMensajesTicket] = useState<MensajeTicket[]>([]);
  const [loadingMensajes, setLoadingMensajes] = useState(false);
  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [esNotaInterna, setEsNotaInterna] = useState(false);
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

  // Ficha 360 del Cliente (Dossier)
  const [clienteDossier, setClienteDossier] = useState<{
    cliente: any | null;
    starlinks: any[];
    garantias: any[];
    totalGastado: number;
  }>({ cliente: null, starlinks: [], garantias: [], totalGastado: 0 });
  const [loadingDossier, setLoadingDossier] = useState(false);

  // Estados para Registrar / Editar Cliente en CRM desde el Ticket
  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [modoCliente, setModoCliente] = useState<"crear" | "editar">("crear");
  const [formClienteData, setFormClienteData] = useState({
    contacto: "",
    empresa: "",
    rif_cedula: "",
    telefono: "",
    email: "",
    direccion: "",
    tipo: "Normal",
    notas: "",
  });
  const [guardandoCliente, setGuardandoCliente] = useState(false);

  // Estados para Enlazar Ticket a Cliente Existente
  const [modalEnlazarOpen, setModalEnlazarOpen] = useState(false);
  const [busquedaEnlazar, setBusquedaEnlazar] = useState("");
  const [clientesCrm, setClientesCrm] = useState<any[]>([]);
  const [cargandoCrm, setCargandoCrm] = useState(false);

  // Estado Garantías
  const [garantias, setGarantias] = useState<RegistroGarantia[]>([]);
  const [searchGarantia, setSearchGarantia] = useState("");
  const [modalNuevaGarantia, setModalNuevaGarantia] = useState(false);
  const [formSerial, setFormSerial] = useState("");
  const [formEquipo, setFormEquipo] = useState("");
  const [formClienteGarantia, setFormClienteGarantia] = useState("");
  const [formFacturaRef, setFormFacturaRef] = useState("");

  // Cargar Categorías
  const cargarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from("soporte_categorias")
        .select("*")
        .order("orden", { ascending: true });
      if (data && data.length > 0) {
        setCategorias(data);
      }
    } catch (e) {
      // Usar defaults
    }
  };

  // Cargar Tickets desde Supabase
  const cargarTickets = async () => {
    setLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from("tickets_soporte")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const mapeados: TicketSoporte[] = data.map((t: any) => ({
          id: t.id,
          codigo: t.codigo,
          cliente: t.cliente,
          cliente_id: t.cliente_id,
          cedula_rif: t.cedula_rif,
          email_cliente: t.email_cliente,
          telefono: t.telefono || "",
          servicio: t.categoria_id || t.servicio || "cctv",
          categoria_id: t.categoria_id || t.servicio,
          tipoPlan: t.tipo_plan === "premium" ? "premium" : "basico",
          prioridad: t.prioridad || "media",
          estado: t.estado || "abierto",
          asunto: t.asunto,
          descripcion: t.descripcion || "",
          respuestas_guia: t.respuestas_guia || {},
          tecnicoAsignado: t.tecnico_asignado || "Por Asignar",
          fechaCreacion: (t.created_at || "").replace("T", " ").substring(0, 16),
          fechaCierre: t.fecha_cierre ? t.fecha_cierre.replace("T", " ").substring(0, 16) : undefined,
          solucion: t.solucion,
          canal_origen: t.canal_origen || "web_form",
          notas_internas: t.notas_internas,
        }));
        setTickets(mapeados);
        localStorage.setItem("ts_soporte_tickets", JSON.stringify(mapeados));
      } else {
        // Fallback a localStorage si la base de datos está vacía
        const saved = localStorage.getItem("ts_soporte_tickets");
        if (saved) setTickets(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error al cargar tickets:", e);
      const saved = localStorage.getItem("ts_soporte_tickets");
      if (saved) setTickets(JSON.parse(saved));
    } finally {
      setLoadingTickets(false);
    }
  };

  // Cargar Garantías desde Supabase
  const cargarGarantias = async () => {
    try {
      const { data } = await supabase
        .from("garantias_equipos")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const mapeadas: RegistroGarantia[] = data.map((g: any) => ({
          id: g.id,
          serial: g.serial,
          equipo: g.equipo,
          cliente: g.cliente,
          fechaInstalacion: g.fecha_instalacion,
          mesesGarantia: g.meses_garantia || 12,
          facturaRef: g.factura_ref,
          estado: g.estado || "activa",
        }));
        setGarantias(mapeadas);
      } else {
        const saved = localStorage.getItem("ts_soporte_garantias");
        if (saved) setGarantias(JSON.parse(saved));
      }
    } catch (e) {
      const saved = localStorage.getItem("ts_soporte_garantias");
      if (saved) setGarantias(JSON.parse(saved));
    }
  };

  useEffect(() => {
    cargarCategorias();
    cargarTickets();
    cargarGarantias();
  }, []);

  // Cargar Mensajes y Dossier 360 cuando se selecciona un Ticket
  useEffect(() => {
    if (!ticketSeleccionado) {
      setMensajesTicket([]);
      setClienteDossier({ cliente: null, starlinks: [], garantias: [], totalGastado: 0 });
      return;
    }

    const cargarDetallesTicket = async () => {
      setLoadingMensajes(true);
      setLoadingDossier(true);

      // 1. Cargar Mensajes
      try {
        const { data: msgs } = await supabase
          .from("ticket_mensajes")
          .select("*")
          .eq("ticket_id", ticketSeleccionado.id)
          .order("created_at", { ascending: true });

        if (msgs) setMensajesTicket(msgs as MensajeTicket[]);
      } catch (err) {
        console.warn("Could not load messages:", err);
      } finally {
        setLoadingMensajes(false);
      }

      // 2. Cargar Dossier 360 del Cliente (si está vinculado)
      try {
        let clienteEncontrado: any = null;

        if (ticketSeleccionado.cliente_id) {
          const { data } = await supabase
            .from("clientes")
            .select("*")
            .eq("id", ticketSeleccionado.cliente_id)
            .maybeSingle();
          clienteEncontrado = data;
        } else if (ticketSeleccionado.cedula_rif || ticketSeleccionado.email_cliente || ticketSeleccionado.telefono) {
          const cleanEmail = (ticketSeleccionado.email_cliente || "").toLowerCase().trim();
          const cleanRif = (ticketSeleccionado.cedula_rif || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
          const cleanTel = (ticketSeleccionado.telefono || "").replace(/\D/g, "");

          // Búsqueda en todo el directorio de clientes sin límite restrictivo
          const { data: list } = await supabase.from("clientes").select("*");
          if (list) {
            clienteEncontrado = list.find((c: any) => {
              if (cleanEmail && (c.email || "").toLowerCase().trim() === cleanEmail) return true;
              if (cleanRif && (c.rif_cedula || "").replace(/[^a-z0-9]/gi, "").toLowerCase() === cleanRif) return true;
              if (cleanTel.length >= 7 && (c.telefono || "").replace(/\D/g, "").includes(cleanTel)) return true;
              return false;
            });

            // Si se detectó automáticamente el cliente en CRM, asociarlo de inmediato al ticket en Supabase
            if (clienteEncontrado) {
              await supabase
                .from("tickets_soporte")
                .update({ cliente_id: clienteEncontrado.id })
                .eq("id", ticketSeleccionado.id);
            }
          }
        }

        if (clienteEncontrado) {
          // Cargar Starlinks vinculados
          const { data: susData } = await supabase
            .from("suscripciones")
            .select("*, servicios_recurrentes(nombre)")
            .eq("cliente_id", clienteEncontrado.id);

          // Cargar garantías vigentes
          const { data: garData } = await supabase
            .from("garantias_equipos")
            .select("*")
            .eq("cliente", clienteEncontrado.contacto || clienteEncontrado.empresa);

          setClienteDossier({
            cliente: clienteEncontrado,
            starlinks: susData || [],
            garantias: garData || [],
            totalGastado: 0,
          });
        } else {
          setClienteDossier({
            cliente: null,
            starlinks: [],
            garantias: [],
            totalGastado: 0,
          });
        }
      } catch (dossierErr) {
        console.warn("Error loading dossier:", dossierErr);
      } finally {
        setLoadingDossier(false);
      }
    };

    cargarDetallesTicket();
  }, [ticketSeleccionado]);

  // Abrir modal de creación de cliente precargando datos del ticket
  const abrirCrearCliente = () => {
    if (!ticketSeleccionado) return;
    setModoCliente("crear");
    setFormClienteData({
      contacto: ticketSeleccionado.cliente || "",
      empresa: "",
      rif_cedula: ticketSeleccionado.cedula_rif || "",
      telefono: ticketSeleccionado.telefono || "",
      email: ticketSeleccionado.email_cliente || "",
      direccion: "",
      tipo: "Normal",
      notas: `Registrado desde Ticket #${ticketSeleccionado.codigo}`,
    });
    setModalClienteOpen(true);
  };

  // Abrir modal de edición del cliente actualmente vinculado
  const abrirEditarCliente = () => {
    if (!clienteDossier.cliente) return;
    setModoCliente("editar");
    setFormClienteData({
      contacto: clienteDossier.cliente.contacto || "",
      empresa: clienteDossier.cliente.empresa || "",
      rif_cedula: clienteDossier.cliente.rif_cedula || "",
      telefono: clienteDossier.cliente.telefono || "",
      email: clienteDossier.cliente.email || "",
      direccion: clienteDossier.cliente.direccion || "",
      tipo: clienteDossier.cliente.tipo || "Normal",
      notas: clienteDossier.cliente.notas || "",
    });
    setModalClienteOpen(true);
  };

  // Guardar (Crear o Editar) Cliente en CRM sin redirigir ni perder contexto
  const handleGuardarClienteCRM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSeleccionado) return;
    setGuardandoCliente(true);

    try {
      const esVip = formClienteData.tipo === "VIP";

      if (modoCliente === "crear") {
        const payload = {
          contacto: formClienteData.contacto.trim(),
          empresa: formClienteData.empresa.trim() || formClienteData.contacto.trim(),
          rif_cedula: formClienteData.rif_cedula.trim() || null,
          telefono: formClienteData.telefono.trim() || null,
          email: formClienteData.email.trim() || null,
          direccion: formClienteData.direccion.trim() || null,
          tipo: formClienteData.tipo || "Normal",
          notas: formClienteData.notas.trim() || null,
        };

        const { data: nuevoCli, error: cliErr } = await supabase
          .from("clientes")
          .insert([payload])
          .select()
          .single();

        if (cliErr) throw cliErr;

        // Actualizar ticket con el nuevo cliente_id y sincronizar teléfono/email/prioridad
        const updateTicketPayload: any = {
          cliente_id: nuevoCli.id,
          cliente: nuevoCli.contacto || nuevoCli.empresa,
          telefono: nuevoCli.telefono || ticketSeleccionado.telefono,
          email_cliente: nuevoCli.email || ticketSeleccionado.email_cliente,
          cedula_rif: nuevoCli.rif_cedula || ticketSeleccionado.cedula_rif,
        };
        if (esVip) {
          updateTicketPayload.prioridad = "alta";
          updateTicketPayload.tipo_plan = "premium";
        }

        await supabase
          .from("tickets_soporte")
          .update(updateTicketPayload)
          .eq("id", ticketSeleccionado.id);

        const ticketActualizado: TicketSoporte = {
          ...ticketSeleccionado,
          cliente_id: nuevoCli.id,
          cliente: nuevoCli.contacto || nuevoCli.empresa,
          telefono: nuevoCli.telefono || ticketSeleccionado.telefono,
          email_cliente: nuevoCli.email || ticketSeleccionado.email_cliente,
          cedula_rif: nuevoCli.rif_cedula || ticketSeleccionado.cedula_rif,
          prioridad: esVip ? "alta" : ticketSeleccionado.prioridad,
          tipoPlan: esVip ? "premium" : ticketSeleccionado.tipoPlan,
        };

        setTicketSeleccionado(ticketActualizado);
        setTickets((prev) => prev.map((t) => (t.id === ticketSeleccionado.id ? ticketActualizado : t)));
        setClienteDossier({
          cliente: nuevoCli,
          starlinks: [],
          garantias: [],
          totalGastado: 0,
        });

      } else {
        // Modo Edición
        if (!clienteDossier.cliente?.id) return;
        const updatePayload = {
          contacto: formClienteData.contacto.trim(),
          empresa: formClienteData.empresa.trim() || formClienteData.contacto.trim(),
          rif_cedula: formClienteData.rif_cedula.trim() || null,
          telefono: formClienteData.telefono.trim() || null,
          email: formClienteData.email.trim() || null,
          direccion: formClienteData.direccion.trim() || null,
          tipo: formClienteData.tipo || "Normal",
          notas: formClienteData.notas.trim() || null,
        };

        const { error: updErr } = await supabase
          .from("clientes")
          .update(updatePayload)
          .eq("id", clienteDossier.cliente.id);

        if (updErr) throw updErr;

        const updateTicketPayload: any = {
          cliente: updatePayload.contacto || updatePayload.empresa,
          telefono: updatePayload.telefono || ticketSeleccionado.telefono,
          email_cliente: updatePayload.email || ticketSeleccionado.email_cliente,
          cedula_rif: updatePayload.rif_cedula || ticketSeleccionado.cedula_rif,
        };
        if (esVip) {
          updateTicketPayload.prioridad = "alta";
          updateTicketPayload.tipo_plan = "premium";
        }

        await supabase
          .from("tickets_soporte")
          .update(updateTicketPayload)
          .eq("id", ticketSeleccionado.id);

        const cliActualizado = { ...clienteDossier.cliente, ...updatePayload };
        setClienteDossier((prev) => ({ ...prev, cliente: cliActualizado }));

        const ticketActualizado: TicketSoporte = {
          ...ticketSeleccionado,
          cliente: updatePayload.contacto || updatePayload.empresa,
          telefono: updatePayload.telefono || ticketSeleccionado.telefono,
          email_cliente: updatePayload.email || ticketSeleccionado.email_cliente,
          cedula_rif: updatePayload.rif_cedula || ticketSeleccionado.cedula_rif,
          prioridad: esVip ? "alta" : ticketSeleccionado.prioridad,
          tipoPlan: esVip ? "premium" : ticketSeleccionado.tipoPlan,
        };
        setTicketSeleccionado(ticketActualizado);
        setTickets((prev) => prev.map((t) => (t.id === ticketSeleccionado.id ? ticketActualizado : t)));
      }

      setModalClienteOpen(false);
    } catch (err: any) {
      alert("Error al guardar cliente en CRM: " + err.message);
    } finally {
      setGuardandoCliente(false);
    }
  };

  // Abrir modal para buscar y enlazar a un cliente existente
  const abrirModalEnlazar = async () => {
    setModalEnlazarOpen(true);
    setBusquedaEnlazar("");
    setCargandoCrm(true);
    try {
      const { data } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setClientesCrm(data);
    } catch (e) {
      console.warn("Error cargando directorio de clientes:", e);
    } finally {
      setCargandoCrm(false);
    }
  };

  // Enlazar el ticket a un cliente seleccionado
  const handleEnlazarCliente = async (clienteElegido: any) => {
    if (!ticketSeleccionado) return;
    try {
      const esVip = clienteElegido.tipo === "VIP" || clienteElegido.tipo === "vip";
      const updateTicketPayload: any = {
        cliente_id: clienteElegido.id,
        cliente: clienteElegido.contacto || clienteElegido.empresa,
        telefono: ticketSeleccionado.telefono || clienteElegido.telefono || "",
        email_cliente: ticketSeleccionado.email_cliente || clienteElegido.email || null,
        cedula_rif: ticketSeleccionado.cedula_rif || clienteElegido.rif_cedula || null,
      };
      if (esVip) {
        updateTicketPayload.prioridad = "alta";
        updateTicketPayload.tipo_plan = "premium";
      }

      await supabase
        .from("tickets_soporte")
        .update(updateTicketPayload)
        .eq("id", ticketSeleccionado.id);

      // Cargar suscripciones y garantías del cliente enlazado
      const { data: susData } = await supabase
        .from("suscripciones")
        .select("*, servicios_recurrentes(nombre)")
        .eq("cliente_id", clienteElegido.id);

      const { data: garData } = await supabase
        .from("garantias_equipos")
        .select("*")
        .eq("cliente", clienteElegido.contacto || clienteElegido.empresa);

      const ticketActualizado: TicketSoporte = {
        ...ticketSeleccionado,
        cliente_id: clienteElegido.id,
        cliente: clienteElegido.contacto || clienteElegido.empresa,
        telefono: ticketSeleccionado.telefono || clienteElegido.telefono || "",
        email_cliente: ticketSeleccionado.email_cliente || clienteElegido.email || null,
        cedula_rif: ticketSeleccionado.cedula_rif || clienteElegido.rif_cedula || null,
        prioridad: esVip ? "alta" : ticketSeleccionado.prioridad,
        tipoPlan: esVip ? "premium" : ticketSeleccionado.tipoPlan,
      };

      setTicketSeleccionado(ticketActualizado);
      setTickets((prev) => prev.map((t) => (t.id === ticketSeleccionado.id ? ticketActualizado : t)));
      setClienteDossier({
        cliente: clienteElegido,
        starlinks: susData || [],
        garantias: garData || [],
        totalGastado: 0,
      });

      setModalEnlazarOpen(false);
    } catch (e: any) {
      alert("Error al enlazar cliente: " + e.message);
    }
  };

  // Crear Ticket desde el ERP
  const handleCrearTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCliente || !formAsunto) return;

    try {
      const payload = {
        cliente: formCliente.trim(),
        cedula_rif: formCedulaRif.trim() || null,
        email_cliente: formEmail.trim() || null,
        telefono: formTelefono.trim() || null,
        categoria_id: formServicio,
        servicio: formServicio,
        asunto: formAsunto.trim(),
        descripcion: formDescripcion.trim(),
        canal_origen: "interno",
      };

      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success && data.ticket) {
        await cargarTickets();
        setModalNuevoTicket(false);
        setFormCliente("");
        setFormCedulaRif("");
        setFormEmail("");
        setFormTelefono("");
        setFormAsunto("");
        setFormDescripcion("");
      } else {
        alert(data.error || "No se pudo registrar el ticket.");
      }
    } catch (err: any) {
      alert("Error al crear ticket: " + err.message);
    }
  };

  // Enviar Respuesta Oficial o Nota Interna
  const handleEnviarRespuesta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSeleccionado || !respuestaTexto.trim()) return;

    setEnviandoRespuesta(true);
    try {
      const payload = {
        ticketId: ticketSeleccionado.id,
        ticketCodigo: ticketSeleccionado.codigo,
        clienteEmail: ticketSeleccionado.email_cliente,
        clienteNombre: ticketSeleccionado.cliente,
        asuntoOriginal: ticketSeleccionado.asunto,
        agenteNombre: usuario?.nombre || "Soporte Técnico TecnoSmart",
        mensajeRespuesta: respuestaTexto.trim(),
        nuevoEstado: ticketSeleccionado.estado === "abierto" ? "en_diagnostico" : ticketSeleccionado.estado,
        esNotaInterna,
        enviarEmail: !esNotaInterna && Boolean(ticketSeleccionado.email_cliente),
      };

      const res = await fetch("/api/support/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        // Añadir mensaje a la vista local
        const nuevoMensaje: MensajeTicket = {
          id: "msg-" + Date.now(),
          ticket_id: ticketSeleccionado.id,
          remitente_tipo: esNotaInterna ? "nota_interna" : "agente",
          remitente_nombre: usuario?.nombre || "Soporte Técnico",
          remitente_email: "soporte@somostecnosmart.com",
          contenido: respuestaTexto.trim(),
          canal: esNotaInterna ? "panel" : "email",
          es_privado: esNotaInterna,
          created_at: new Date().toISOString(),
        };
        setMensajesTicket([...mensajesTicket, nuevoMensaje]);
        setRespuestaTexto("");
        setEsNotaInterna(false);
        await cargarTickets();
      } else {
        alert(data.error || "No se pudo enviar la respuesta.");
      }
    } catch (err: any) {
      alert("Error al enviar respuesta: " + err.message);
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  // Cambiar Estado Rápido del Ticket
  const handleCambiarEstadoTicket = async (ticketId: string, nuevoEstado: TicketSoporte["estado"]) => {
    try {
      await supabase
        .from("tickets_soporte")
        .update({
          estado: nuevoEstado,
          fecha_cierre: nuevoEstado === "resuelto" || nuevoEstado === "cerrado" ? new Date().toISOString() : null,
        })
        .eq("id", ticketId);

      const actualizados = tickets.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            estado: nuevoEstado,
            fechaCierre: nuevoEstado === "resuelto" || nuevoEstado === "cerrado" ? new Date().toISOString().replace("T", " ").substring(0, 16) : undefined,
          };
        }
        return t;
      });
      setTickets(actualizados);
      if (ticketSeleccionado && ticketSeleccionado.id === ticketId) {
        setTicketSeleccionado({ ...ticketSeleccionado, estado: nuevoEstado });
      }
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    }
  };

  // Marcar como Resuelto con Solución Técnica
  const handleResolverConSolucion = async () => {
    if (!ticketSeleccionado) return;
    const solucion = prompt("Ingrese la solución técnica aplicada para cerrar el ticket:", ticketSeleccionado.solucion || "Se solventó la falla de configuración.");
    if (!solucion) return;

    try {
      await supabase
        .from("tickets_soporte")
        .update({
          estado: "resuelto",
          solucion,
          fecha_cierre: new Date().toISOString(),
        })
        .eq("id", ticketSeleccionado.id);

      await handleCambiarEstadoTicket(ticketSeleccionado.id, "resuelto");
      setTicketSeleccionado({
        ...ticketSeleccionado,
        estado: "resuelto",
        solucion,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Reabrir Ticket Atendido / Resuelto
  const handleReabrirTicket = async (ticketId: string) => {
    try {
      await supabase
        .from("tickets_soporte")
        .update({
          estado: "en_diagnostico",
          fecha_cierre: null,
        })
        .eq("id", ticketId);

      const actualizados = tickets.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            estado: "en_diagnostico" as TicketSoporte["estado"],
            fechaCierre: undefined,
          };
        }
        return t;
      });
      setTickets(actualizados);
      if (ticketSeleccionado && ticketSeleccionado.id === ticketId) {
        setTicketSeleccionado({
          ...ticketSeleccionado,
          estado: "en_diagnostico",
          fechaCierre: undefined,
        });
      }
    } catch (err) {
      console.error("Error al reabrir ticket:", err);
    }
  };

  // Agregar Nueva Categoría
  const handleCrearCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCatNombre || !nuevaCatId) return;

    const catSlug = nuevaCatId.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
    const nueva: CategoriaSoporte = {
      id: catSlug,
      nombre: nuevaCatNombre.trim(),
      icono: "HelpCircle",
      color: nuevaCatColor,
      descripcion: nuevaCatDesc.trim(),
      activo: true,
      orden: categorias.length + 1,
    };

    try {
      await supabase.from("soporte_categorias").insert(nueva);
      setCategorias([...categorias, nueva]);
      setModalCategorias(false);
      setNuevaCatNombre("");
      setNuevaCatId("");
      setNuevaCatDesc("");
    } catch (err: any) {
      alert("Error al guardar categoría en Supabase: " + err.message);
    }
  };

  // Filtrado de Tickets con Priorización VIP y Separación Activos vs Atendidos/Resueltos
  const ticketsFiltrados = useMemo(() => {
    return tickets
      .filter((t) => {
        // Segmentación por Vista Principal
        if (vistaTickets === "activos") {
          if (t.estado === "resuelto" || t.estado === "cerrado") return false;
        } else if (vistaTickets === "atendidos") {
          if (t.estado !== "resuelto" && t.estado !== "cerrado") return false;
        }

        const cumpleFiltroEstado = filtroEstado === "todos" || t.estado === filtroEstado;
        const cumpleFiltroPrioridad = filtroPrioridad === "todos" || t.prioridad === filtroPrioridad;
        const cumpleFiltroServicio = filtroServicio === "todos" || (t.categoria_id || t.servicio) === filtroServicio;
        const term = searchTicket.toLowerCase();
        const cumpleSearch =
          t.codigo.toLowerCase().includes(term) ||
          t.cliente.toLowerCase().includes(term) ||
          t.asunto.toLowerCase().includes(term) ||
          (t.cedula_rif && t.cedula_rif.toLowerCase().includes(term)) ||
          (t.email_cliente && t.email_cliente.toLowerCase().includes(term)) ||
          t.telefono.includes(term);

        return cumpleFiltroEstado && cumpleFiltroPrioridad && cumpleFiltroServicio && cumpleSearch;
      })
      .sort((a, b) => {
        // Priorizar tickets VIP y de prioridad Alta/Urgente al tope de la cola
        const aVip = a.tipoPlan === "premium" || a.prioridad === "urgente" || a.prioridad === "alta";
        const bVip = b.tipoPlan === "premium" || b.prioridad === "urgente" || b.prioridad === "alta";
        if (aVip && !bVip) return -1;
        if (!aVip && bVip) return 1;
        return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
      });
  }, [tickets, vistaTickets, searchTicket, filtroEstado, filtroPrioridad, filtroServicio]);

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
  const kpiAbiertos = tickets.filter((t) => t.estado !== "resuelto" && t.estado !== "cerrado").length;
  const kpiAtendidos = tickets.filter((t) => t.estado === "resuelto" || t.estado === "cerrado").length;
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
                Mesa de Ayuda & Soporte Omnicanal
              </h1>
            </div>
            <p className="text-xs text-[var(--ts-text-muted)] mt-1">
              Atención de incidencias vía Web/Email (<span className="font-mono text-cyan-600 font-bold">soporte@somostecnosmart.com</span>), garantías de 1 año y base técnica.
            </p>
          </div>

          {/* Switcher de Vistas */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-[var(--ts-surface)] border border-[var(--ts-border)] p-1 rounded-xl shadow-xs">
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

            <button
              onClick={() => setModalCategorias(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[var(--ts-surface)] hover:bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl text-xs font-bold text-[var(--ts-text-primary)] transition-colors shadow-xs"
              title="Configurar Categorías Dinámicas"
            >
              <Settings className="w-4 h-4 text-cyan-600" />
              <span className="hidden sm:inline">Categorías ({categorias.length})</span>
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
            <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">Soporte prioritario 24/7</p>
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
            TAB 1: MESA DE AYUDA (TICKETS OMNICANAL)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            {/* Selector de Vista: Cola Activa vs Atendidos & Resueltos */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--ts-surface)] border border-[var(--ts-border)] p-2.5 rounded-2xl shadow-xs">
              <div className="flex items-center gap-1.5 p-1 bg-[var(--ts-surface-2)] rounded-xl">
                <button
                  type="button"
                  onClick={() => setVistaTickets("activos")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    vistaTickets === "activos"
                      ? "bg-[var(--ts-red)] text-white shadow-xs"
                      : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>En Cola Activa</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    vistaTickets === "activos" ? "bg-white/20 text-white" : "bg-[var(--ts-surface)] text-[var(--ts-text-muted)]"
                  }`}>
                    {kpiAbiertos}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setVistaTickets("atendidos")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    vistaTickets === "atendidos"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Atendidos & Resueltos</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    vistaTickets === "atendidos" ? "bg-white/20 text-white" : "bg-[var(--ts-surface)] text-[var(--ts-text-muted)]"
                  }`}>
                    {kpiAtendidos}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setVistaTickets("todos")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    vistaTickets === "todos"
                      ? "bg-[var(--ts-surface)] text-[var(--ts-text-primary)] shadow-xs border border-[var(--ts-border)]"
                      : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                  }`}
                >
                  <span>Todos ({tickets.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--ts-text-muted)]">
                {vistaTickets === "activos" && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-amber-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Mostrando tickets pendientes de respuesta o diagnóstico
                  </span>
                )}
                {vistaTickets === "atendidos" && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Historial de incidencias resueltas y archivadas
                  </span>
                )}
              </div>
            </div>

            {/* Barra de Filtros y Acción */}
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTicket}
                  onChange={(e) => setSearchTicket(e.target.value)}
                  placeholder="Buscar por código, cédula, cliente, problema..."
                  className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] placeholder:text-[var(--ts-text-muted)] focus:outline-none focus:border-[var(--ts-red)]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={filtroServicio}
                  onChange={(e) => setFiltroServicio(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] font-medium"
                >
                  <option value="todos">Todos los Servicios</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>

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
                  onClick={cargarTickets}
                  className="p-2 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] hover:bg-[var(--ts-surface)] text-[var(--ts-text-muted)]"
                  title="Recargar tickets"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingTickets ? "animate-spin" : ""}`} />
                </button>

                <button
                  onClick={() => setModalNuevoTicket(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[var(--ts-red)] hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Ticket</span>
                </button>
              </div>
            </div>

            {/* Lista de Tickets */}
            <div className="space-y-3">
              {loadingTickets ? (
                <div className="py-12 text-center text-xs text-[var(--ts-text-muted)] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--ts-red)]" />
                  <span>Cargando tickets de soporte...</span>
                </div>
              ) : ticketsFiltrados.length === 0 ? (
                <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-12 text-center text-[var(--ts-text-muted)]">
                  {vistaTickets === "atendidos" ? (
                    <>
                      <Archive className="w-10 h-10 mx-auto mb-3 opacity-30 text-emerald-600" />
                      <p className="text-sm font-bold text-[var(--ts-text-primary)]">No hay tickets atendidos o resueltos con estos filtros</p>
                      <p className="text-xs mt-1">Los tickets marcados como resueltos o cerrados se archivarán aquí automáticamente.</p>
                    </>
                  ) : (
                    <>
                      <LifeBuoy className="w-10 h-10 mx-auto mb-3 opacity-30 text-cyan-600" />
                      <p className="text-sm font-bold text-[var(--ts-text-primary)]">
                        {vistaTickets === "activos" ? "¡Excelente! No hay tickets pendientes en la cola activa" : "No hay tickets registrados con estos filtros"}
                      </p>
                      <p className="text-xs mt-1">Crea un nuevo ticket o ajusta tus filtros de búsqueda.</p>
                    </>
                  )}
                </div>
              ) : (
                ticketsFiltrados.map((t) => {
                  const cat = categorias.find((c) => c.id === (t.categoria_id || t.servicio));
                  const esVip = t.tipoPlan === "premium" || t.prioridad === "urgente" || t.prioridad === "alta";
                  const esInboundEmail = t.canal_origen === "email";
                  return (
                    <div
                      key={t.id}
                      className={`rounded-2xl p-4 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 border ${
                        esVip
                          ? "bg-gradient-to-r from-amber-500/[0.08] via-[var(--ts-surface)] to-[var(--ts-surface)] border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.12)] hover:border-amber-400"
                          : esInboundEmail
                          ? "bg-[var(--ts-surface)] border-violet-500/30 hover:border-violet-400"
                          : "bg-[var(--ts-surface)] border-[var(--ts-border)] hover:border-cyan-500/40"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-xs font-mono font-black text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg">
                            {t.codigo}
                          </span>

                          {/* Badge de Categoría Dinámica */}
                          <span
                            className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1"
                            style={{
                              backgroundColor: `${cat?.color || "#64748b"}15`,
                              color: cat?.color || "#64748b",
                              border: `1px solid ${cat?.color || "#64748b"}30`,
                            }}
                          >
                            {(t.categoria_id === "starlink" || t.servicio === "starlink") && <Wifi className="w-3 h-3" />}
                            {(t.categoria_id === "cctv" || t.servicio === "cctv") && <Camera className="w-3 h-3" />}
                            {(t.categoria_id === "redes" || t.servicio === "redes") && <Network className="w-3 h-3" />}
                            {(t.categoria_id === "automatizacion" || t.servicio === "automatizacion") && <Cpu className="w-3 h-3" />}
                            {(t.categoria_id === "domotica" || t.servicio === "domotica") && <KeyRound className="w-3 h-3" />}
                            {cat?.nombre || t.servicio}
                          </span>

                          {/* Distinción VIP Especial */}
                          {esVip && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-xs">
                              <Crown className="w-3 h-3 text-amber-500" /> CLIENTE VIP • PRIORIDAD ALTA
                            </span>
                          )}

                          {/* Distinción Inbound Email Especial */}
                          {esInboundEmail && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/30 flex items-center gap-1 shadow-xs">
                              <Mail className="w-3 h-3 text-violet-500" /> Correo Inbound Directo
                            </span>
                          )}

                          {/* Badge de Cliente Verificado en CRM */}
                          {t.cliente_id ? (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Cliente Verificado
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-[var(--ts-text-muted)] bg-[var(--ts-surface-2)] px-2 py-0.5 rounded-full">
                              No Registrado en CRM
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
                          {limpiarTextoMime(t.descripcion)}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--ts-text-muted)]">
                          <span className="flex items-center gap-1 font-semibold text-[var(--ts-text-primary)]">
                            <User className="w-3.5 h-3.5 text-cyan-600" />
                            {t.cliente}
                            {t.cedula_rif && <span className="font-mono text-[10px] text-[var(--ts-text-muted)] font-normal">({t.cedula_rif})</span>}
                          </span>
                          {t.telefono && (
                            <a
                              href={`https://wa.me/58${t.telefono.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(`Hola ${t.cliente}, te escribo de TecnoSmart sobre tu Ticket #${t.codigo} (${t.asunto}).`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-emerald-600 hover:underline font-semibold"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              {t.telefono}
                            </a>
                          )}
                          {t.email_cliente && (
                            <span className="flex items-center gap-1 font-mono text-[10px]">
                              <Mail className="w-3 h-3 text-cyan-500" />
                              {t.email_cliente}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {t.fechaCreacion}
                          </span>
                        </div>

                        {t.solucion && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                            <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 block mb-0.5">
                              ✅ Solución Técnica Aplicada {t.fechaCierre && `(${t.fechaCierre})`}
                            </span>
                            <p className="text-emerald-800 dark:text-emerald-200 font-medium">
                              {t.solucion}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Acciones Rápidas */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        {(t.estado === "resuelto" || t.estado === "cerrado") ? (
                          <button
                            type="button"
                            onClick={() => handleReabrirTicket(t.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition-colors shadow-xs"
                            title="Reabrir este ticket para que vuelva a la cola activa"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reabrir</span>
                          </button>
                        ) : (
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
                        )}

                        <button
                          onClick={() => setTicketSeleccionado(t)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--ts-border)] hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] text-xs font-bold transition-colors"
                        >
                          <Eye className="w-4 h-4 text-cyan-600" />
                          <span>Atender Caso</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2: GARANTÍAS & SERIALES (1 AÑO EN CÁMARAS)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "garantias" && (
          <div className="space-y-4">
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

      {/* ══════════════════════════════════════════════════════════
          MODAL DETALLE Y ATENCIÓN 360 DEL TICKET
      ══════════════════════════════════════════════════════════ */}
      {ticketSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Header del Ticket */}
            <div className="px-6 py-4 border-b border-[var(--ts-border)] flex items-center justify-between bg-[var(--ts-surface-2)]">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-black text-cyan-600 bg-cyan-500/10 px-2.5 py-1 rounded-xl">
                  {ticketSeleccionado.codigo}
                </span>
                <div>
                  <h3 className="text-base font-black text-[var(--ts-text-primary)] truncate max-w-md">
                    {ticketSeleccionado.asunto}
                  </h3>
                  <p className="text-xs text-[var(--ts-text-muted)]">
                    Cliente: <strong className="text-[var(--ts-text-primary)]">{ticketSeleccionado.cliente}</strong> {ticketSeleccionado.cedula_rif && `(${ticketSeleccionado.cedula_rif})`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTicketSeleccionado(null)}
                  className="p-1.5 rounded-xl text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenedor Dividido: Área Técnica (Izquierda) + Ficha 360 Cliente (Derecha) */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[var(--ts-border)]">

              {/* COLUMNA 1 & 2: Hilo Técnico, Respuestas y WhatsApp */}
              <div className="lg:col-span-2 p-6 space-y-5">
                
                {/* Banner Protocolo Ticket Inbound (Correo Directo) */}
                {ticketSeleccionado.canal_origen === "email" && (
                  <div className="bg-gradient-to-r from-violet-950/40 via-[var(--ts-surface-2)] to-[var(--ts-surface-2)] border border-violet-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-400 shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                          <span>Protocolo Inbound: Ticket Recibido por Correo Directo</span>
                        </span>
                        <p className="text-xs text-[var(--ts-text-muted)] mt-0.5 leading-relaxed">
                          Este caso ingresó directamente a <strong>soporte@somostecnosmart.com</strong>. Se recomienda dar atención al cliente <strong>directamente vía WhatsApp</strong> para mayor agilidad (o responder por correo oficial abajo).
                        </p>
                      </div>
                    </div>
                    {ticketSeleccionado.telefono ? (
                      <a
                        href={`https://wa.me/58${ticketSeleccionado.telefono.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(`Hola ${ticketSeleccionado.cliente}, te escribimos de Soporte Técnico TecnoSmart respecto a tu correo sobre: "${ticketSeleccionado.asunto}". Estamos a tu disposición.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shrink-0 transition-all shadow-md"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Atender por WhatsApp</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={abrirCrearCliente}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[var(--ts-surface)] hover:bg-[var(--ts-border)] text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir Teléfono al CRM</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Banner Distinción Especial Cliente VIP */}
                {(ticketSeleccionado.tipoPlan === "premium" || ticketSeleccionado.prioridad === "urgente" || ticketSeleccionado.prioridad === "alta" || clienteDossier.cliente?.tipo === "VIP") && (
                  <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 rounded-2xl p-3 px-4 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <Crown className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-xs font-black uppercase text-amber-500 dark:text-amber-300 block">
                          Cliente VIP TecnoSmart — Atención Preferencial y Prioridad Alta
                        </span>
                        <span className="text-[11px] text-[var(--ts-text-muted)]">
                          Este caso cuenta con SLA preferencial y máxima prioridad en cola técnica.
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-amber-500 text-black px-2.5 py-1 rounded-full shrink-0">
                      VIP ACTIVO
                    </span>
                  </div>
                )}

                {/* Badges de Estado, Prioridad y SLA */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-lg bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] border border-[var(--ts-border)]">
                    Servicio: <strong className="uppercase">{ticketSeleccionado.servicio}</strong>
                  </span>

                  <span className={`text-xs font-bold uppercase px-3 py-1 rounded-lg ${
                    ticketSeleccionado.estado === "resuelto"
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : ticketSeleccionado.estado === "en_diagnostico"
                      ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                      : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  }`}>
                    Estado: {ticketSeleccionado.estado.replace("_", " ")}
                  </span>

                  <span className={`text-xs font-bold uppercase px-3 py-1 rounded-lg ${
                    ticketSeleccionado.prioridad === "urgente"
                      ? "bg-red-500/10 text-[var(--ts-red)] border border-red-500/20"
                      : ticketSeleccionado.prioridad === "alta"
                      ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      : "bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)]"
                  }`}>
                    Prioridad: {ticketSeleccionado.prioridad}
                  </span>

                  <div className="text-[11px] text-[var(--ts-text-muted)] flex items-center gap-1.5 bg-[var(--ts-surface-2)]/60 px-3 py-1 rounded-lg border border-[var(--ts-border)] ml-auto">
                    <Clock className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span>SLA: ~24 horas en días hábiles (L-V 8:00 AM - 5:00 PM)</span>
                  </div>
                </div>

                {/* Descripción Inicial del Cliente */}
                <div className="bg-[var(--ts-surface-2)] p-4 rounded-2xl border border-[var(--ts-border)] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[var(--ts-text-muted)]">
                    <span className="font-bold uppercase text-[10px]">Falla Reportada Inicial</span>
                    <span>{ticketSeleccionado.fechaCreacion}</span>
                  </div>
                  <p className="text-xs text-[var(--ts-text-primary)] font-medium leading-relaxed whitespace-pre-line">
                    {limpiarTextoMime(ticketSeleccionado.descripcion) || "Sin descripción adicional provista."}
                  </p>
                </div>

                {/* Preguntas Guía Técnicas Respondidas (si existen) */}
                {ticketSeleccionado.respuestas_guia && Object.keys(ticketSeleccionado.respuestas_guia).length > 0 && (
                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-cyan-600 font-bold uppercase text-[10px]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Respuestas de Diagnóstico Guiado por el Cliente</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {Object.entries(ticketSeleccionado.respuestas_guia).map(([k, v]) => (
                        <div key={k} className="p-2.5 rounded-xl bg-[var(--ts-surface)] border border-[var(--ts-border)]">
                          <span className="block text-[10px] text-[var(--ts-text-muted)] font-mono">{k}</span>
                          <span className="font-bold text-[var(--ts-text-primary)] text-xs">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Solución Registrada (si ya fue resuelto) */}
                {ticketSeleccionado.solucion && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-xs">
                    <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">
                      ✅ Solución Técnica Aplicada
                    </span>
                    <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-1 font-medium">
                      {ticketSeleccionado.solucion}
                    </p>
                  </div>
                )}

                {/* Historial de Mensajes / Conversación */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ts-text-muted)] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Historial de Respuestas & Notas ({mensajesTicket.length})</span>
                  </h4>

                  {loadingMensajes ? (
                    <div className="text-xs text-[var(--ts-text-muted)] py-4 text-center">Cargando conversación...</div>
                  ) : mensajesTicket.length === 0 ? (
                    <p className="text-xs text-[var(--ts-text-muted)] italic">Aún no hay respuestas registradas en este ticket.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {mensajesTicket.map((m) => (
                        <div
                          key={m.id}
                          className={`p-3 rounded-2xl border text-xs ${
                            m.es_privado
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                              : m.remitente_tipo === "cliente"
                              ? "bg-[var(--ts-surface-2)] border-[var(--ts-border)]"
                              : "bg-blue-500/10 border-blue-500/20"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold">
                              {m.es_privado && <Lock className="w-3 h-3 inline mr-1 text-amber-600" />}
                              {m.remitente_nombre} {m.es_privado && "(Nota Interna Confidencial)"}
                            </span>
                            <span className="text-[10px] opacity-70">
                              {(m.created_at || "").replace("T", " ").substring(0, 16)}
                            </span>
                          </div>
                          <p className="whitespace-pre-line leading-relaxed">{limpiarTextoMime(m.contenido)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Formulario de Respuesta y Notas */}
                <form onSubmit={handleEnviarRespuesta} className="space-y-3 pt-3 border-t border-[var(--ts-border)]">
                  <div>
                    <label className="flex items-center justify-between text-xs font-bold text-[var(--ts-text-primary)] mb-1">
                      <span>Responder al Cliente / Registrar Diagnóstico</span>
                      <label className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={esNotaInterna}
                          onChange={(e) => setEsNotaInterna(e.target.checked)}
                          className="rounded text-amber-600"
                        />
                        <span>Nota interna (Privada para técnicos)</span>
                      </label>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={respuestaTexto}
                      onChange={(e) => setRespuestaTexto(e.target.value)}
                      placeholder={
                        esNotaInterna
                          ? "Escriba una nota técnica privada visible solo para el equipo TecnoSmart..."
                          : `Escriba la respuesta oficial para ${ticketSeleccionado.cliente}. Se despachará desde soporte@somostecnosmart.com...`
                      }
                      className="w-full text-xs p-3 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)] resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {ticketSeleccionado.telefono && (
                        <a
                          href={`https://wa.me/58${ticketSeleccionado.telefono.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(`Hola ${ticketSeleccionado.cliente}, te escribe ${usuario?.nombre || "el equipo de soporte"} de TecnoSmart respecto al Ticket #${ticketSeleccionado.codigo}: ${ticketSeleccionado.asunto}. ¿Podrías indicarnos más detalles?`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                        >
                          <Smartphone className="w-4 h-4" />
                          <span>Atender por WhatsApp</span>
                        </a>
                      )}

                      {(ticketSeleccionado.estado === "resuelto" || ticketSeleccionado.estado === "cerrado") ? (
                        <button
                          type="button"
                          onClick={() => handleReabrirTicket(ticketSeleccionado.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Reabrir Ticket 🔄</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResolverConSolucion}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          <span>Marcar Resuelto ✅</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={enviandoRespuesta || !respuestaTexto.trim()}
                      className="inline-flex items-center gap-1.5 px-5 py-2 bg-[var(--ts-red)] hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      {enviandoRespuesta ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{esNotaInterna ? "Guardar Nota Interna" : "Enviar Correo Oficial"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

              </div>

              {/* COLUMNA 3: FICHA 360 DEL CLIENTE & EQUIPOS ACTIVOS */}
              <div className="p-6 bg-[var(--ts-surface-2)]/40 space-y-5">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[var(--ts-text-primary)] flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-600" />
                    <span>Ficha 360° del Cliente</span>
                  </h4>
                  <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">
                    Trazabilidad de equipos, Starlinks y compras en TecnoSmart.
                  </p>
                </div>

                {loadingDossier ? (
                  <div className="text-xs text-[var(--ts-text-muted)] py-4 text-center">Buscando ficha de cliente...</div>
                ) : clienteDossier.cliente ? (
                  <div className="space-y-4 text-xs">
                    {/* Datos Generales con Acciones In-App de Edición y Cambio */}
                    <div className="bg-[var(--ts-surface)] p-4 rounded-2xl border border-[var(--ts-border)] space-y-3 shadow-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-sm text-[var(--ts-text-primary)] block">
                            {clienteDossier.cliente.contacto || clienteDossier.cliente.empresa}
                          </span>
                          {clienteDossier.cliente.empresa && clienteDossier.cliente.contacto && clienteDossier.cliente.empresa !== clienteDossier.cliente.contacto && (
                            <span className="text-[11px] text-[var(--ts-text-muted)] block">
                              {clienteDossier.cliente.empresa}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {(clienteDossier.cliente.tipo === "VIP" || clienteDossier.cliente.tipo === "vip") ? (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30 flex items-center gap-1">
                              <Crown className="w-3 h-3" /> VIP
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                              Verificado
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1 text-[11px]">
                        {clienteDossier.cliente.rif_cedula && (
                          <p className="font-mono text-[var(--ts-text-muted)] flex items-center gap-1.5">
                            <span className="font-semibold text-[var(--ts-text-primary)]">C.I. / RIF:</span> {clienteDossier.cliente.rif_cedula}
                          </p>
                        )}
                        {clienteDossier.cliente.telefono && (
                          <p className="text-[var(--ts-text-muted)] flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                            <a
                              href={`https://wa.me/58${clienteDossier.cliente.telefono.replace(/\D/g, "").replace(/^0/, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:underline font-semibold font-mono"
                            >
                              {clienteDossier.cliente.telefono}
                            </a>
                          </p>
                        )}
                        {clienteDossier.cliente.email && (
                          <p className="text-[var(--ts-text-muted)] flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                            <span className="truncate">{clienteDossier.cliente.email}</span>
                          </p>
                        )}
                        {clienteDossier.cliente.direccion && (
                          <p className="text-[var(--ts-text-muted)] flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{clienteDossier.cliente.direccion}</span>
                          </p>
                        )}
                      </div>

                      {/* Botones de Acción In-App: Editar Ficha y Enlazar Otro Cliente */}
                      <div className="pt-2 border-t border-[var(--ts-border)] flex items-center gap-2">
                        <button
                          type="button"
                          onClick={abrirEditarCliente}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl text-xs font-bold text-[var(--ts-text-primary)] transition"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Editar Ficha</span>
                        </button>
                        <button
                          type="button"
                          onClick={abrirModalEnlazar}
                          className="inline-flex items-center justify-center p-2 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl text-xs text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] transition"
                          title="Cambiar o enlazar a otro cliente del CRM"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Equipos Starlink Vinculados */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase text-[var(--ts-text-muted)] flex items-center gap-1.5">
                        <Wifi className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Suscripciones Starlink ({clienteDossier.starlinks.length})</span>
                      </span>

                      {clienteDossier.starlinks.length === 0 ? (
                        <p className="text-[11px] text-[var(--ts-text-muted)] italic">No posee Starlink activo.</p>
                      ) : (
                        clienteDossier.starlinks.map((s: any) => (
                          <div key={s.id} className="p-2.5 rounded-xl bg-[var(--ts-surface)] border border-[var(--ts-border)] text-xs">
                            <span className="font-bold text-[var(--ts-text-primary)] block">
                              {s.servicios_recurrentes?.nombre || "Starlink Flota"}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-semibold uppercase">
                              Estado: {s.estado} • ${s.precio_mensual_usd}/mes
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Seriales en Garantía Oficial (1 Año) */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase text-[var(--ts-text-muted)] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Equipos en Garantía 1 Año ({clienteDossier.garantias.length})</span>
                      </span>

                      {clienteDossier.garantias.length === 0 ? (
                        <p className="text-[11px] text-[var(--ts-text-muted)] italic">No hay seriales registrados a su nombre.</p>
                      ) : (
                        clienteDossier.garantias.map((g: any) => (
                          <div key={g.id} className="p-2.5 rounded-xl bg-[var(--ts-surface)] border border-[var(--ts-border)] text-xs">
                            <span className="font-mono font-bold text-[var(--ts-text-primary)] block">
                              {g.serial}
                            </span>
                            <span className="text-[10px] text-[var(--ts-text-muted)]">
                              {g.equipo} • Instalado: {g.fecha_instalacion}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[var(--ts-surface)] p-5 rounded-2xl border border-[var(--ts-border)] space-y-4">
                    <div className="text-center space-y-1">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
                        <User className="w-5 h-5" />
                      </div>
                      <h5 className="font-bold text-xs text-[var(--ts-text-primary)]">Cliente No Vinculado</h5>
                      <p className="text-[11px] text-[var(--ts-text-muted)] leading-relaxed">
                        Este ticket no está asociado a una ficha de cliente en el CRM de TecnoSmart.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[var(--ts-border)]">
                      <button
                        type="button"
                        onClick={abrirCrearCliente}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Registrar Nuevo Cliente en CRM</span>
                      </button>

                      <button
                        type="button"
                        onClick={abrirModalEnlazar}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[var(--ts-text-primary)] rounded-xl font-bold text-xs transition-colors"
                      >
                        <Search className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Enlazar a Cliente Existente</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL GESTIÓN DE CATEGORÍAS DINÁMICAS
      ══════════════════════════════════════════════════════════ */}
      {modalCategorias && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-[var(--ts-border)] pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-black text-[var(--ts-text-primary)]">
                  Categorías de Servicios de Soporte
                </h3>
              </div>
              <button
                onClick={() => setModalCategorias(false)}
                className="p-1 rounded-lg text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista actual de categorías */}
            <div className="space-y-2 mb-4 max-h-52 overflow-y-auto pr-1">
              {categorias.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <div>
                      <p className="font-bold text-[var(--ts-text-primary)]">{c.nombre}</p>
                      <p className="text-[10px] text-[var(--ts-text-muted)] font-mono">id: {c.id}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Activa
                  </span>
                </div>
              ))}
            </div>

            {/* Añadir nueva categoría */}
            <form onSubmit={handleCrearCategoria} className="space-y-3 pt-3 border-t border-[var(--ts-border)]">
              <h4 className="text-xs font-black uppercase text-[var(--ts-text-primary)]">
                + Añadir Nuevo Servicio a Soporte
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="field-label">Nombre del Servicio *</label>
                  <input
                    type="text"
                    required
                    value={nuevaCatNombre}
                    onChange={(e) => {
                      setNuevaCatNombre(e.target.value);
                      if (!nuevaCatId) {
                        setNuevaCatId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "_"));
                      }
                    }}
                    placeholder="Ej. Energía Solar & Inversores"
                    className="field-input text-xs"
                  />
                </div>
                <div>
                  <label className="field-label">Identificador (slug) *</label>
                  <input
                    type="text"
                    required
                    value={nuevaCatId}
                    onChange={(e) => setNuevaCatId(e.target.value)}
                    placeholder="energia_solar"
                    className="field-input font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Color Distintivo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={nuevaCatColor}
                    onChange={(e) => setNuevaCatColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={nuevaCatColor}
                    onChange={(e) => setNuevaCatColor(e.target.value)}
                    className="field-input font-mono text-xs w-32"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Descripción Breve</label>
                <input
                  type="text"
                  value={nuevaCatDesc}
                  onChange={(e) => setNuevaCatDesc(e.target.value)}
                  placeholder="Inversores híbridos, bancos de batería y paneles..."
                  className="field-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCategorias(false)}
                  className="px-4 py-2 text-xs font-bold text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)] rounded-xl"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Nuevo Ticket Interno ── */}
      {modalNuevoTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl w-full max-w-lg p-5 shadow-2xl animate-modal-enter">
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
                  placeholder="Ej. Abasto San Juan / Inversiones Don Pedro"
                  className="field-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Cédula / RIF</label>
                  <input
                    type="text"
                    value={formCedulaRif}
                    onChange={(e) => setFormCedulaRif(e.target.value)}
                    placeholder="V-12345678 / J-12345678-0"
                    className="field-input font-mono"
                  />
                </div>

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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Correo Electrónico</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="cliente@gmail.com"
                    className="field-input"
                  />
                </div>

                <div>
                  <label className="field-label">Servicio Afectado</label>
                  <select
                    value={formServicio}
                    onChange={(e) => setFormServicio(e.target.value)}
                    className="field-input"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
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

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!formSerial || !formEquipo || !formClienteGarantia) return;

              const nueva: RegistroGarantia = {
                id: "gar-" + Date.now(),
                serial: formSerial.toUpperCase().trim(),
                equipo: formEquipo,
                cliente: formClienteGarantia,
                fechaInstalacion: new Date().toISOString().split("T")[0],
                mesesGarantia: 12,
                facturaRef: formFacturaRef || undefined,
                estado: "activa",
              };

              try {
                await supabase.from("garantias_equipos").insert({
                  id: nueva.id,
                  serial: nueva.serial,
                  equipo: nueva.equipo,
                  cliente: nueva.cliente,
                  fecha_instalacion: nueva.fechaInstalacion,
                  meses_garantia: 12,
                  factura_ref: nueva.facturaRef,
                  estado: "activa",
                });
              } catch (err) {
                console.warn(err);
              }

              setGarantias([nueva, ...garantias]);
              setModalNuevaGarantia(false);
              setFormSerial("");
              setFormEquipo("");
              setFormClienteGarantia("");
              setFormFacturaRef("");
            }} className="space-y-3">
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

      {/* ══════════════════════════════════════════════════════════
          MODAL IN-APP: REGISTRAR O EDITAR CLIENTE EN CRM
      ══════════════════════════════════════════════════════════ */}
      {modalClienteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-3xl w-full max-w-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--ts-border)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--ts-text-primary)]">
                    {modoCliente === "crear" ? "Registrar Cliente en CRM" : "Editar Ficha del Cliente en CRM"}
                  </h3>
                  <p className="text-[11px] text-[var(--ts-text-muted)]">
                    {modoCliente === "crear"
                      ? `Crea la ficha del cliente y vincúlala de inmediato al Ticket #${ticketSeleccionado?.codigo}.`
                      : "Actualiza los datos de contacto y nivel de atención comercial."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalClienteOpen(false)}
                className="p-1.5 rounded-xl text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarClienteCRM} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Nombre del Contacto *</label>
                  <input
                    type="text"
                    required
                    value={formClienteData.contacto}
                    onChange={(e) => setFormClienteData({ ...formClienteData, contacto: e.target.value })}
                    placeholder="Ej. Carlos Mendoza"
                    className="field-input font-medium"
                  />
                </div>

                <div>
                  <label className="field-label">Empresa / Razón Social</label>
                  <input
                    type="text"
                    value={formClienteData.empresa}
                    onChange={(e) => setFormClienteData({ ...formClienteData, empresa: e.target.value })}
                    placeholder="Ej. Inversiones San Miguel C.A."
                    className="field-input font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="field-label">C.I. / RIF</label>
                  <input
                    type="text"
                    value={formClienteData.rif_cedula}
                    onChange={(e) => setFormClienteData({ ...formClienteData, rif_cedula: e.target.value })}
                    placeholder="V-18719306 / J-..."
                    className="field-input font-mono"
                  />
                </div>

                <div>
                  <label className="field-label">Teléfono / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={formClienteData.telefono}
                    onChange={(e) => setFormClienteData({ ...formClienteData, telefono: e.target.value })}
                    placeholder="0412-1234567"
                    className="field-input font-mono"
                  />
                </div>

                <div>
                  <label className="field-label">Tipo de Cliente</label>
                  <select
                    value={formClienteData.tipo}
                    onChange={(e) => setFormClienteData({ ...formClienteData, tipo: e.target.value })}
                    className="field-input font-bold"
                  >
                    <option value="Normal">Normal</option>
                    <option value="VIP">👑 VIP (Prioridad Alta)</option>
                    <option value="Corporativo">Corporativo</option>
                    <option value="Residencial">Residencial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">Correo Electrónico</label>
                <input
                  type="email"
                  value={formClienteData.email}
                  onChange={(e) => setFormClienteData({ ...formClienteData, email: e.target.value })}
                  placeholder="cliente@gmail.com"
                  className="field-input"
                />
              </div>

              <div>
                <label className="field-label">Dirección / Ubicación</label>
                <input
                  type="text"
                  value={formClienteData.direccion}
                  onChange={(e) => setFormClienteData({ ...formClienteData, direccion: e.target.value })}
                  placeholder="Ciudad, Sector, Calle o Punto de Referencia"
                  className="field-input"
                />
              </div>

              <div>
                <label className="field-label">Notas Internas</label>
                <textarea
                  rows={2}
                  value={formClienteData.notas}
                  onChange={(e) => setFormClienteData({ ...formClienteData, notas: e.target.value })}
                  placeholder="Notas internas o historial para el equipo técnico y comercial..."
                  className="field-input resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--ts-border)]">
                <button
                  type="button"
                  onClick={() => setModalClienteOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoCliente}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  {guardandoCliente ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{modoCliente === "crear" ? "Registrar y Vincular al Ticket" : "Actualizar Datos"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL IN-APP: ENLAZAR A CLIENTE EXISTENTE DEL CRM
      ══════════════════════════════════════════════════════════ */}
      {modalEnlazarOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-3xl w-full max-w-xl p-6 shadow-2xl max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--ts-border)] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--ts-text-primary)]">
                    Enlazar a Cliente Existente
                  </h3>
                  <p className="text-[11px] text-[var(--ts-text-muted)]">
                    Selecciona el cliente del CRM para asociarlo a este ticket y cargar su historial 360°.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEnlazarOpen(false)}
                className="p-1.5 rounded-xl text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buscador Rápido */}
            <div className="relative mb-3 shrink-0">
              <Search className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={busquedaEnlazar}
                onChange={(e) => setBusquedaEnlazar(e.target.value)}
                placeholder="Buscar por nombre, empresa, RIF, teléfono o email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--ts-surface-2)] border border-[var(--ts-border)] text-xs text-[var(--ts-text-primary)] placeholder:text-[var(--ts-text-muted)] focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Lista de Clientes */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {cargandoCrm ? (
                <div className="py-8 text-center text-xs text-[var(--ts-text-muted)] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                  <span>Cargando directorio de clientes...</span>
                </div>
              ) : (
                (() => {
                  const q = busquedaEnlazar.toLowerCase().trim();
                  const filtrados = clientesCrm.filter((c) => {
                    if (!q) return true;
                    return (
                      (c.contacto || "").toLowerCase().includes(q) ||
                      (c.empresa || "").toLowerCase().includes(q) ||
                      (c.rif_cedula || "").toLowerCase().includes(q) ||
                      (c.telefono || "").includes(q) ||
                      (c.email || "").toLowerCase().includes(q)
                    );
                  });

                  if (filtrados.length === 0) {
                    return (
                      <div className="py-8 text-center text-xs text-[var(--ts-text-muted)]">
                        No se encontraron clientes que coincidan con &quot;{busquedaEnlazar}&quot;.
                      </div>
                    );
                  }

                  return filtrados.slice(0, 25).map((c) => {
                    const esVip = c.tipo === "VIP" || c.tipo === "vip";
                    return (
                      <div
                        key={c.id}
                        className="p-3 rounded-2xl bg-[var(--ts-surface-2)] hover:bg-[var(--ts-surface)] border border-[var(--ts-border)] hover:border-cyan-500/40 transition flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-[var(--ts-text-primary)] truncate">
                              {c.contacto || c.empresa}
                            </span>
                            {esVip && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30 flex items-center gap-1 shrink-0">
                                <Crown className="w-3 h-3" /> VIP
                              </span>
                            )}
                          </div>
                          {c.empresa && c.empresa !== c.contacto && (
                            <p className="text-[11px] text-[var(--ts-text-muted)] truncate mb-0.5">
                              {c.empresa}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-[var(--ts-text-muted)]">
                            {c.rif_cedula && <span>RIF: {c.rif_cedula}</span>}
                            {c.telefono && <span>Tel: {c.telefono}</span>}
                            {c.email && <span className="truncate">Email: {c.email}</span>}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEnlazarCliente(c)}
                          className="shrink-0 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-xs transition"
                        >
                          Vincular
                        </button>
                      </div>
                    );
                  });
                })()
              )}
            </div>

            <div className="pt-3 border-t border-[var(--ts-border)] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setModalEnlazarOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[var(--ts-text-muted)] hover:bg-[var(--ts-surface-2)] rounded-xl"
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
