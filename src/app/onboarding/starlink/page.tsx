"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Satellite,
  Wifi,
  ShieldCheck,
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Send,
  Lock,
  Phone,
  Mail,
  User,
  FileText,
  Sparkles,
  ArrowRight,
  Upload,
} from "lucide-react";
import { guardarSolicitudStarlink } from "@/lib/starlinkSolicitudes";

const PLANES = [
  {
    id: "residencial",
    nombre: "Starlink Residencial",
    precio: "$50",
    periodo: "mes",
    badge: "Más Popular",
    desc: "Internet de alta velocidad para hogares, fincas, haciendas y comercios fijos.",
  },
  {
    id: "itinerante_100gb",
    nombre: "Starlink Itinerante 100GB",
    precio: "$70",
    periodo: "mes",
    badge: "Portátil",
    desc: "Ideal para camionetas, viajes, botes o ubicaciones temporales (100GB de alta velocidad).",
  },
  {
    id: "itinerante_ilimitado",
    nombre: "Starlink Itinerante Ilimitado",
    precio: "$120",
    periodo: "mes",
    badge: "Movilidad Total",
    desc: "Datos ilimitados para trabajo continuo en movimiento o zonas rurales remotas.",
  },
];

// Comprimir imagen a base64 ligero antes de enviar
async function comprimirImagen(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Calidad media para no saturar memoria ni red (aprox 150KB - 250KB)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export default function StarlinkOnboardingPage() {
  // Datos del formulario
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [cedulaRif, setCedulaRif] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");
  const [coordenadasGps, setCoordenadasGps] = useState("");
  const [obteniendoGps, setObteniendoGps] = useState(false);
  const [planDeseado, setPlanDeseado] = useState(PLANES[0].nombre);
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [notas, setNotas] = useState("");

  // Fotos de cédula
  const [fotoFrontal, setFotoFrontal] = useState<string | null>(null);
  const [fotoTrasera, setFotoTrasera] = useState<string | null>(null);
  const [procesandoFoto, setProcesandoFoto] = useState(false);

  // Estados de envío
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [enviadoExitoso, setEnviadoExitoso] = useState(false);

  // Capturar coordenadas GPS del teléfono
  const capturarGps = () => {
    if (!navigator.geolocation) {
      alert("Tu dispositivo no soporta geolocalización.");
      return;
    }
    setObteniendoGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
        setCoordenadasGps(coords);
        setObteniendoGps(false);
      },
      (error) => {
        console.error("Error GPS:", error);
        alert("No se pudo obtener la ubicación GPS. Por favor escribe tu dirección detallada.");
        setObteniendoGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Manejar subida de foto frontal
  const handleFotoFrontal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setProcesandoFoto(true);
      const b64 = await comprimirImagen(file);
      setFotoFrontal(b64);
    } catch (err) {
      console.error(err);
      alert("Error al procesar la imagen frontal. Intenta con otra foto.");
    } finally {
      setProcesandoFoto(false);
    }
  };

  // Manejar subida de foto trasera
  const handleFotoTrasera = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setProcesandoFoto(true);
      const b64 = await comprimirImagen(file);
      setFotoTrasera(b64);
    } catch (err) {
      console.error(err);
      alert("Error al procesar la imagen trasera. Intenta con otra foto.");
    } finally {
      setProcesandoFoto(false);
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto.trim() || !cedulaRif.trim() || !telefono.trim() || !direccion.trim()) {
      setErrorMsg("Por favor completa los campos obligatorios (*).");
      return;
    }

    setEnviando(true);
    setErrorMsg(null);

    const res = await guardarSolicitudStarlink({
      nombre_completo: nombreCompleto.trim(),
      cedula_rif: cedulaRif.trim(),
      telefono: telefono.trim(),
      email: email.trim() || undefined,
      direccion: direccion.trim(),
      coordenadas_gps: coordenadasGps || undefined,
      plan_deseado: planDeseado,
      wifi_ssid_preferido: wifiSsid.trim() || undefined,
      wifi_password_preferido: wifiPassword.trim() || undefined,
      cedula_frontal_url: fotoFrontal || undefined,
      cedula_trasera_url: fotoTrasera || undefined,
      notas: notas.trim() || undefined,
      estado: "pendiente",
      origen: "web_cliente",
    });

    setEnviando(false);

    if (res.success) {
      setEnviadoExitoso(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setErrorMsg(res.error || "Ocurrió un error al enviar tus datos. Por favor inténtalo de nuevo.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── HEADER CORPORATIVO ── */}
        <div className="text-center space-y-3 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
          <div className="inline-flex items-center gap-2 bg-[#c9242b]/15 border border-[#c9242b]/30 px-3 py-1 rounded-full text-[#ff4d4d] text-xs font-black tracking-wider uppercase">
            <Satellite className="w-3.5 h-3.5" />
            <span>TecnoSmart VZL C.A.</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Activación de Internet Starlink
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Por favor completa este formulario con los datos del titular para registrar y activar oficialmente tu antena satelital.
          </p>

          <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
            <Lock className="w-3 h-3" />
            <span>Tus datos y documentos están protegidos con cifrado de seguridad</span>
          </div>
        </div>

        {/* ── PANTALLA DE ÉXITO ── */}
        {enviadoExitoso ? (
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-5 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                ¡Solicitud Recibida con Éxito!
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Muchas gracias, <strong className="text-white">{nombreCompleto}</strong>. Tus datos han sido registrados en nuestro sistema de activación.
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto pt-2">
                Nuestro equipo técnico en Tinaquillo procederá a verificar tu antena y te contactaremos por WhatsApp ({telefono}) para entregarte la Ficha Técnica oficial con tus credenciales y acceso WiFi.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`https://wa.me/584122789273?text=${encodeURIComponent(
                  `Hola TecnoSmart VZL, acabo de enviar mi formulario de activación Starlink a nombre de *${nombreCompleto}* (C.I. ${cedulaRif}). Quedo atento a la confirmación.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <span>Avisar por WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        ) : (
          /* ── FORMULARIO PRINCIPAL ── */
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ── PASO 1: DATOS DEL TITULAR ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <User className="w-4 h-4 text-[#c9242b]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  1. Datos del Titular del Servicio
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nombre y Apellido Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Carlos Mendoza o Agropecuaria El Roble C.A."
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9242b] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Cédula de Identidad o RIF *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: V-20.123.456 o J-12345678-0"
                    value={cedulaRif}
                    onChange={(e) => setCedulaRif(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9242b] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Teléfono con WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 0414-1234567"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9242b] transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Correo Electrónico Personal (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="ejemplo@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9242b] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* ── PASO 2: FOTOS DE LA CÉDULA (KYC) ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  2. Documento de Identidad (Cédula de Identidad)
                </h3>
              </div>

              {/* Alerta de legibilidad */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 space-y-1">
                  <p className="font-bold text-amber-300">Requisito obligatorio de Starlink:</p>
                  <p className="text-[11px] leading-relaxed">
                    Puedes <strong>tomar la foto directamente</strong> con tu cámara o <strong>subir una imagen</strong> desde tu galería. Asegúrate de que la foto tenga buena luz, sin reflejos ni sombras, y que el número de cédula y los 4 bordes sean 100% legibles.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Foto Frontal */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Cédula — Cara Frontal (Delantera) *
                  </label>
                  {fotoFrontal ? (
                    <div className="relative border border-emerald-500/40 rounded-2xl overflow-hidden bg-slate-950 aspect-[3/2] flex items-center justify-center group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={fotoFrontal} alt="Cédula Frontal" className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => setFotoFrontal(null)}
                        className="absolute bottom-2 right-2 px-2.5 py-1 bg-red-600/90 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg shadow"
                      >
                        Cambiar foto
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-700 hover:border-[#c9242b] rounded-2xl aspect-[3/2] flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors bg-slate-950/60 hover:bg-slate-950">
                      <Camera className="w-8 h-8 text-slate-500 mb-2" />
                      <span className="text-xs font-bold text-slate-200">Tomar foto o subir frontal</span>
                      <span className="text-[10px] text-slate-500 mt-1">Cámara o archivo de galería</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFotoFrontal}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Foto Trasera */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Cédula — Cara Trasera (Reverso) *
                  </label>
                  {fotoTrasera ? (
                    <div className="relative border border-emerald-500/40 rounded-2xl overflow-hidden bg-slate-950 aspect-[3/2] flex items-center justify-center group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={fotoTrasera} alt="Cédula Trasera" className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => setFotoTrasera(null)}
                        className="absolute bottom-2 right-2 px-2.5 py-1 bg-red-600/90 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg shadow"
                      >
                        Cambiar foto
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-700 hover:border-[#c9242b] rounded-2xl aspect-[3/2] flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors bg-slate-950/60 hover:bg-slate-950">
                      <Upload className="w-8 h-8 text-slate-500 mb-2" />
                      <span className="text-xs font-bold text-slate-200">Tomar foto o subir reverso</span>
                      <span className="text-[10px] text-slate-500 mt-1">Cámara o archivo de galería</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFotoTrasera}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* ── PASO 3: UBICACIÓN DE INSTALACIÓN ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    3. Ubicación de Instalación
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={capturarGps}
                  disabled={obteniendoGps}
                  className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <MapPin className={`w-3.5 h-3.5 ${obteniendoGps ? "animate-spin" : ""}`} />
                  <span>{obteniendoGps ? "Localizando..." : "📍 Detectar mi GPS"}</span>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Dirección Exacta / Punto de Referencia *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Ej: Sector Centro, Calle Bolívar c/ Av. Miranda, Casa #12-A, Tinaquillo, Cojedes"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9242b] transition-colors resize-none"
                  />
                </div>

                {coordenadasGps && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                    <span className="font-mono">Coordenadas GPS: {coordenadasGps}</span>
                    <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-bold">Capturado ✓</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── PASO 4: PLAN STARLINK ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Satellite className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  4. Selecciona tu Plan Starlink
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {PLANES.map((plan) => {
                  const isSelected = planDeseado === plan.nombre;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setPlanDeseado(plan.nombre)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-4 ${
                        isSelected
                          ? "bg-slate-950 border-[#c9242b] shadow-md ring-1 ring-[#c9242b]"
                          : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-white">{plan.nombre}</span>
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#c9242b]/20 text-[#ff6666] border border-[#c9242b]/30">
                            {plan.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{plan.desc}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-lg font-black text-emerald-400">{plan.precio}</div>
                        <span className="text-[10px] text-slate-500">/ {plan.periodo}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── PASO 5: RED WIFI PREFERIDA ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Wifi className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  5. Configuración de tu Red WiFi (Opcional)
                </h3>
              </div>

              <p className="text-xs text-slate-400">
                Puedes indicarnos cómo te gustaría que se llame tu red WiFi y qué contraseña deseas para que te entreguemos el equipo listo para conectar.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nombre deseado para tu WiFi (SSID)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: MiWiFi-Casa o Starlink-Familia"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9242b] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Contraseña sugerida para tu WiFi
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Tecno2026* (mínimo 8 caracteres)"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9242b] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Observaciones adicionales (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Requerimos instalación sobre mástil alto en el galpón..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#c9242b] transition-colors"
                />
              </div>
            </div>

            {/* ── BOTÓN DE ENVÍO FINAL ── */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={enviando || procesandoFoto}
                className="w-full py-4 bg-[#c9242b] hover:bg-red-700 disabled:bg-slate-800 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Send className={`w-4 h-4 ${enviando ? "animate-spin" : ""}`} />
                <span>
                  {enviando
                    ? "Enviando y protegiendo tus datos..."
                    : "🚀 Enviar Solicitud de Activación"}
                </span>
              </button>

              <p className="text-center text-[11px] text-slate-500 mt-3">
                Al enviar aceptas que TecnoSmart VZL C.A. gestione la activación oficial de tu antena Starlink.
              </p>
            </div>
          </form>
        )}

        {/* ── FOOTER INSTITUCIONAL ── */}
        <div className="text-center text-xs text-slate-600 pt-6 pb-4 border-t border-slate-900 space-y-1">
          <p className="font-bold text-slate-400">TECNO SMART VZL C.A. · RIF: J-50701960-8</p>
          <p>Tienda Especializada · Tinaquillo, Estado Cojedes, Venezuela</p>
          <p className="text-[10px]">Telf: 0412-2789273 / 0414-4141887 · Instagram: @tecnosmartvzl</p>
        </div>

      </div>
    </div>
  );
}
