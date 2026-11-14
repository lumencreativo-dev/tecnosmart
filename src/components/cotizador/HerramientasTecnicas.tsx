// ─────────────────────────────────────────────────────────────────────────────
// src/components/cotizador/HerramientasTecnicas.tsx
// Centro de Herramientas de Cálculo y Utilidades de Campo para CCTV y Seguridad
// Cumple con la directiva estricta de UI/UX Móvil TecnoSmart VZL (#c9242b)
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useMemo } from "react";
import {
  Calculator, HardDrive, Zap, Eye, BatteryCharging,
  Network, Copy, Check, Info, AlertTriangle, CheckCircle2,
  Sliders, ShieldCheck, ArrowRight, Share2, Sparkles, RefreshCw
} from "lucide-react";

type TabHerramienta = "lente_dori" | "almacenamiento" | "voltaje" | "poe" | "baterias" | "redes";

export default function HerramientasTecnicas() {
  const [tabActiva, setTabActiva] = useState<TabHerramienta>("lente_dori");
  const [copiado, setCopiado] = useState(false);

  const copiarAlPortapapeles = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto pb-28 pt-2 px-3 sm:px-4 text-white">
      {/* Cabecera del Módulo */}
      <div className="flex items-center justify-between gap-3 mb-4 bg-gradient-to-r from-[#16161f] to-[#131318] p-4 rounded-2xl border border-[#22222c] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[rgba(201,36,43,0.15)] border border-[rgba(201,36,43,0.3)] flex items-center justify-center text-[#c9242b]">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">Cálculos Técnicos</h1>
            <p className="text-xs text-[#a5a5b2]">Utilidades de ingeniería y campo CCTV / Seguridad</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#c9242b]/20 text-[#c9242b] border border-[#c9242b]/30">
          PRO FIELD
        </span>
      </div>

      {/* Selector de Herramientas (Scroll Horizontal Táctil) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar -mx-3 px-3">
        {[
          { id: "lente_dori", label: "Lente & DORI", icon: Eye },
          { id: "almacenamiento", label: "Disco & Días", icon: HardDrive },
          { id: "voltaje", label: "Caída Voltaje", icon: Zap },
          { id: "poe", label: "Potencia PoE", icon: Sliders },
          { id: "baterias", label: "Baterías / UPS", icon: BatteryCharging },
          { id: "redes", label: "RJ45 & Puertos", icon: Network },
        ].map((item) => {
          const Icon = item.icon;
          const activa = tabActiva === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTabActiva(item.id as TabHerramienta)}
              className={`flex items-center gap-2 px-4 h-12 rounded-xl text-xs font-semibold shrink-0 transition-all active:scale-95 ${
                activa
                  ? "bg-[#c9242b] text-white shadow-lg shadow-[#c9242b]/30"
                  : "bg-[#16161f] text-[#a5a5b2] border border-[#22222c] hover:border-[#333342] hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido según herramienta seleccionada */}
      {tabActiva === "lente_dori" && <CalculadoraLenteDORI onCopiar={copiarAlPortapapeles} copiado={copiado} />}
      {tabActiva === "almacenamiento" && <CalculadoraAlmacenamiento onCopiar={copiarAlPortapapeles} copiado={copiado} />}
      {tabActiva === "voltaje" && <CalculadoraCaidaVoltaje onCopiar={copiarAlPortapapeles} copiado={copiado} />}
      {tabActiva === "poe" && <CalculadoraPoE onCopiar={copiarAlPortapapeles} copiado={copiado} />}
      {tabActiva === "baterias" && <CalculadoraBaterias onCopiar={copiarAlPortapapeles} copiado={copiado} />}
      {tabActiva === "redes" && <GuiaRedesCCTV onCopiar={copiarAlPortapapeles} copiado={copiado} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CALCULADORA DE LENTES Y ESTÁNDAR DORI (EN 62676-4)
// ─────────────────────────────────────────────────────────────────────────────
function CalculadoraLenteDORI({ onCopiar, copiado }: { onCopiar: (t: string) => void; copiado: boolean }) {
  const [distancia, setDistancia] = useState<number>(10); // metros al objetivo
  const [anchoEscena, setAnchoEscena] = useState<number>(8); // metros de ancho requerido
  const [sensor, setSensor] = useState<number>(4.8); // 1/2.8" sensor width aprox 4.8mm
  const [sensorLabel, setSensorLabel] = useState<string>("1/2.8\" (Común en IP/TVI)");
  const [resolucionMP, setResolucionMP] = useState<number>(4); // 2MP, 4MP, 8MP (4K)

  // Distancia focal necesaria = (Distancia * Ancho_Sensor) / Ancho_Escena
  const focalCalculada = useMemo(() => {
    if (anchoEscena <= 0) return 2.8;
    const f = (distancia * sensor) / anchoEscena;
    return parseFloat(f.toFixed(2));
  }, [distancia, anchoEscena, sensor]);

  // Selección de lente comercial más cercana
  const lenteComercial = useMemo(() => {
    const comerciales = [2.8, 3.6, 4.0, 6.0, 8.0, 12.0, 16.0];
    let masCercano = comerciales[0];
    let difMin = Math.abs(focalCalculada - masCercano);
    for (const l of comerciales) {
      const dif = Math.abs(focalCalculada - l);
      if (dif < difMin) {
        difMin = dif;
        masCercano = l;
      }
    }
    return masCercano;
  }, [focalCalculada]);

  // Cálculo DORI (EN 62676-4) para el lente seleccionado y resolución
  // Resolución horizontal en pixeles según MP: 2MP=1920, 4MP=2560, 5MP=2960, 8MP(4K)=3840
  const dori = useMemo(() => {
    let pxH = 2560; // default 4MP
    if (resolucionMP === 2) pxH = 1920;
    if (resolucionMP === 5) pxH = 2960;
    if (resolucionMP === 8) pxH = 3840;

    // Con el lente comercial, el ángulo de visión horizontal y FOV a distancia
    // Ancho real cubierto a la distancia seleccionada: Ancho = (distancia * sensor) / lenteComercial
    const anchoReal = (distancia * sensor) / lenteComercial;
    const pxPorMetro = pxH / Math.max(anchoReal, 0.5);

    // Distancias máximas según norma EN 62676-4:
    // Detección: 25 px/m -> DistanciaMax = (pxH * lenteComercial) / (25 * sensor)
    const distDeteccion = (pxH * lenteComercial) / (25 * sensor);
    const distObservacion = (pxH * lenteComercial) / (62.5 * sensor);
    const distReconocimiento = (pxH * lenteComercial) / (125 * sensor);
    const distIdentificacion = (pxH * lenteComercial) / (250 * sensor);

    return {
      pxPorMetro: Math.round(pxPorMetro),
      anchoReal: anchoReal.toFixed(1),
      distDeteccion: Math.round(distDeteccion),
      distObservacion: Math.round(distObservacion),
      distReconocimiento: Math.round(distReconocimiento),
      distIdentificacion: Math.round(distIdentificacion),
    };
  }, [lenteComercial, sensor, distancia, resolucionMP]);

  const textoResumen = `Cálculo CCTV DORI (TecnoSmart VZL):
- Distancia al Objetivo: ${distancia} m
- Ancho de Escena Deseado: ${anchoEscena} m
- Sensor: ${sensorLabel} (${resolucionMP} Megapíxeles)
- Lente Calculado: ${focalCalculada} mm -> Lente Comercial Sugerido: ${lenteComercial} mm
- Alcance DORI (Norma EN 62676-4):
  * Detección (25 px/m): hasta ${dori.distDeteccion} m
  * Observación (62 px/m): hasta ${dori.distObservacion} m
  * Reconocimiento (125 px/m): hasta ${dori.distReconocimiento} m
  * Identificación Rostro (250 px/m): hasta ${dori.distIdentificacion} m`;

  return (
    <div className="space-y-4">
      {/* Tarjeta de Entrada de Parámetros */}
      <div className="bg-[#131318] p-4 rounded-2xl border border-[#22222c] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#c9242b]" /> Dimensionamiento de Lente
          </h2>
          <span className="text-[11px] text-[#a5a5b2]">Norma EN 62676-4</span>
        </div>

        {/* Distancia y Ancho de Escena */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#a5a5b2] block mb-1">
              Distancia al Objetivo (m)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="150"
                value={distancia}
                onChange={(e) => setDistancia(Math.max(1, Number(e.target.value)))}
                className="w-full h-12 bg-[#0e0e12] border border-[#22222c] focus:border-[#c9242b] rounded-xl px-3 text-sm text-white font-mono outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#a5a5b2] block mb-1">
              Ancho de Escena (m)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={anchoEscena}
              onChange={(e) => setAnchoEscena(Math.max(1, Number(e.target.value)))}
              className="w-full h-12 bg-[#0e0e12] border border-[#22222c] focus:border-[#c9242b] rounded-xl px-3 text-sm text-white font-mono outline-none"
            />
          </div>
        </div>

        {/* Resolución y Sensor */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#a5a5b2] block mb-1">Resolución Cámara</label>
            <select
              value={resolucionMP}
              onChange={(e) => setResolucionMP(Number(e.target.value))}
              className="w-full h-12 bg-[#0e0e12] border border-[#22222c] focus:border-[#c9242b] rounded-xl px-3 text-xs text-white outline-none"
            >
              <option value={2}>2 MP (1080p Full HD)</option>
              <option value={4}>4 MP (2K QHD - Recomendado)</option>
              <option value={5}>5 MP (Ultra)</option>
              <option value={8}>8 MP (4K Ultra HD)</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#a5a5b2] block mb-1">Tamaño Sensor Óptico</label>
            <select
              value={sensor}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSensor(val);
                setSensorLabel(val === 4.8 ? "1/2.8\"" : val === 3.6 ? "1/3\"" : "1/1.8\" (ColorVu/DarkFighter)");
              }}
              className="w-full h-12 bg-[#0e0e12] border border-[#22222c] focus:border-[#c9242b] rounded-xl px-3 text-xs text-white outline-none"
            >
              <option value={4.8}>1/2.8" (Estándar Hikvision/Dahua)</option>
              <option value={3.6}>1/3" (Económico)</option>
              <option value={7.1}>1/1.8" (ColorVu / Full Color 4K)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tarjeta de Resultados */}
      <div className="bg-gradient-to-br from-[#1c1c24] to-[#131318] p-5 rounded-2xl border border-[rgba(201,36,43,0.3)] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#c9242b] uppercase tracking-wider">
            Recomendación Óptica
          </span>
          <button
            onClick={() => onCopiar(textoResumen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#22222c] hover:bg-[#2a2a36] text-white active:scale-95 transition-all"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiado ? "Copiado" : "Copiar"}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0e0e12]/80 p-3.5 rounded-xl border border-[#22222c]">
            <span className="text-[10px] text-[#a5a5b2] block mb-0.5">Lente Exacto Teórico</span>
            <div className="text-2xl font-black text-white font-mono">{focalCalculada} <span className="text-sm font-normal text-[#a5a5b2]">mm</span></div>
          </div>
          <div className="bg-[#c9242b]/15 p-3.5 rounded-xl border border-[#c9242b]/30">
            <span className="text-[10px] text-red-200 block mb-0.5 font-bold">Lente Comercial Sugerido</span>
            <div className="text-2xl font-black text-[#c9242b] font-mono">{lenteComercial} <span className="text-sm font-normal text-white">mm</span></div>
          </div>
        </div>

        {/* Tabla DORI */}
        <div className="space-y-2 pt-2 border-t border-[#22222c]">
          <span className="text-[11px] font-bold text-[#a5a5b2] block">Alcances DORI (con lente {lenteComercial}mm a {resolucionMP}MP):</span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#0e0e12] p-2.5 rounded-xl border border-[#22222c]">
              <div className="flex items-center justify-between text-blue-400 font-bold mb-0.5">
                <span>Detección</span>
                <span className="font-mono text-white">{dori.distDeteccion} m</span>
              </div>
              <p className="text-[10px] text-[#6e6e78]">Presencia humana (25 px/m)</p>
            </div>
            <div className="bg-[#0e0e12] p-2.5 rounded-xl border border-[#22222c]">
              <div className="flex items-center justify-between text-yellow-400 font-bold mb-0.5">
                <span>Observación</span>
                <span className="font-mono text-white">{dori.distObservacion} m</span>
              </div>
              <p className="text-[10px] text-[#6e6e78]">Ropa y actividad (62 px/m)</p>
            </div>
            <div className="bg-[#0e0e12] p-2.5 rounded-xl border border-[#22222c]">
              <div className="flex items-center justify-between text-orange-400 font-bold mb-0.5">
                <span>Reconocimiento</span>
                <span className="font-mono text-white">{dori.distReconocimiento} m</span>
              </div>
              <p className="text-[10px] text-[#6e6e78]">Conocido o extraño (125 px/m)</p>
            </div>
            <div className="bg-[#0e0e12] p-2.5 rounded-xl border border-[#22222c]">
              <div className="flex items-center justify-between text-emerald-400 font-bold mb-0.5">
                <span>Identificación</span>
                <span className="font-mono text-white">{dori.distIdentificacion} m</span>
              </div>
              <p className="text-[10px] text-[#6e6e78]">Rostro nítido / Placas (250 px/m)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CALCULADORA DE ALMACENAMIENTO HDD Y ANCHO DE BANDA (STORAGE & BITRATE)
// ─────────────────────────────────────────────────────────────────────────────
function CalculadoraAlmacenamiento({ onCopiar, copiado }: { onCopiar: (t: string) => void; copiado: boolean }) {
  const [numCamaras, setNumCamaras] = useState<number>(4);
  const [resolucion, setResolucion] = useState<number>(4); // 2, 4, 8 MP
  const [codec, setCodec] = useState<string>("h265p"); // h264, h265, h265p (Hikvision H.265+ / Dahua Smart H.265+)
  const [fps, setFps] = useState<number>(20);
  const [diasGrabacion, setDiasGrabacion] = useState<number>(30);
  const [horasDia, setHorasDia] = useState<number>(24);
  const [modoGrabacion, setModoGrabacion] = useState<number>(0.4); // 1 = continuo 100%, 0.4 = movimiento 40%

  // Bitrates típicos recomendados por cámara (Kbps)
  const bitrateKbpsPorCamara = useMemo(() => {
    let base = 2048; // 2MP en H.264
    if (resolucion === 2) base = 2048;
    else if (resolucion === 4) base = 4096;
    else if (resolucion === 8) base = 8192;

    // Modificador por FPS (base 25fps)
    const factorFps = fps / 25;
    let b = base * factorFps;

    // Modificador por códec
    if (codec === "h264") b = b * 1.0;
    else if (codec === "h265") b = b * 0.55; // 45% de ahorro
    else if (codec === "h265p") b = b * 0.30; // 70% de ahorro con H.265+ / Smart

    return Math.round(b);
  }, [resolucion, codec, fps]);

  // Cálculo de GB y TB requeridos
  // GB = (BitrateKbps * 1000 / 8 bits / 1024^3 bytes) * 3600 seg * horas * dias * cámaras * ratioMovimiento
  const calculoDisco = useMemo(() => {
    const bytesPorSegundo = (bitrateKbpsPorCamara * 1000) / 8;
    const bytesPorDia = bytesPorSegundo * 3600 * horasDia * modoGrabacion;
    const gbPorCamaraDia = bytesPorDia / (1024 * 1024 * 1024);
    const totalGB = gbPorCamaraDia * numCamaras * diasGrabacion;
    const totalTB = totalGB / 1024;

    // Disco comercial recomendado (1TB, 2TB, 4TB, 6TB, 8TB, 10TB, 12TB, 16TB)
    const comercialesTB = [1, 2, 4, 6, 8, 10, 12, 16, 20];
    const tbRecomendado = comercialesTB.find((t) => t >= totalTB) || Math.ceil(totalTB);
    const anchoBandaMbpsTotal = ((bitrateKbpsPorCamara * numCamaras) / 1000).toFixed(1);

    return {
      bitratePorCamaraKbps: bitrateKbpsPorCamara,
      anchoBandaMbpsTotal,
      totalGB: Math.round(totalGB),
      totalTB: parseFloat(totalTB.toFixed(2)),
      tbRecomendado,
    };
  }, [bitrateKbpsPorCamara, horasDia, modoGrabacion, numCamaras, diasGrabacion]);

  const textoResumen = `Cálculo de Almacenamiento CCTV (TecnoSmart VZL):
- Cantidad de Cámaras: ${numCamaras} (${resolucion} MP @ ${fps} FPS)
- Compresión: ${codec.toUpperCase()} (${modoGrabacion === 1 ? "Continuo 24/7" : "Detección de Movimiento"})
- Tiempo de Retención: ${diasGrabacion} días (${horasDia} h/día)
- Ancho de Banda Total Requerido: ${calculoDisco.anchoBandaMbpsTotal} Mbps
- Capacidad Mínima Neta: ${calculoDisco.totalTB} TB
- Disco Duro Vigilancia Sugerido (WD Purple / SkyHawk): ${calculoDisco.tbRecomendado} TB`;

  return (
    <div className="space-y-4">
      <div className="bg-[#131318] p-4 rounded-2xl border border-[#22222c] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#c9242b]" /> Parámetros de Grabación
          </h2>
          <span className="text-[11px] text-[#a5a5b2]">WD Purple / SkyHawk</span>
        </div>

        {/* Cámaras y Días */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#a5a5b2] block mb-1">Número de Cámaras</label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setNumCamaras(Math.max(1, numCamaras - 1))}
                className="w-10 h-12 rounded-xl bg-[#0e0e12] border border-[#22222c] text-white font-bold active:scale-95"
              >-</button>
              <input
                type="number"
                min="1"
                max="64"
                value={numCamaras}
                onChange={(e) => setNumCamaras(Math.max(1, Number(e.target.value)))}
                className="w-full h-12 bg-[#0e0e12] border border-[#22222c] focus:border-[#c9242b] rounded-xl px-2 text-center text-sm text-white font-mono outline-none"
              />
              <button
                type="button"
                onClick={() => setNumCamaras(numCamaras + 1)}
                className="w-10 h-12 rounded-xl bg-[#0e0e12] border border-[#22222c] text-white font-bold active:scale-95"
              >+</button>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#a5a5b2] block mb-1">Días de Grabación Deseados</label>
            <input
              type="number"
              min="1"
              max="180"
              value={diasGrabacion}
              onChange={(e) => setDiasGrabacion(Math.max(1, Number(e.target.value)))}
              className="w-full h-12 bg-[#0e0e12] border border-[#22222c] focus:border-[#c9242b] rounded-xl px-3 text-sm text-white font-mono outline-none"
            />
          </div>
        </div>

        {/* Resolución y Códec */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#a5a5b2] block mb-1">Resolución</label>
            <select
              value={resolucion}
              onChange={(e) => setResolucion(Number(e.target.value))}
              className="w-full h-12 bg-[#0e0e12] border border-[#22222c] focus:border-[#c9242b] rounded-xl px-3 text-xs text-white outline-none"
            >
              <option value={2}>2 MP (1080p Full HD)</option>
              <option value={4}>4 MP (2K QHD)</option>
              <option value={8}>8 MP (4K Ultra HD)</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#a5a5b2] block mb-1">Códec de Compresión</label>
            <select
              value={codec}
              onChange={(e) => setCodec(e.target.value)}
              className="w-full h-12 bg-[#0e0e12] border border-[#22222c] focus:border-[#c9242b] rounded-xl px-3 text-xs text-white outline-none"
            >
              <option value="h265p">H.265+ / Smart Codec (Recomendado)</option>
              <option value="h265">H.265 Estándar</option>
              <option value="h264">H.264 Tradicional</option>
            </select>
          </div>
        </div>

        {/* Modalidad de Grabación */}
        <div>
          <label className="text-[11px] font-semibold text-[#a5a5b2] block mb-1.5">Régimen de Grabación</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setModoGrabacion(0.4)}
              className={`h-11 rounded-xl text-xs font-semibold border transition-all ${
                modoGrabacion === 0.4
                  ? "bg-[#c9242b]/20 text-[#c9242b] border-[#c9242b]"
                  : "bg-[#0e0e12] text-[#a5a5b2] border-[#22222c]"
              }`}
            >
              Movimiento (~40% actividad)
            </button>
            <button
              type="button"
              onClick={() => setModoGrabacion(1)}
              className={`h-11 rounded-xl text-xs font-semibold border transition-all ${
                modoGrabacion === 1
                  ? "bg-[#c9242b]/20 text-[#c9242b] border-[#c9242b]"
                  : "bg-[#0e0e12] text-[#a5a5b2] border-[#22222c]"
              }`}
            >
              Continuo 24/7 (100%)
            </button>
          </div>
        </div>
      </div>

      {/* Resultados HDD */}
      <div className="bg-gradient-to-br from-[#1c1c24] to-[#131318] p-5 rounded-2xl border border-[rgba(201,36,43,0.3)] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#c9242b] uppercase tracking-wider">
            Requerimiento de Disco Duro
          </span>
          <button
            onClick={() => onCopiar(textoResumen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#22222c] hover:bg-[#2a2a36] text-white active:scale-95 transition-all"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiado ? "Copiado" : "Copiar"}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0e0e12]/80 p-3.5 rounded-xl border border-[#22222c]">
            <span className="text-[10px] text-[#a5a5b2] block mb-0.5">Espacio Neto Teórico</span>
            <div className="text-2xl font-black text-white font-mono">{calculoDisco.totalTB} <span className="text-sm font-normal text-[#a5a5b2]">TB</span></div>
            <span className="text-[10px] text-[#6e6e78] font-mono">{calculoDisco.totalGB} GB</span>
          </div>
          <div className="bg-[#c9242b]/15 p-3.5 rounded-xl border border-[#c9242b]/30">
            <span className="text-[10px] text-red-200 block mb-0.5 font-bold">HDD Comercial a Instalar</span>
            <div className="text-2xl font-black text-[#c9242b] font-mono">{calculoDisco.tbRecomendado} <span className="text-sm font-normal text-white">TB</span></div>
            <span className="text-[10px] text-emerald-400 font-semibold">100% Cobertura</span>
          </div>
        </div>

        <div className="p-3 bg-[#0e0e12] rounded-xl border border-[#22222c] flex items-center justify-between text-xs">
          <span className="text-[#a5a5b2]">Ancho de Banda Total Streaming:</span>
          <span className="font-mono font-bold text-white">{calculoDisco.anchoBandaMbpsTotal} Mbps</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CALCULADORA DE CAÍDA DE TENSIÓN (VOLTAGE DROP - 12VDC / 24VAC)
// ─────────────────────────────────────────────────────────────────────────────
function CalculadoraCaidaVoltaje({ onCopiar, copiado }: { onCopiar: (t: string) => void; copiado: boolean }) {
  const [voltajeFuente, setVoltajeFuente] = useState<number>(12); // 12V o 24V
  const [corrienteCámara, setCorrienteCamara] = useState<number>(800); // mA con IR encendido
  const [distanciaMetros, setDistanciaMetros] = useState<number>(30); // metros de cable
  const [tipoCable, setTipoCable] = useState<string>("utp_1par"); // utp_1par, utp_2pares, awg18, awg20, awg22

  // Resistividad del conductor de cobre en Ohms por metro (ida + retorno = 2x distancia)
  const resistividadPorMetroIdaVuelta = useMemo(() => {
    switch (tipoCable) {
      case "utp_1par": return 0.176; // Cat5e/6 AWG24 aprox 0.088 ohm/m * 2
      case "utp_2pares": return 0.088; // 2 pares en paralelo (resistencia a la mitad)
      case "awg22": return 0.106;
      case "awg20": return 0.066;
      case "awg18": return 0.042; // Cable siamés 18/2 de alto calibre
      default: return 0.176;
    }
  }, [tipoCable]);

  const calculoVoltaje = useMemo(() => {
    const resistenciaTotal = resistividadPorMetroIdaVuelta * distanciaMetros;
    const corrienteAmperios = corrienteCámara / 1000;
    const caidaVoltaje = corrienteAmperios * resistenciaTotal;
    const voltajeLlegada = voltajeFuente - caidaVoltaje;
    const porcentajeCaida = (caidaVoltaje / voltajeFuente) * 100;

    // Estado de salud del voltaje:
    // En 12VDC, si cae por debajo de 10.8V (-10%), los infrarrojos causan reinicio nocturno cíclico
    let estado: "optimo" | "precaucion" | "critico" = "optimo";
    if (voltajeFuente === 12) {
      if (voltajeLlegada < 10.8) estado = "critico";
      else if (voltajeLlegada < 11.2) estado = "precaucion";
    } else {
      if (porcentajeCaida > 10) estado = "critico";
      else if (porcentajeCaida > 5) estado = "precaucion";
    }

    return {
      resistenciaTotal: resistenciaTotal.toFixed(2),
      caidaVoltaje: caidaVoltaje.toFixed(2),
      voltajeLlegada: voltajeLlegada.toFixed(2),
      porcentajeCaida: porcentajeCaida.toFixed(1),
      estado,
    };
  }, [resistividadPorMetroIdaVuelta, distanciaMetros, corrienteCámara, voltajeFuente]);

  const textoResumen = `Cálculo Caída de Tensión CCTV (TecnoSmart VZL):
- Fuente: ${voltajeFuente}V DC | Consumo Cámara (IR Nocturno): ${corrienteCámara} mA
- Distancia de Cableado: ${distanciaMetros} metros | Conductor: ${tipoCable.toUpperCase()}
- Caída Estimada: ${calculoVoltaje.caidaVoltaje} V (${calculoVoltaje.porcentajeCaida}%)
- Voltaje Real en la Cámara: ${calculoVoltaje.voltajeLlegada} V
- Diagnóstico: ${calculoVoltaje.estado === "critico" ? "CRÍTICO - RIESGO DE REINICIOS NOCTURNOS" : calculoVoltaje.estado === "precaucion" ? "ADVERTENCIA - CERCA DEL LÍMITE" : "ÓPTIMO - ESTABILIDAD GARANTIZADA"}`;

  return (
    <div className="space-y-4">
      <div className="bg-[#131318] p-4 rounded-2xl border border-[#22222c] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#c9242b]" /> Caída en Alimentación 12V/24V
          </h2>
          <span className="text-[11px] text-[#a5a5b2]">Evita reinicios por IR</span>
        </div>

        {/* Voltaje Fuente y Distancia */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#a5a5b2] block mb-1">Voltaje en Fuente</label>
            <select
              value={voltajeFuente}
              onChange={(e) => setVoltajeFuente(Number(e.target.value))}
              className="w-full h-12 bg-[#0e0e12] border border-[#22222c] focus:border-[#c9242b] rounded-xl px-3 text-xs text-white outline-none"
            >
              <option value={12}>12 V DC (CCTV Común)</option>
              <option value={12.5}>12.5 V DC (Fuente regulable alta)</option>
              <option value={13.8}>13.8 V DC (Fuente de respaldo)</option>
              <option value={24}>24 V AC (PTZ / Cámaras pesadas)</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#a5a5b2] block mb-1">Distancia de Tirada (m)</label>
            <input
              type="number"
              min="1"
              max="250"
              value={distanciaMetros}
              onChange={(e) => setDistanciaMetros(Math.max(1, Number(e.target.value)))}
              className="w-full h-12 bg-[#0e0e12] border border-[#22222c] focus:border-[#c9242b] rounded-xl px-3 text-sm text-white font-mono outline-none"
            />
          </div>
        </div>

        {/* Consumo y Tipo de Cable */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#a5a5b2] block mb-1">Consumo Cámara (mA)</label>
            <select
              value={corrienteCámara}
              onChange={(e) => setCorrienteCamara(Number(e.target.value))}
              className="w-full h-12 bg-[#0e0e12] border border-[#22222c] focus:border-[#c9242b] rounded-xl px-3 text-xs text-white outline-none"
            >
              <option value={400}>400 mA (Domo interior día)</option>
              <option value={800}>800 mA (Bullet IR normal noche)</option>
              <option value={1200}>1200 mA (ColorVu / LEDs Luz Blanca)</option>
              <option value={2000}>2000 mA (PTZ / Motorizado)</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#a5a5b2] block mb-1">Calibre / Tipo de Conductor</label>
            <select
              value={tipoCable}
              onChange={(e) => setTipoCable(e.target.value)}
              className="w-full h-12 bg-[#0e0e12] border border-[#22222c] focus:border-[#c9242b] rounded-xl px-3 text-xs text-white outline-none"
            >
              <option value="utp_1par">UTP Cat5e/6 (1 Par - Común)</option>
              <option value="utp_2pares">UTP Cat5e/6 (2 Pares en paralelo)</option>
              <option value="awg22">AWG 22 (Cable Alarma / Control)</option>
              <option value="awg18">AWG 18 (Siamés Coaxial 18/2 Pro)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resultados de Voltaje */}
      <div className={`p-5 rounded-2xl border shadow-xl space-y-4 transition-all ${
        calculoVoltaje.estado === "critico"
          ? "bg-red-950/20 border-red-700/50"
          : calculoVoltaje.estado === "precaucion"
          ? "bg-amber-950/20 border-amber-700/50"
          : "bg-[#131318] border-[rgba(201,36,43,0.3)]"
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            {calculoVoltaje.estado === "critico" ? (
              <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Voltaje Crítico</span>
            ) : calculoVoltaje.estado === "precaucion" ? (
              <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Atención al Límite</span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Alimentación Óptima</span>
            )}
          </span>
          <button
            onClick={() => onCopiar(textoResumen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#22222c] hover:bg-[#2a2a36] text-white active:scale-95 transition-all"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiado ? "Copiado" : "Copiar"}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0e0e12]/80 p-3.5 rounded-xl border border-[#22222c]">
            <span className="text-[10px] text-[#a5a5b2] block mb-0.5">Voltaje en la Cámara</span>
            <div className={`text-2xl font-black font-mono ${
              calculoVoltaje.estado === "critico" ? "text-red-400" : calculoVoltaje.estado === "precaucion" ? "text-amber-400" : "text-emerald-400"
            }`}>
              {calculoVoltaje.voltajeLlegada} <span className="text-sm font-normal text-[#a5a5b2]">V</span>
            </div>
          </div>
          <div className="bg-[#0e0e12]/80 p-3.5 rounded-xl border border-[#22222c]">
            <span className="text-[10px] text-[#a5a5b2] block mb-0.5">Caída de Tensión</span>
            <div className="text-2xl font-black text-white font-mono">
              {calculoVoltaje.caidaVoltaje} <span className="text-sm font-normal text-[#a5a5b2]">V</span>
            </div>
            <span className="text-[10px] text-[#6e6e78] font-mono">({calculoVoltaje.porcentajeCaida}%)</span>
          </div>
        </div>

        {calculoVoltaje.estado === "critico" && (
          <div className="p-3 bg-red-900/30 rounded-xl border border-red-700/40 text-xs text-red-200">
            ⚠️ <strong>Riesgo en campo:</strong> Con menos de 10.8V la cámara funcionará de día, pero al encender los infrarrojos de noche se apagará y quedará en bucle de reinicio. Solución: usar 2 pares en paralelo o cable Siamés AWG 18.
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CALCULADORA DE PRESUPUESTO DE POTENCIA POE (SWITCH POE BUDGET)
// ─────────────────────────────────────────────────────────────────────────────
function CalculadoraPoE({ onCopiar, copiado }: { onCopiar: (t: string) => void; copiado: boolean }) {
  const [camarasAf, setCamarasAf] = useState<number>(4); // PoE 802.3af standard (~12W)
  const [camarasAt, setCamarasAt] = useState<number>(1); // PoE+ 802.3at ColorVu / PTZ (~25W)
  const [camarasBt, setCamarasBt] = useState<number>(0); // Hi-PoE / bt (~60W)
  const [capacidadSwitch, setCapacidadSwitch] = useState<number>(65); // Watts totales del switch

  const calculoPoE = useMemo(() => {
    const wAf = camarasAf * 12.5;
    const wAt = camarasAt * 25.5;
    const wBt = camarasBt * 60;
    const totalWatts = wAf + wAt + wBt;
    const porcentajeUso = capacidadSwitch > 0 ? (totalWatts / capacidadSwitch) * 100 : 0;
    const margenSeguridad = capacidadSwitch - totalWatts;

    let estado: "sobrado" | "limite" | "sobrecargado" = "sobrado";
    if (porcentajeUso > 100) estado = "sobrecargado";
    else if (porcentajeUso > 80) estado = "limite";

    return {
      totalWatts: parseFloat(totalWatts.toFixed(1)),
      porcentajeUso: parseFloat(porcentajeUso.toFixed(1)),
      margenSeguridad: parseFloat(margenSeguridad.toFixed(1)),
      estado,
    };
  }, [camarasAf, camarasAt, camarasBt, capacidadSwitch]);

  const textoResumen = `Cálculo PoE Switch (TecnoSmart VZL):
- Dispositivos Conectados:
  * ${camarasAf} Cámaras PoE 802.3af (12.5W c/u)
  * ${camarasAt} Cámaras PoE+ 802.3at (25.5W c/u)
  * ${camarasBt} Equipos Hi-PoE 802.3bt (60W c/u)
- Carga Total Requerida: ${calculoPoE.totalWatts} Watts
- Capacidad del Switch PoE: ${capacidadSwitch} Watts (Uso: ${calculoPoE.porcentajeUso}%)
- Margen Libre: ${calculoPoE.margenSeguridad} Watts
- Veredicto: ${calculoPoE.estado === "sobrecargado" ? "SOBRECARGA - EL SWITCH SE APAGARÁ" : calculoPoE.estado === "limite" ? "ALTO - SE REQUIERE MARGEN DE SEGURIDAD 20%" : "SWITCH COMPATIBLE Y SEGURO"}`;

  return (
    <div className="space-y-4">
      <div className="bg-[#131318] p-4 rounded-2xl border border-[#22222c] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#c9242b]" /> Presupuesto Switch PoE (Watts)
          </h2>
          <span className="text-[11px] text-[#a5a5b2]">802.3af / at / bt</span>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#a5a5b2] block mb-1">Potencia Total del Switch PoE (W)</label>
          <div className="grid grid-cols-4 gap-2">
            {[60, 65, 120, 250].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setCapacidadSwitch(w)}
                className={`h-11 rounded-xl text-xs font-semibold border transition-all ${
                  capacidadSwitch === w
                    ? "bg-[#c9242b] text-white border-[#c9242b]"
                    : "bg-[#0e0e12] text-[#a5a5b2] border-[#22222c]"
                }`}
              >
                {w} W
              </button>
            ))}
          </div>
        </div>

        {/* Tipos de Cámaras */}
        <div className="space-y-3 pt-2 border-t border-[#22222c]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">PoE 802.3af (Hasta 12.5W)</span>
              <span className="text-[10px] text-[#a5a5b2]">Domo / Bullet convencional IP</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCamarasAf(Math.max(0, camarasAf - 1))} className="w-9 h-9 rounded-lg bg-[#0e0e12] border border-[#22222c] font-bold">-</button>
              <span className="w-6 text-center font-mono font-bold">{camarasAf}</span>
              <button onClick={() => setCamarasAf(camarasAf + 1)} className="w-9 h-9 rounded-lg bg-[#0e0e12] border border-[#22222c] font-bold">+</button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">PoE+ 802.3at (Hasta 25.5W)</span>
              <span className="text-[10px] text-[#a5a5b2]">ColorVu potente, Audio 2 vías o PTZ chica</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCamarasAt(Math.max(0, camarasAt - 1))} className="w-9 h-9 rounded-lg bg-[#0e0e12] border border-[#22222c] font-bold">-</button>
              <span className="w-6 text-center font-mono font-bold">{camarasAt}</span>
              <button onClick={() => setCamarasAt(camarasAt + 1)} className="w-9 h-9 rounded-lg bg-[#0e0e12] border border-[#22222c] font-bold">+</button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Hi-PoE / 802.3bt (Hasta 60W)</span>
              <span className="text-[10px] text-[#a5a5b2]">PTZ Speed Dome de largo alcance / Calefactores</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCamarasBt(Math.max(0, camarasBt - 1))} className="w-9 h-9 rounded-lg bg-[#0e0e12] border border-[#22222c] font-bold">-</button>
              <span className="w-6 text-center font-mono font-bold">{camarasBt}</span>
              <button onClick={() => setCamarasBt(camarasBt + 1)} className="w-9 h-9 rounded-lg bg-[#0e0e12] border border-[#22222c] font-bold">+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados PoE */}
      <div className={`p-5 rounded-2xl border shadow-xl space-y-4 ${
        calculoPoE.estado === "sobrecargado"
          ? "bg-red-950/20 border-red-700/50"
          : calculoPoE.estado === "limite"
          ? "bg-amber-950/20 border-amber-700/50"
          : "bg-[#131318] border-[rgba(201,36,43,0.3)]"
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            {calculoPoE.estado === "sobrecargado" ? (
              <span className="text-red-400">⚠️ Switch Sobrecargado</span>
            ) : calculoPoE.estado === "limite" ? (
              <span className="text-amber-400">⚠️ Uso cercano al límite (80%+)</span>
            ) : (
              <span className="text-emerald-400">✓ Presupuesto Seguro</span>
            )}
          </span>
          <button
            onClick={() => onCopiar(textoResumen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#22222c] hover:bg-[#2a2a36] text-white active:scale-95 transition-all"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiado ? "Copiado" : "Copiar"}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0e0e12]/80 p-3.5 rounded-xl border border-[#22222c]">
            <span className="text-[10px] text-[#a5a5b2] block mb-0.5">Consumo Requerido</span>
            <div className="text-2xl font-black text-white font-mono">{calculoPoE.totalWatts} <span className="text-sm font-normal text-[#a5a5b2]">W</span></div>
          </div>
          <div className="bg-[#0e0e12]/80 p-3.5 rounded-xl border border-[#22222c]">
            <span className="text-[10px] text-[#a5a5b2] block mb-0.5">Uso del Switch</span>
            <div className={`text-2xl font-black font-mono ${
              calculoPoE.estado === "sobrecargado" ? "text-red-400" : calculoPoE.estado === "limite" ? "text-amber-400" : "text-emerald-400"
            }`}>
              {calculoPoE.porcentajeUso} <span className="text-sm font-normal text-white">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CALCULADORA DE AUTONOMÍA DE BATERÍAS & UPS (RESPALDO ELÉCTRICO)
// ─────────────────────────────────────────────────────────────────────────────
function CalculadoraBaterias({ onCopiar, copiado }: { onCopiar: (t: string) => void; copiado: boolean }) {
  const [cargaDVR, setCargaDVR] = useState<number>(30); // DVR/NVR Watts
  const [cargaCamaras, setCargaCamaras] = useState<number>(40); // Cámaras Watts
  const [incluyeStarlink, setIncluyeStarlink] = useState<boolean>(true); // Starlink ~60W
  const [voltajeBanco, setVoltajeBanco] = useState<number>(12); // 12V o 24V
  const [capacidadAh, setCapacidadAh] = useState<number>(100); // 100Ah batería común
  const [tipoBateria, setTipoBateria] = useState<string>("agm"); // agm (50% DOD), litio (85% DOD)

  const calculoBateria = useMemo(() => {
    const totalWatts = cargaDVR + cargaCamaras + (incluyeStarlink ? 60 : 0);
    const dod = tipoBateria === "litio" ? 0.85 : 0.50; // Profundidad de descarga segura
    const eficienciaInversor = 0.85;

    // Energía útil (Watt-hora) = CapacidadAh * Voltaje * DOD * Eficiencia
    const whUtiles = capacidadAh * voltajeBanco * dod * eficienciaInversor;
    const horasAutonomia = totalWatts > 0 ? whUtiles / totalWatts : 0;

    const horas = Math.floor(horasAutonomia);
    const minutos = Math.round((horasAutonomia - horas) * 60);

    return {
      totalWatts,
      whUtiles: Math.round(whUtiles),
      horas,
      minutos,
      horasDecimal: parseFloat(horasAutonomia.toFixed(1)),
    };
  }, [cargaDVR, cargaCamaras, incluyeStarlink, voltajeBanco, capacidadAh, tipoBateria]);

  const textoResumen = `Cálculo Autonomía Eléctrica (TecnoSmart VZL):
- Carga Total de Seguridad: ${calculoBateria.totalWatts} W (DVR + Cámaras ${incluyeStarlink ? "+ Starlink 60W" : ""})
- Banco de Baterías: ${capacidadAh} Ah @ ${voltajeBanco}V (${tipoBateria.toUpperCase()})
- Autonomía Estimada sin Energía Eléctrica: ${calculoBateria.horas} horas y ${calculoBateria.minutos} minutos
- Energía Útil Efectiva: ${calculoBateria.whUtiles} Wh`;

  return (
    <div className="space-y-4">
      <div className="bg-[#131318] p-4 rounded-2xl border border-[#22222c] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BatteryCharging className="w-4 h-4 text-[#c9242b]" /> Respaldo ante Cortes de Luz
          </h2>
          <span className="text-[11px] text-[#a5a5b2]">CCTV + Starlink</span>
        </div>

        {/* Batería y Voltaje */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#a5a5b2] block mb-1">Capacidad Batería (Ah)</label>
            <input
              type="number"
              min="7"
              max="600"
              value={capacidadAh}
              onChange={(e) => setCapacidadAh(Math.max(1, Number(e.target.value)))}
              className="w-full h-12 bg-[#0e0e12] border border-[#22222c] focus:border-[#c9242b] rounded-xl px-3 text-sm text-white font-mono outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#a5a5b2] block mb-1">Tecnología de Batería</label>
            <select
              value={tipoBateria}
              onChange={(e) => setTipoBateria(e.target.value)}
              className="w-full h-12 bg-[#0e0e12] border border-[#22222c] focus:border-[#c9242b] rounded-xl px-3 text-xs text-white outline-none"
            >
              <option value="agm">Gel / AGM / Plomo (50% descarga)</option>
              <option value="litio">Litio LiFePO4 (85% descarga)</option>
            </select>
          </div>
        </div>

        {/* Cargas */}
        <div className="space-y-2 pt-2 border-t border-[#22222c]">
          <label className="text-[11px] font-semibold text-[#a5a5b2] block">Equipos en Respaldo:</label>
          <div className="flex items-center justify-between p-2.5 bg-[#0e0e12] rounded-xl border border-[#22222c] text-xs">
            <span>DVR / NVR Grabador + Disco</span>
            <span className="font-mono text-white">{cargaDVR} W</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-[#0e0e12] rounded-xl border border-[#22222c] text-xs">
            <span>Cámaras CCTV y Baluns</span>
            <span className="font-mono text-white">{cargaCamaras} W</span>
          </div>
          <div
            onClick={() => setIncluyeStarlink(!incluyeStarlink)}
            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
              incluyeStarlink ? "bg-[#c9242b]/15 border-[#c9242b]/40 text-white" : "bg-[#0e0e12] border-[#22222c] text-[#a5a5b2]"
            }`}
          >
            <span>Incluir Antena & Router Starlink (~60W)</span>
            <span className="font-bold">{incluyeStarlink ? "SI (60W)" : "NO"}</span>
          </div>
        </div>
      </div>

      {/* Resultados de Autonomía */}
      <div className="bg-gradient-to-br from-[#1c1c24] to-[#131318] p-5 rounded-2xl border border-[rgba(201,36,43,0.3)] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#c9242b] uppercase tracking-wider">
            Tiempo de Autonomía Estimado
          </span>
          <button
            onClick={() => onCopiar(textoResumen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#22222c] hover:bg-[#2a2a36] text-white active:scale-95 transition-all"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiado ? "Copiado" : "Copiar"}</span>
          </button>
        </div>

        <div className="text-center p-4 bg-[#0e0e12] rounded-xl border border-[#22222c]">
          <span className="text-[11px] text-[#a5a5b2] block mb-1">Duración con Carga Total ({calculoBateria.totalWatts} W)</span>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {calculoBateria.horas}h {calculoBateria.minutos}m
          </div>
          <span className="text-[10px] text-[#6e6e78]">Corte seguro para no degradar la batería</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. GUÍA DE REDES CCTV, PINES RJ45 & PUERTOS TÉCNICOS
// ─────────────────────────────────────────────────────────────────────────────
function GuiaRedesCCTV({ onCopiar, copiado }: { onCopiar: (t: string) => void; copiado: boolean }) {
  const puertosComunes = [
    { marca: "Hikvision / HiLook", server: "8000", rtsp: "554", http: "80 / 443" },
    { marca: "Dahua / Imou", server: "37777", rtsp: "554", http: "80" },
    { marca: "Uniview (UNV)", server: "82 / 81", rtsp: "554", http: "80" },
    { marca: "Estándar ONVIF", server: "80 / 8899", rtsp: "554", http: "80" },
  ];

  return (
    <div className="space-y-4">
      {/* Pines T-568B */}
      <div className="bg-[#131318] p-4 rounded-2xl border border-[#22222c] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Network className="w-4 h-4 text-[#c9242b]" /> Código de Crimpado T-568B
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
            Estándar Oficial
          </span>
        </div>

        <p className="text-xs text-[#a5a5b2]">Orden de izquierda a derecha con la pestaña del conector RJ45 hacia abajo:</p>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
          {[
            { pin: 1, color: "bg-orange-100 text-orange-800 border-orange-400", label: "Blanco/Naranja" },
            { pin: 2, color: "bg-orange-500 text-white border-orange-600", label: "Naranja" },
            { pin: 3, color: "bg-emerald-100 text-emerald-800 border-emerald-400", label: "Blanco/Verde" },
            { pin: 4, color: "bg-blue-600 text-white border-blue-700", label: "Azul" },
            { pin: 5, color: "bg-blue-100 text-blue-800 border-blue-400", label: "Blanco/Azul" },
            { pin: 6, color: "bg-emerald-600 text-white border-emerald-700", label: "Verde" },
            { pin: 7, color: "bg-amber-100 text-amber-900 border-amber-400", label: "Blanco/Marrón" },
            { pin: 8, color: "bg-amber-800 text-white border-amber-900", label: "Marrón" },
          ].map((p) => (
            <div key={p.pin} className={`p-2 rounded-lg border text-center text-[10px] font-bold ${p.color}`}>
              <div>Pin {p.pin}</div>
              <div className="text-[8px] truncate leading-tight mt-0.5">{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Puertos de Fábrica por Marca */}
      <div className="bg-[#131318] p-4 rounded-2xl border border-[#22222c] space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#c9242b]" /> Puertos de Fábrica para Router / Port Forwarding
        </h2>

        <div className="space-y-2">
          {puertosComunes.map((p) => (
            <div key={p.marca} className="p-3 bg-[#0e0e12] rounded-xl border border-[#22222c] flex items-center justify-between text-xs">
              <span className="font-bold text-white">{p.marca}</span>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-[#a5a5b2]">Server: <strong className="text-white">{p.server}</strong></span>
                <span className="text-[#a5a5b2]">RTSP: <strong className="text-emerald-400">{p.rtsp}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
