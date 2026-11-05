"use client";

import { useState, useEffect } from "react";
import {
  X,
  Satellite,
  Wifi,
  Key,
  Lock,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Crown,
  ShieldCheck,
  Download,
  AlertCircle,
  CheckCircle2,
  Phone,
  FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatUSD } from "@/lib/utils";
import ClientePicker from "../ClientePicker";
import type { Cliente } from "@/lib/types";
import {
  extractStarlinkData,
  packStarlinkData,
  StarlinkMetadata,
} from "@/lib/types";
import { exportarStarlinkFichaPDF } from "@/components/pdf/StarlinkFichaPDF";
import type { Suscripcion, ServicioRecurrente } from "../SuscripcionesManager";

interface StarlinkOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  suscripcionEditar?: Suscripcion | null;
  servicios: ServicioRecurrente[];
}

// Planes estándar de Starlink en Venezuela y sus costos base
const PLANES_STARLINK = [
  { id: "residencial", nombre: "Starlink Residencial", costoBase: 40, totalRegular: 50 },
  { id: "itinerante_100gb", nombre: "Starlink Itinerante 100GB", costoBase: 60, totalRegular: 70 },
  { id: "itinerante_ilimitado", nombre: "Starlink Itinerante Ilimitado", costoBase: 110, totalRegular: 120 },
  { id: "personalizado", nombre: "Plan Personalizado", costoBase: 0, totalRegular: 10 },
];

