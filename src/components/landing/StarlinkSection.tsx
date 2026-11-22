"use client";

import { useState } from "react";
import Image from "next/image";
import { Radio, Wifi, CreditCard, ArrowRight, CheckCircle2, Zap, Activity, Globe2, Sparkles, BatteryCharging, ShieldCheck } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const starlinkModels = [
  {
    id: "mini",
    badge: "Nuevo & Portátil",
    name: "Starlink Mini",
    tagline: "Ultra portátil · Cabe en una mochila · Alimentación 12V / USB-C",
    image: "/landing/starlink-mini.jpg",
    alt: "Antena Starlink Mini en mesa de terraza con vista panorámica",
    description:
      "La solución definitiva para movilidad, camionetas 4x4, campings y respaldo en apagones. Router Wi-Fi 5 integrado, consumo de solo 25-40W (opera con power banks o baterías de 12V) y peso de apenas 1.1 kg.",
    metrics: {
      speed: "100-180",
      speedUnit: "Mbps",
      latency: "25-40 ms",
      power: "25-40W (12V)",
      ideal: "Viajes, 4x4, Fincas, Casas de Campo",
    },
    features: [
      "Router Wi-Fi integrado en el propio panel de antena",
      "Alimentación directa vía puerto USB-C PD o DC 12-48V",
      "Resistencia extrema IP67 a lluvia, polvo y vientos",
      "Pesa apenas 1.1 kg (cabe en cualquier bolso o guantera)",
    ],
  },
  {
    id: "standard",
    badge: "Alta Potencia Fija",
    name: "Starlink Standard",
    tagline: "Residencial & Comercial · Cobertura Máxima de Red",
    image: "/landing/starlink-standard.jpg",
    alt: "Antena satelital Starlink Standard rectangular con base de suelo o techo",
    description:
      "El modelo de mayor despliegue para casas de familia, negocios, centros comerciales, galpones industriales y fincas agropecuarias que requieren velocidad constante para decenas de dispositivos en simultáneo.",
    metrics: {
      speed: "180-280",
      speedUnit: "Mbps",
      latency: "25-35 ms",
      power: "50-75W (110V)",
      ideal: "Hogares, Comercios, Racks y Galpones",
    },
    features: [
      "Mayor área de recepción para ancho de banda masivo",
      "Integración limpia con routers empresariales y switches PoE",
      "Soportes de techo y mástiles reforzados contra tormentas",
      "Ideal para interconectar sistemas de 16+ cámaras de seguridad",
    ],
  },
  {
    id: "overland",
    badge: "Vehicular & Rural",
    name: "Montaje Fijo 4x4 & Techo",
    tagline: "Enlace en movimiento y estructuras metálicas",
    image: "/landing/starlink-overland.jpg",
    alt: "Starlink montado en barra de techo de camioneta 4x4 en camino rural",
    description:
      "Instalación aerodinámica de panel plano sobre parrillas de techo de camionetas, maquinarias agrícolas, remolques o postes elevados sin cables colgando.",
    metrics: {
      speed: "150-250",
      speedUnit: "Mbps",
      latency: "25-45 ms",
      power: "12V / 110V",
      ideal: "Maquinaria, Transporte y Vigilancia Móvil",
    },
    features: [
      "Soportes antivibración mecanizados de alta rigidez",
      "Conexión fija mientras viajas por carreteras y trochas",
      "Protección contra ramas, lodo y lluvia torrencial",
      "Alimentación adaptada a la batería del vehículo",
    ],
  },
];

