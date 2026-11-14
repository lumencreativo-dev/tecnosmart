"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { formatUSD, formatFecha } from "@/lib/utils";
import { useUsuario } from "@/hooks/useUsuario";
import ClientePicker from "./ClientePicker";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Plus,
  Search,
  RefreshCw,
  Calendar,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Lock,
  User,
  X,
  Copy,
  Check,
  TrendingUp,
  Clock,
  AlertCircle,
  Users,
  DollarSign,
  MessageCircle,
  Edit,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Download,
  FileSpreadsheet,
  Layers,
  Filter,
  Handshake,
  Shield,
  Sparkles,
  Satellite,
  Crown,
  Wifi,
  Key,
  Pause,
  Play,
  Ban,
} from "lucide-react";
import StarlinkFleetView from "./starlink/StarlinkFleetView";
import StarlinkOnboardingModal from "./starlink/StarlinkOnboardingModal";
import { exportarStarlinkFichaPDF } from "@/components/pdf/StarlinkFichaPDF";
import {
  isStarlinkSubscription,
  extractStarlinkData,
  packStarlinkData,
  StarlinkMetadata,
} from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// TIPOS Y CONSTANTES
// ─────────────────────────────────────────────────────────────

export type Socio = {
  perfil_id?: string;
  nombre: string;
  porcentaje: number;
};

export type ServicioRecurrente = {
  id: string;
  nombre: string;
  descripcion: string;
  precio_sugerido: number;
  activo?: boolean;
  mensaje_whatsapp?: string;
  created_at?: string;
};

export type Suscripcion = {
  id: string;
  cliente_id: string;
  servicio_id: string;
  estado: string;
  ciclo_facturacion: string;
  monto: number;
  costo_base?: number;
  socios?: Socio[] | null;
  fecha_inicio?: string;
  proximo_pago: string;
  credenciales_usuario?: string;
  credenciales_clave?: string;
  credenciales_notas?: string;
  equipo_serial?: string;
  created_at?: string;
  updated_at?: string;
  clientes?: {
    id?: string;
    contacto: string;
    empresa?: string;
    telefono?: string;
    email?: string;
    rif_cedula?: string;
    direccion?: string;
  };
  servicios_recurrentes?: {
    id?: string;
    nombre: string;
    mensaje_whatsapp?: string;
    precio_sugerido?: number;
  };
};

export type SuscripcionPago = {
  id: string;
  suscripcion_id: string;
  fecha_pago: string;
  monto: number;
  referencia?: string;
  notas?: string;
  created_at?: string;
};

// Colores conocidos para socios (fallback para gráficas)
const MEMBER_COLORS: Record<string, { color: string; iniciales: string }> = {
  "2d04423f-ae8f-49e8-89e7-33201cfd4e86": { color: "#c9242b", iniciales: "OS" },
  "dc9995f5-c602-463e-b5f9-01981e680bfe": { color: "#3b82f6", iniciales: "KF" },
  "97dca47b-66d3-4600-bec5-bc866936a565": { color: "#10b981", iniciales: "GC" },
  "6a67adee-d1b2-4175-9559-900d2f93c043": { color: "#f59e0b", iniciales: "TÉ" },
};

// Paleta de colores para socios sin color asignado
const COLOR_PALETTE = ["#c9242b", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export type PerfilEquipo = {
  id: string;
  nombre: string;
  username?: string;
  color: string;
  iniciales: string;
  rol_nombre?: string;
};
// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const getMrrMensual = (s: { monto: number; ciclo_facturacion: string }) => {
  const m = Number(s.monto || 0);
  switch (s.ciclo_facturacion) {
    case "Mensual":
      return m;
    case "Bimestral":
      return m / 2;
    case "Trimestral":
      return m / 3;
    case "Semestral":
      return m / 6;
    case "Anual":
      return m / 12;
    default:
      return m;
  }
};

const getGananciaMensual = (s: { monto: number; costo_base?: number; ciclo_facturacion: string }) => {
  const ganancia = Number(s.monto || 0) - Number(s.costo_base || 0);
  switch (s.ciclo_facturacion) {
    case "Mensual":
      return ganancia;
    case "Bimestral":
      return ganancia / 2;
    case "Trimestral":
      return ganancia / 3;
    case "Semestral":
      return ganancia / 6;
    case "Anual":
      return ganancia / 12;
    default:
      return ganancia;
  }
};

const isDue = (dateString: string) => {
  if (!dateString) return false;
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  return new Date(dateString) <= hoy;
};

const isAcompanamiento = (s: { monto?: number }) => {
  return Number(s.monto || 0) <= 0;
};

const getSocioShare = (s: Suscripcion, perfilId: string): number => {
  if (!s.socios || !Array.isArray(s.socios)) return 0;
  const match = s.socios.find((p) => p.perfil_id === perfilId);
  return match ? (Number(match.porcentaje) || 0) / 100 : 0;
};

const doesSocioParticipate = (s: Suscripcion, perfilId: string): boolean => {
  if (perfilId === "todos") return true;
  return getSocioShare(s, perfilId) > 0;
};

const getSocioBadgeInfo = (socio: Socio) => {
  const name = socio.nombre || "Socio";
  const known = socio.perfil_id ? MEMBER_COLORS[socio.perfil_id] : undefined;
  if (known) {
    return {
      nombre: name,
      iniciales: known.iniciales,
      color: known.color,
    };
  }
  const initials = name
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    nombre: name,
    iniciales: initials || "SO",
    color: "#6b7280",
  };
};

