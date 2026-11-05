"use client";

import { useState } from "react";
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
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatUSD } from "@/lib/utils";
import type { SolicitudStarlink } from "@/lib/types";
import { packStarlinkData, StarlinkMetadata } from "@/lib/types";
import { exportarStarlinkFichaPDF } from "@/components/pdf/StarlinkFichaPDF";
import { actualizarEstadoSolicitud } from "@/lib/starlinkSolicitudes";
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

  // Inicializar campos cuando se abre una solicitud
  useState(() => {
    if (solicitud) {
      setWifiSsid(solicitud.wifi_ssid_preferido || `Starlink-${solicitud.nombre_completo.split(" ")[0]}`);
      setWifiPassword(solicitud.wifi_password_preferido || "Tecno2026*");
    }
  });

  if (!isOpen || !solicitud) return null;

  const handleCopiar = (texto: string, clave: string) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    setCopiado(clave);
    setTimeout(() => setCopiado(null), 2000);
  };

  // Calcular montos según el plan
  const planNombre = solicitud.plan_deseado || "Starlink Residencial";
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

      // Buscar si ya existe por RIF o Cédula
      const { data: existente } = await supabase
        .from("clientes")
        .select("id")
        .eq("rif_cedula", solicitud.cedula_rif)
        .limit(1);

      if (existente && existente.length > 0) {
        clienteId = existente[0].id;
        // Actualizar datos de contacto y dirección
        await supabase
          .from("clientes")
          .update({
            contacto: solicitud.nombre_completo,
            telefono: solicitud.telefono,
            email: solicitud.email || undefined,
            direccion: solicitud.direccion,
            tipo: "cliente_normal",
          })
          .eq("id", clienteId);
      } else {
        // Crear nuevo cliente
        const { data: nuevoCliente, error: errCli } = await supabase
          .from("clientes")
          .insert([
            {
              contacto: solicitud.nombre_completo,
              empresa: solicitud.nombre_completo,
              rif_cedula: solicitud.cedula_rif,
              telefono: solicitud.telefono,
              email: solicitud.email || null,
              direccion: solicitud.direccion,
              tipo: "cliente_normal",
              notas: `Cliente activado vía Onboarding Starlink. Tel: ${solicitud.telefono}`,
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
        direccion_instalacion: solicitud.direccion,
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

      // 5. Marcar solicitud como 'activada'
      if (solicitud.id) {
        await actualizarEstadoSolicitud(solicitud.id, "activada");
      }

      // 6. Generar y descargar inmediatamente la Ficha PDF formal para el cliente
      await exportarStarlinkFichaPDF({
        clienteNombre: solicitud.nombre_completo,
        clienteTelefono: solicitud.telefono,
        clienteEmail: solicitud.email,
        clienteRif: solicitud.cedula_rif,
        direccionInstalacion: solicitud.direccion,
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
              <span className="text-[10px] text-slate-400">Toca el botón para copiar</span>
            </div>

            {/* Tarjetas de copiado rápido */}
            <div className="space-y-2.5 text-xs">
              {/* Nombre */}
              <div className="p-3 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[var(--ts-text-muted)] block uppercase font-bold">Nombre del Titular</span>
                  <span className="font-bold text-[var(--ts-text-primary)] text-sm">{solicitud.nombre_completo}</span>
                </div>
                <button
                  onClick={() => handleCopiar(solicitud.nombre_completo, "nombre")}
                  className="px-2.5 py-1.5 bg-[var(--ts-surface)] border border-[var(--ts-border)] hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                >
                  {copiado === "nombre" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiado === "nombre" ? "Copiado" : "Copiar"}</span>
                </button>
              </div>

              {/* Cédula */}
              <div className="p-3 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[var(--ts-text-muted)] block uppercase font-bold">Cédula / Documento</span>
                  <span className="font-mono font-bold text-[var(--ts-text-primary)] text-sm">{solicitud.cedula_rif}</span>
                </div>
                <button
                  onClick={() => handleCopiar(solicitud.cedula_rif, "cedula")}
                  className="px-2.5 py-1.5 bg-[var(--ts-surface)] border border-[var(--ts-border)] hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                >
                  {copiado === "cedula" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiado === "cedula" ? "Copiado" : "Copiar"}</span>
                </button>
              </div>

              {/* Teléfono */}
              <div className="p-3 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[var(--ts-text-muted)] block uppercase font-bold">Teléfono WhatsApp</span>
                  <span className="font-mono font-bold text-[var(--ts-text-primary)]">{solicitud.telefono}</span>
                </div>
                <button
                  onClick={() => handleCopiar(solicitud.telefono, "telefono")}
                  className="px-2.5 py-1.5 bg-[var(--ts-surface)] border border-[var(--ts-border)] hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                >
                  {copiado === "telefono" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiado === "telefono" ? "Copiado" : "Copiar"}</span>
                </button>
              </div>

              {/* Dirección */}
              <div className="p-3 bg-[var(--ts-surface-2)] border border-[var(--ts-border)] rounded-xl flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] text-[var(--ts-text-muted)] block uppercase font-bold">Dirección de Instalación</span>
                  <p className="text-[var(--ts-text-primary)] text-xs mt-0.5 leading-relaxed">{solicitud.direccion}</p>
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
                </div>
                <button
                  onClick={() => handleCopiar(solicitud.direccion, "direccion")}
                  className="px-2.5 py-1.5 bg-[var(--ts-surface)] border border-[var(--ts-border)] hover:bg-[var(--ts-surface-2)] text-[var(--ts-text-primary)] rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0"
                >
                  {copiado === "direccion" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiado === "direccion" ? "Copiado" : "Copiar"}</span>
                </button>
              </div>
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
                      type="email"
                      required
                      placeholder="starlink.410@somostecnosmart.com"
                      value={correoStarlink}
                      onChange={(e) => setCorreoStarlink(e.target.value)}
                      className="w-full bg-[var(--ts-surface)] border border-[var(--ts-border)] rounded-xl px-3.5 py-2 text-xs font-mono text-[var(--ts-text-primary)] focus:outline-none focus:border-[var(--ts-red)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ts-text-muted)] mb-1">
                      Contraseña Cuenta Starlink
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarClaveStarlink ? "text" : "password"}
                        placeholder="Contraseña"
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