export default function StarlinkSection() {
  const [activeModelIdx, setActiveModelIdx] = useState(0);
  const activeModel = starlinkModels[activeModelIdx];

  return (
    <section id="starlink" className="py-24 bg-[#0e0e12] border-t border-[#1a1a22] text-white overflow-hidden relative">
      {/* Luz ambiental sutil en el fondo */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[var(--ts-red)]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Encabezado con ScrollReveal */}
        <ScrollReveal direction="up">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-[var(--ts-red)] text-xs font-bold uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-3 py-1 rounded-full">
              Internet Satelital de Alta Velocidad
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black text-white tracking-tight">
              Starlink en Venezuela: Modelos Mini, Standard y Gestión Completa
            </h2>
            <p className="mt-3 text-base text-[#a5a5b2] leading-relaxed">
              Disfruta de conectividad satelital estable en cualquier rincón del país. Desde el ultra compacto <strong className="text-white">Starlink Mini</strong> portátil hasta el <strong className="text-white">Standard</strong> residencial, nosotros instalamos, alineamos y gestionamos tu pago.
            </p>

            {/* Selector de Modelos Starlink (Pills con Switch Dinámico) */}
            <div className="mt-8 inline-flex p-1.5 rounded-2xl bg-[#14141c] border border-[#262636] shadow-xl">
              {starlinkModels.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => setActiveModelIdx(idx)}
                  className={`relative px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeModelIdx === idx
                      ? "bg-[var(--ts-red)] text-white shadow-lg shadow-red-950/50"
                      : "text-[#90909f] hover:text-white hover:bg-[#1c1c28]"
                  }`}
                >
                  <span>{m.name}</span>
                  {idx === 0 && (
                    <span className="ml-2 text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-black hidden sm:inline-block">
                      Mini
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Contenedor Principal en 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Columna Izquierda: Imagen del Modelo con Switch Suave */}
          <div className="lg:col-span-6">
            <ScrollReveal direction="left" duration={800}>
              <div className="relative">
                
                {/* Marco de la imagen con borde iluminado */}
                <div className="relative p-1 rounded-3xl bg-gradient-to-br from-[#2e2e40] via-[#1a1a24] to-[var(--ts-red)]/40 shadow-2xl shadow-black/90">
                  <div className="relative w-full aspect-[16/11] rounded-[22px] overflow-hidden bg-black group">
                    <Image
                      key={activeModel.image}
                      src={activeModel.image}
                      alt={activeModel.alt}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 600px"
                      className="object-cover transition-all duration-700 group-hover:scale-105 animate-fade-in"
                    />
                    
                    {/* Badge superior */}
                    <div className="absolute top-4 left-4 bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-lg">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--ts-red)]" />
                      <span>{activeModel.badge}</span>
                    </div>

                    {/* Gradiente inferior */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-5">
                      <p className="text-sm font-bold text-white mb-0.5">
                        {activeModel.name}
                      </p>
                      <p className="text-xs text-[#b0b0be]">
                        {activeModel.tagline}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Métricas Técnicas en Vivo del Modelo Seleccionado */}
                <div className="mt-4 grid grid-cols-3 gap-2 bg-[#14141c] border border-[#252534] p-3 rounded-2xl text-center shadow-lg">
                  <div className="p-1.5">
                    <p className="text-[11px] text-[#858595] flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3 text-[var(--ts-red)]" />
                      <span>Velocidad</span>
                    </p>
                    <p className="text-sm sm:text-base font-black text-white mt-0.5">
                      {activeModel.metrics.speed} <span className="text-[10px] font-normal text-[#858595]">{activeModel.metrics.speedUnit}</span>
                    </p>
                  </div>
                  <div className="p-1.5 border-x border-[#252534]">
                    <p className="text-[11px] text-[#858595] flex items-center justify-center gap-1">
                      <Activity className="w-3 h-3 text-emerald-400" />
                      <span>Latencia</span>
                    </p>
                    <p className="text-sm sm:text-base font-black text-white mt-0.5">
                      {activeModel.metrics.latency}
                    </p>
                  </div>
                  <div className="p-1.5">
                    <p className="text-[11px] text-[#858595] flex items-center justify-center gap-1">
                      <BatteryCharging className="w-3 h-3 text-amber-400" />
                      <span>Consumo</span>
                    </p>
                    <p className="text-sm sm:text-base font-black text-white mt-0.5">
                      {activeModel.metrics.power}
                    </p>
                  </div>
                </div>

              </div>
            </ScrollReveal>
          </div>

          {/* Columna Derecha: Detalles del Modelo y Servicio TecnoSmart */}
          <div className="lg:col-span-6">
            <ScrollReveal direction="right" duration={800} delay={100}>
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
                    {activeModel.name}: {activeModel.tagline}
                  </h3>
                  <p className="text-sm text-[#b0b0c0] leading-relaxed">
                    {activeModel.description}
                  </p>
                </div>

                {/* Lista de características del modelo */}
                <div className="bg-[#14141b] border border-[#242432] rounded-2xl p-5 space-y-3">
                  <p className="text-xs uppercase tracking-wider text-[var(--ts-red)] font-bold mb-2">
                    Ventajas y Capacidades Técnicas:
                  </p>
                  {activeModel.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#d0d0dc]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Servicios de Instalación y Pago de Mensualidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-[#161622] border border-[#2a2a3c] rounded-xl p-3.5">
                    <div className="flex items-center gap-2 text-white font-bold text-xs mb-1">
                      <Radio className="w-4 h-4 text-[var(--ts-red)]" />
                      <span>Instalación & Alineación</span>
                    </div>
                    <p className="text-[11px] text-[#90909e] leading-snug">
                      Fijación segura de mástil, anclajes y tendido de cable hacia router interno.
                    </p>
                  </div>

                  <div className="bg-[#161622] border border-[#2a2a3c] rounded-xl p-3.5">
                    <div className="flex items-center gap-2 text-white font-bold text-xs mb-1">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>Gestión de Mensualidad</span>
                    </div>
                    <p className="text-[11px] text-[#90909e] leading-snug">
                      ¿Sin tarjeta internacional? Nosotros gestionamos y pagamos tu plan mensual.
                    </p>
                  </div>
                </div>

                {/* CTA a formulario */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <a
                    href="#asesoria-gratuita"
                    className="inline-flex items-center justify-center gap-2 bg-[var(--ts-red)] hover:bg-[#b01f25] text-white font-bold text-sm px-7 py-4 rounded-xl shadow-xl shadow-red-950/40 transition-all hover:scale-105 active:scale-95"
                  >
                    <span>Cotizar instalación de {activeModel.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <p className="text-xs text-[#808090]">
                    Presupuesto personalizado según altura y ubicación.
                  </p>
                </div>

              </div>
            </ScrollReveal>
          </div>

        </div>

      </div>
    </section>
  );
}
