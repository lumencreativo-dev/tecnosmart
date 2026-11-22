"use client";

import { useState, useEffect } from "react";
import {
  LifeBuoy, X, ShieldCheck, Wifi, Camera, Network,
  Cpu, KeyRound, CheckCircle2, ArrowRight, ArrowLeft,
  Search, AlertCircle, Sparkles, Send, Smartphone, Mail,
  User, Check, Clock, HelpCircle, Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export interface FormularioSoporteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CategoriaSoporte {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  descripcion: string;
  preguntas_guia?: Array<{
    id: string;
    pregunta: string;
    opciones: string[];
  }>;
}

// Fallback robusto de categorías oficiales TecnoSmart
const CATEGORIAS_FALLBACK: CategoriaSoporte[] = [
  {
    id: "starlink",
    nombre: "Starlink / Internet Satelital",
    icono: "Wifi",
    color: "#6366f1",
    descripcion: "Fallas de conexión, router, antenas satelitales y soporte de flota.",
    preguntas_guia: [
      {
        id: "led_router",
        pregunta: "¿Cómo se encuentra la luz LED del router Starlink?",
        opciones: ["Luz blanca fija encendida", "Luz parpadeando intermitente", "Luz roja / desconectada", "Apagada por completo (sin energía)"],
      },
      {
        id: "estado_app",
        pregunta: "¿Qué mensaje muestra la app móvil de Starlink?",
        opciones: ["En Línea / Conectado", "Desconectado", "Buscando Satélites / Obstruido", "Calentando / Reiniciando", "No puedo abrir la app"],
      },
      {
        id: "origen_falla",
        pregunta: "¿La falla ocurrió tras algún evento eléctrico?",
        opciones: ["Sí, hubo bajón o corte de energía", "Sí, hubo tormenta eléctrica con rayos", "No, ocurrió de manera espontánea", "Es una antena nueva recién instalada"],
      },
    ],
  },
  {
    id: "cctv",
    nombre: "Seguridad Electrónica & CCTV",
    icono: "Camera",
    color: "#c9242b",
    descripcion: "Cámaras de seguridad, DVR, NVR, fuentes de poder y monitoreo Hik-Connect / DMSS.",
    preguntas_guia: [
      {
        id: "alcance_falla",
        pregunta: "¿En cuántas cámaras se presenta la falla?",
        opciones: ["En una sola cámara específica", "En varias cámaras del mismo sector", "En todas las cámaras (pantalla en negro)", "Falla en la grabación / disco duro"],
      },
      {
        id: "estado_grabador",
        pregunta: "¿El grabador (DVR/NVR) emite algún sonido o luces?",
        opciones: ["Luces normales pero emite pitidos constantes (beeps)", "Enciende luces frontales normales", "Completamente apagado / sin luces", "Se reinicia constantemente en bucle"],
      },
      {
        id: "acceso_remoto",
        pregunta: "¿El problema es ver las cámaras en el celular?",
        opciones: ["Sí, en monitor local se ven pero en móvil dice 'Desconectado'", "No, no se ven ni en monitor ni en celular", "Olvidé la contraseña o cambié de teléfono"],
      },
    ],
  },
  {
    id: "redes",
    nombre: "Redes, Fibra Óptica & Wi-Fi",
    icono: "Network",
    color: "#06b6d4",
    descripcion: "Switches, routers Mikrotik/Omada, cableado estructurado y cobertura Wi-Fi.",
    preguntas_guia: [
      {
        id: "tipo_conexion",
        pregunta: "¿Dónde se manifiesta la lentitud o caída?",
        opciones: ["Tanto por cable de red como por Wi-Fi", "Solo en la señal inalámbrica (Wi-Fi)", "En una computadora o punto de red específico", "En toda la empresa / red principal"],
      },
      {
        id: "luces_switch",
        pregunta: "¿Cómo están las luces del Switch o Router principal?",
        opciones: ["Luces verdes parpadeando con tráfico", "Luces fijas en naranja/ámbar", "Luces apagadas", "No tengo acceso al rack/equipo"],
      },
    ],
  },
  {
    id: "automatizacion",
    nombre: "Automatización de Portones & Motores",
    icono: "Cpu",
    color: "#10b981",
    descripcion: "Motores corredizos, brazos abatibles, tarjetas electrónicas y controles remotos.",
    preguntas_guia: [
      {
        id: "comportamiento_motor",
        pregunta: "¿Qué ocurre al presionar el control remoto?",
        opciones: ["El motor hace 'clic' o zumba pero el portón no abre", "El portón abre unos centímetros y se frena", "No hace absolutamente nada ni enciende luz", "Abre bien pero no quiere cerrar"],
      },
      {
        id: "fotocelula",
        pregunta: "¿Las fotocélulas o sensores emiten luz?",
        opciones: ["Luz fija (alineadas correctamente)", "Luz parpadeando (posible desalineación)", "Sin luz / tapadas con suciedad", "No dispone de fotocélulas"],
      },
    ],
  },
  {
    id: "domotica",
    nombre: "Domótica & Control de Acceso",
    icono: "KeyRound",
    color: "#8b5cf6",
    descripcion: "Cerraduras inteligentes, biométricos, sensores y alarmas de intrusión.",
    preguntas_guia: [
      {
        id: "tipo_dispositivo",
        pregunta: "¿Qué dispositivo presenta la incidencia?",
        opciones: ["Cerradura inteligente digital", "Control de asistencia / biométrico", "Central de alarma de intrusión", "Sensores de movimiento / magnéticos"],
      },
    ],
  },
  {
    id: "garantia",
    nombre: "Garantía Oficial de Hardware (1 Año)",
    icono: "ShieldCheck",
    color: "#f59e0b",
    descripcion: "Activación de garantía por defecto de fábrica en cámaras y equipos adquiridos.",
    preguntas_guia: [
      {
        id: "posee_serial",
        pregunta: "¿Tiene a mano el número de Serial (S/N) del equipo?",
        opciones: ["Sí, lo tengo ubicado en la etiqueta del equipo", "Tengo el número de Factura / Nota de Entrega", "No lo tengo a mano, instalado en altura"],
      },
    ],
  },
  {
    id: "otro",
    nombre: "Consultas Generales & Otro",
    icono: "LifeBuoy",
    color: "#64748b",
    descripcion: "Requerimientos técnicos diversos o consultas de soporte general.",
  },
];

export default function FormularioSoporteModal({ isOpen, onClose }: FormularioSoporteModalProps) {
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [categorias, setCategorias] = useState<CategoriaSoporte[]>(CATEGORIAS_FALLBACK);

  // Paso 1: Identificación
  const [identificador, setIdentificador] = useState("");
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteMatched, setClienteMatched] = useState<any>(null);
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");

  // Paso 2: Servicio y Preguntas Guía
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaSoporte | null>(null);
  const [respuestasGuia, setRespuestasGuia] = useState<Record<string, string>>({});

  // Paso 3: Falla y Envío
  const [asunto, setAsunto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ticketGenerado, setTicketGenerado] = useState<any>(null);

  // Cargar categorías dinámicas de Supabase
  useEffect(() => {
    async function loadCategorias() {
      try {
        const { data, error } = await supabase
          .from("soporte_categorias")
          .select("*")
          .eq("activo", true)
          .order("orden", { ascending: true });

        if (data && data.length > 0) {
          setCategorias(data);
        }
      } catch (e) {
        // Fallback a locales
      }
    }
    if (isOpen) {
      loadCategorias();
    }
  }, [isOpen]);

  // Buscar cliente al cambiar identificador (Cédula, RIF, Correo o Teléfono)
  const handleBuscarCliente = async (val: string) => {
    if (!val || val.trim().length < 4) {
      setClienteMatched(null);
      return;
    }

    setBuscandoCliente(true);
    try {
      const res = await fetch("/api/support/match-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: val.trim() }),
      });
      const data = await res.json();
      if (data.matched && data.cliente) {
        setClienteMatched(data.cliente);
        if (!clienteNombre) setClienteNombre(data.cliente.nombre || data.cliente.empresa || "");
        if (!clienteTelefono && data.cliente.telefono) setClienteTelefono(data.cliente.telefono);
        if (!clienteEmail && data.cliente.email) setClienteEmail(data.cliente.email);
      } else {
        setClienteMatched(null);
      }
    } catch (e) {
      // Ignorar error de red
    } finally {
      setBuscandoCliente(false);
    }
  };

  // Enviar Ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre || !asunto) return;

    setEnviando(true);
    try {
      const payload = {
        cliente: clienteNombre.trim(),
        cliente_id: clienteMatched?.id || null,
        cedula_rif: clienteMatched?.rif_cedula || (identificador.includes("-") ? identificador : null),
        email_cliente: clienteEmail.trim() || null,
        telefono: clienteTelefono.trim() || null,
        categoria_id: categoriaSeleccionada?.id || "cctv",
        servicio: categoriaSeleccionada?.id || "cctv",
        asunto: asunto.trim(),
        descripcion: descripcion.trim(),
        respuestas_guia: respuestasGuia,
        canal_origen: "web_form",
      };

      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.ticket) {
        setTicketGenerado(data.ticket);
        // Sincronizar en localStorage como respaldo local inmediato
        try {
          const saved = localStorage.getItem("ts_soporte_tickets");
          const arr = saved ? JSON.parse(saved) : [];
          localStorage.setItem("ts_soporte_tickets", JSON.stringify([data.ticket, ...arr]));
        } catch (e) {
          // ignore
        }
      } else {
        alert(data.error || "Ocurrió un error al generar el ticket.");
      }
    } catch (err: any) {
      alert("Error de conexión al enviar el ticket: " + err.message);
    } finally {
      setEnviando(false);
    }
  };

  const [animandoCierre, setAnimandoCierre] = useState(false);

  const resetForm = () => {
    setPaso(1);
    setIdentificador("");
    setClienteMatched(null);
    setClienteNombre("");
    setClienteTelefono("");
    setClienteEmail("");
    setCategoriaSeleccionada(null);
    setRespuestasGuia({});
    setAsunto("");
    setDescripcion("");
    setTicketGenerado(null);
  };

  const handleCerrarConAnimacion = () => {
    setAnimandoCierre(true);
    setTimeout(() => {
      setAnimandoCierre(false);
      resetForm();
      onClose();
    }, 220);
  };

  // Manejo de tecla Escape y scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !animandoCierre) {
        handleCerrarConAnimacion();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, animandoCierre]);

  if (!isOpen && !animandoCierre) return null;

  return (
    <div
      onClick={handleCerrarConAnimacion}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${
        animandoCierre ? "opacity-0 pointer-events-none" : "opacity-100 animate-in fade-in duration-300"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-[#121217] border border-[#262633] rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl text-white ${
          animandoCierre ? "animate-modal-exit" : "animate-modal-enter"
        }`}
      >

        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-[#22222e] flex items-center justify-between bg-[#16161d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--ts-red)]/15 border border-[var(--ts-red)]/30 flex items-center justify-center text-[var(--ts-red)] shadow-sm shadow-[var(--ts-red)]/20">
              <LifeBuoy className="w-5 h-5 animate-pulse-glow" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">Mesa de Ayuda & Soporte Técnico</h3>
              <p className="text-xs text-[#9c9ca8]">Atención directa y trazabilidad de incidencias TecnoSmart</p>
            </div>
          </div>
          <button
            onClick={handleCerrarConAnimacion}
            className="p-2 rounded-xl text-[#8e8e9c] hover:bg-[#20202a] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Progreso de Pasos (si aún no se ha generado el ticket) */}
        {!ticketGenerado && (
          <div className="px-6 pt-4 pb-2 bg-[#14141a] border-b border-[#1f1f28]">
            <div className="flex items-center justify-between text-xs font-bold text-[#8c8c99]">
              <span className={`flex items-center gap-1.5 ${paso >= 1 ? "text-[var(--ts-red)]" : ""}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${paso >= 1 ? "bg-[var(--ts-red)] text-white" : "bg-[#252530]"}`}>1</span>
                Identificación
              </span>
              <span className="h-0.5 w-8 bg-[#252530]" />
              <span className={`flex items-center gap-1.5 ${paso >= 2 ? "text-[var(--ts-red)]" : ""}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${paso >= 2 ? "bg-[var(--ts-red)] text-white" : "bg-[#252530]"}`}>2</span>
                Servicio
              </span>
              <span className="h-0.5 w-8 bg-[#252530]" />
              <span className={`flex items-center gap-1.5 ${paso >= 3 ? "text-[var(--ts-red)]" : ""}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${paso >= 3 ? "bg-[var(--ts-red)] text-white" : "bg-[#252530]"}`}>3</span>
                Detalle Falla
              </span>
            </div>
          </div>
        )}

        {/* Contenido con Scroll */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* ══════════════════════════════════════════════════════════
              PANTALLA DE ÉXITO: TICKET GENERADO
          ══════════════════════════════════════════════════════════ */}
          {ticketGenerado ? (
            <div className="text-center py-6 space-y-5 animate-modal-enter">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full">
                  Ticket Registrado con Éxito
                </span>
                <h4 className="text-2xl sm:text-3xl font-black text-white mt-3 font-mono">
                  {ticketGenerado.codigo}
                </h4>
                <p className="text-sm text-[#a5a5b2] max-w-md mx-auto mt-2 leading-relaxed">
                  Estimado(a) <strong>{ticketGenerado.cliente}</strong>, su caso ha sido ingresado al sistema técnico de TecnoSmart bajo el servicio de <strong>{ticketGenerado.servicio}</strong>.
                </p>
              </div>

              {ticketGenerado.email_cliente && (
                <div className="bg-[#181822] border border-[#2a2a38] rounded-2xl p-4 max-w-md mx-auto text-left text-xs flex items-center gap-3">
                  <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
                  <p className="text-[#b5b5c2]">
                    Hemos enviado un correo oficial con el acuse de recibo a <strong>{ticketGenerado.email_cliente}</strong>.
                  </p>
                </div>
              )}

              {/* Compromiso SLA Oficial */}
              <div className="bg-[#1a1726] border border-amber-500/30 rounded-2xl p-3.5 max-w-md mx-auto text-left text-xs flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-[#d0d0e0]">
                  <strong>Tiempo estimado de respuesta:</strong> Alrededor de 24 horas en días hábiles (Lunes a Viernes de 8:00 AM a 5:00 PM).
                </p>
              </div>

              {/* Botón WhatsApp Inmediato */}
              <div className="pt-2 max-w-md mx-auto space-y-3">
                <a
                  href={`https://wa.me/584122789273?text=${encodeURIComponent(`Hola TecnoSmart, acabo de registrar el Ticket #${ticketGenerado.codigo} sobre ${ticketGenerado.asunto}. ¿Podrían brindarme atención técnica?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02]"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>Chatear de Inmediato por WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleCerrarConAnimacion}
                  className="w-full text-xs font-semibold text-[#8e8e9c] hover:text-white py-2"
                >
                  Finalizar y cerrar ventana
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ══════════════════════════════════════════════════════════
                  PASO 1: IDENTIFICACIÓN DEL CLIENTE (SMART MATCH)
              ══════════════════════════════════════════════════════════ */}
              {paso === 1 && (
                <div className="space-y-4 animate-step-enter">
                  <div>
                    <h4 className="text-base font-bold text-white mb-1">
                      1. Ingrese su Cédula, RIF, Correo o Teléfono
                    </h4>
                    <p className="text-xs text-[#9595a4]">
                      Permite que nuestro sistema reconozca sus equipos instalados y su historial en TecnoSmart.
                    </p>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-[#757585] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={identificador}
                      onChange={(e) => {
                        setIdentificador(e.target.value);
                        handleBuscarCliente(e.target.value);
                      }}
                      placeholder="Ej. V-18.456.789 / J-50701960-8 / correo@empresa.com / 0412-1234567"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#181822] border border-[#2a2a38] text-sm text-white placeholder:text-[#5f5f70] focus:outline-none focus:border-[var(--ts-red)] font-medium"
                    />
                    {buscandoCliente && (
                      <Loader2 className="w-4 h-4 text-[var(--ts-red)] animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  {/* Banner de Reconocimiento si coincide */}
                  {clienteMatched && (
                    <div className="bg-emerald-950/30 border border-emerald-600/40 rounded-2xl p-4 text-xs text-emerald-300 flex items-start gap-3 animate-in fade-in">
                      <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm text-emerald-200">
                          ¡Hola Sr./Sra. {clienteMatched.nombre}!
                        </p>
                        <p className="mt-0.5 text-[#a3e635] text-[11px]">
                          Te identificamos como cliente registrado de TecnoSmart en {clienteMatched.ciudad || "Venezuela"}. Hemos precargado tus datos de contacto para mayor rapidez.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-[#b5b5c2] mb-1">
                        Nombre y Apellido / Razón Social *
                      </label>
                      <input
                        type="text"
                        required
                        value={clienteNombre}
                        onChange={(e) => setClienteNombre(e.target.value)}
                        placeholder="Ej. Juan Pérez / Inversiones El Diamante"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#181822] border border-[#2a2a38] text-xs text-white placeholder:text-[#5f5f70] focus:outline-none focus:border-[var(--ts-red)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#b5b5c2] mb-1">
                        Teléfono / WhatsApp *
                      </label>
                      <input
                        type="text"
                        required
                        value={clienteTelefono}
                        onChange={(e) => setClienteTelefono(e.target.value)}
                        placeholder="0412-1234567"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#181822] border border-[#2a2a38] text-xs text-white placeholder:text-[#5f5f70] focus:outline-none focus:border-[var(--ts-red)] font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#b5b5c2] mb-1">
                      Correo Electrónico (Para recibir el ticket y acuse)
                    </label>
                    <input
                      type="email"
                      value={clienteEmail}
                      onChange={(e) => setClienteEmail(e.target.value)}
                      placeholder="nombre@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181822] border border-[#2a2a38] text-xs text-white placeholder:text-[#5f5f70] focus:outline-none focus:border-[var(--ts-red)]"
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-[#22222e]">
                    <button
                      type="button"
                      disabled={!clienteNombre || !clienteTelefono}
                      onClick={() => setPaso(2)}
                      className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all"
                    >
                      <span>Siguiente: Seleccionar Servicio</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  PASO 2: SELECCIÓN DE SERVICIO Y PREGUNTAS GUÍA
              ══════════════════════════════════════════════════════════ */}
              {paso === 2 && (
                <div className="space-y-4 animate-step-enter">
                  <div>
                    <h4 className="text-base font-bold text-white mb-1">
                      2. ¿Sobre qué servicio o equipo requiere asistencia?
                    </h4>
                    <p className="text-xs text-[#9595a4]">
                      Seleccione la categoría para direccionar su caso al departamento técnico adecuado.
                    </p>
                  </div>

                  {/* Grid de Servicios */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {categorias.map((cat) => {
                      const isSelected = categoriaSeleccionada?.id === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoriaSeleccionada(cat)}
                          className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                            isSelected
                              ? "bg-[#1f1a24] border-[var(--ts-red)] shadow-lg shadow-red-950/20"
                              : "bg-[#181822] border-[#272736] hover:border-[#38384d]"
                          }`}
                        >
                          <div
                            className="p-2 rounded-xl shrink-0"
                            style={{
                              backgroundColor: `${cat.color}20`,
                              color: cat.color,
                            }}
                          >
                            {cat.id === "starlink" && <Wifi className="w-5 h-5" />}
                            {cat.id === "cctv" && <Camera className="w-5 h-5" />}
                            {cat.id === "redes" && <Network className="w-5 h-5" />}
                            {cat.id === "automatizacion" && <Cpu className="w-5 h-5" />}
                            {cat.id === "domotica" && <KeyRound className="w-5 h-5" />}
                            {cat.id === "garantia" && <ShieldCheck className="w-5 h-5" />}
                            {cat.id === "otro" && <LifeBuoy className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">
                              {cat.nombre}
                            </p>
                            <p className="text-[10px] text-[#8e8e9c] line-clamp-2 mt-1">
                              {cat.descripcion}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Preguntas Guía Inteligentes si la categoría tiene preguntas */}
                  {categoriaSeleccionada?.preguntas_guia && categoriaSeleccionada.preguntas_guia.length > 0 && (
                    <div className="bg-[#181824] border border-[#2a2a3d] rounded-2xl p-4 space-y-3 mt-3 animate-in fade-in">
                      <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" />
                        <span>Diagnóstico Preliminar Rápido</span>
                      </div>

                      {categoriaSeleccionada.preguntas_guia.map((pg) => (
                        <div key={pg.id} className="space-y-1.5">
                          <label className="block text-xs font-medium text-[#c5c5d2]">
                            {pg.pregunta}
                          </label>
                          <select
                            value={respuestasGuia[pg.id] || ""}
                            onChange={(e) =>
                              setRespuestasGuia({
                                ...respuestasGuia,
                                [pg.id]: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-[#121217] border border-[#292938] text-xs text-white focus:outline-none focus:border-[var(--ts-red)]"
                          >
                            <option value="">-- Seleccionar una respuesta --</option>
                            {pg.opciones.map((opc, oIdx) => (
                              <option key={oIdx} value={opc}>
                                {opc}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-[#22222e]">
                    <button
                      type="button"
                      onClick={() => setPaso(1)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8c8c99] hover:text-white"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Volver al Paso 1</span>
                    </button>
                    <button
                      type="button"
                      disabled={!categoriaSeleccionada}
                      onClick={() => setPaso(3)}
                      className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all"
                    >
                      <span>Siguiente: Describir Falla</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  PASO 3: DETALLE DE LA FALLA Y ENVÍO
              ══════════════════════════════════════════════════════════ */}
              {paso === 3 && (
                <form onSubmit={handleSubmitTicket} className="space-y-4 animate-step-enter">
                  <div>
                    <h4 className="text-base font-bold text-white mb-1">
                      3. Describa la falla presentada
                    </h4>
                    <p className="text-xs text-[#9595a4]">
                      Sea lo más específico posible para que el técnico acuda o responda con las herramientas adecuadas.
                    </p>
                  </div>

                  {/* Resumen del Servicio */}
                  <div className="bg-[#181822] border border-[#272736] rounded-2xl p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-[#7a7a8a] uppercase font-bold">Servicio Seleccionado:</span>
                      <p className="font-bold text-white mt-0.5">{categoriaSeleccionada?.nombre}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaso(2)}
                      className="text-xs text-[var(--ts-red)] hover:underline font-semibold"
                    >
                      Cambiar
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#b5b5c2] mb-1">
                      Asunto / Resumen de la Falla *
                    </label>
                    <input
                      type="text"
                      required
                      value={asunto}
                      onChange={(e) => setAsunto(e.target.value)}
                      placeholder="Ej. Antena no enlaza tras tormenta / Cámara de entrada sin imagen"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181822] border border-[#2a2a38] text-xs text-white placeholder:text-[#5f5f70] focus:outline-none focus:border-[var(--ts-red)] font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#b5b5c2] mb-1">
                      Descripción Detallada
                    </label>
                    <textarea
                      rows={4}
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Explique qué síntomas observa, desde cuándo ocurre, pruebas realizadas..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181822] border border-[#2a2a38] text-xs text-white placeholder:text-[#5f5f70] focus:outline-none focus:border-[var(--ts-red)] resize-none"
                    />
                  </div>

                  <div className="bg-[#1b1722] border border-[var(--ts-red)]/20 rounded-xl p-3 text-[11px] text-[#c2b2c9] flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-[var(--ts-red)] shrink-0" />
                    <span>
                      Al enviar, se generará su número correlativo de ticket. Nuestro equipo técnico responde en alrededor de 24 horas en días hábiles (L-V 8:00 AM a 5:00 PM).
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#22222e]">
                    <button
                      type="button"
                      onClick={() => setPaso(2)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8c8c99] hover:text-white"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Volver al Paso 2</span>
                    </button>
                    <button
                      type="submit"
                      disabled={enviando || !asunto}
                      className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-red-950/40 transition-all hover:scale-105"
                    >
                      {enviando ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generando Ticket...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Enviar Ticket a Soporte</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