export default function SuscripcionesManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { usuario } = useUsuario();

  // Estados principales
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [servicios, setServicios] = useState<ServicioRecurrente[]>([]);
  const [perfilesEquipo, setPerfilesEquipo] = useState<PerfilEquipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"starlink" | "activas" | "cobranzas" | "analitica" | "catalogo">("starlink");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "starlink" || t === "activas" || t === "cobranzas" || t === "analitica" || t === "catalogo") {
      setActiveTab(t as any);
    }
  }, [searchParams]);
  const [showStarlinkModal, setShowStarlinkModal] = useState(false);
  const [starlinkEditSub, setStarlinkEditSub] = useState<Suscripcion | null>(null);
  const [filtroSocio, setFiltroSocio] = useState<string>("todos");
  const [filtroServicio, setFiltroServicio] = useState<string>("todos");
  const [filtroModalidad, setFiltroModalidad] = useState<"todas" | "gestionada" | "acompanamiento">("todas");
  const [modoVista, setModoVista] = useState<"financiera" | "boveda">("financiera");
  const [filtroInicializado, setFiltroInicializado] = useState(false);
  const [busqueda, setBusqueda] = useState<string>("");

  // Período para análisis de nuevas altas históricas
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(new Date().getFullYear());
  const [clavesVisibles, setClavesVisibles] = useState<Record<string, boolean>>({});

  // Drawer lateral
  const [selected, setSelected] = useState<Suscripcion | null>(null);
  const [pagosHistorial, setPagosHistorial] = useState<SuscripcionPago[]>([]);
  const [susCliente, setSusCliente] = useState<Suscripcion[]>([]);
  const [loadingDrawerData, setLoadingDrawerData] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [formType, setFormType] = useState<"suscripcion" | "servicio">("suscripcion");
  const [editId, setEditId] = useState<string | null>(null);
  const [suscripcionParaEliminar, setSuscripcionParaEliminar] = useState<Suscripcion | null>(null);
  const [eliminandoSub, setEliminandoSub] = useState(false);

  // Formulario Suscripción
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [formData, setFormData] = useState({
    servicio_id: "",
    estado: "Activo",
    ciclo_facturacion: "Mensual",
    monto: "",
    costo_base: "0",
    modalidad: "gestionada" as "gestionada" | "acompanamiento",
    fecha_inicio: new Date().toISOString().split("T")[0],
    proximo_pago: new Date().toISOString().split("T")[0],
    credenciales_usuario: "",
    credenciales_clave: "",
    credenciales_notas: "",
    equipo_serial: "",
    socios: [] as Socio[],
  });
  const [nuevoSocioNombre, setNuevoSocioNombre] = useState<string>("");

  // Formulario Servicio
  const [servicioData, setServicioData] = useState({
    nombre: "",
    descripcion: "",
    precio_sugerido: "",
    mensaje_whatsapp: "",
  });

  // Modal Renovar
  const [showRenovarModal, setShowRenovarModal] = useState(false);
  const [renovarData, setRenovarData] = useState({
    suscripcion_id: "",
    proximo_pago: "",
    fecha_pago: new Date().toISOString().split("T")[0],
    referencia: "",
    notas: "",
    monto: 0,
  });

  // Vista Global por defecto: los gerentes y administradores ven todas las suscripciones
  useEffect(() => {
    if (!filtroInicializado) {
      setFiltroSocio("todos");
      setFiltroInicializado(true);
    }
  }, [filtroInicializado]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Cargar servicios recurrentes
      const { data: sData, error: sErr } = await supabase
        .from("servicios_recurrentes")
        .select("*")
        .order("nombre");

      if (!sErr && sData) setServicios(sData);

      // 2. Cargar suscripciones con clientes y servicios
      const { data: subData, error: subErr } = await supabase
        .from("suscripciones")
        .select(`
          *,
          clientes(id, empresa, contacto, telefono, email, rif_cedula, direccion),
          servicios_recurrentes(id, nombre, mensaje_whatsapp, precio_sugerido)
        `)
        .order("proximo_pago", { ascending: true });

      if (subErr) console.error("Error cargando suscripciones:", subErr.message);
      if (!subErr && subData) setSuscripciones(subData);

      // 3. Cargar perfiles del equipo (usuarios del sistema)
      const { data: perfilesData } = await supabase
        .from("perfiles")
        .select("id, nombre, username, estado, roles(nombre)")
        .eq("estado", "activo")
        .order("nombre");

      if (perfilesData) {
        const mapped: PerfilEquipo[] = perfilesData.map((p: any, idx: number) => {
          const known = MEMBER_COLORS[p.id];
          const initials = (p.nombre || "")
            .trim()
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          return {
            id: p.id,
            nombre: p.nombre || p.username || "Usuario",
            username: p.username,
            color: known?.color || COLOR_PALETTE[idx % COLOR_PALETTE.length],
            iniciales: known?.iniciales || initials || "US",
            rol_nombre: p.roles?.nombre || "",
          };
        });
        setPerfilesEquipo(mapped);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // COPIAR AL PORTAPAPELES
  // ─────────────────────────────────────────────────────────────
  const handleCopiar = (texto: string, clave: string) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    setCopiado(clave);
    setTimeout(() => setCopiado(null), 2000);
  };

  // ─────────────────────────────────────────────────────────────
  // ABRIR DETALLE DRAWER
  // ─────────────────────────────────────────────────────────────
  const abrirDetalle = async (s: Suscripcion) => {
    setSelected(s);
    setShowPassword(false);
    setLoadingDrawerData(true);
    try {
      const { data: pagos } = await supabase
        .from("suscripciones_pagos")
        .select("*")
        .eq("suscripcion_id", s.id)
        .order("fecha_pago", { ascending: false });
      setPagosHistorial(pagos || []);

      const { data: clienteSubs } = await supabase
        .from("suscripciones")
        .select("*, servicios_recurrentes(nombre)")
        .eq("cliente_id", s.cliente_id)
        .eq("estado", "Activo");
      setSusCliente(clienteSubs || []);
    } catch (err) {
      console.error("Error cargando detalle suscripción:", err);
    } finally {
      setLoadingDrawerData(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // MÉTRICAS Y KPIS
  // ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let mrrTotal = 0;
    let gananciaNetaTotal = 0;
    let porCobrarCount = 0;
    let porCobrarMonto = 0;

    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    suscripciones.forEach((s) => {
      if (s.estado !== "Activo") return;

      const esCobroReal = Number(s.monto || 0) > 0;
      const overdue = esCobroReal && new Date(s.proximo_pago) <= hoy;

      if (filtroSocio === "todos") {
        const sMrr = getMrrMensual(s);
        const sGanancia = getGananciaMensual(s);
        mrrTotal += sMrr;
        gananciaNetaTotal += sGanancia;
        if (overdue) {
          porCobrarCount++;
          porCobrarMonto += Number(s.monto || 0);
        }
      } else {
        const share = getSocioShare(s, filtroSocio);
        if (share > 0) {
          const sGanancia = getGananciaMensual(s);
          const socioMrrShare = sGanancia * share;
          mrrTotal += socioMrrShare;
          gananciaNetaTotal += socioMrrShare;
          if (overdue) {
            porCobrarCount++;
            porCobrarMonto += (Number(s.monto || 0) - Number(s.costo_base || 0)) * share;
          }
        }
      }
    });

    const arrTotal = mrrTotal * 12;

    return {
      mrr: mrrTotal,
      arr: arrTotal,
      gananciaNeta: gananciaNetaTotal,
      porCobrarCount,
      porCobrarMonto,
    };
  }, [suscripciones, filtroSocio]);

  // ─────────────────────────────────────────────────────────────
  // DATOS PARA GRÁFICAS
  // ─────────────────────────────────────────────────────────────
  // 1. Gráfica de Barras: MRR por Servicio
  const barChartData = useMemo(() => {
    const serviceMap = new Map<string, number>();

    suscripciones.forEach((s) => {
      if (s.estado !== "Activo") return;
      const nombreServicio = s.servicios_recurrentes?.nombre || "Otros Servicios";

      let mrrValue = 0;
      if (filtroSocio === "todos") {
        mrrValue = getMrrMensual(s);
      } else {
        const share = getSocioShare(s, filtroSocio);
        if (share > 0) {
          mrrValue = getGananciaMensual(s) * share;
        }
      }

      if (mrrValue > 0) {
        serviceMap.set(nombreServicio, (serviceMap.get(nombreServicio) || 0) + mrrValue);
      }
    });

    const result = Array.from(serviceMap.entries()).map(([nombre, mrr]) => ({
      nombre,
      mrr: Math.round(mrr * 100) / 100,
    }));

    result.sort((a, b) => b.mrr - a.mrr);
    return result;
  }, [suscripciones, filtroSocio]);

  // 2. Gráfica de Pie / Donut: Distribución entre Socios
  const pieChartData = useMemo(() => {
    const shares = new Map<string, { nombre: string; value: number; color: string }>();
    shares.set("sin_asignar", { nombre: "Sin asignar", value: 0, color: "#6b7280" });

    suscripciones.forEach((s) => {
      if (s.estado !== "Activo") return;
      const ganancia = getGananciaMensual(s);
      if (ganancia <= 0) return;

      if (!s.socios || !Array.isArray(s.socios) || s.socios.length === 0) {
        const unassigned = shares.get("sin_asignar")!;
        unassigned.value += ganancia;
        return;
      }

      let totalPctAssigned = 0;
      s.socios.forEach((socio) => {
        const pct = (Number(socio.porcentaje) || 0) / 100;
        totalPctAssigned += Number(socio.porcentaje) || 0;

        const key = socio.perfil_id || socio.nombre || "sin_asignar";
        if (!shares.has(key)) {
          const perfil = perfilesEquipo.find((p) => p.id === socio.perfil_id);
          const known = socio.perfil_id ? MEMBER_COLORS[socio.perfil_id] : undefined;
          shares.set(key, {
            nombre: perfil?.nombre || socio.nombre || "Socio",
            value: 0,
            color: perfil?.color || known?.color || COLOR_PALETTE[shares.size % COLOR_PALETTE.length],
          });
        }
        shares.get(key)!.value += ganancia * pct;
      });

      if (totalPctAssigned < 100) {
        const unassignedPct = (100 - totalPctAssigned) / 100;
        shares.get("sin_asignar")!.value += ganancia * unassignedPct;
      }
    });

    return Array.from(shares.values())
      .map((item) => ({
        ...item,
        value: Math.round(item.value * 100) / 100,
      }))
      .filter((item) => item.value > 0);
  }, [suscripciones, perfilesEquipo]);

  // ─────────────────────────────────────────────────────────────
  // FILTRADO DINÁMICO DE SUSCRIPCIONES
  // ─────────────────────────────────────────────────────────────
  const suscripcionesFiltradas = useMemo(() => {
    return suscripciones.filter((s) => {
      // 1. Filtro de socio
      if (!doesSocioParticipate(s, filtroSocio)) return false;

      // 2. Filtro de servicio específico
      if (filtroServicio !== "todos" && s.servicio_id !== filtroServicio) {
        return false;
      }

      // 3. Filtro de modalidad (Gestionada vs Acompañamiento)
      if (filtroModalidad === "gestionada" && isAcompanamiento(s)) {
        return false;
      }
      if (filtroModalidad === "acompanamiento" && !isAcompanamiento(s)) {
        return false;
      }

      // 4. Filtro de texto de búsqueda expandido
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const clienteNom = (s.clientes?.empresa || s.clientes?.contacto || "").toLowerCase();
        const rif = (s.clientes?.rif_cedula || "").toLowerCase();
        const serv = (s.servicios_recurrentes?.nombre || "").toLowerCase();
        const userCred = (s.credenciales_usuario || "").toLowerCase();
        const serial = (s.equipo_serial || "").toLowerCase();
        const notasCred = (s.credenciales_notas || "").toLowerCase();
        const emailCliente = ((s.clientes as any)?.email || "").toLowerCase();

        if (
          !clienteNom.includes(q) &&
          !rif.includes(q) &&
          !serv.includes(q) &&
          !userCred.includes(q) &&
          !serial.includes(q) &&
          !notasCred.includes(q) &&
          !emailCliente.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [suscripciones, filtroSocio, filtroServicio, filtroModalidad, busqueda]);

  // Conteos dinámicos por servicio para las píldoras del filtro
  const conteoPorServicio = useMemo(() => {
    const map = new Map<string, number>();
    suscripciones.forEach((s) => {
      if (!doesSocioParticipate(s, filtroSocio)) return;
      if (filtroModalidad === "gestionada" && isAcompanamiento(s)) return;
      if (filtroModalidad === "acompanamiento" && !isAcompanamiento(s)) return;

      const sId = s.servicio_id || "sin_servicio";
      map.set(sId, (map.get(sId) || 0) + 1);
    });
    return map;
  }, [suscripciones, filtroSocio, filtroModalidad]);

  // Conteos por modalidad (Gestionada vs Acompañamiento)
  const conteoModalidades = useMemo(() => {
    let gestionadas = 0;
    let acompanamiento = 0;
    suscripciones.forEach((s) => {
      if (!doesSocioParticipate(s, filtroSocio)) return;
      if (filtroServicio !== "todos" && s.servicio_id !== filtroServicio) return;
      if (isAcompanamiento(s)) {
        acompanamiento++;
      } else {
        gestionadas++;
      }
    });
    return { gestionadas, acompanamiento, total: gestionadas + acompanamiento };
  }, [suscripciones, filtroSocio, filtroServicio]);

  // Métricas de grupo para la Vista Bóveda (Estilo Excel)
  const statsBoveda = useMemo(() => {
    const totalCuentas = suscripcionesFiltradas.length;
    let totalRecaudado = 0;
    let cuentasConMonto = 0;

    suscripcionesFiltradas.forEach((s) => {
      const m = Number(s.monto || 0);
      totalRecaudado += m;
      if (m > 0) cuentasConMonto++;
    });

    const promedio = cuentasConMonto > 0 ? totalRecaudado / cuentasConMonto : 0;

    return {
      totalCuentas,
      totalRecaudado,
      promedio,
    };
  }, [suscripcionesFiltradas]);

  // Estadísticas históricas de Nuevas Altas (Altas mensuales)
  const statsAltas = useMemo(() => {
    const altasMes: Suscripcion[] = [];
    const desgloseServiciosMap = new Map<string, { nombre: string; count: number; mrr: number }>();

    suscripciones.forEach((s) => {
      // Usar fecha_inicio o created_at
      const fStr = s.fecha_inicio || s.created_at;
      if (!fStr) return;
      const f = new Date(fStr);
      if (f.getFullYear() === anioSeleccionado && f.getMonth() === mesSeleccionado) {
        altasMes.push(s);

        const servNombre = s.servicios_recurrentes?.nombre || "Otros Servicios";
        const servId = s.servicio_id || "sin_servicio";
        const current = desgloseServiciosMap.get(servId) || { nombre: servNombre, count: 0, mrr: 0 };
        current.count += 1;
        current.mrr += getMrrMensual(s);
        desgloseServiciosMap.set(servId, current);
      }
    });

    let nuevoMrr = 0;
    let nuevaGanancia = 0;
    let gestionadas = 0;
    let acompanamiento = 0;

    altasMes.forEach((s) => {
      nuevoMrr += getMrrMensual(s);
      nuevaGanancia += getGananciaMensual(s);
      if (isAcompanamiento(s)) {
        acompanamiento++;
      } else {
        gestionadas++;
      }
    });

    const desglose = Array.from(desgloseServiciosMap.values()).sort((a, b) => b.count - a.count);

    return {
      totalAltas: altasMes.length,
      gestionadas,
      acompanamiento,
      nuevoMrr,
      nuevaGanancia,
      desglose,
      promedioAlta: gestionadas > 0 ? nuevoMrr / gestionadas : 0,
    };
  }, [suscripciones, anioSeleccionado, mesSeleccionado]);

  // Exportar vista actual a formato CSV / Excel
  const exportarCSV = () => {
    if (suscripcionesFiltradas.length === 0) {
      alert("No hay suscripciones en la vista actual para exportar.");
      return;
    }
    const encabezados = [
      "ID Ref",
      "Cliente",
      "RIF/Cedula",
      "Telefono",
      "Correo Cliente",
      "Servicio",
      "Modalidad",
      "Cuenta Creada (Usuario)",
      "Clave",
      "Serial / KIT",
      "Fecha Inscripcion",
      "Monto USD",
      "Costo Base USD",
      "Ciclo",
      "Estado",
      "Proximo Pago",
    ];

    const filas = suscripcionesFiltradas.map((s, idx) => {
      const idRef = `USR-${String(idx + 1).padStart(3, "0")}`;
      const modalidad = isAcompanamiento(s) ? "Acompanamiento" : "Cobro TecnoSmart";
      return [
        `"${idRef}"`,
        `"${(s.clientes?.empresa || s.clientes?.contacto || "").replace(/"/g, '""')}"`,
        `"${(s.clientes?.rif_cedula || "").replace(/"/g, '""')}"`,
        `"${(s.clientes?.telefono || "").replace(/"/g, '""')}"`,
        `"${((s.clientes as any)?.email || "").replace(/"/g, '""')}"`,
        `"${(s.servicios_recurrentes?.nombre || "").replace(/"/g, '""')}"`,
        `"${modalidad}"`,
        `"${(s.credenciales_usuario || "").replace(/"/g, '""')}"`,
        `"${(s.credenciales_clave || "").replace(/"/g, '""')}"`,
        `"${(s.equipo_serial || s.credenciales_notas || "").replace(/"/g, '""')}"`,
        `"${s.fecha_inicio || ""}"`,
        s.monto || 0,
        s.costo_base || 0,
        `"${s.ciclo_facturacion || "Mensual"}"`,
        `"${s.estado || "Activo"}"`,
        `"${s.proximo_pago || ""}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [encabezados.join(","), ...filas].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `TecnoSmart_Cuentas_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Secciones para la pestaña de Cobranzas (Excluye acompañamiento con monto 0 de deudas)
  const cobranzasCategorizadas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const en7Dias = new Date();
    en7Dias.setDate(hoy.getDate() + 7);
    en7Dias.setHours(23, 59, 59, 999);

    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);

    const vencidas: Suscripcion[] = [];
    const proximos7Dias: Suscripcion[] = [];
    const esteMes: Suscripcion[] = [];
    const acompanamientoCortes: Suscripcion[] = [];

    suscripcionesFiltradas.forEach((s) => {
      if (s.estado !== "Activo") return;

      // Si es acompañamiento (pago directo cliente), va a su lista informativa sin considerarse deuda
      if (isAcompanamiento(s)) {
        acompanamientoCortes.push(s);
        return;
      }

      const f = new Date(s.proximo_pago);
      if (f < hoy) {
        vencidas.push(s);
      } else if (f <= en7Dias) {
        proximos7Dias.push(s);
      } else if (f <= finMes) {
        esteMes.push(s);
      }
    });

    return { vencidas, proximos7Dias, esteMes, acompanamientoCortes };
  }, [suscripcionesFiltradas]);

  // ─────────────────────────────────────────────────────────────
  // ACCIONES CRUD
  // ─────────────────────────────────────────────────────────────
  const openNewStarlink = () => {
    setStarlinkEditSub(null);
    setShowStarlinkModal(true);
  };

  const descargarFichaPDF = async (s: Suscripcion) => {
    try {
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
    }
  };

  const openNewSuscripcion = () => {
    setEditId(null);
    setSelectedCliente(null);
    setFormData({
      servicio_id: "",
      estado: "Activo",
      ciclo_facturacion: "Mensual",
      monto: "",
      costo_base: "0",
      modalidad: "gestionada",
      fecha_inicio: new Date().toISOString().split("T")[0],
      proximo_pago: new Date().toISOString().split("T")[0],
      credenciales_usuario: "",
      credenciales_clave: "",
      credenciales_notas: "",
      equipo_serial: "",
      socios: [],
    });
    setNuevoSocioNombre("");
    setFormType("suscripcion");
    setShowModal(true);
  };

  const openEditSuscripcion = (s: Suscripcion) => {
    if (isStarlinkSubscription(s)) {
      setStarlinkEditSub(s);
      setShowStarlinkModal(true);
      return;
    }
    setEditId(s.id);
    setSelectedCliente(s.clientes ? { id: s.cliente_id, ...s.clientes } : null);

    const sociosActuales =
      Array.isArray(s.socios) && s.socios.length > 0
        ? s.socios
        : [];

    const esAcomp = Number(s.monto || 0) <= 0;

    setFormData({
      servicio_id: s.servicio_id || "",
      estado: s.estado || "Activo",
      ciclo_facturacion: s.ciclo_facturacion || "Mensual",
      monto: (s.monto ?? "").toString(),
      costo_base: (s.costo_base ?? 0).toString(),
      modalidad: esAcomp ? "acompanamiento" : "gestionada",
      fecha_inicio: s.fecha_inicio || new Date().toISOString().split("T")[0],
      proximo_pago: s.proximo_pago || new Date().toISOString().split("T")[0],
      credenciales_usuario: s.credenciales_usuario || "",
      credenciales_clave: s.credenciales_clave || "",
      credenciales_notas: s.credenciales_notas || "",
      equipo_serial: s.equipo_serial || "",
      socios: sociosActuales,
    });
    setNuevoSocioNombre("");
    setFormType("suscripcion");
    setShowModal(true);
  };

  const openEditServicio = (s: ServicioRecurrente) => {
    setEditId(s.id);
    setServicioData({
      nombre: s.nombre,
      descripcion: s.descripcion || "",
      precio_sugerido: s.precio_sugerido?.toString() || "",
      mensaje_whatsapp: s.mensaje_whatsapp || "",
    });
    setFormType("servicio");
    setShowModal(true);
  };

  const handleSaveServicio = async () => {
    if (!servicioData.nombre.trim()) return alert("El nombre del servicio es obligatorio.");
    try {
      const payload = {
        nombre: servicioData.nombre.trim(),
        descripcion: servicioData.descripcion.trim(),
        precio_sugerido: Number(servicioData.precio_sugerido) || 0,
        mensaje_whatsapp: servicioData.mensaje_whatsapp.trim(),
      };

      if (editId) {
        const { error } = await supabase.from("servicios_recurrentes").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("servicios_recurrentes").insert([payload]);
        if (error) throw error;
      }

      await fetchData();
      setShowModal(false);
    } catch (e: any) {
      console.error(e);
      alert("Error al guardar servicio: " + e.message);
    }
  };

  const handleDeleteServicio = async (servicioId: string, servicioNombre: string) => {
    // Check if any subscription uses this service
    const usandoEsteServicio = suscripciones.filter((s) => s.servicio_id === servicioId);
    if (usandoEsteServicio.length > 0) {
      return alert(
        `No se puede eliminar "${servicioNombre}" porque tiene ${usandoEsteServicio.length} suscripción(es) activa(s) asociada(s). Elimina o reasigna esas suscripciones primero.`
      );
    }
    if (!confirm(`¿Estás seguro de que deseas eliminar el servicio "${servicioNombre}" del catálogo?`)) return;
    try {
      const { error } = await supabase.from("servicios_recurrentes").delete().eq("id", servicioId);
      if (error) throw error;
      await fetchData();
    } catch (e: any) {
      console.error(e);
      alert("Error al eliminar servicio: " + e.message);
    }
  };

  const handleSaveSuscripcion = async () => {
    if (!selectedCliente || !formData.servicio_id) {
      return alert("Cliente y Servicio son obligatorios.");
    }

    const esAcomp = formData.modalidad === "acompanamiento";
    const montoFinal = esAcomp ? 0 : Number(formData.monto) || 0;
    const costoFinal = esAcomp ? 0 : Number(formData.costo_base) || 0;

    // Validar suma de porcentaje de socios solo para suscripciones con ganancia/monto que tengan socios asignados
    if (!esAcomp && formData.socios.length > 0) {
      const totalPorcentaje = formData.socios.reduce(
        (acc, curr) => acc + (Number(curr.porcentaje) || 0),
        0
      );
      if (totalPorcentaje !== 100) {
        return alert(`La división entre socios debe sumar exactamente 100% (Suma actual: ${totalPorcentaje}%).`);
      }
    }

    try {
      const payload = {
        cliente_id: selectedCliente.id,
        servicio_id: formData.servicio_id,
        estado: formData.estado,
        ciclo_facturacion: formData.ciclo_facturacion,
        monto: montoFinal,
        costo_base: costoFinal,
        socios: esAcomp ? [] : formData.socios,
        fecha_inicio: formData.fecha_inicio,
        proximo_pago: formData.proximo_pago,
        credenciales_usuario: formData.credenciales_usuario,
        credenciales_clave: formData.credenciales_clave,
        credenciales_notas: formData.credenciales_notas,
        equipo_serial: formData.equipo_serial,
      };

      if (editId) {
        const { error } = await supabase.from("suscripciones").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suscripciones").insert([payload]);
        if (error) throw error;
      }

      await fetchData();
      setShowModal(false);

      // Si el drawer estaba abierto con este id, refrescar el seleccionado
      if (selected && selected.id === editId) {
        const { data: updated } = await supabase
          .from("suscripciones")
          .select(`
            *,
            clientes(id, empresa, contacto, telefono, rif_cedula, direccion),
            servicios_recurrentes(id, nombre, mensaje_whatsapp, precio_sugerido)
          `)
          .eq("id", editId)
          .single();
        if (updated) setSelected(updated);
      }
    } catch (e: any) {
      console.error(e);
      alert("Error al guardar suscripción: " + e.message);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // GESTIÓN DE ESTADOS: PAUSAR, CANCELAR, REACTIVAR
  // ─────────────────────────────────────────────────────────────
  const handleCambiarEstadoSuscripcion = async (
    subId: string,
    nuevoEstado: "Activo" | "Suspendido" | "Cancelado"
  ) => {
    try {
      const { error } = await supabase
        .from("suscripciones")
        .update({ estado: nuevoEstado })
        .eq("id", subId);

      if (error) throw error;

      // Actualizar estado local inmediatamente
      setSuscripciones((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, estado: nuevoEstado } : s))
      );

      if (selected && selected.id === subId) {
        setSelected((prev) => (prev ? { ...prev, estado: nuevoEstado } : null));
      }

      await fetchData();
    } catch (err: any) {
      console.error("Error al actualizar estado:", err);
      alert("Error al cambiar estado de la suscripción: " + err.message);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // ELIMINAR SUSCRIPCIÓN CON CONFIRMACIÓN DE SEGURIDAD
  // ─────────────────────────────────────────────────────────────
  const confirmarEliminarSuscripcion = async () => {
    if (!suscripcionParaEliminar) return;
    setEliminandoSub(true);
    try {
      const subId = suscripcionParaEliminar.id;
      // 1. Borrar pagos asociados para evitar errores de clave foránea
      await supabase.from("suscripciones_pagos").delete().eq("suscripcion_id", subId);

      // 2. Borrar la suscripción
      const { error } = await supabase.from("suscripciones").delete().eq("id", subId);
      if (error) throw error;

      // 3. Limpiar estado local
      setSuscripciones((prev) => prev.filter((s) => s.id !== subId));
      if (selected && selected.id === subId) {
        setSelected(null);
      }
      setSuscripcionParaEliminar(null);
      await fetchData();
    } catch (e: any) {
      console.error(e);
      alert("Error al eliminar la suscripción: " + e.message);
    } finally {
      setEliminandoSub(false);
    }
  };

  const handleDeleteSuscripcion = async () => {
    if (!editId) return;
    const sub = suscripciones.find((s) => s.id === editId);
    if (sub) {
      setShowModal(false);
      setSuscripcionParaEliminar(sub);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENOVAR Y REGISTRAR PAGO
  // ─────────────────────────────────────────────────────────────
  const openRenovarModal = (s: Suscripcion) => {
    const actual = new Date(s.proximo_pago);
    let nextDate = new Date(s.proximo_pago);
    switch (s.ciclo_facturacion) {
      case "Mensual":
        nextDate.setMonth(actual.getMonth() + 1);
        break;
      case "Bimestral":
        nextDate.setMonth(actual.getMonth() + 2);
        break;
      case "Trimestral":
        nextDate.setMonth(actual.getMonth() + 3);
        break;
      case "Semestral":
        nextDate.setMonth(actual.getMonth() + 6);
        break;
      case "Anual":
        nextDate.setFullYear(actual.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(actual.getMonth() + 1);
    }

    setRenovarData({
      suscripcion_id: s.id,
      proximo_pago: nextDate.toISOString().split("T")[0],
      fecha_pago: new Date().toISOString().split("T")[0],
      referencia: "",
      notas: "",
      monto: s.monto,
    });
    setShowRenovarModal(true);
  };

  const handleConfirmarRenovacion = async () => {
    if (!renovarData.referencia.trim()) {
      return alert("Por favor ingresa una referencia o identificador de pago.");
    }

    try {
      const { error: pagoErr } = await supabase.from("suscripciones_pagos").insert([
        {
          suscripcion_id: renovarData.suscripcion_id,
          monto: renovarData.monto,
          fecha_pago: renovarData.fecha_pago || new Date().toISOString().split("T")[0],
          referencia: renovarData.referencia.trim(),
          notas: renovarData.notas.trim(),
        },
      ]);
      if (pagoErr) throw pagoErr;

      const { error: subErr } = await supabase
        .from("suscripciones")
        .update({ proximo_pago: renovarData.proximo_pago })
        .eq("id", renovarData.suscripcion_id);
      if (subErr) throw subErr;

      await fetchData();
      setShowRenovarModal(false);

      if (selected && selected.id === renovarData.suscripcion_id) {
        abrirDetalle({ ...selected, proximo_pago: renovarData.proximo_pago });
      }

      alert("Suscripción renovada exitosamente y pago registrado.");
    } catch (e: any) {
      console.error(e);
      alert("Error al renovar: " + e.message);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // FACTURACIÓN Y WHATSAPP
  // ─────────────────────────────────────────────────────────────
  const handleGenerarFactura = (s: Suscripcion) => {
    const cId = s.clientes?.id || s.cliente_id;
    const cNombre = s.clientes?.empresa || s.clientes?.contacto || "";
    const cRif = s.clientes?.rif_cedula || "";
    const cTelf = s.clientes?.telefono || "";
    const sNombre = `Renovación de ${s.servicios_recurrentes?.nombre || "Servicio"} - Ciclo ${s.ciclo_facturacion}`;
    const sMonto = s.monto.toString();

    const params = new URLSearchParams({
      modo: "venta_directa",
      cliente_id: cId,
      cliente_nombre: cNombre,
      cliente_rif: cRif,
      cliente_telefono: cTelf,
      servicio: sNombre,
      monto: sMonto,
    });

    router.push(`/facturacion?${params.toString()}`);
  };

  const handleEnviarWhatsApp = (s: Suscripcion) => {
    const telf = s.clientes?.telefono?.replace(/\D/g, "");
    if (!telf) {
      alert("El cliente no tiene un teléfono registrado.");
      return;
    }

    const clienteNombre = s.clientes?.empresa || s.clientes?.contacto || "Estimado Cliente";
    const servicioNombre = s.servicios_recurrentes?.nombre || "Servicio TecnoSmart";
    const plantilla = s.servicios_recurrentes?.mensaje_whatsapp;

    let mensaje = "";
    if (plantilla) {
      mensaje = plantilla
        .replace(/{cliente}/g, clienteNombre)
        .replace(/{servicio}/g, servicioNombre)
        .replace(/{monto}/g, formatUSD(s.monto));
    } else {
      mensaje = `Hola ${clienteNombre}, te saludamos de TecnoSmart. Te recordamos tu pago de ${formatUSD(s.monto)} correspondiente a la renovación de tu servicio de ${servicioNombre}. ¡Quedamos a tu orden!`;
    }

    window.open(`https://wa.me/${telf}?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "Activo":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "Suspendido":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "Cancelado":
        return "text-[var(--ts-red)] bg-[var(--ts-red)]/10 border-[var(--ts-red)]/20";
      default:
        return "text-[var(--ts-text-muted)] bg-[var(--ts-surface-2)] border-[var(--ts-border)]";
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      {/* ── 1. NAVEGACIÓN PRINCIPAL (TABS SUPERIORES) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {/* Pestañas Principales */}
        <div className="flex bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-1 shadow-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab("starlink")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "starlink"
                ? "bg-[var(--ts-red)] text-white shadow-sm"
                : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Flota Starlink</span>
            <span
              className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                activeTab === "starlink" ? "bg-white/20 text-white" : "bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)]"
              }`}
            >
              {suscripciones.filter((s) => isStarlinkSubscription(s)).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("activas")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0 ${
              activeTab === "activas"
                ? "bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] shadow-sm"
                : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
            }`}
          >
            Otras Suscripciones
          </button>

          <button
            onClick={() => setActiveTab("cobranzas")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "cobranzas"
                ? "bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] shadow-sm"
                : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
            }`}
          >
            <span>Cobranzas</span>
            {cobranzasCategorizadas.vencidas.length > 0 && (
              <span className="bg-[var(--ts-red)] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {cobranzasCategorizadas.vencidas.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("analitica")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "analitica"
                ? "bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] shadow-sm"
                : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Analítica & Socios</span>
          </button>

          <button
            onClick={() => setActiveTab("catalogo")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0 ${
              activeTab === "catalogo"
                ? "bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] shadow-sm"
                : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
            }`}
          >
            Catálogo de Servicios
          </button>
        </div>

        {/* Buscador y botones de acción */}
        <div className="flex items-center gap-2">
          {activeTab !== "catalogo" && activeTab !== "starlink" && activeTab !== "analitica" && (
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-[var(--ts-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente, RIF, correo o serial..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {activeTab === "catalogo" && (
            <button
              onClick={() => {
                setFormType("servicio");
                setEditId(null);
                setServicioData({ nombre: "", descripcion: "", precio_sugerido: "", mensaje_whatsapp: "" });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-[var(--ts-surface)] border border-[var(--ts-border)] hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-[var(--ts-red)]" /> Nuevo Servicio
            </button>
          )}

          {activeTab === "activas" && (
            <button
              onClick={openNewSuscripcion}
              className="flex items-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" /> Nueva Suscripción
            </button>
          )}
        </div>
      </div>

      {/* ── FLOTA STARLINK ── */}
      {activeTab === "starlink" && (
        <StarlinkFleetView
          suscripciones={suscripciones}
          servicios={servicios}
          onOpenNewStarlink={openNewStarlink}
          onSelectSuscripcion={(sub) => abrirDetalle(sub)}
          onEditSuscripcion={(sub) => {
            setStarlinkEditSub(sub);
            setShowStarlinkModal(true);
          }}
          onRefresh={fetchData}
          onCambiarEstado={handleCambiarEstadoSuscripcion}
          onEliminarSuscripcion={(sub) => setSuscripcionParaEliminar(sub)}
        />
      )}

      {/* ── TAB ANALÍTICA & RENDIMIENTO DE SOCIOS ── */}
      {activeTab === "analitica" && (
        <div className="space-y-6">

          {/* ── 1. PARTNER FILTER BAR ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)] px-2">
            Filtrar por Socio:
          </span>
          <button
            onClick={() => setFiltroSocio("todos")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filtroSocio === "todos"
                ? "bg-[var(--ts-red)] text-white shadow-sm"
                : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)]"
            }`}
          >
            🏢 Vista Global
          </button>
          {perfilesEquipo.map((socio) => {
            const isSelected = filtroSocio === socio.id;
            const esYo = usuario?.id === socio.id;
            return (
              <button
                key={socio.id}
                onClick={() => setFiltroSocio(socio.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? "bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] border-[var(--ts-border)] shadow-sm"
                    : "border-transparent text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)]"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: socio.color }}
                />
                👤 {socio.nombre.split(" ")[0]}
                {esYo && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/20">
                    tú
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {filtroSocio !== "todos" && (
          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Métricas proporcionales aplicadas
          </div>
        )}
      </div>

      {/* ── 2. DASHBOARD KPI CARDS (4 cards in a row) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR Mensual */}
        <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
              MRR Mensual
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-500 tracking-tight">
              {formatUSD(stats.mrr)}
            </p>
            <p className="text-[11px] text-[var(--ts-text-muted)] mt-1.5 flex items-center gap-1">
              Ingreso mensual recurrente
              {filtroSocio !== "todos" && " (Participación)"}
            </p>
          </div>
        </div>

        {/* ARR Proyectado */}
        <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
              ARR Proyectado
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-[var(--ts-text-primary)] tracking-tight">
              {formatUSD(stats.arr)}
            </p>
            <p className="text-[11px] text-[var(--ts-text-muted)] mt-1.5">
              MRR × 12 meses estimados
            </p>
          </div>
        </div>

        {/* Ganancia Neta Mensual */}
        <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
              Ganancia Neta / Mes
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-400 tracking-tight">
              {formatUSD(stats.gananciaNeta)}
            </p>
            <p className="text-[11px] text-[var(--ts-text-muted)] mt-1.5">
              Monto − Costo base del proveedor
            </p>
          </div>
        </div>

        {/* Por Cobrar (Vencidas) */}
        <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
              Por Cobrar (Vencidas)
            </span>
            <div className="w-8 h-8 rounded-xl bg-[var(--ts-red)]/10 flex items-center justify-center text-[var(--ts-red)]">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-[var(--ts-red)] tracking-tight">
                {formatUSD(stats.porCobrarMonto)}
              </p>
              <span className="text-xs font-bold text-[var(--ts-red)] bg-[var(--ts-red)]/10 px-2 py-0.5 rounded-full">
                {stats.porCobrarCount} {stats.porCobrarCount === 1 ? "sub" : "subs"}
              </span>
            </div>
            <p className="text-[11px] text-[var(--ts-text-muted)] mt-1.5">
              Fecha de pago cumplida o expirada
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. CHARTS (2-column layout below KPIs) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left (2/3 width): Bar chart — MRR por Servicio */}
        <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 lg:col-span-2 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--ts-text-primary)] uppercase tracking-wider">
                MRR por Servicio
              </h3>
              <p className="text-xs text-[var(--ts-text-muted)] mt-0.5">
                Aporte recurrente mensual clasificado por producto / servicio
              </p>
            </div>
            <span className="text-xs font-bold text-[var(--ts-text-muted)] bg-[var(--ts-surface-2)] px-2.5 py-1 rounded-lg">
              {barChartData.length} {barChartData.length === 1 ? "servicio activo" : "servicios activos"}
            </span>
          </div>

          <div className="h-64 w-full mt-2">
            {barChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[var(--ts-text-muted)]">
                <RefreshCw className="w-8 h-8 mb-2 opacity-30 animate-spin" />
                No hay suscripciones activas registradas para este filtro.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ts-border)" />
                  <XAxis
                    dataKey="nombre"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--ts-text-muted)" }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--ts-text-muted)" }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--ts-border)", opacity: 0.3 }}
                    contentStyle={{
                      backgroundColor: "var(--ts-surface)",
                      borderColor: "var(--ts-border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "var(--ts-text-primary)",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    }}
                    formatter={(val: any) => [formatUSD(Number(val)), "MRR"]}
                  />
                  <Bar
                    dataKey="mrr"
                    fill="var(--ts-red)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right (1/3 width): Pie/Donut chart — Distribución entre Socios */}
        <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 lg:col-span-1 shadow-sm flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-[var(--ts-text-primary)] uppercase tracking-wider">
              Distribución de Ganancia Neta
            </h3>
            <p className="text-xs text-[var(--ts-text-muted)] mt-0.5">
              Reparto mensual entre socios
            </p>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center">
            {pieChartData.length === 0 ? (
              <div className="text-xs text-[var(--ts-text-muted)] text-center">
                Sin datos de ganancia neta.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--ts-surface)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--ts-surface)",
                      borderColor: "var(--ts-border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "var(--ts-text-primary)",
                    }}
                    formatter={(val: any, name: any) => [formatUSD(Number(val)), `${name}`]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Leyenda de Socios */}
          <div className="space-y-2 mt-2 pt-3 border-t border-[var(--ts-border)]">
            {pieChartData.map((item) => {
              const totalGanancia = pieChartData.reduce((acc, c) => acc + c.value, 0);
              const pct = totalGanancia > 0 ? Math.round((item.value / totalGanancia) * 100) : 0;
              return (
                <div key={item.nombre} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-[var(--ts-text-primary)]">{item.nombre}</span>
                    <span className="text-[10px] text-[var(--ts-text-muted)]">({pct}%)</span>
                  </div>
                  <span className="font-bold text-[var(--ts-text-primary)]">{formatUSD(item.value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 3.5 PANEL DE NUEVAS ALTAS & ACTIVACIONES (HISTÓRICO MENSUAL) ── */}
      <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[var(--ts-border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--ts-text-primary)] uppercase tracking-wider">
                Rendimiento de Nuevas Altas & Activaciones
              </h3>
              <p className="text-xs text-[var(--ts-text-muted)]">
                Contrataciones y clientes nuevos incorporados por mes
              </p>
            </div>
          </div>

          {/* Selectores de Período */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(Number(e.target.value))}
              className="bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
            >
              {[
                "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
              ].map((m, idx) => (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>

            <select
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
              className="bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setMesSeleccionado(new Date().getMonth());
                setAnioSeleccionado(new Date().getFullYear());
              }}
              className="px-2.5 py-1.5 text-xs font-bold bg-[var(--ts-surface-2)] hover:bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] rounded-xl transition-all"
            >
              Este Mes
            </button>
          </div>
        </div>

        {/* 4 Mini KPIs del Mes Seleccionado */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[var(--ts-surface-2)]/60 rounded-xl p-3 border border-[var(--ts-border)]">
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
              Nuevas Altas ({[
                "Ene", "Feb", "Mar", "Abr", "May", "Jun",
                "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
              ][mesSeleccionado]})
            </p>
            <p className="text-2xl font-black text-[var(--ts-text-primary)] mt-1">
              {statsAltas.totalAltas}
            </p>
            <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">
              {statsAltas.gestionadas} cobro · {statsAltas.acompanamiento} soporte
            </p>
          </div>

          <div className="bg-[var(--ts-surface-2)]/60 rounded-xl p-3 border border-[var(--ts-border)]">
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
              Nuevo MRR Sumado
            </p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {formatUSD(statsAltas.nuevoMrr)}
            </p>
            <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">
              Ingreso mensual recurrente nuevo
            </p>
          </div>

          <div className="bg-[var(--ts-surface-2)]/60 rounded-xl p-3 border border-[var(--ts-border)]">
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
              Nueva Ganancia / Mes
            </p>
            <p className="text-2xl font-black text-blue-400 mt-1">
              {formatUSD(statsAltas.nuevaGanancia)}
            </p>
            <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">
              Margen neto incorporado
            </p>
          </div>

          <div className="bg-[var(--ts-surface-2)]/60 rounded-xl p-3 border border-[var(--ts-border)]">
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
              Promedio por Alta
            </p>
            <p className="text-2xl font-black text-[var(--ts-text-primary)] mt-1">
              {formatUSD(statsAltas.promedioAlta)}
            </p>
            <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">
              Ticket promedio por cliente nuevo
            </p>
          </div>
        </div>

        {/* Desglose de Altas por Servicio */}
        <div className="pt-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)] mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Desglose de contrataciones en el período:
          </p>
          {statsAltas.desglose.length === 0 ? (
            <p className="text-xs text-[var(--ts-text-muted)] italic">
              No hay nuevas activaciones registradas en este mes seleccionado.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {statsAltas.desglose.map((d, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl flex items-center gap-2 text-xs font-bold"
                >
                  <span className="text-[var(--ts-text-primary)]">{d.nombre}:</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 font-black text-[11px]">
                    {d.count} {d.count === 1 ? "alta" : "altas"}
                  </span>
                  <span className="text-[10px] text-[var(--ts-text-muted)]">
                    (+{formatUSD(d.mrr)}/mes)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        </div>
      )}

      {/* ── 5. TAB 1: SUSCRIPCIONES ACTIVAS (FILTROS POR SERVICIO, MODALIDAD Y TABLAS) ── */}
      {activeTab === "activas" && (
        <div className="space-y-4">
          {/* BARRA DE FILTROS DINÁMICOS POR SERVICIO */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)] shrink-0 px-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[var(--ts-red)]" /> Servicio:
            </span>

            <button
              onClick={() => setFiltroServicio("todos")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                filtroServicio === "todos"
                  ? "bg-[var(--ts-red)] text-white border-[var(--ts-red)] shadow-sm"
                  : "bg-[var(--ts-surface)] text-[var(--ts-text-muted)] border-[var(--ts-border)] hover:text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)]"
              }`}
            >
              <span>Todos los Servicios</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                filtroServicio === "todos" ? "bg-white/20 text-white" : "bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)]"
              }`}>
                {Array.from(conteoPorServicio.values()).reduce((a, b) => a + b, 0)}
              </span>
            </button>

            {servicios.map((s) => {
              const count = conteoPorServicio.get(s.id) || 0;
              const isSelected = filtroServicio === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setFiltroServicio(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-[var(--ts-red)] text-white border-[var(--ts-red)] shadow-sm"
                      : "bg-[var(--ts-surface)] text-[var(--ts-text-muted)] border-[var(--ts-border)] hover:text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)]"
                  }`}
                >
                  <span>{s.nombre}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isSelected ? "bg-white/20 text-white" : "bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)]"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* BARRA DE FILTRO POR SOCIO / RESPONSABLE (VISTA GLOBAL POR DEFECTO) */}
          {perfilesEquipo.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)] shrink-0 px-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-[var(--ts-red)]" /> Socio:
              </span>

              <button
                onClick={() => setFiltroSocio("todos")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                  filtroSocio === "todos"
                    ? "bg-[var(--ts-red)] text-white border-[var(--ts-red)] shadow-sm"
                    : "bg-[var(--ts-surface)] text-[var(--ts-text-muted)] border-[var(--ts-border)] hover:text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)]"
                }`}
              >
                <span>🏢 Todos los Socios</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  filtroSocio === "todos" ? "bg-white/20 text-white" : "bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)]"
                }`}>
                  {suscripciones.filter(s => filtroServicio === "todos" || s.servicio_id === filtroServicio).length}
                </span>
              </button>

              {perfilesEquipo.map((socio) => {
                const count = suscripciones.filter(
                  (s) => (filtroServicio === "todos" || s.servicio_id === filtroServicio) && doesSocioParticipate(s, socio.id)
                ).length;
                const isSelected = filtroSocio === socio.id;
                return (
                  <button
                    key={socio.id}
                    onClick={() => setFiltroSocio(socio.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                      isSelected
                        ? "bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] border-[var(--ts-red)] shadow-sm font-bold"
                        : "bg-[var(--ts-surface)] text-[var(--ts-text-muted)] border-[var(--ts-border)] hover:text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)]"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: socio.color }}
                    />
                    <span>{socio.nombre.split(" ")[0]}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isSelected ? "bg-[var(--ts-red-subtle)] text-[var(--ts-red)] font-bold" : "bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)]"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* SUB-TOOLBAR: MODALIDAD (Cobro vs Acompañamiento) & TOGGLE DE VISTA (Financiera vs Bóveda) */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-[var(--ts-surface)] border border-[var(--ts-border)] p-2.5 rounded-2xl">
            {/* Filtro por Modalidad */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)] px-2">
                Modalidad:
              </span>
              <button
                onClick={() => setFiltroModalidad("todas")}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all border ${
                  filtroModalidad === "todas"
                    ? "bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] border-[var(--ts-border)] shadow-sm"
                    : "border-transparent text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                }`}
              >
                Todas ({conteoModalidades.total})
              </button>
              <button
                onClick={() => setFiltroModalidad("gestionada")}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border ${
                  filtroModalidad === "gestionada"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm"
                    : "border-transparent text-[var(--ts-text-muted)] hover:text-emerald-400"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Cobro TecnoSmart ({conteoModalidades.gestionadas})</span>
              </button>
              <button
                onClick={() => setFiltroModalidad("acompanamiento")}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border ${
                  filtroModalidad === "acompanamiento"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-sm"
                    : "border-transparent text-[var(--ts-text-muted)] hover:text-blue-400"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Solo Acompañamiento ({conteoModalidades.acompanamiento})</span>
              </button>
            </div>

            {/* Toggle de Modo de Vista & Exportar CSV */}
            <div className="flex items-center gap-2">
              <div className="flex bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl p-0.5">
                <button
                  onClick={() => setModoVista("financiera")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    modoVista === "financiera"
                      ? "bg-[var(--ts-surface)] text-[var(--ts-text-primary)] shadow-sm"
                      : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                  }`}
                  title="Vista Financiera (Monto, Ganancia, Próximo Pago, Socios)"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Financiera</span>
                </button>
                <button
                  onClick={() => setModoVista("boveda")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    modoVista === "boveda"
                      ? "bg-[var(--ts-surface)] text-[var(--ts-text-primary)] shadow-sm"
                      : "text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                  }`}
                  title="Vista Bóveda de Cuentas (Estilo Excel con Correos, Claves y Seriales)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                  <span>Bóveda Excel</span>
                </button>
              </div>

              <button
                onClick={exportarCSV}
                className="px-3 py-1 text-xs font-bold bg-[var(--ts-surface-2)] hover:bg-[var(--ts-surface)] text-[var(--ts-text-primary)] border border-[var(--ts-border)] rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                title="Descargar datos en CSV compatible con Excel"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* VISTA 1: BÓVEDA DE CUENTAS (ESTILO HOJA DE CÁLCULO EXCEL) */}
          {modoVista === "boveda" && (
            <div className="space-y-4">
              {/* HEADER DE MÉTRICAS OPERATIVAS (IDÉNTICO A LA HOJA DE EXCEL) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl p-4 shadow-sm text-center">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
                    Total Usuarios / Cuentas
                  </p>
                  <p className="text-2xl font-black text-[var(--ts-text-primary)] mt-1">
                    {statsBoveda.totalCuentas}
                  </p>
                </div>
                <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl p-4 shadow-sm text-center">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
                    Total Recaudado / Facturado
                  </p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">
                    {formatUSD(statsBoveda.totalRecaudado)}
                  </p>
                </div>
                <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl p-4 shadow-sm text-center">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
                    Promedio por Usuario
                  </p>
                  <p className="text-2xl font-black text-blue-400 mt-1">
                    {formatUSD(statsBoveda.promedio)}
                  </p>
                </div>
              </div>

              {/* TABLA ESTILO EXCEL CON CREDENCIALES DIRECTAS */}
              <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1100px]">
                    <thead>
                      <tr className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)] text-[9px] uppercase font-black text-[var(--ts-text-muted)]">
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Usuario / Cliente</th>
                        <th className="px-4 py-3">Correo Cliente</th>
                        <th className="px-4 py-3">Cuenta Creada (Email)</th>
                        <th className="px-4 py-3">Clave</th>
                        <th className="px-4 py-3">Equipo / Serial</th>
                        <th className="px-4 py-3">Inscripción</th>
                        <th className="px-4 py-3">Monto</th>
                        <th className="px-4 py-3">Modalidad</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ts-border)] text-xs">
                      {suscripcionesFiltradas.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="px-5 py-12 text-center text-[var(--ts-text-muted)]">
                            No se encontraron cuentas registradas con este filtro.
                          </td>
                        </tr>
                      ) : (
                        suscripcionesFiltradas.map((s, idx) => {
                          const idRef = `USR-${String(idx + 1).padStart(3, "0")}`;
                          const esAcomp = isAcompanamiento(s);
                          const claveVisible = clavesVisibles[s.id] || false;

                          return (
                            <tr
                              key={s.id}
                              onClick={() => abrirDetalle(s)}
                              className="hover:bg-[var(--ts-surface-2)]/60 cursor-pointer transition-colors"
                            >
                              {/* ID Ref */}
                              <td className="px-4 py-3 font-mono font-bold text-[11px] text-[var(--ts-text-muted)]">
                                {idRef}
                              </td>

                              {/* Usuario / Cliente */}
                              <td className="px-4 py-3">
                                <div className="font-bold text-[var(--ts-text-primary)]">
                                  {s.clientes?.empresa || s.clientes?.contacto || "Sin Cliente"}
                                </div>
                                <div className="text-[10px] text-[var(--ts-text-muted)]">
                                  {s.servicios_recurrentes?.nombre}
                                </div>
                              </td>

                              {/* Correo Cliente */}
                              <td className="px-4 py-3 text-[11px] text-[var(--ts-text-muted)]">
                                {(s.clientes as any)?.email ? (
                                  <span className="font-mono">{((s.clientes as any).email)}</span>
                                ) : (
                                  <span className="italic text-gray-500">—</span>
                                )}
                              </td>

                              {/* Cuenta Creada (credenciales_usuario) + Copiar */}
                              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                {s.credenciales_usuario ? (
                                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-blue-400 bg-[var(--ts-surface-2)] px-2 py-1 rounded-lg border border-[var(--ts-border)] max-w-fit">
                                    <span className="truncate max-w-[180px]">{s.credenciales_usuario}</span>
                                    <button
                                      onClick={() => handleCopiar(s.credenciales_usuario!, `usr-${s.id}`)}
                                      className="p-1 hover:text-white transition-colors"
                                      title="Copiar correo de la cuenta"
                                    >
                                      {copiado === `usr-${s.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 text-[var(--ts-text-muted)]" />
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-[var(--ts-text-muted)] italic">No registrado</span>
                                )}
                              </td>

                              {/* Clave (credenciales_clave) + Toggle Ver + Copiar */}
                              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                {s.credenciales_clave ? (
                                  <div className="flex items-center gap-1.5 font-mono text-[11px] bg-[var(--ts-surface-2)] px-2 py-1 rounded-lg border border-[var(--ts-border)] max-w-fit">
                                    <span className="text-[var(--ts-text-primary)] min-w-[70px]">
                                      {claveVisible ? s.credenciales_clave : "••••••••"}
                                    </span>
                                    <button
                                      onClick={() => setClavesVisibles(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                                      className="p-1 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] transition-colors"
                                      title={claveVisible ? "Ocultar clave" : "Mostrar clave"}
                                    >
                                      {claveVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      onClick={() => handleCopiar(s.credenciales_clave!, `pwd-${s.id}`)}
                                      className="p-1 hover:text-white transition-colors"
                                      title="Copiar contraseña"
                                    >
                                      {copiado === `pwd-${s.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 text-[var(--ts-text-muted)]" />
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-[var(--ts-text-muted)] italic">—</span>
                                )}
                              </td>

                              {/* Equipo / Serial / Kit */}
                              <td className="px-4 py-3 text-[11px] font-mono text-[var(--ts-text-muted)]">
                                {s.equipo_serial || s.credenciales_notas ? (
                                  <span className="truncate max-w-[150px] block" title={s.equipo_serial || s.credenciales_notas}>
                                    {s.equipo_serial || s.credenciales_notas}
                                  </span>
                                ) : (
                                  <span className="italic text-gray-500">—</span>
                                )}
                              </td>

                              {/* Fecha de Inscripción */}
                              <td className="px-4 py-3 text-[11px] text-[var(--ts-text-muted)] whitespace-nowrap">
                                {formatFecha(s.fecha_inicio || s.created_at)}
                              </td>

                              {/* Monto */}
                              <td className="px-4 py-3 font-black text-[var(--ts-text-primary)]">
                                {esAcomp ? (
                                  <span className="text-[11px] text-blue-400 font-bold">$0.00 (Directo)</span>
                                ) : (
                                  formatUSD(s.monto)
                                )}
                              </td>

                              {/* Modalidad */}
                              <td className="px-4 py-3">
                                {esAcomp ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1">
                                    <Handshake className="w-3 h-3" /> Acompañamiento
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> Cobro TecnoSmart
                                  </span>
                                )}
                              </td>

                              {/* Estado */}
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border ${getStatusBadge(
                                    s.estado
                                  )}`}
                                >
                                  {s.estado}
                                </span>
                              </td>

                              {/* Acciones */}
                              <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                  {s.estado === "Activo" ? (
                                    <button
                                      onClick={() => handleCambiarEstadoSuscripcion(s.id, "Suspendido")}
                                      title="Pausar por este mes"
                                      className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                    >
                                      <Pause className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleCambiarEstadoSuscripcion(s.id, "Activo")}
                                      title="Reactivar servicio"
                                      className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                    >
                                      <Play className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openEditSuscripcion(s)}
                                    title="Editar cuenta"
                                    className="p-1.5 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)] rounded-lg transition-colors"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setSuscripcionParaEliminar(s)}
                                    title="Eliminar suscripción definitivamente"
                                    className="p-1.5 text-[var(--ts-text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => abrirDetalle(s)}
                                    title="Ver panel lateral completo"
                                    className="p-1.5 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)] rounded-lg transition-colors"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 2: FINANCIERA (TABLA TRADICIONAL CON MARGEN, SOCIOS Y FACTURACIÓN) */}
          {modoVista === "financiera" && (
            <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-12 text-center text-[var(--ts-text-muted)] text-sm flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[var(--ts-red)]" /> Cargando suscripciones...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[950px]">
                    <thead>
                      <tr className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)]">
                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
                          Cliente
                        </th>
                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
                          Servicio
                        </th>
                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
                          Modalidad
                        </th>
                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
                          Estado
                        </th>
                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
                          Próximo Pago
                        </th>
                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
                          Monto
                        </th>
                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
                          Ganancia Neta
                        </th>
                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)]">
                          Socios
                        </th>
                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-[var(--ts-text-muted)] text-right">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ts-border)] text-sm">
                      {suscripcionesFiltradas.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-5 py-12 text-center text-[var(--ts-text-muted)]">
                            No se encontraron suscripciones activas registradas con este filtro.
                          </td>
                        </tr>
                      ) : (
                        suscripcionesFiltradas.map((s) => {
                          const ganancia = Number(s.monto || 0) - Number(s.costo_base || 0);
                          const esAcomp = isAcompanamiento(s);
                          const overdue = !esAcomp && isDue(s.proximo_pago) && s.estado === "Activo";

                          return (
                            <tr
                              key={s.id}
                              onClick={() => abrirDetalle(s)}
                              className="hover:bg-[var(--ts-surface-2)]/60 cursor-pointer transition-colors"
                            >
                              {/* Cliente */}
                              <td className="px-5 py-4">
                                <div className="font-bold text-[var(--ts-text-primary)]">
                                  {s.clientes?.empresa || s.clientes?.contacto || "Sin Cliente"}
                                </div>
                                <div className="text-xs text-[var(--ts-text-muted)] flex items-center gap-2 mt-0.5">
                                  <span>{s.clientes?.rif_cedula || s.clientes?.contacto || "—"}</span>
                                  {s.fecha_inicio && (
                                    <span className="text-[10px] text-gray-400">· Alta: {formatFecha(s.fecha_inicio)}</span>
                                  )}
                                </div>
                              </td>

                              {/* Servicio */}
                              <td className="px-5 py-4">
                                <div className="font-semibold text-[var(--ts-text-primary)] flex items-center gap-1.5">
                                  <RefreshCw className="w-3.5 h-3.5 text-[var(--ts-red)]" />
                                  {s.servicios_recurrentes?.nombre || "Servicio"}
                                </div>
                                <div className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider mt-0.5">
                                  Ciclo {s.ciclo_facturacion}
                                </div>
                              </td>

                              {/* Modalidad */}
                              <td className="px-5 py-4">
                                {esAcomp ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1">
                                    <Handshake className="w-3 h-3" /> Acompañamiento
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> Cobro TecnoSmart
                                  </span>
                                )}
                              </td>

                              {/* Estado */}
                              <td className="px-5 py-4">
                                <span
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border ${getStatusBadge(
                                    s.estado
                                  )}`}
                                >
                                  {s.estado === "Activo" && <CheckCircle className="w-3 h-3" />}
                                  {s.estado === "Suspendido" && <AlertTriangle className="w-3 h-3" />}
                                  {s.estado === "Cancelado" && <X className="w-3 h-3" />}
                                  {s.estado}
                                </span>
                              </td>

                              {/* Próximo Pago */}
                              <td className="px-5 py-4">
                                <div
                                  className={`font-semibold flex items-center gap-1.5 ${
                                    overdue ? "text-amber-500 font-bold" : "text-[var(--ts-text-primary)]"
                                  }`}
                                >
                                  <Calendar className="w-4 h-4 shrink-0" />
                                  {formatFecha(s.proximo_pago)}
                                </div>
                                {overdue && (
                                  <div className="text-[10px] text-amber-500 font-bold mt-0.5 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Pago Vencido
                                  </div>
                                )}
                              </td>

                              {/* Monto */}
                              <td className="px-5 py-4">
                                <div className="font-black text-[var(--ts-text-primary)]">
                                  {esAcomp ? (
                                    <span className="text-xs text-blue-400 font-bold">$0.00 (Directo)</span>
                                  ) : (
                                    formatUSD(s.monto)
                                  )}
                                </div>
                                {!esAcomp && (
                                  <div className="text-[10px] text-[var(--ts-text-muted)]">
                                    MRR: {formatUSD(getMrrMensual(s))}/mes
                                  </div>
                                )}
                              </td>

                              {/* Ganancia */}
                              <td className="px-5 py-4">
                                <div className="font-black text-emerald-400">
                                  {formatUSD(ganancia)}
                                </div>
                                {!esAcomp && (
                                  <div className="text-[10px] text-[var(--ts-text-muted)]">
                                    Costo: {formatUSD(s.costo_base || 0)}
                                  </div>
                                )}
                              </td>

                              {/* Socios (Avatar Initials Pills) */}
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-1">
                                  {Array.isArray(s.socios) && s.socios.length > 0 ? (
                                    s.socios.map((socio, idx) => {
                                      const info = getSocioBadgeInfo(socio);
                                      return (
                                        <div
                                          key={idx}
                                          title={`${info.nombre} (${socio.porcentaje}%)`}
                                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-sm border border-black/30"
                                          style={{ backgroundColor: info.color }}
                                        >
                                          {info.iniciales}
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <span className="text-[10px] text-[var(--ts-text-muted)] italic">
                                      {esAcomp ? "N/A" : "Sin asignar"}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Acciones */}
                              <td className="px-5 py-4 text-right">
                                <div
                                  className="flex items-center justify-end gap-1.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {!esAcomp && (
                                    <>
                                      <button
                                        onClick={() => handleGenerarFactura(s)}
                                        title="Generar Factura"
                                        className="text-xs font-bold text-[var(--ts-text-muted)] hover:text-white bg-[var(--ts-surface-2)] hover:bg-emerald-600 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                      >
                                        <CreditCard className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Facturar</span>
                                      </button>

                                      <button
                                        onClick={() => openRenovarModal(s)}
                                        title="Renovar Suscripción"
                                        className="text-xs font-bold text-[var(--ts-text-muted)] hover:text-white bg-[var(--ts-surface-2)] hover:bg-[var(--ts-red)] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Renovar</span>
                                      </button>
                                    </>
                                  )}

                                  {/* Cambiar Estado Rápido: Pausar / Reactivar */}
                                  {s.estado === "Activo" ? (
                                    <button
                                      onClick={() => handleCambiarEstadoSuscripcion(s.id, "Suspendido")}
                                      title="Pausar por este mes"
                                      className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                    >
                                      <Pause className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleCambiarEstadoSuscripcion(s.id, "Activo")}
                                      title="Reactivar servicio"
                                      className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                    >
                                      <Play className="w-4 h-4" />
                                    </button>
                                  )}

                                  {s.estado !== "Cancelado" && (
                                    <button
                                      onClick={() => handleCambiarEstadoSuscripcion(s.id, "Cancelado")}
                                      title="Cancelar suscripción"
                                      className="p-1.5 text-[var(--ts-text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                      <Ban className="w-4 h-4" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => openEditSuscripcion(s)}
                                    title="Editar"
                                    className="p-1.5 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] hover:bg-[var(--ts-surface-2)] rounded-lg transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => setSuscripcionParaEliminar(s)}
                                    title="Eliminar suscripción definitivamente"
                                    className="p-1.5 text-[var(--ts-text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 5. TAB 2: COBRANZAS (SUB-SECCIONES DE URGENCIA) ── */}
      {activeTab === "cobranzas" && (
        <div className="space-y-6">

          {/* Sub-sección 1: 🔴 VENCIDAS */}
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-[var(--ts-red)]/10 border-b border-[var(--ts-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[var(--ts-red)] animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--ts-red)]">
                  🔴 Pagos Vencidos ({cobranzasCategorizadas.vencidas.length})
                </h3>
              </div>
              <span className="text-xs font-bold text-[var(--ts-red)]">
                Total: {formatUSD(cobranzasCategorizadas.vencidas.reduce((a, b) => a + Number(b.monto || 0), 0))}
              </span>
            </div>

            {cobranzasCategorizadas.vencidas.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--ts-text-muted)] flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                ¡Excelente! No hay pagos vencidos actualmente.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)] text-[9px] uppercase font-black text-[var(--ts-text-muted)]">
                      <th className="px-5 py-2.5">Urgencia</th>
                      <th className="px-5 py-2.5">Cliente</th>
                      <th className="px-5 py-2.5">Servicio</th>
                      <th className="px-5 py-2.5">Monto</th>
                      <th className="px-5 py-2.5">Socios</th>
                      <th className="px-5 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ts-border)] text-xs">
                    {cobranzasCategorizadas.vencidas.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => abrirDetalle(s)}
                        className="hover:bg-[var(--ts-surface-2)]/60 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 bg-red-500/10 text-red-500 font-bold rounded-md text-[10px] inline-flex items-center gap-1 border border-red-500/20">
                            <AlertCircle className="w-3 h-3" />
                            Venció el {formatFecha(s.proximo_pago)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-[var(--ts-text-primary)]">
                          {s.clientes?.empresa || s.clientes?.contacto}
                          <div className="text-[10px] text-[var(--ts-text-muted)] font-normal">
                            {s.clientes?.telefono || "Sin teléfono"}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-[var(--ts-text-primary)]">
                          {s.servicios_recurrentes?.nombre}
                          <div className="text-[10px] text-[var(--ts-text-muted)] font-normal uppercase">
                            Ciclo {s.ciclo_facturacion}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-black text-[var(--ts-red)] text-sm">
                          {formatUSD(s.monto)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            {s.socios?.map((soc, idx) => {
                              const inf = getSocioBadgeInfo(soc);
                              return (
                                <div
                                  key={idx}
                                  title={`${inf.nombre} (${soc.porcentaje}%)`}
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                                  style={{ backgroundColor: inf.color }}
                                >
                                  {inf.iniciales}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleEnviarWhatsApp(s)}
                              title="Recordar vía WhatsApp"
                              className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                            </button>
                            <button
                              onClick={() => openRenovarModal(s)}
                              className="px-2.5 py-1 text-xs font-bold bg-[var(--ts-red)] hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Cobrar y Renovar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sub-sección 2: 🟡 PRÓXIMOS 7 DÍAS */}
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-amber-500/10 border-b border-[var(--ts-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-500">
                  🟡 Próximos 7 Días ({cobranzasCategorizadas.proximos7Dias.length})
                </h3>
              </div>
              <span className="text-xs font-bold text-amber-500">
                Total: {formatUSD(cobranzasCategorizadas.proximos7Dias.reduce((a, b) => a + Number(b.monto || 0), 0))}
              </span>
            </div>

            {cobranzasCategorizadas.proximos7Dias.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--ts-text-muted)]">
                No hay suscripciones por vencer en los próximos 7 días.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)] text-[9px] uppercase font-black text-[var(--ts-text-muted)]">
                      <th className="px-5 py-2.5">Vencimiento</th>
                      <th className="px-5 py-2.5">Cliente</th>
                      <th className="px-5 py-2.5">Servicio</th>
                      <th className="px-5 py-2.5">Monto</th>
                      <th className="px-5 py-2.5">Socios</th>
                      <th className="px-5 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ts-border)] text-xs">
                    {cobranzasCategorizadas.proximos7Dias.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => abrirDetalle(s)}
                        className="hover:bg-[var(--ts-surface-2)]/60 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 font-bold rounded-md text-[10px] inline-flex items-center gap-1 border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            Vence el {formatFecha(s.proximo_pago)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-[var(--ts-text-primary)]">
                          {s.clientes?.empresa || s.clientes?.contacto}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-[var(--ts-text-primary)]">
                          {s.servicios_recurrentes?.nombre}
                        </td>
                        <td className="px-5 py-3.5 font-black text-[var(--ts-text-primary)] text-sm">
                          {formatUSD(s.monto)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            {s.socios?.map((soc, idx) => {
                              const inf = getSocioBadgeInfo(soc);
                              return (
                                <div
                                  key={idx}
                                  title={`${inf.nombre} (${soc.porcentaje}%)`}
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                                  style={{ backgroundColor: inf.color }}
                                >
                                  {inf.iniciales}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleEnviarWhatsApp(s)}
                              className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                            </button>
                            <button
                              onClick={() => openRenovarModal(s)}
                              className="px-2.5 py-1 text-xs font-bold bg-[var(--ts-surface-2)] hover:bg-[var(--ts-red)] hover:text-white rounded-lg transition-colors flex items-center gap-1"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Renovar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sub-sección 3: 🟢 ESTE MES */}
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-emerald-500/10 border-b border-[var(--ts-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-500">
                  🟢 Resto de Este Mes ({cobranzasCategorizadas.esteMes.length})
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-500">
                Total: {formatUSD(cobranzasCategorizadas.esteMes.reduce((a, b) => a + Number(b.monto || 0), 0))}
              </span>
            </div>

            {cobranzasCategorizadas.esteMes.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--ts-text-muted)]">
                No hay más renovaciones programadas para este mes.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)] text-[9px] uppercase font-black text-[var(--ts-text-muted)]">
                      <th className="px-5 py-2.5">Fecha</th>
                      <th className="px-5 py-2.5">Cliente</th>
                      <th className="px-5 py-2.5">Servicio</th>
                      <th className="px-5 py-2.5">Monto</th>
                      <th className="px-5 py-2.5">Socios</th>
                      <th className="px-5 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ts-border)] text-xs">
                    {cobranzasCategorizadas.esteMes.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => abrirDetalle(s)}
                        className="hover:bg-[var(--ts-surface-2)]/60 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold rounded-md text-[10px] inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatFecha(s.proximo_pago)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-[var(--ts-text-primary)]">
                          {s.clientes?.empresa || s.clientes?.contacto}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-[var(--ts-text-primary)]">
                          {s.servicios_recurrentes?.nombre}
                        </td>
                        <td className="px-5 py-3.5 font-black text-[var(--ts-text-primary)] text-sm">
                          {formatUSD(s.monto)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            {s.socios?.map((soc, idx) => {
                              const inf = getSocioBadgeInfo(soc);
                              return (
                                <div
                                  key={idx}
                                  title={`${inf.nombre} (${soc.porcentaje}%)`}
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                                  style={{ backgroundColor: inf.color }}
                                >
                                  {inf.iniciales}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openRenovarModal(s)}
                              className="px-2.5 py-1 text-xs font-bold bg-[var(--ts-surface-2)] hover:bg-[var(--ts-red)] hover:text-white rounded-lg transition-colors flex items-center gap-1"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Renovar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sub-sección 4: 🤝 CLIENTES EN ACOMPAÑAMIENTO (SOLO SOPORTE - PAGO DIRECTO CLIENTE) */}
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-blue-500/10 border-b border-[var(--ts-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Handshake className="w-4 h-4" /> Clientes en Acompañamiento VIP ({cobranzasCategorizadas.acompanamientoCortes.length})
                </h3>
              </div>
              <span className="text-[11px] text-[var(--ts-text-muted)] font-semibold">
                Informativo: Pago directo del cliente · $0 deuda TecnoSmart
              </span>
            </div>

            {cobranzasCategorizadas.acompanamientoCortes.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--ts-text-muted)]">
                No hay clientes registrados en modalidad de acompañamiento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)] text-[9px] uppercase font-black text-[var(--ts-text-muted)]">
                      <th className="px-5 py-2.5">Día de Corte / Pago</th>
                      <th className="px-5 py-2.5">Cliente</th>
                      <th className="px-5 py-2.5">Servicio</th>
                      <th className="px-5 py-2.5">Cuenta (Email)</th>
                      <th className="px-5 py-2.5">Serial KIT</th>
                      <th className="px-5 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ts-border)] text-xs">
                    {cobranzasCategorizadas.acompanamientoCortes.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => abrirDetalle(s)}
                        className="hover:bg-[var(--ts-surface-2)]/60 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 font-bold rounded-md text-[10px] inline-flex items-center gap-1 border border-blue-500/20">
                            <Calendar className="w-3 h-3" />
                            Corte: {formatFecha(s.proximo_pago)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-[var(--ts-text-primary)]">
                          {s.clientes?.empresa || s.clientes?.contacto}
                          <div className="text-[10px] text-[var(--ts-text-muted)] font-normal">
                            {s.clientes?.telefono || "Sin teléfono"}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-[var(--ts-text-primary)]">
                          {s.servicios_recurrentes?.nombre}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-blue-400">
                          {s.credenciales_usuario || "—"}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-[var(--ts-text-muted)]">
                          {s.equipo_serial || s.credenciales_notas || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => abrirDetalle(s)}
                            className="px-2.5 py-1 text-xs font-bold bg-[var(--ts-surface-2)] hover:bg-[var(--ts-surface)] text-[var(--ts-text-primary)] rounded-lg transition-colors border border-[var(--ts-border)]"
                          >
                            Ver Datos
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── 5. TAB 3: CATÁLOGO DE SERVICIOS ── */}
      {activeTab === "catalogo" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {servicios.map((s) => (
            <div
              key={s.id}
              className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl p-5 hover:border-[var(--ts-red)] transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-[var(--ts-text-primary)] text-base">
                    {s.nombre}
                  </h3>
                  <span className="text-xs font-black bg-[var(--ts-surface-2)] text-emerald-400 px-2.5 py-1 rounded-md border border-[var(--ts-border)]">
                    {formatUSD(s.precio_sugerido)}
                  </span>
                </div>
                <p className="text-xs text-[var(--ts-text-muted)] mb-4 line-clamp-3">
                  {s.descripcion || "Sin descripción proporcionada."}
                </p>

                {s.mensaje_whatsapp && (
                  <div className="mb-4 p-2.5 rounded-xl bg-[var(--ts-surface-2)]/50 border border-[var(--ts-border)] text-[11px] text-[var(--ts-text-muted)]">
                    <p className="font-bold text-[10px] text-[var(--ts-text-primary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-emerald-500" /> Plantilla WhatsApp
                    </p>
                    <p className="italic line-clamp-2">"{s.mensaje_whatsapp}"</p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[var(--ts-border)] flex gap-2">
                <button
                  onClick={() => openEditServicio(s)}
                  className="flex-1 text-xs font-bold text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] bg-[var(--ts-surface-2)] hover:bg-[var(--ts-surface)] px-3 py-2 rounded-xl transition-colors text-center border border-[var(--ts-border)]"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteServicio(s.id, s.nombre)}
                  className="text-xs font-bold text-[var(--ts-text-muted)] hover:text-[var(--ts-red)] bg-[var(--ts-surface-2)] hover:bg-red-500/10 px-3 py-2 rounded-xl transition-colors text-center border border-[var(--ts-border)]"
                >
                  <Trash2 className="w-3.5 h-3.5 mx-auto" />
                </button>
              </div>
            </div>
          ))}
          {servicios.length === 0 && (
            <div className="col-span-3 p-12 text-center text-xs text-[var(--ts-text-muted)] bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl">
              No hay servicios en el catálogo. Haz clic en "Nuevo Servicio" para agregar uno.
            </div>
          )}
        </div>
      )}

      {/* ── 6. DETAIL DRAWER (PANEL LATERAL DERECHO) ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop con blur */}
          <div
            className="flex-1 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSelected(null)}
          />

          {/* Drawer container */}
          <div className="w-full max-w-lg bg-[var(--ts-surface)] h-full overflow-y-auto shadow-2xl flex flex-col border-l border-[var(--ts-border)]">

            {/* Header del Drawer */}
            <div className="px-6 py-5 border-b border-[var(--ts-border)] bg-[var(--ts-surface-2)] sticky top-0 z-10">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h2 className="text-lg font-black text-[var(--ts-text-primary)]">
                      {selected.servicios_recurrentes?.nombre || "Suscripción"}
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(
                        selected.estado
                      )}`}
                    >
                      {selected.estado}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--ts-surface)] text-[var(--ts-text-muted)] border border-[var(--ts-border)]">
                      {selected.ciclo_facturacion}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ts-text-muted)] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Próximo Pago:{" "}
                    <span className={`font-bold ${isDue(selected.proximo_pago) ? "text-amber-500" : "text-[var(--ts-text-primary)]"}`}>
                      {formatFecha(selected.proximo_pago)}
                    </span>
                  </p>

                  {/* Acciones Rápidas de Estado (Pausar / Cancelar / Reactivar) */}
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[var(--ts-border)] flex-wrap">
                    <span className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">
                      Estado:
                    </span>
                    {selected.estado === "Activo" ? (
                      <>
                        <button
                          onClick={() => handleCambiarEstadoSuscripcion(selected.id, "Suspendido")}
                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                          title="Pausar o suspender servicio por este mes"
                        >
                          <Pause className="w-3 h-3" />
                          <span>Pausar (Mes)</span>
                        </button>
                        <button
                          onClick={() => handleCambiarEstadoSuscripcion(selected.id, "Cancelado")}
                          className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                          title="Cancelar suscripción"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Cancelar</span>
                        </button>
                      </>
                    ) : selected.estado === "Suspendido" ? (
                      <>
                        <button
                          onClick={() => handleCambiarEstadoSuscripcion(selected.id, "Activo")}
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                          title="Reactivar suscripción"
                        >
                          <Play className="w-3 h-3" />
                          <span>Reactivar Servicio</span>
                        </button>
                        <button
                          onClick={() => handleCambiarEstadoSuscripcion(selected.id, "Cancelado")}
                          className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                          title="Cancelar suscripción"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Cancelar</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleCambiarEstadoSuscripcion(selected.id, "Activo")}
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                        title="Reactivar suscripción"
                      >
                        <Play className="w-3 h-3" />
                        <span>Reactivar Suscripción</span>
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-xl hover:bg-[var(--ts-surface)] text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido scrolleable del Drawer */}
            <div className="flex-1 p-6 space-y-6">

              {/* Starlink Banner Especial con 1-Click PDF */}
              {isStarlinkSubscription(selected) && (
                <div className="bg-gradient-to-r from-[var(--ts-red)]/15 via-[var(--ts-surface-2)] to-transparent border border-[var(--ts-red)]/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--ts-red)] text-white flex items-center justify-center shadow-md shrink-0">
                      <Satellite className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-[var(--ts-text-primary)] uppercase tracking-wider">
                          Antena Starlink Oficial
                        </h4>
                        {extractStarlinkData(selected).es_vip && (
                          <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded-full">
                            👑 VIP ($0)
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">
                        Ficha técnica y custodia de acceso TecnoSmart VZL
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => descargarFichaPDF(selected)}
                    className="px-3.5 py-2 bg-[var(--ts-red)] hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all shrink-0"
                    title="Descargar Ficha PDF para el Cliente"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ficha PDF</span>
                  </button>
                </div>
              )}

              {/* A. Info del Cliente */}
              <div>
                <h3 className="text-[10px] font-black text-[var(--ts-text-muted)] uppercase tracking-wider mb-2">
                  Cliente Asignado
                </h3>
                <div className="bg-[var(--ts-surface-2)] rounded-xl p-4 border border-[var(--ts-border)] space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-black text-[var(--ts-text-primary)]">
                        {selected.clientes?.empresa || selected.clientes?.contacto || "Sin nombre registrado"}
                      </p>
                      {selected.clientes?.contacto && selected.clientes?.empresa && (
                        <p className="text-xs text-[var(--ts-text-muted)] mt-0.5">
                          Contacto: {selected.clientes.contacto}
                        </p>
                      )}
                      {selected.clientes?.rif_cedula && (
                        <p className="text-xs text-[var(--ts-text-muted)]">
                          RIF / C.I.: {selected.clientes.rif_cedula}
                        </p>
                      )}
                      {selected.clientes?.telefono && (
                        <p className="text-xs text-[var(--ts-text-muted)]">
                          Teléfono: {selected.clientes.telefono}
                        </p>
                      )}
                    </div>

                    {selected.clientes?.telefono && (
                      <button
                        onClick={() => handleEnviarWhatsApp(selected)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* B. TODAS las suscripciones activas de este cliente */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-black text-[var(--ts-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    💡 Todas las suscripciones de este cliente
                  </h3>
                  <span className="text-[10px] font-bold text-[var(--ts-text-muted)]">
                    {susCliente.length} activa{susCliente.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {loadingDrawerData ? (
                  <div className="p-4 text-center text-xs text-[var(--ts-text-muted)] bg-[var(--ts-surface-2)] rounded-xl">
                    Cargando contratos del cliente...
                  </div>
                ) : susCliente.length === 0 ? (
                  <p className="text-xs text-[var(--ts-text-muted)] italic">
                    No posee otras suscripciones registradas.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {susCliente.map((cs) => {
                      const isCurrent = cs.id === selected.id;
                      return (
                        <div
                          key={cs.id}
                          onClick={() => {
                            if (!isCurrent) abrirDetalle(cs);
                          }}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            isCurrent
                              ? "bg-[var(--ts-surface-2)] border-[var(--ts-red)] shadow-sm"
                              : "bg-[var(--ts-surface-2)]/40 border-[var(--ts-border)] hover:bg-[var(--ts-surface-2)]"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-[var(--ts-text-primary)]">
                                {cs.servicios_recurrentes?.nombre || "Servicio"}
                              </p>
                              {isCurrent && (
                                <span className="bg-[var(--ts-red)]/20 text-[var(--ts-red)] text-[9px] font-black px-1.5 py-0.2 rounded">
                                  Viendo actual
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">
                              {cs.ciclo_facturacion} · Próximo: {formatFecha(cs.proximo_pago)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-[var(--ts-text-primary)]">
                              {formatUSD(cs.monto)}
                            </p>
                            <span className="text-[9px] font-bold text-emerald-500 uppercase">
                              {cs.estado}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* C. Resumen Financiero y División de Socios */}
              <div>
                <h3 className="text-[10px] font-black text-[var(--ts-text-muted)] uppercase tracking-wider mb-2">
                  Resumen Financiero y Ganancia
                </h3>
                <div className="bg-[var(--ts-surface-2)] rounded-xl p-4 border border-[var(--ts-border)] space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--ts-text-muted)]">Monto a Cobrar ({selected.ciclo_facturacion})</span>
                    <span className="font-black text-[var(--ts-text-primary)]">{formatUSD(selected.monto)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--ts-text-muted)]">Costo Base del Proveedor</span>
                    <span className="font-bold text-[var(--ts-text-muted)]">− {formatUSD(selected.costo_base || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-[var(--ts-border)] pt-2">
                    <span className="font-bold text-[var(--ts-text-primary)]">Ganancia Neta por Ciclo</span>
                    <span className="font-black text-emerald-400">
                      {formatUSD(Number(selected.monto) - Number(selected.costo_base || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--ts-text-muted)]">MRR Equivalente (Mensual)</span>
                    <span className="font-bold text-[var(--ts-text-primary)]">
                      {formatUSD(getMrrMensual(selected))} / mes
                    </span>
                  </div>

                  {/* División entre socios */}
                  <div className="border-t border-[var(--ts-border)] pt-2.5">
                    <p className="text-[10px] font-black text-[var(--ts-text-muted)] uppercase tracking-wider mb-2">
                      Reparto de Ganancia Neta:
                    </p>
                    <div className="space-y-1.5">
                      {Array.isArray(selected.socios) && selected.socios.length > 0 ? (
                        selected.socios.map((socio, idx) => {
                          const info = getSocioBadgeInfo(socio);
                          const gananciaCiclo = Number(selected.monto) - Number(selected.costo_base || 0);
                          const cuota = gananciaCiclo * ((Number(socio.porcentaje) || 0) / 100);
                          return (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
                                <span className="font-semibold text-[var(--ts-text-primary)]">{socio.nombre}</span>
                                <span className="text-[10px] text-[var(--ts-text-muted)]">({socio.porcentaje}%)</span>
                              </div>
                              <span className="font-bold text-[var(--ts-text-primary)]">{formatUSD(cuota)}</span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-[var(--ts-text-muted)] italic">
                          Sin división configurada (100% fondo general).
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* D. Historial de Pagos Registrados */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-black text-[var(--ts-text-muted)] uppercase tracking-wider">
                    Historial de Pagos Registrados
                  </h3>
                  <span className="text-[10px] font-bold text-[var(--ts-text-muted)]">
                    {pagosHistorial.length} pago{pagosHistorial.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {loadingDrawerData ? (
                  <div className="p-4 text-center text-xs text-[var(--ts-text-muted)] bg-[var(--ts-surface-2)] rounded-xl">
                    Cargando historial de pagos...
                  </div>
                ) : pagosHistorial.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[var(--ts-text-muted)] bg-[var(--ts-surface-2)] rounded-xl border border-[var(--ts-border)] italic">
                    No hay registros de pagos previos.
                  </div>
                ) : (
                  <div className="border border-[var(--ts-border)] rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] text-[9px] uppercase border-b border-[var(--ts-border)]">
                          <th className="px-3 py-2">Fecha</th>
                          <th className="px-3 py-2">Monto</th>
                          <th className="px-3 py-2">Referencia</th>
                          <th className="px-3 py-2">Notas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--ts-border)]">
                        {pagosHistorial.map((pago) => (
                          <tr key={pago.id} className="hover:bg-[var(--ts-surface-2)]/50">
                            <td className="px-3 py-2 text-[var(--ts-text-primary)] font-semibold">
                              {formatFecha(pago.fecha_pago || pago.created_at)}
                            </td>
                            <td className="px-3 py-2 font-black text-emerald-400">
                              {formatUSD(pago.monto)}
                            </td>
                            <td className="px-3 py-2 text-[var(--ts-text-muted)] font-mono">
                              {pago.referencia || "—"}
                            </td>
                            <td className="px-3 py-2 text-[var(--ts-text-muted)] text-[11px] truncate max-w-[120px]">
                              {pago.notas || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* E. Bóveda de Credenciales */}
              <div>
                <h3 className="text-[10px] font-black text-[var(--ts-text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" /> Bóveda de Credenciales
                </h3>

                <div className="bg-[var(--ts-surface-2)] rounded-xl p-4 border border-[var(--ts-border)] space-y-3">
                  {/* Usuario */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">
                        Usuario / Correo
                      </p>
                      <p className="text-xs font-mono font-semibold text-[var(--ts-text-primary)] mt-0.5">
                        {selected.credenciales_usuario || <span className="text-[var(--ts-text-muted)] italic">No registrado</span>}
                      </p>
                    </div>
                    {selected.credenciales_usuario && (
                      <button
                        onClick={() => handleCopiar(selected.credenciales_usuario!, "user")}
                        className="p-1.5 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg transition-colors"
                        title="Copiar usuario"
                      >
                        {copiado === "user" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Clave */}
                  <div className="flex items-center justify-between border-t border-[var(--ts-border)] pt-2.5">
                    <div>
                      <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">
                        Contraseña
                      </p>
                      <p className="text-xs font-mono font-semibold text-[var(--ts-text-primary)] mt-0.5">
                        {selected.credenciales_clave ? (
                          showPassword ? selected.credenciales_clave : "••••••••••••"
                        ) : (
                          <span className="text-[var(--ts-text-muted)] italic">No registrada</span>
                        )}
                      </p>
                    </div>
                    {selected.credenciales_clave && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1.5 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg transition-colors"
                          title={showPassword ? "Ocultar" : "Mostrar"}
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopiar(selected.credenciales_clave!, "clave")}
                          className="p-1.5 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg transition-colors"
                          title="Copiar clave"
                        >
                          {copiado === "clave" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Serial del Equipo / Notas */}
                  {isStarlinkSubscription(selected) ? (
                    <div className="border-t border-[var(--ts-border)] pt-2.5 space-y-2.5">
                      {extractStarlinkData(selected).wifi_ssid && (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider flex items-center gap-1">
                              <Wifi className="w-3 h-3 text-cyan-400" /> Red WiFi (SSID)
                            </p>
                            <p className="text-xs font-mono font-bold text-[var(--ts-text-primary)] mt-0.5">
                              {extractStarlinkData(selected).wifi_ssid}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCopiar(extractStarlinkData(selected).wifi_ssid!, "wifi-ssid")}
                            className="p-1.5 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg transition-colors"
                            title="Copiar SSID"
                          >
                            {copiado === "wifi-ssid" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}

                      {extractStarlinkData(selected).wifi_password && (
                        <div className="flex items-center justify-between border-t border-[var(--ts-border)] pt-2">
                          <div>
                            <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider flex items-center gap-1">
                              <Key className="w-3 h-3 text-amber-400" /> Clave WiFi
                            </p>
                            <p className="text-xs font-mono font-semibold text-[var(--ts-text-primary)] mt-0.5">
                              {showPassword ? extractStarlinkData(selected).wifi_password : "••••••••••••"}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCopiar(extractStarlinkData(selected).wifi_password!, "wifi-pass")}
                            className="p-1.5 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg transition-colors"
                            title="Copiar clave WiFi"
                          >
                            {copiado === "wifi-pass" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}

                      {extractStarlinkData(selected).kit_serial && (
                        <div className="flex items-center justify-between border-t border-[var(--ts-border)] pt-2">
                          <div>
                            <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">
                              Serial del KIT Starlink
                            </p>
                            <p className="text-xs font-mono text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700 mt-0.5 inline-block">
                              {extractStarlinkData(selected).kit_serial}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCopiar(extractStarlinkData(selected).kit_serial!, "kit-sn")}
                            className="p-1.5 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg transition-colors"
                            title="Copiar Serial KIT"
                          >
                            {copiado === "kit-sn" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}

                      {extractStarlinkData(selected).direccion_instalacion && (
                        <div className="border-t border-[var(--ts-border)] pt-2">
                          <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">
                            Dirección de Instalación
                          </p>
                          <p className="text-xs text-[var(--ts-text-primary)] mt-0.5">
                            {extractStarlinkData(selected).direccion_instalacion}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (selected.equipo_serial || selected.credenciales_notas) ? (
                    <div className="border-t border-[var(--ts-border)] pt-2.5 space-y-2">
                      {selected.equipo_serial && (
                        <div>
                          <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">
                            Serial de Equipo / Hardware
                          </p>
                          <p className="text-xs font-mono text-[var(--ts-text-primary)] mt-0.5">
                            {selected.equipo_serial}
                          </p>
                        </div>
                      )}
                      {selected.credenciales_notas && (
                        <div>
                          <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">
                            Notas de Conexión / Acceso
                          </p>
                          <p className="text-xs text-[var(--ts-text-primary)] mt-0.5 whitespace-pre-wrap">
                            {selected.credenciales_notas}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

            </div>

            {/* Acciones al fondo del Drawer */}
            <div className="p-5 border-t border-[var(--ts-border)] bg-[var(--ts-surface)] space-y-2 sticky bottom-0">
              {isStarlinkSubscription(selected) && (
                <button
                  onClick={() => descargarFichaPDF(selected)}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-red)] text-[var(--ts-text-primary)] hover:text-white border border-[var(--ts-border)] hover:border-[var(--ts-red)] text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm"
                >
                  <Download className="w-4 h-4 text-[var(--ts-red)]" />
                  <span>📄 Descargar Ficha PDF para el Cliente</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openRenovarModal(selected)}
                  className="flex items-center justify-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" /> Registrar Pago
                </button>
                <button
                  onClick={() => handleGenerarFactura(selected)}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  <CreditCard className="w-4 h-4" /> Facturar
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEnviarWhatsApp(selected)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[var(--ts-text-primary)] text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-500" /> WhatsApp
                </button>
                <button
                  onClick={() => {
                    openEditSuscripcion(selected);
                  }}
                  className="px-4 flex items-center justify-center gap-1.5 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[var(--ts-text-primary)] text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  <Edit className="w-4 h-4" /> Editar
                </button>
              </div>

              {/* Botón de Eliminación Segura de la Suscripción */}
              <button
                onClick={() => setSuscripcionParaEliminar(selected)}
                className="w-full flex items-center justify-center gap-1.5 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 border border-red-500/20 hover:border-red-600 text-xs font-bold py-2 rounded-xl transition-all"
                title="Eliminar esta suscripción definitivamente del sistema"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Suscripción Definitivamente</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── 7. MODAL CREAR / EDITAR (SUSCRIPCIÓN Y SERVICIO) ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--ts-border)] sticky top-0 bg-[var(--ts-surface)] z-10">
              <h2 className="text-base font-black text-[var(--ts-text-primary)]">
                {formType === "servicio"
                  ? editId ? "Editar Servicio Recurrente" : "Nuevo Servicio Recurrente"
                  : editId ? "Editar Suscripción" : "Nueva Suscripción"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-[var(--ts-surface-2)] rounded-xl transition-colors text-[var(--ts-text-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {formType === "servicio" ? (
                // ── FORMULARIO SERVICIO ──
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">
                      Nombre del Servicio
                    </label>
                    <input
                      type="text"
                      value={servicioData.nombre}
                      onChange={(e) => setServicioData({ ...servicioData, nombre: e.target.value })}
                      className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                      placeholder="Ej: Starlink Residencial"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">
                      Descripción
                    </label>
                    <textarea
                      value={servicioData.descripcion}
                      onChange={(e) => setServicioData({ ...servicioData, descripcion: e.target.value })}
                      className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors min-h-[90px]"
                      placeholder="Detalles del plan, características..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">
                      Precio Sugerido ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={servicioData.precio_sugerido}
                      onChange={(e) => setServicioData({ ...servicioData, precio_sugerido: e.target.value })}
                      className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                      placeholder="60.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">
                      Plantilla WhatsApp (Opcional)
                    </label>
                    <textarea
                      value={servicioData.mensaje_whatsapp}
                      onChange={(e) => setServicioData({ ...servicioData, mensaje_whatsapp: e.target.value })}
                      className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors min-h-[80px]"
                      placeholder="Hola {cliente}, te recordamos tu pago de {monto} por el servicio de {servicio}."
                    />
                    <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">
                      Variables: <span className="font-bold text-[var(--ts-text-primary)]">{'{cliente}'}</span>,{" "}
                      <span className="font-bold text-[var(--ts-text-primary)]">{'{monto}'}</span>,{" "}
                      <span className="font-bold text-[var(--ts-text-primary)]">{'{servicio}'}</span>
                    </p>
                  </div>
                  <div className="pt-4 flex justify-end gap-2 border-t border-[var(--ts-border)]">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-xs font-bold text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveServicio}
                      className="bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm"
                    >
                      {editId ? "Guardar Cambios" : "Crear Servicio"}
                    </button>
                  </div>
                </div>
              ) : (
                // ── FORMULARIO SUSCRIPCIÓN ──
                <div className="space-y-6">
                  {/* Selector de Modalidad */}
                  <div className="bg-[var(--ts-surface-2)]/60 border border-[var(--ts-border)] rounded-2xl p-4">
                    <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-2 uppercase tracking-wider">
                      Modalidad del Servicio
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const serv = servicios.find((s) => s.id === formData.servicio_id);
                          setFormData({
                            ...formData,
                            modalidad: "gestionada",
                            monto: formData.monto === "0" || formData.monto === "0.00" ? (serv ? serv.precio_sugerido.toString() : "") : formData.monto,
                          });
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                          formData.modalidad !== "acompanamiento"
                            ? "bg-[var(--ts-red)]/10 border-[var(--ts-red)] text-[var(--ts-text-primary)] shadow-sm"
                            : "bg-[var(--ts-surface)] border-[var(--ts-border)] text-[var(--ts-text-muted)] hover:border-[var(--ts-border-strong)]"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                            formData.modalidad !== "acompanamiento" ? "border-[var(--ts-red)]" : "border-[var(--ts-text-muted)]"
                          }`}
                        >
                          {formData.modalidad !== "acompanamiento" && (
                            <div className="w-2 h-2 rounded-full bg-[var(--ts-red)]" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black">💳 Cobro TecnoSmart</p>
                          <p className="text-[11px] text-[var(--ts-text-muted)] mt-0.5 leading-snug">
                            El cliente nos paga la mensualidad directamente. Suma al MRR, ganancias y gestión de cobranzas.
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            modalidad: "acompanamiento",
                            monto: "0",
                            costo_base: "0",
                          });
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                          formData.modalidad === "acompanamiento"
                            ? "bg-amber-500/10 border-amber-500 text-[var(--ts-text-primary)] shadow-sm"
                            : "bg-[var(--ts-surface)] border-[var(--ts-border)] text-[var(--ts-text-muted)] hover:border-[var(--ts-border-strong)]"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                            formData.modalidad === "acompanamiento" ? "border-amber-500" : "border-[var(--ts-text-muted)]"
                          }`}
                        >
                          {formData.modalidad === "acompanamiento" && (
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black">🤝 Solo Acompañamiento VIP</p>
                          <p className="text-[11px] text-[var(--ts-text-muted)] mt-0.5 leading-snug">
                            El cliente paga con su propia tarjeta. No genera deuda ni distorsiona ingresos; guardamos accesos y fecha de corte.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Cliente */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">
                      Cliente Asignado
                    </label>
                    {!selectedCliente ? (
                      <div className="border border-[var(--ts-border)] rounded-xl overflow-hidden bg-[var(--ts-surface-2)]">
                        <ClientePicker onSelect={(c) => setSelectedCliente(c)} clienteSeleccionado={selectedCliente} />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 border border-[var(--ts-border)] rounded-xl bg-[var(--ts-surface-2)]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--ts-border)] flex items-center justify-center">
                            <User className="w-4 h-4 text-[var(--ts-text-primary)]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[var(--ts-text-primary)]">
                              {selectedCliente.empresa || selectedCliente.contacto}
                            </p>
                            <p className="text-[10px] text-[var(--ts-text-muted)]">
                              {selectedCliente.rif_cedula || "Sin RIF/Cédula"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedCliente(null)}
                          className="text-xs text-[var(--ts-text-muted)] hover:text-[var(--ts-red)] font-bold px-2 py-1"
                        >
                          Cambiar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Campos Principales */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">
                        Estado
                      </label>
                      <select
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Suspendido">Suspendido</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">
                        Servicio
                      </label>
                      <select
                        value={formData.servicio_id}
                        onChange={(e) => {
                          const s = servicios.find((x) => x.id === e.target.value);
                          setFormData({
                            ...formData,
                            servicio_id: e.target.value,
                            monto: formData.modalidad === "acompanamiento" ? "0" : (s ? s.precio_sugerido.toString() : formData.monto),
                          });
                        }}
                        className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                      >
                        <option value="">Seleccione un servicio</option>
                        {servicios.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre} (${s.precio_sugerido.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">
                        Ciclo de Facturación / Corte
                      </label>
                      <select
                        value={formData.ciclo_facturacion}
                        onChange={(e) => setFormData({ ...formData, ciclo_facturacion: e.target.value })}
                        className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                      >
                        <option value="Mensual">Mensual</option>
                        <option value="Bimestral">Bimestral</option>
                        <option value="Trimestral">Trimestral</option>
                        <option value="Semestral">Semestral</option>
                        <option value="Anual">Anual</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">
                        Monto a Facturar ($)
                      </label>
                      {formData.modalidad === "acompanamiento" ? (
                        <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-500 font-bold">
                          <span>$0.00 (Pago directo cliente)</span>
                          <span className="text-[10px] uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded">Acompañamiento</span>
                        </div>
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          value={formData.monto}
                          onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                          className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                          placeholder="60.00"
                        />
                      )}
                    </div>

                    {/* Costo Base Field */}
                    {formData.modalidad !== "acompanamiento" ? (
                      <div className="sm:col-span-2 bg-[var(--ts-surface-2)]/60 border border-[var(--ts-border)] p-3.5 rounded-xl">
                        <label className="block text-xs font-bold text-[var(--ts-text-primary)] mb-1 uppercase tracking-wider">
                          Costo Base del Proveedor ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.costo_base}
                          onChange={(e) => setFormData({ ...formData, costo_base: e.target.value })}
                          className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                          placeholder="0.00"
                        />
                        <p className="text-[10px] text-[var(--ts-text-muted)] mt-1.5">
                          Lo que pagas al proveedor. La ganancia = Monto − Costo Base (
                          <span className="font-bold text-emerald-400">
                            {formatUSD(Math.max(0, (Number(formData.monto) || 0) - (Number(formData.costo_base) || 0)))}
                          </span>
                          ).
                        </p>
                      </div>
                    ) : (
                      <div className="sm:col-span-2 bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl flex items-center gap-2">
                        <Handshake className="w-4 h-4 text-amber-500 shrink-0" />
                        <p className="text-[11px] text-amber-400">
                          Cuenta en modalidad de acompañamiento: no genera costos base para TecnoSmart ni cuentas por cobrar.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">
                        Fecha de Inicio / Inscripción
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_inicio}
                        onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                        className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">
                        {formData.modalidad === "acompanamiento" ? "Fecha de Próximo Corte / Renovación" : "Próximo Pago"}
                      </label>
                      <input
                        type="date"
                        value={formData.proximo_pago}
                        onChange={(e) => setFormData({ ...formData, proximo_pago: e.target.value })}
                        className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Bóveda de Credenciales */}
                  <div className="border border-[var(--ts-border)] rounded-xl p-4 bg-[var(--ts-surface-2)]/50 space-y-4">
                    <h3 className="text-xs font-bold text-[var(--ts-text-primary)] flex items-center gap-2 uppercase tracking-wider">
                      <Lock className="w-4 h-4 text-amber-500" /> Bóveda de Credenciales (Opcional)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--ts-text-muted)] mb-1 uppercase tracking-wider">
                          Usuario / Correo
                        </label>
                        <input
                          type="text"
                          value={formData.credenciales_usuario}
                          onChange={(e) => setFormData({ ...formData, credenciales_usuario: e.target.value })}
                          className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                          placeholder="ej: cliente@gmail.com"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--ts-text-muted)] mb-1 uppercase tracking-wider">
                          Contraseña
                        </label>
                        <input
                          type="text"
                          value={formData.credenciales_clave}
                          onChange={(e) => setFormData({ ...formData, credenciales_clave: e.target.value })}
                          className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors font-mono"
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--ts-text-muted)] mb-1 uppercase tracking-wider">
                          Serial del Equipo / KIT Starlink
                        </label>
                        <input
                          type="text"
                          value={formData.equipo_serial}
                          onChange={(e) => setFormData({ ...formData, equipo_serial: e.target.value })}
                          className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                          placeholder="KIT S/N: XYZ-1234..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--ts-text-muted)] mb-1 uppercase tracking-wider">
                          Notas de Acceso
                        </label>
                        <input
                          type="text"
                          value={formData.credenciales_notas}
                          onChange={(e) => setFormData({ ...formData, credenciales_notas: e.target.value })}
                          className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                          placeholder="IP, puerto, instrucciones..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* ENHANCEMENT B: División de Socios */}
                  {formData.modalidad === "acompanamiento" ? (
                    <div className="border border-[var(--ts-border)] rounded-xl p-4 bg-[var(--ts-surface-2)]/30 space-y-1.5">
                      <h3 className="text-xs font-bold text-[var(--ts-text-muted)] flex items-center gap-2 uppercase tracking-wider">
                        <Users className="w-4 h-4 text-[var(--ts-text-muted)]" /> División de Socios
                      </h3>
                      <p className="text-xs text-[var(--ts-text-muted)]">
                        Las cuentas en modalidad de <strong className="text-[var(--ts-text-primary)]">Acompañamiento VIP</strong> no generan comisiones monetarias recurrentes para socios ($0.00 en sistema), ya que el cliente paga de manera directa al proveedor.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-[var(--ts-border)] rounded-xl p-4 bg-[var(--ts-surface-2)]/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-[var(--ts-text-primary)] flex items-center gap-2 uppercase tracking-wider">
                          <Users className="w-4 h-4 text-blue-500" /> División de Socios
                        </h3>
                        {/* Running Total Indicator */}
                        {formData.socios.length > 0 && (() => {
                          const total = formData.socios.reduce((a, b) => a + (Number(b.porcentaje) || 0), 0);
                          return (
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded-md ${
                                total === 100
                                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                  : "bg-red-500/10 text-[var(--ts-red)] border border-red-500/20"
                              }`}
                            >
                              Total: {total}% {total === 100 ? "✓" : "(debe sumar 100%)"}
                            </span>
                          );
                        })()}
                      </div>

                      {formData.socios.length === 0 && (
                        <p className="text-[11px] text-[var(--ts-text-muted)] italic">
                          No hay socios asignados. Agrega socios para distribuir la ganancia.
                        </p>
                      )}

                      {/* Lista siempre visible de socios */}
                      <div className="space-y-2">
                        {formData.socios.map((socio, idx) => {
                          const isSystemUser = perfilesEquipo.some((m) => m.id === socio.perfil_id);
                          return (
                            <div key={idx} className="flex items-center gap-2 bg-[var(--ts-surface)] rounded-lg p-2 border border-[var(--ts-border)]">
                              {isSystemUser ? (
                                <select
                                  value={socio.perfil_id || ""}
                                  onChange={(e) => {
                                    const selectedMember = perfilesEquipo.find((m) => m.id === e.target.value);
                                    if (selectedMember) {
                                      const updated = [...formData.socios];
                                      updated[idx] = {
                                        ...updated[idx],
                                        perfil_id: selectedMember.id,
                                        nombre: selectedMember.nombre,
                                      };
                                      setFormData({ ...formData, socios: updated });
                                    }
                                  }}
                                  className="flex-1 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)]"
                                >
                                  {perfilesEquipo.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.nombre} {m.rol_nombre ? `(${m.rol_nombre})` : ""}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="flex-1 flex items-center gap-1.5">
                                  <span className="text-[10px] text-[var(--ts-text-muted)] shrink-0">✏️</span>
                                  <input
                                    type="text"
                                    value={socio.nombre}
                                    onChange={(e) => {
                                      const updated = [...formData.socios];
                                      updated[idx] = { ...updated[idx], nombre: e.target.value };
                                      setFormData({ ...formData, socios: updated });
                                    }}
                                    className="flex-1 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)]"
                                    placeholder="Nombre del socio"
                                  />
                                </div>
                              )}

                              <div className="flex items-center gap-1 w-24">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={socio.porcentaje}
                                  onChange={(e) => {
                                    const updated = [...formData.socios];
                                    updated[idx] = { ...updated[idx], porcentaje: Number(e.target.value) || 0 };
                                    setFormData({ ...formData, socios: updated });
                                  }}
                                  className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-lg px-2 py-2 text-xs text-right focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)]"
                                  placeholder="%"
                                />
                                <span className="text-xs font-bold text-[var(--ts-text-muted)]">%</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const updated = formData.socios.filter((_, i) => i !== idx);
                                  setFormData({ ...formData, socios: updated });
                                }}
                                className="p-1.5 text-[var(--ts-text-muted)] hover:text-[var(--ts-red)] transition-colors rounded-lg hover:bg-red-500/10"
                                title="Eliminar socio"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Agregar socio: elegir del equipo o escribir nombre nuevo */}
                      <div className="pt-2 border-t border-[var(--ts-border)] space-y-2">
                        <p className="text-[10px] font-bold text-[var(--ts-text-muted)] uppercase tracking-wider">Agregar socio del equipo</p>
                        <div className="flex flex-wrap gap-1.5">
                          {perfilesEquipo.filter(
                            (m) => !formData.socios.some((s) => s.perfil_id === m.id)
                          ).map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  socios: [
                                    ...formData.socios,
                                    { perfil_id: m.id, nombre: m.nombre, porcentaje: 0 },
                                  ],
                                });
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all border bg-[var(--ts-surface)] text-[var(--ts-text-muted)] border-[var(--ts-border)] hover:text-[var(--ts-text-primary)] hover:border-[var(--ts-red)]"
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                              + {m.nombre.split(" ")[0]}
                              {m.rol_nombre && (
                                <span className="text-[9px] text-[var(--ts-text-muted)] opacity-60">({m.rol_nombre})</span>
                              )}
                            </button>
                          ))}
                          {perfilesEquipo.filter((m) => !formData.socios.some((s) => s.perfil_id === m.id)).length === 0 && (
                            <span className="text-[11px] text-[var(--ts-text-muted)] italic">Todos los usuarios ya están agregados</span>
                          )}
                        </div>

                        {/* Input para socio nuevo con nombre personalizado */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={nuevoSocioNombre}
                            onChange={(e) => setNuevoSocioNombre(e.target.value)}
                            className="flex-1 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)]"
                            placeholder="Nombre de socio nuevo..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && nuevoSocioNombre.trim()) {
                                e.preventDefault();
                                setFormData({
                                  ...formData,
                                  socios: [
                                    ...formData.socios,
                                    { nombre: nuevoSocioNombre.trim(), porcentaje: 0 },
                                  ],
                                });
                                setNuevoSocioNombre("");
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!nuevoSocioNombre.trim()) return;
                              setFormData({
                                ...formData,
                                socios: [
                                  ...formData.socios,
                                  { nombre: nuevoSocioNombre.trim(), porcentaje: 0 },
                                ],
                              });
                              setNuevoSocioNombre("");
                            }}
                            disabled={!nuevoSocioNombre.trim()}
                            className="px-3 py-2 text-xs font-bold rounded-xl transition-all border bg-[var(--ts-red)] text-white border-transparent hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Agregar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botones del Modal */}
                  <div className="pt-4 flex justify-between items-center border-t border-[var(--ts-border)]">
                    <div>
                      {editId && (
                        <button
                          type="button"
                          onClick={handleDeleteSuscripcion}
                          className="text-xs font-bold text-[var(--ts-red)] hover:text-red-700 px-3 py-2 rounded-xl transition-all"
                        >
                          Eliminar Suscripción
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 text-xs font-bold text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveSuscripcion}
                        className="bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm"
                      >
                        {editId ? "Guardar Cambios" : "Crear Suscripción"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 8. MODAL RENOVAR Y REGISTRAR PAGO ── */}
      {showRenovarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--ts-border)] bg-[var(--ts-surface-2)]">
              <div>
                <h2 className="text-base font-black text-[var(--ts-text-primary)]">
                  Registrar Pago y Renovar
                </h2>
                <p className="text-xs text-[var(--ts-text-muted)]">
                  Actualiza el próximo corte y genera registro contable
                </p>
              </div>
              <button
                onClick={() => setShowRenovarModal(false)}
                className="p-1.5 hover:bg-[var(--ts-surface)] rounded-xl transition-colors text-[var(--ts-text-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">
                  Monto Recibido ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={renovarData.monto}
                  onChange={(e) => setRenovarData({ ...renovarData, monto: Number(e.target.value) || 0 })}
                  className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">
                  Fecha del Pago Realizado
                </label>
                <input
                  type="date"
                  value={renovarData.fecha_pago}
                  onChange={(e) => setRenovarData({ ...renovarData, fecha_pago: e.target.value })}
                  className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">
                  Nueva Fecha de Próximo Pago
                </label>
                <input
                  type="date"
                  value={renovarData.proximo_pago}
                  onChange={(e) => setRenovarData({ ...renovarData, proximo_pago: e.target.value })}
                  className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">
                  Referencia de Pago *
                </label>
                <input
                  type="text"
                  value={renovarData.referencia}
                  onChange={(e) => setRenovarData({ ...renovarData, referencia: e.target.value })}
                  className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors font-mono"
                  placeholder="Ej: Zelle Ref #49281, PagoMóvil 8392"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ts-text-muted)] mb-1.5 uppercase tracking-wider">
                  Notas Adicionales (Opcional)
                </label>
                <input
                  type="text"
                  value={renovarData.notas}
                  onChange={(e) => setRenovarData({ ...renovarData, notas: e.target.value })}
                  className="w-full bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                  placeholder="Banco destino, observación de abono..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-[var(--ts-border)]">
                <button
                  onClick={() => setShowRenovarModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarRenovacion}
                  className="bg-[var(--ts-red)] hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  Confirmar Renovación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Onboarding y Edición de Starlink */}
      <StarlinkOnboardingModal
        isOpen={showStarlinkModal}
        onClose={() => {
          setShowStarlinkModal(false);
          setStarlinkEditSub(null);
        }}
        onSaved={async () => {
          await fetchData();
          setShowStarlinkModal(false);
          setStarlinkEditSub(null);
          if (selected) {
            abrirDetalle(selected);
          }
        }}
        suscripcionEditar={starlinkEditSub}
        servicios={servicios}
      />

      {/* ── MODAL DE CONFIRMACIÓN DE SEGURIDAD PARA ELIMINAR SUSCRIPCIÓN ── */}
      {suscripcionParaEliminar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--ts-surface)] border border-red-500/30 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/15 rounded-2xl border border-red-500/30 text-red-500 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--ts-text-primary)]">
                  ¿Eliminar Suscripción Definitivamente?
                </h3>
                <p className="text-xs text-[var(--ts-text-muted)]">
                  Acción de seguridad irreversible
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs space-y-1.5">
              <p className="font-bold text-white text-sm">
                {suscripcionParaEliminar.clientes?.empresa || suscripcionParaEliminar.clientes?.contacto || "Cliente sin nombre"}
              </p>
              <p className="text-slate-300">
                Servicio: <strong className="text-white">{suscripcionParaEliminar.servicios_recurrentes?.nombre || "Suscripción"}</strong>
              </p>
              <p className="text-[11px] text-red-300 pt-1 border-t border-red-500/20">
                ⚠️ Esta suscripción y todo su historial de cobros asociados se eliminarán de la base de datos permanentemente.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSuscripcionParaEliminar(null)}
                disabled={eliminandoSub}
                className="px-4 py-2 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-border)] text-[var(--ts-text-primary)] rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminarSuscripcion}
                disabled={eliminandoSub}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/30 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{eliminandoSub ? "Eliminando..." : "Sí, Eliminar Definitivamente"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
