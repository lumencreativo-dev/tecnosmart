"use client";

import { useState, useEffect } from "react";
import {
  X,
  Satellite,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Phone,
  FileText,
  User,
  Lock,
  Wifi,
  Key,
  Calendar,
  DollarSign,
  Crown,
  Download,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Mail,
  Box,
  Pencil,
  Save,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatUSD } from "@/lib/utils";
import type { SolicitudStarlink } from "@/lib/types";
import { packStarlinkData, StarlinkMetadata } from "@/lib/types";
import { exportarStarlinkFichaPDF } from "@/components/pdf/StarlinkFichaPDF";
import { actualizarEstadoSolicitud, actualizarDatosSolicitud } from "@/lib/starlinkSolicitudes";
import { obtenerPoolAlias, marcarAliasAsignado, StarlinkEmailAlias } from "@/lib/starlinkEmailPool";
import type { ServicioRecurrente } from "../SuscripcionesManager";

interface Props {
  solicitud: SolicitudStarlink | null;
  isOpen: boolean;
  onClose: () => void;
  onActivated: () => void;
  servicios: ServicioRecurrente[];
}

export default function StarlinkCockpitActivacionModal({
  solicitud,
  isOpen,
  onClose,
  onActivated,
  servicios,
}: Props) {
  // ── Estados editables de los datos del cliente ──
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [cedulaRif, setCedulaRif] = useState("");
  const [telefono, setTelefono] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [direccion, setDireccion] = useState("");
  const [planDeseado, setPlanDeseado] = useState("Starlink Residencial");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);

  // Estados para datos que llena TecnoSmart en la activación
  const [correoStarlink, setCorreoStarlink] = useState("");
  const [claveStarlink, setClaveStarlink] = useState("");
  const [mostrarClaveStarlink, setMostrarClaveStarlink] = useState(false);
  const [kitSerial, setKitSerial] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [mostrarClaveWifi, setMostrarClaveWifi] = useState(false);
  const [diaCorte, setDiaCorte] = useState<number>(new Date().getDate());
  const [esVip, setEsVip] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [activando, setActivando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fotoZoom, setFotoZoom] = useState<string | null>(null);

  // Pool de Alias Cloudflare
  const [poolDisponibles, setPoolDisponibles] = useState<StarlinkEmailAlias[]>([]);

  // Inicializar y sincronizar campos cuando se abre o cambia la solicitud
  useEffect(() => {
    if (solicitud && isOpen) {
      setNombreCompleto(solicitud.nombre_completo || "");
      setCedulaRif(solicitud.cedula_rif || "");
      setTelefono(solicitud.telefono || "");
      setEmailCliente(solicitud.email || "");
      setDireccion(solicitud.direccion || "");
      setPlanDeseado(solicitud.plan_deseado || "Starlink Residencial");

      const serial = solicitud.kit_serial || (solicitud.notas && solicitud.notas.length < 35 ? solicitud.notas.trim() : "");
      setKitSerial(serial || "");
      // Correo y clave de la cuenta Starlink inician 100% vacíos para ingresar el alias de Cloudflare
      setCorreoStarlink("");
      setClaveStarlink("");
      setWifiSsid(solicitud.wifi_ssid_preferido || `Starlink-${(solicitud.nombre_completo || "").split(" ")[0]}`);
      setWifiPassword(solicitud.wifi_password_preferido || "Tecno2026*");
      setModoEdicion(false);
      setErrorMsg(null);
      setMensajeGuardado(null);

      // Cargar correos disponibles del pool
      obtenerPoolAlias().then((res) => {
        const libres = res.pool.filter((p) => p.estado === "disponible");
        setPoolDisponibles(libres);
      });
    }
  }, [solicitud, isOpen]);

  if (!isOpen || !solicitud) return null;

  const handleCopiar = (texto: string, clave: string) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    setCopiado(clave);
    setTimeout(() => setCopiado(null), 2000);
  };

  // Guardar correcciones en la base de datos
  const handleGuardarCambiosCliente = async () => {
    if (!solicitud?.id) return;
    setGuardandoEdicion(true);
    setErrorMsg(null);
    try {
      const res = await actualizarDatosSolicitud(solicitud.id, {
        nombre_completo: nombreCompleto.trim(),
        cedula_rif: cedulaRif.trim(),
        telefono: telefono.trim(),
        email: emailCliente.trim() || undefined,
        direccion: direccion.trim(),
        plan_deseado: planDeseado,
        kit_serial: kitSerial.trim() || undefined,
        wifi_ssid_preferido: wifiSsid.trim() || undefined,
        wifi_password_preferido: wifiPassword.trim() || undefined,
      });

      if (res.success) {
        setMensajeGuardado("Correcciones guardadas exitosamente.");
        setModoEdicion(false);
        setTimeout(() => setMensajeGuardado(null), 3000);
      } else {
        setErrorMsg(res.error || "Error al guardar corrección.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al actualizar");
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // Calcular montos según el plan
  const planNombre = planDeseado || "Starlink Residencial";
  let costoBase = 40;
  if (planNombre.toLowerCase().includes("100gb")) costoBase = 60;
  else if (planNombre.toLowerCase().includes("ilimitado")) costoBase = 110;

  const feeSoporte = esVip ? 0 : 10;
  const montoTotal = costoBase + feeSoporte;

  // Confirmar y procesar activación
  const handleConfirmarActivacion = async () => {
    if (!correoStarlink.trim() || !kitSerial.trim()) {
      setErrorMsg("El correo de la cuenta Starlink y el Serial del KIT son obligatorios para completar la activación.");
      return;
    }

    setActivando(true);
    setErrorMsg(null);

    try {
      // 1. Crear o buscar el cliente en la tabla 'clientes' de TecnoSmart
      let clienteId: string | null = null;

      // Buscar si ya existe por RIF o Cédula (o por el RIF corregido)
      const { data: existente } = await supabase
        .from("clientes")
        .select("id")
        .eq("rif_cedula", cedulaRif.trim())
        .limit(1);

      if (existente && existente.length > 0) {
        clienteId = existente[0].id;
        // Actualizar datos de contacto y dirección con los valores corregidos
        await supabase
          .from("clientes")
          .update({
            contacto: nombreCompleto.trim(),
            empresa: nombreCompleto.trim(),
            rif_cedula: cedulaRif.trim(),
            telefono: telefono.trim(),
            email: emailCliente.trim() || null,
            direccion: direccion.trim(),
            tipo: "cliente_normal",
          })
          .eq("id", clienteId);
      } else {
        // Crear nuevo cliente con los datos limpios y corregidos
        const { data: nuevoCliente, error: errCli } = await supabase
          .from("clientes")
          .insert([
            {
              contacto: nombreCompleto.trim(),
              empresa: nombreCompleto.trim(),
              rif_cedula: cedulaRif.trim(),
              telefono: telefono.trim(),
              email: emailCliente.trim() || null,
              direccion: direccion.trim(),
              tipo: "cliente_normal",
              notas: `Cliente activado vía Onboarding Starlink. Tel: ${telefono.trim()}`,
            },
          ])
          .select("id")
          .single();

        if (errCli) throw errCli;
        clienteId = nuevoCliente.id;
      }

      // 2. Buscar servicio_id en servicios_recurrentes
      let servicioId = "";
      const servicioEncontrado = servicios.find(
        (s) =>
          s.nombre.toLowerCase().includes(planNombre.toLowerCase()) ||
          s.nombre.toLowerCase().includes("starlink")
      );
      if (servicioEncontrado) servicioId = servicioEncontrado.id;
      else if (servicios.length > 0) servicioId = servicios[0].id;

      // 3. Empaquetar metadatos Starlink
      const meta: StarlinkMetadata = {
        wifi_ssid: wifiSsid.trim(),
        wifi_password: wifiPassword.trim(),
        correo_starlink: correoStarlink.trim(),
        clave_starlink: claveStarlink.trim(),
        plan_starlink: planNombre,
        dia_corte: diaCorte,
        direccion_instalacion: direccion.trim(),
        kit_serial: kitSerial.trim(),
        fee_soporte: feeSoporte,
        es_vip: esVip,
        cedula_frontal_url: solicitud.cedula_frontal_url,
        cedula_trasera_url: solicitud.cedula_trasera_url,
        ubicacion_detalles: solicitud.coordenadas_gps,
        notas_soporte: solicitud.notas,
      };

      const serializedNotas = packStarlinkData(meta, solicitud.notas);

      // Calcular fecha de corte
      const hoy = new Date();
      let fechaCorte: Date;
      if (diaCorte >= hoy.getDate()) {
        fechaCorte = new Date(hoy.getFullYear(), hoy.getMonth(), diaCorte);
      } else {
        fechaCorte = new Date(hoy.getFullYear(), hoy.getMonth() + 1, diaCorte);
      }
      const proximoPago = fechaCorte.toISOString().split("T")[0];

      // 4. Crear la suscripción activa en 'suscripciones'
      const { data: nuevaSub, error: subErr } = await supabase
        .from("suscripciones")
        .insert([
          {
            cliente_id: clienteId,
            servicio_id: servicioId,
            estado: "Activo",
            ciclo_facturacion: "Mensual",
            monto: montoTotal,
            costo_base: costoBase,
            fecha_inicio: hoy.toISOString().split("T")[0],
            proximo_pago: proximoPago,
            credenciales_usuario: correoStarlink.trim(),
            credenciales_clave: claveStarlink.trim(),
            credenciales_notas: serializedNotas,
            equipo_serial: kitSerial.trim(),
            socios: [],
          },
        ])
        .select()
        .single();

      if (subErr) throw subErr;

      // 5. Marcar solicitud como 'activada' y sincronizar datos corregidos
      if (solicitud.id) {
        await actualizarDatosSolicitud(solicitud.id, {
          nombre_completo: nombreCompleto.trim(),
          cedula_rif: cedulaRif.trim(),
          telefono: telefono.trim(),
          email: emailCliente.trim() || undefined,
          direccion: direccion.trim(),
          plan_deseado: planDeseado,
          kit_serial: kitSerial.trim() || undefined,
          estado: "activada",
        });
        await actualizarEstadoSolicitud(solicitud.id, "activada");
      }

      // 6. Marcar el correo como asignado en el Pool de Cloudflare
      try {
        await marcarAliasAsignado(correoStarlink.trim(), {
          cliente_nombre: nombreCompleto.trim(),
          kit_serial: kitSerial.trim(),
          suscripcion_id: nuevaSub?.id,
        });
      } catch (poolErr) {
        console.warn("No se pudo actualizar pool de alias:", poolErr);
      }

      // 7. Generar y descargar inmediatamente la Ficha PDF formal con los datos corregidos
      await exportarStarlinkFichaPDF({
        clienteNombre: nombreCompleto.trim(),
        clienteTelefono: telefono.trim(),
        clienteEmail: emailCliente.trim() || undefined,
        clienteRif: cedulaRif.trim(),
        direccionInstalacion: direccion.trim(),
        correoStarlink: correoStarlink.trim(),
        claveStarlink: claveStarlink.trim(),
        wifiSsid: wifiSsid.trim() || "Starlink",
        wifiPassword: wifiPassword.trim() || "Configurado en sitio",
        planNombre: planNombre,
        estado: "Activo",
        mensualidadUSD: montoTotal,
        costoBaseUSD: costoBase,
        feeSoporteUSD: feeSoporte,
        esVip,
        diaCorte,
        kitSerial: kitSerial.trim(),
        fechaEmision: new Date(),
      });

      onActivated();
      onClose();
    } catch (err: any) {
      console.error("Error al activar antena:", err);
      setErrorMsg("Error al activar antena: " + (err.message || "Error desconocido"));
    } finally {
      setActivando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header Cockpit */}
        <div className="px-6 py-4 border-b border-[var(--ts-border)] bg-[var(--ts-surface-2)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--ts-red)]/15 border border-[var(--ts-red)]/30 flex items-center justify-center text-[var(--ts-red)]">
              <Satellite className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[var(--ts-text-primary)]">
                  Cockpit de Activación Starlink
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Por Activar
                </span>
              </div>
              <p className="text-xs text-[var(--ts-text-muted)]">
                Cliente: <strong className="text-[var(--ts-text-primary)]">{solicitud.nombre_completo}</strong> ({solicitud.cedula_rif})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://www.starlink.com/activate"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Starlink.com/activate</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[var(--ts-surface)] text-[var(--ts-text-muted)] hover:text-[var(--ts-text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo Dividido (Split Layout) */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          {/* ── PANEL IZQUIERDO: DATOS Y RECAUDOS DEL CLIENTE ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--ts-border)]">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--ts-text-muted)] flex items-center gap-1.5">
                <User className="w-4 h-4 text-[var(--ts-red)]" /> 1. Datos para Registrar en Starlink.com
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModoEdicion(!modoEdicion)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                    modoEdicion
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                      : "bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)] hover:text-white border border-[var(--ts-border)] hover:bg-[var(--ts-border)]"
                  }`}
                  title="Corregir errores de ortografía, cédula o dirección cometidos por el cliente"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{modoEdicion ? "Finalizar Edición" : "Editar Datos"}</span>
                </button>
                {!modoEdicion && <span className="text-[10px] text-slate-400">Toca el botón para copiar</span>}
              </div>
            </div>

            {/* Banner de Modo Edición */}
            {modoEdicion && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span className="text-[11px]">
                    Modifica cualquier dato erróneo del cliente. Las correcciones se guardarán y aparecerán en la Ficha PDF final.
                  </span>
                </div>
                {solicitud.id && (
                  <button
                    type="button"
                    onClick={handleGuardarCambiosCliente}
                    disabled={guardandoEdicion}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{guardandoEdicion ? "Guardando..." : "Guardar Corrección"}</span>
                  </button>
                )}
              </div>
            )}

            {/* Mensaje de éxito al guardar corrección */}
            {mensajeGuardado && (
              <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{mensajeGuardado}</span>
              </div>
            )}

            {/* Tarjetas de copiado rápido o campos editables */}
            <div className="space-y-2.5 text-xs">
              {/* Nombre */}
              <div className="p-3 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl flex items-center justify-between gap-2">
                <div className="flex-1">
                  <span className="text-[10px] text-[var(--ts-text-muted)] block uppercase font-bold mb-0.5">Nombre del Titular</span>
                  {modoEdicion ? (
                    <input
                      type="text"
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none focus:border-[var(--ts-red)]"
                      placeholder="Nombre y Apellido"
                    />
                  ) : (
                    <span className="font-bold text-[var(--ts-text-primary)] text-sm">{nombreCompleto}</span>
                  )}
                </div>
                {!modoEdicion && (
                  <button
                    onClick={() => handleCopiar(nombreCompleto, "nombre")}
                    className="px-2.5 py-1.5 bg-[var(--ts-surface)] border border-[var(--ts-border)] hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0"
                  >
                    {copiado === "nombre" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiado === "nombre" ? "Copiado" : "Copiar"}</span>
                  </button>
                )}
              </div>

              {/* Cédula */}
              <div className="p-3 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl flex items-center justify-between gap-2">
                <div className="flex-1">
                  <span className="text-[10px] text-[var(--ts-text-muted)] block uppercase font-bold mb-0.5">Cédula / Documento</span>
                  {modoEdicion ? (
                    <input
                      type="text"
                      value={cedulaRif}
                      onChange={(e) => setCedulaRif(e.target.value)}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-2.5 py-1 text-xs font-mono text-white font-bold focus:outline-none focus:border-[var(--ts-red)]"
                      placeholder="Ej: V-12.345.678"
                    />
                  ) : (
                    <span className="font-mono font-bold text-[var(--ts-text-primary)] text-sm">{cedulaRif}</span>
                  )}
                </div>
                {!modoEdicion && (
                  <button
                    onClick={() => handleCopiar(cedulaRif, "cedula")}
                    className="px-2.5 py-1.5 bg-[var(--ts-surface)] border border-[var(--ts-border)] hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0"
                  >
                    {copiado === "cedula" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiado === "cedula" ? "Copiado" : "Copiar"}</span>
                  </button>
                )}
              </div>

              {/* Correo Electrónico del Cliente */}
              <div className="p-3 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl flex items-center justify-between gap-2">
                <div className="flex-1">
                  <span className="text-[10px] text-[var(--ts-text-muted)] block uppercase font-bold flex items-center gap-1 mb-0.5">
                    <Mail className="w-3 h-3 text-blue-400" /> Correo Electrónico Enviado por Cliente
                  </span>
                  {modoEdicion ? (
                    <input
                      type="email"
                      value={emailCliente}
                      onChange={(e) => {
                        setEmailCliente(e.target.value);
                        if (!correoStarlink || correoStarlink === emailCliente) {
                          setCorreoStarlink(e.target.value);
                        }
                      }}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-2.5 py-1 text-xs font-mono text-white font-bold focus:outline-none focus:border-[var(--ts-red)]"
                      placeholder="cliente@ejemplo.com"
                    />
                  ) : (
                    <span className="font-mono font-bold text-[var(--ts-text-primary)] text-sm">
                      {emailCliente || <span className="text-amber-400/80 font-normal italic">No especificado</span>}
                    </span>
                  )}
                </div>
                {!modoEdicion && emailCliente && (
                  <button
                    onClick={() => handleCopiar(emailCliente, "email")}
                    className="px-2.5 py-1.5 bg-[var(--ts-surface)] border border-[var(--ts-border)] hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0"
                  >
                    {copiado === "email" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiado === "email" ? "Copiado" : "Copiar"}</span>
                  </button>
                )}
              </div>

              {/* Serial del KIT / Antena enviado por el cliente */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 to-emerald-900/20 border-2 border-emerald-500/50 rounded-xl flex items-center justify-between shadow-lg shadow-emerald-950/20 gap-2">
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 uppercase font-black tracking-wider">
                      Identificador / Serial Starlink (Etiqueta de la Caja)
                    </span>
                  </div>
                  {modoEdicion ? (
                    <input
                      type="text"
                      value={kitSerial}
                      onChange={(e) => setKitSerial(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-emerald-500/60 rounded-lg px-2.5 py-1 text-xs font-mono font-black text-emerald-300 tracking-wider focus:outline-none focus:border-emerald-400"
                      placeholder="KIT0000001234 o serial alfanumérico"
                    />
                  ) : (
                    <span className="font-mono font-black text-emerald-300 text-sm tracking-wider block">
                      {kitSerial || <span className="text-slate-400 font-normal italic text-xs">No indicado por el cliente</span>}
                    </span>
                  )}
                </div>
                {!modoEdicion && kitSerial && (
                  <button
                    onClick={() => handleCopiar(kitSerial, "serial_cliente")}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-md shrink-0"
                  >
                    {copiado === "serial_cliente" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiado === "serial_cliente" ? "Copiado" : "Copiar Serial"}</span>
                  </button>
                )}
              </div>

              {/* Teléfono */}
              <div className="p-3 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl flex items-center justify-between gap-2">
                <div className="flex-1">
                  <span className="text-[10px] text-[var(--ts-text-muted)] block uppercase font-bold mb-0.5">Teléfono WhatsApp</span>
                  {modoEdicion ? (
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-2.5 py-1 text-xs font-mono text-white font-bold focus:outline-none focus:border-[var(--ts-red)]"
                      placeholder="0414-0000000"
                    />
                  ) : (
                    <span className="font-mono font-bold text-[var(--ts-text-primary)]">{telefono}</span>
                  )}
                </div>
                {!modoEdicion && (
                  <button
                    onClick={() => handleCopiar(telefono, "telefono")}
                    className="px-2.5 py-1.5 bg-[var(--ts-surface)] border border-[var(--ts-border)] hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0"
                  >
                    {copiado === "telefono" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiado === "telefono" ? "Copiado" : "Copiar"}</span>
                  </button>
                )}
              </div>

              {/* Dirección */}
              <div className="p-3 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-[10px] text-[var(--ts-text-muted)] block uppercase font-bold mb-0.5">Dirección de Instalación</span>
                  {modoEdicion ? (
                    <textarea
                      rows={2}
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[var(--ts-red)] resize-none"
                      placeholder="Dirección detallada"
                    />
                  ) : (
                    <>
                      <p className="text-[var(--ts-text-primary)] text-xs mt-0.5 leading-relaxed">{direccion}</p>
                      {solicitud.coordenadas_gps && (
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(solicitud.coordenadas_gps)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold mt-1.5 hover:underline"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>Ver coordenadas en Google Maps ({solicitud.coordenadas_gps})</span>
                        </a>
                      )}
                    </>
                  )}
                </div>
                {!modoEdicion && (
                  <button
                    onClick={() => handleCopiar(direccion, "direccion")}
                    className="px-2.5 py-1.5 bg-[var(--ts-surface)] border border-[var(--ts-border)] hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0"
                  >
                    {copiado === "direccion" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiado === "direccion" ? "Copiado" : "Copiar"}</span>
                  </button>
                )}
              </div>

              {/* Plan Solicitado (Editable) */}
              <div className="p-3 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl flex items-center justify-between gap-2">
                <div className="flex-1">
                  <span className="text-[10px] text-[var(--ts-text-muted)] block uppercase font-bold mb-0.5">Plan Contratado</span>
                  {modoEdicion ? (
                    <select
                      value={planDeseado}
                      onChange={(e) => setPlanDeseado(e.target.value)}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none focus:border-[var(--ts-red)]"
                    >
                      <option value="Starlink Residencial">Starlink Residencial ($50/mes)</option>
                      <option value="Starlink Itinerante 100GB">Starlink Itinerante 100GB ($70/mes)</option>
                      <option value="Starlink Itinerante Ilimitado">Starlink Itinerante Ilimitado ($120/mes)</option>
                    </select>
                  ) : (
                    <span className="font-bold text-[var(--ts-text-primary)] text-xs bg-[var(--ts-surface)] px-2 py-0.5 rounded border border-[var(--ts-border)]">
                      {planDeseado}
                    </span>
                  )}
                </div>
              </div>

              {/* Preferencias WiFi enviadas por el cliente */}
              {(solicitud.wifi_ssid_preferido || solicitud.wifi_password_preferido) && (
                <div className="p-3 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[var(--ts-text-muted)] block uppercase font-bold flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-cyan-400" /> WiFi Preferido por Cliente
                    </span>
                    <div className="font-mono text-xs text-[var(--ts-text-primary)] mt-0.5">
                      SSID: <strong className="text-white">{solicitud.wifi_ssid_preferido || "Starlink"}</strong>
                      {solicitud.wifi_password_preferido && (
                        <span className="ml-2 text-cyan-300">
                          | Clave: <strong>{solicitud.wifi_password_preferido}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                  {solicitud.wifi_password_preferido && (
                    <button
                      onClick={() => handleCopiar(solicitud.wifi_password_preferido!, "wifi_pass")}
                      className="px-2.5 py-1.5 bg-[var(--ts-surface)] border border-[var(--ts-border)] hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      {copiado === "wifi_pass" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiado === "wifi_pass" ? "Copiado" : "Copiar Clave"}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Fotos de Cédula (Visor) */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-[var(--ts-text-muted)] block uppercase mb-2">
                Fotos de Cédula Adjuntas
              </span>
              <div className="grid grid-cols-2 gap-3">
                {/* Frontal */}
                <div className="space-y-1">
                  <span className="text-[10px] text-[var(--ts-text-muted)]">Cara Frontal:</span>
                  {solicitud.cedula_frontal_url ? (
                    <div
                      onClick={() => setFotoZoom(solicitud.cedula_frontal_url!)}
                      className="aspect-[3/2] rounded-xl overflow-hidden border border-[var(--ts-border)] cursor-pointer hover:border-[var(--ts-red)] transition-all relative group bg-black"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={solicitud.cedula_frontal_url} alt="Frontal" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                        Click para ampliar 🔍
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/2] rounded-xl border border-dashed border-[var(--ts-border)] flex items-center justify-center text-[10px] text-[var(--ts-text-muted)]">
                      Sin foto frontal
                    </div>
                  )}
                </div>

                {/* Trasera */}
                <div className="space-y-1">
                  <span className="text-[10px] text-[var(--ts-text-muted)]">Cara Trasera:</span>
                  {solicitud.cedula_trasera_url ? (
                    <div
                      onClick={() => setFotoZoom(solicitud.cedula_trasera_url!)}
                      className="aspect-[3/2] rounded-xl overflow-hidden border border-[var(--ts-border)] cursor-pointer hover:border-[var(--ts-red)] transition-all relative group bg-black"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={solicitud.cedula_trasera_url} alt="Trasera" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                        Click para ampliar 🔍
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/2] rounded-xl border border-dashed border-[var(--ts-border)] flex items-center justify-center text-[10px] text-[var(--ts-text-muted)]">
                      Sin foto trasera
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── PANEL DERECHO: ASIGNACIÓN TECNOSMART & ACTIVACIÓN ── */}
          <div className="space-y-4 bg-[var(--ts-surface-2)]/40 p-5 rounded-2xl border border-[var(--ts-border)] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="pb-2 border-b border-[var(--ts-border)]">
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--ts-text-primary)] flex items-center gap-1.5">
                  <Satellite className="w-4 h-4 text-emerald-400" /> 2. Asignar Hardware y Credenciales Starlink
                </h3>
                <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">
                  Rellena los datos de la antena que acabas de activar en Starlink.com
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Correo y Clave de la Cuenta Starlink */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                      Correo Cuenta Starlink *
                    </label>
                    <input
                      type="text"
                      name="starlink_cloudflare_alias_email"
                      id="starlink_cloudflare_alias_email"
                      autoComplete="off"
                      data-lpignore="true"
                      data-form-type="other"
                      required
                      placeholder="ej. cliente@somostecnosmart.com"
                      value={correoStarlink}
                      onChange={(e) => setCorreoStarlink(e.target.value)}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs font-mono text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                    />

                    {/* Selector Asistido desde el Pool de Cloudflare */}
                    {poolDisponibles.length > 0 ? (
                      <div className="mt-1.5 p-2 bg-blue-500/10 border border-blue-500/25 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] text-blue-300 truncate flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-blue-400 shrink-0" />
                            Siguiente libre: <strong className="font-mono text-white">{poolDisponibles[0].email}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setCorreoStarlink(poolDisponibles[0].email)}
                            className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[10px] font-bold shrink-0 transition-colors shadow-xs"
                          >
                            Usar este
                          </button>
                        </div>

                        {poolDisponibles.length > 1 && (
                          <div className="relative">
                            <select
                              onChange={(e) => {
                                if (e.target.value) setCorreoStarlink(e.target.value);
                              }}
                              defaultValue=""
                              className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] text-[11px] text-[var(--ts-text-muted)] focus:text-white rounded-lg px-2 py-1 appearance-none cursor-pointer focus:outline-none"
                            >
                              <option value="" disabled>
                                O elegir otro del Pool ({poolDisponibles.length} libres)...
                              </option>
                              {poolDisponibles.map((p) => (
                                <option key={p.id} value={p.email} className="bg-[#18181b] text-white font-mono">
                                  {p.email}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-[var(--ts-text-muted)] mt-0.5 block">
                        Alias Cloudflare que creaste para este cliente
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                      Contraseña Cuenta Starlink
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarClaveStarlink ? "text" : "password"}
                        name="starlink_cloudflare_alias_pass"
                        id="starlink_cloudflare_alias_pass"
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-form-type="other"
                        placeholder="Contraseña de la cuenta"
                        value={claveStarlink}
                        onChange={(e) => setClaveStarlink(e.target.value)}
                        className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 pr-8 text-xs font-mono text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarClaveStarlink(!mostrarClaveStarlink)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--ts-text-muted)]"
                      >
                        {mostrarClaveStarlink ? "👁️" : "🙈"}
                      </button>
                    </div>
                    <span className="text-[10px] text-[var(--ts-text-muted)] mt-0.5 block">
                      Clave registrada en Starlink.com
                    </span>
                  </div>
                </div>

                {/* Serial del KIT */}
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                    Serial del KIT / Antena Starlink *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: KIT4M070688358RG"
                    value={kitSerial}
                    onChange={(e) => setKitSerial(e.target.value)}
                    className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs font-mono text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                  />
                </div>

                {/* WiFi SSID & Clave */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                      Red WiFi (SSID)
                    </label>
                    <input
                      type="text"
                      placeholder="Starlink-Cliente"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs font-mono text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                      Clave de la Red WiFi
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarClaveWifi ? "text" : "password"}
                        placeholder="••••••••"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 pr-8 text-xs font-mono text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarClaveWifi(!mostrarClaveWifi)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--ts-text-muted)]"
                      >
                        {mostrarClaveWifi ? "👁️" : "🙈"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Día de Corte y Toggle VIP */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                      Día de Corte Mensual (1-31)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={diaCorte}
                      onChange={(e) => setDiaCorte(Number(e.target.value))}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="w-full flex items-center gap-2 p-2.5 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={esVip}
                        onChange={(e) => setEsVip(e.target.checked)}
                        className="w-4 h-4 text-amber-500 rounded"
                      />
                      <span className="text-xs font-bold text-[var(--ts-text-primary)] flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-amber-400" /> Cliente VIP ($0 Soporte)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Resumen Financiero */}
                <div className="p-3 bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--ts-text-muted)] block font-bold uppercase">Plan Seleccionado</span>
                    <span className="font-bold text-[var(--ts-text-primary)]">{planNombre}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--ts-text-muted)] block font-bold uppercase">Total Mensual</span>
                    <span className="text-base font-black text-emerald-400 font-mono">{formatUSD(montoTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de Confirmación Definitiva */}
            <div className="pt-4 border-t border-[var(--ts-border)]">
              <button
                type="button"
                onClick={handleConfirmarActivacion}
                disabled={activando}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Satellite className={`w-4 h-4 ${activando ? "animate-spin" : ""}`} />
                <span>
                  {activando
                    ? "Generando cliente y Ficha PDF..."
                    : "✅ Confirmar Activación y Descargar Ficha PDF"}
                </span>
              </button>
              <p className="text-[10px] text-[var(--ts-text-muted)] text-center mt-2">
                Crea al cliente en el CRM, agrega la antena a la flota activa y emite la Ficha de Entrega al instante.
              </p>
            </div>
          </div>
        </div>

        {/* Modal de Zoom para fotos de cédula */}
        {fotoZoom && (
          <div
            className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setFotoZoom(null)}
          >
            <div className="max-w-3xl max-h-[90vh] relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fotoZoom} alt="Zoom Cédula" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
              <p className="text-center text-xs text-slate-400 mt-2">Click en cualquier lugar para cerrar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