export default function StarlinkOnboardingModal({
  isOpen,
  onClose,
  onSaved,
  suscripcionEditar,
  servicios,
}: StarlinkOnboardingModalProps) {
  // Estado del cliente seleccionado
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  // Estados del formulario Starlink
  const [direccionInstalacion, setDireccionInstalacion] = useState("");
  const [correoStarlink, setCorreoStarlink] = useState("");
  const [claveStarlink, setClaveStarlink] = useState("");
  const [mostrarClaveStarlink, setMostrarClaveStarlink] = useState(false);

  // Red WiFi Local
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [mostrarClaveWifi, setMostrarClaveWifi] = useState(false);

  // Plan y Finanzas
  const [planSeleccionado, setPlanSeleccionado] = useState(PLANES_STARLINK[0].nombre);
  const [costoBase, setCostoBase] = useState<number>(40);
  const [esVip, setEsVip] = useState(false);
  const [modalidadAcompanamiento, setModalidadAcompanamiento] = useState(false);
  const [diaCorte, setDiaCorte] = useState<number>(new Date().getDate());
  const [kitSerial, setKitSerial] = useState("");
  const [notasSoporte, setNotasSoporte] = useState("");

  // Documentos de Activación
  const [cedulaFrontalUrl, setCedulaFrontalUrl] = useState("");
  const [cedulaTraseraUrl, setCedulaTraseraUrl] = useState("");

  // Estado de guardado y éxito
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exitoGuardado, setExitoGuardado] = useState<boolean>(false);
  const [suscripcionCreada, setSuscripcionCreada] = useState<any>(null);

  // Inicializar formulario al abrir o cambiar suscripcionEditar
  useEffect(() => {
    if (!isOpen) return;

    if (suscripcionEditar) {
      const meta = extractStarlinkData(suscripcionEditar);
      setSelectedCliente(suscripcionEditar.clientes as any);
      setDireccionInstalacion(meta.direccion_instalacion || (suscripcionEditar.clientes as any)?.direccion || "");
      setCorreoStarlink(meta.correo_starlink || suscripcionEditar.credenciales_usuario || "");
      setClaveStarlink(meta.clave_starlink || suscripcionEditar.credenciales_clave || "");
      setWifiSsid(meta.wifi_ssid || "");
      setWifiPassword(meta.wifi_password || "");
      setKitSerial(meta.kit_serial || suscripcionEditar.equipo_serial || "");
      setNotasSoporte(meta.notas_soporte || "");
      setCedulaFrontalUrl(meta.cedula_frontal_url || "");
      setCedulaTraseraUrl(meta.cedula_trasera_url || "");

      const planNombre = meta.plan_starlink || suscripcionEditar.servicios_recurrentes?.nombre || PLANES_STARLINK[0].nombre;
      setPlanSeleccionado(planNombre);

      const planMatch = PLANES_STARLINK.find((p) => p.nombre.toLowerCase() === planNombre.toLowerCase());
      const base = Number(suscripcionEditar.costo_base || (planMatch ? planMatch.costoBase : 40));
      setCostoBase(base);

      const monto = Number(suscripcionEditar.monto || 0);
      const isAcomp = monto <= 0;
      setModalidadAcompanamiento(isAcomp);
      setEsVip(Boolean(meta.es_vip || isAcomp));

      if (meta.dia_corte) {
        setDiaCorte(Number(meta.dia_corte));
      } else if (suscripcionEditar.proximo_pago) {
        const d = new Date(suscripcionEditar.proximo_pago);
        if (!isNaN(d.getDate())) setDiaCorte(d.getUTCDate());
      }
    } else {
      // Nuevo registro en blanco
      setSelectedCliente(null);
      setDireccionInstalacion("");
      setCorreoStarlink("");
      setClaveStarlink("");
      setWifiSsid("");
      setWifiPassword("");
      setPlanSeleccionado(PLANES_STARLINK[0].nombre);
      setCostoBase(PLANES_STARLINK[0].costoBase);
      setEsVip(false);
      setModalidadAcompanamiento(false);
      setDiaCorte(new Date().getDate());
      setKitSerial("");
      setNotasSoporte("");
      setCedulaFrontalUrl("");
      setCedulaTraseraUrl("");
      setExitoGuardado(false);
      setSuscripcionCreada(null);
      setErrorMsg(null);
    }
  }, [isOpen, suscripcionEditar]);

  // Manejar cambio de plan predeterminado
  const handleCambiarPlan = (nombre: string) => {
    setPlanSeleccionado(nombre);
    const encontrado = PLANES_STARLINK.find((p) => p.nombre === nombre);
    if (encontrado && encontrado.costoBase > 0) {
      setCostoBase(encontrado.costoBase);
    }
  };

  // Cálculo del monto total mensual
  const feeSoporte = esVip || modalidadAcompanamiento ? 0 : 10;
  const montoTotal = modalidadAcompanamiento ? 0 : costoBase + feeSoporte;

  // Calcular fecha de próximo pago basada en el día de corte
  const calcularProximoPago = (dia: number): string => {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();
    const diaActual = hoy.getDate();

    let fechaCorte: Date;
    if (dia >= diaActual) {
      fechaCorte = new Date(anio, mes, dia);
    } else {
      // Próximo mes
      fechaCorte = new Date(anio, mes + 1, dia);
    }

    return fechaCorte.toISOString().split("T")[0];
  };

  // Guardar suscripción
  const handleGuardar = async () => {
    if (!selectedCliente || !selectedCliente.id) {
      setErrorMsg("Debes seleccionar o registrar un cliente.");
      return;
    }
    if (!correoStarlink.trim()) {
      setErrorMsg("El correo de la cuenta Starlink es requerido.");
      return;
    }

    setGuardando(true);
    setErrorMsg(null);

    try {
      // Buscar o asignar un servicio_id de Starlink adecuado
      let servicioId = "";
      const servicioEncontrado = servicios.find(
        (s) =>
          s.nombre.toLowerCase().includes(planSeleccionado.toLowerCase()) ||
          s.nombre.toLowerCase().includes("starlink")
      );
      if (servicioEncontrado) {
        servicioId = servicioEncontrado.id;
      } else if (servicios.length > 0) {
        servicioId = servicios[0].id;
      }

      // Empaquetar metadatos en JSON dentro de credenciales_notas
      const meta: StarlinkMetadata = {
        wifi_ssid: wifiSsid.trim(),
        wifi_password: wifiPassword.trim(),
        correo_starlink: correoStarlink.trim(),
        clave_starlink: claveStarlink.trim(),
        plan_starlink: planSeleccionado,
        dia_corte: diaCorte,
        direccion_instalacion: direccionInstalacion.trim(),
        kit_serial: kitSerial.trim(),
        fee_soporte: feeSoporte,
        es_vip: esVip,
        cedula_frontal_url: cedulaFrontalUrl.trim(),
        cedula_trasera_url: cedulaTraseraUrl.trim(),
        notas_soporte: notasSoporte.trim(),
      };

      const serializedNotas = packStarlinkData(meta, notasSoporte);
      const proximoPagoCalculado = calcularProximoPago(diaCorte);

      const payload = {
        cliente_id: selectedCliente.id,
        servicio_id: servicioId || null,
        estado: "Activo",
        ciclo_facturacion: "Mensual",
        monto: montoTotal,
        costo_base: modalidadAcompanamiento ? 0 : costoBase,
        fecha_inicio: suscripcionEditar?.fecha_inicio || new Date().toISOString().split("T")[0],
        proximo_pago: proximoPagoCalculado,
        credenciales_usuario: correoStarlink.trim(),
        credenciales_clave: claveStarlink.trim(),
        credenciales_notas: serializedNotas,
        equipo_serial: kitSerial.trim(),
        socios: suscripcionEditar?.socios || [],
      };

      let resultId = suscripcionEditar?.id;

      if (suscripcionEditar) {
        const { error } = await supabase.from("suscripciones").update(payload).eq("id", suscripcionEditar.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("suscripciones").insert([payload]).select().single();
        if (error) throw error;
        if (data) resultId = data.id;
      }

      // Actualizar la dirección del cliente si se proporcionó una
      if (direccionInstalacion && (!selectedCliente.direccion || selectedCliente.direccion !== direccionInstalacion)) {
        await supabase
          .from("clientes")
          .update({ direccion: direccionInstalacion })
          .eq("id", selectedCliente.id);
      }

      setSuscripcionCreada({
        ...payload,
        id: resultId,
        clientes: selectedCliente,
        servicios_recurrentes: { nombre: planSeleccionado },
      });

      setExitoGuardado(true);
      onSaved();
    } catch (err: any) {
      console.error("Error al guardar Starlink:", err);
      setErrorMsg("Error al guardar: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Descarga inmediata de PDF tras guardar
  const handleDescargarPDFInmediato = async () => {
    if (!selectedCliente) return;

    await exportarStarlinkFichaPDF({
      clienteNombre: selectedCliente.empresa || selectedCliente.contacto || "Cliente",
      clienteTelefono: selectedCliente.telefono,
      clienteEmail: selectedCliente.email,
      clienteRif: selectedCliente.rif_cedula,
      direccionInstalacion: direccionInstalacion || selectedCliente.direccion || "Venezuela",
      correoStarlink,
      claveStarlink,
      wifiSsid: wifiSsid || "Starlink",
      wifiPassword: wifiPassword || "Configurado en sitio",
      planNombre: planSeleccionado,
      estado: "Activo",
      mensualidadUSD: montoTotal,
      costoBaseUSD: costoBase,
      feeSoporteUSD: feeSoporte,
      esVip,
      diaCorte,
      kitSerial,
      fechaEmision: new Date(),
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-3xl bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
        {/* Header con estilo TecnoSmart & Starlink */}
        <div className="px-6 py-4 border-b border-[var(--ts-border)] bg-[var(--ts-surface-2)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--ts-red)]/10 border border-[var(--ts-red)]/20 flex items-center justify-center text-[var(--ts-red)]">
              <Satellite className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[var(--ts-text-primary)]">
                {suscripcionEditar ? "Editar Antena Starlink" : "Nueva Activación Starlink"}
              </h2>
              <p className="text-xs text-[var(--ts-text-muted)]">
                TecnoSmart VZL C.A. — Gestión técnica de flota y entrega al cliente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[var(--ts-surface)] text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo scrolleable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Mensaje de Éxito Post-Guardado */}
          {exitoGuardado ? (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <div>
                <h3 className="text-base font-black text-[var(--ts-text-primary)]">
                  ¡Antena Starlink Registrada con Éxito!
                </h3>
                <p className="text-xs text-[var(--ts-text-muted)] mt-1 max-w-md mx-auto">
                  La antena para <strong className="text-[var(--ts-text-primary)]">{selectedCliente?.contacto || selectedCliente?.empresa}</strong> ha sido guardada en el sistema. Puedes descargar ahora la ficha formal de entrega en PDF.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleDescargarPDFInmediato}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[var(--ts-red)] hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>📄 Descargar Ficha PDF para el Cliente</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[var(--ts-surface-2)] hover:bg-[var(--ts-border)] text-[var(--ts-text-primary)] font-bold text-xs rounded-xl transition-all"
                >
                  Finalizar y Volver a la Flota
                </button>
              </div>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* ── BLOQUE 1: CLIENTE Y UBICACIÓN DE INSTALACIÓN ── */}
              <div className="bg-[var(--ts-surface-2)]/60 border border-[var(--ts-border)] rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--ts-text-primary)] flex items-center gap-2">
                  <User className="w-4 h-4 text-[var(--ts-red)]" /> 1. Cliente y Ubicación de Instalación
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                      Cliente Asignado *
                    </label>
                    <ClientePicker
                      clienteSeleccionado={selectedCliente}
                      onSelect={(c) => {
                        setSelectedCliente(c);
                        if (c.direccion && !direccionInstalacion) {
                          setDireccionInstalacion(c.direccion);
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Dirección Exacta de Instalación
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Finca El Paraíso, Tinaquillo, Cojedes / Casa Francis"
                      value={direccionInstalacion}
                      onChange={(e) => setDireccionInstalacion(e.target.value)}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* ── BLOQUE 2: CUENTA STARLINK OFICIAL ── */}
              <div className="bg-[var(--ts-surface-2)]/60 border border-[var(--ts-border)] rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--ts-text-primary)] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" /> 2. Cuenta Starlink Oficial
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                      Correo de la Cuenta Starlink *
                    </label>
                    <input
                      type="email"
                      placeholder="ej: starlink.cliente@somostecnosmart.com"
                      value={correoStarlink}
                      onChange={(e) => setCorreoStarlink(e.target.value)}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                    />
                    <p className="text-[10px] text-[var(--ts-text-muted)] mt-1">
                      Correo de acceso directo al portal de Starlink.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                      Contraseña de la Cuenta Starlink
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarClaveStarlink ? "text" : "password"}
                        placeholder="Contraseña de la cuenta"
                        value={claveStarlink}
                        onChange={(e) => setClaveStarlink(e.target.value)}
                        className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 pr-9 text-xs font-mono focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarClaveStarlink(!mostrarClaveStarlink)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                      >
                        {mostrarClaveStarlink ? "👁️" : "🙈"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── BLOQUE 3: RED WIFI LOCAL ── */}
              <div className="bg-[var(--ts-surface-2)]/60 border border-[var(--ts-border)] rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--ts-text-primary)] flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-cyan-400" /> 3. Red WiFi Local del Cliente
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                      Nombre de la Red WiFi (SSID)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Starlink-Casa o MiWiFi_Fibra"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                      Contraseña de la Red WiFi
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarClaveWifi ? "text" : "password"}
                        placeholder="Ej: ClaveSegura2026*"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 pr-9 text-xs font-mono focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarClaveWifi(!mostrarClaveWifi)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
                      >
                        {mostrarClaveWifi ? "👁️" : "🙈"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── BLOQUE 4: PLAN, SOPORTE TÉCNICO Y HARDWARE ── */}
              <div className="bg-[var(--ts-surface-2)]/60 border border-[var(--ts-border)] rounded-2xl p-4 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--ts-text-primary)] flex items-center gap-2">
                  <Satellite className="w-4 h-4 text-[var(--ts-red)]" /> 4. Plan, Facturación y Hardware
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Selector de Plan */}
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                      Plan Starlink
                    </label>
                    <select
                      value={planSeleccionado}
                      onChange={(e) => handleCambiarPlan(e.target.value)}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)]"
                    >
                      {PLANES_STARLINK.map((p) => (
                        <option key={p.id} value={p.nombre}>
                          {p.nombre} {p.costoBase > 0 ? `(Base $${p.costoBase} + $10 Soporte)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Serial del KIT */}
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                      Serial del KIT / Antena Starlink
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: KIT4M070688358RG"
                      value={kitSerial}
                      onChange={(e) => setKitSerial(e.target.value)}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                    />
                  </div>

                  {/* Día de Corte */}
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                      Día de Corte Mensual (1 al 31)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={diaCorte}
                      onChange={(e) => setDiaCorte(Number(e.target.value))}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                    />
                  </div>

                  {/* Costo Base Starlink */}
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                      Costo Base Starlink ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={costoBase}
                      onChange={(e) => setCostoBase(Number(e.target.value))}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors"
                    />
                  </div>
                </div>

                {/* Toggles VIP y Modalidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Toggle VIP */}
                  <label className="flex items-center gap-3 p-3 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl cursor-pointer hover:border-amber-400/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={esVip}
                      onChange={(e) => setEsVip(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <span className="text-xs font-bold text-[var(--ts-text-primary)] flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-400" /> Cliente VIP (Exonerar $10 Soporte)
                      </span>
                      <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">
                        Fee de soporte = $0.00. Solo paga el costo base de Starlink.
                      </p>
                    </div>
                  </label>

                  {/* Toggle Acompañamiento */}
                  <label className="flex items-center gap-3 p-3 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl cursor-pointer hover:border-blue-400/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={modalidadAcompanamiento}
                      onChange={(e) => setModalidadAcompanamiento(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-500 focus:ring-blue-400"
                    />
                    <div>
                      <span className="text-xs font-bold text-[var(--ts-text-primary)] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Solo Acompañamiento ($0 en Sistema)
                      </span>
                      <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">
                        El cliente paga directamente a Starlink con su tarjeta propia.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Resumen Financiero en Vivo */}
                <div className="p-3 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--ts-text-muted)] block uppercase font-black">
                      Desglose de Facturación
                    </span>
                    <span className="text-xs text-[var(--ts-text-primary)]">
                      Base: <strong className="font-mono">{formatUSD(costoBase)}</strong> + Soporte:{" "}
                      <strong className={`font-mono ${feeSoporte > 0 ? "text-blue-400" : "text-amber-400"}`}>
                        {formatUSD(feeSoporte)}
                      </strong>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[var(--ts-text-muted)] block uppercase font-black">
                      Total Mensualidad
                    </span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      {formatUSD(montoTotal)}
                    </span>
                  </div>
                </div>

                {/* Notas de Soporte e Instalación */}
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                    Notas de Instalación / Observaciones
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Antena instalada en mástil del techo. Router secundario en planta baja..."
                    value={notasSoporte}
                    onChange={(e) => setNotasSoporte(e.target.value)}
                    className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[var(--ts-red)] text-[var(--ts-text-primary)] transition-colors resize-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer con botones */}
        {!exitoGuardado && (
          <div className="px-6 py-4 border-t border-[var(--ts-border)] bg-[var(--ts-surface-2)] flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)] transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="px-6 py-2 bg-[var(--ts-red)] hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Satellite className={`w-4 h-4 ${guardando ? "animate-spin" : ""}`} />
              <span>{guardando ? "Guardando..." : suscripcionEditar ? "Guardar Cambios" : "Activar Antena Starlink"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
