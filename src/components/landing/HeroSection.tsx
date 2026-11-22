"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  MapPin,
  Award,
  Radio,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const heroSlides = [
  {
    id: "obra",
    title: "Técnico en Obra",
    src: "/landing/hero.jpg",
    alt: "Técnico certificado de TecnoSmart instalando cámara de seguridad con taladro",
    caption: "Instalación en sitio con herramientas de precisión, arnés y equipo de protección",
    tag: "Técnicos Certificados",
  },
  {
    id: "rack",
    title: "Rack & Networking",
    src: "/landing/instalacion-3.jpg",
    alt: "Rack de telecomunicaciones con switch de alta velocidad y cableado peinado",
    caption: "Cableado estructurado de datos y peinado de rack de nivel corporativo",
    tag: "Infraestructura Pro",
  },
  {
    id: "conduit",
    title: "Canalización Hermética",
    src: "/landing/instalacion-1.jpg",
    alt: "Cámara Hikvision con tubería conduit hermética y cajetín estanco",
    caption: "Cero cables expuestos: tubería curva de PVC sellada y cajetines estancos IP66",
    tag: "Normas Internacionales",
  },
  {
    id: "perimetro",
    title: "Seguridad Perimetral",
    src: "/landing/instalacion-2.jpg",
    alt: "Técnico en escalera montando cámara en poste metálico perimetral",
    caption: "Instalación en altura sobre postes exteriores para galpones, empresas y fincas",
    tag: "Cobertura Exterior",
  },
];

const AUTOPLAY_INTERVAL = 4500; // 4.5 segundos por foto

export default function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Ciclo automático de fotos
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, AUTOPLAY_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, activeSlide]);

  const handleNext = () => {
    setActiveSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handlePrev = () => {
    setActiveSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <section
      id="inicio"
      className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 bg-[#0a0a0c] text-white overflow-hidden"
    >
      {/* Patrón de fondo tecnológico sutil */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Gradientes decorativos de marca con animación de pulso */}
      <div className="absolute top-1/4 left-0 -translate-x-1/2 w-96 h-96 bg-[var(--ts-red)]/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div
        className="absolute bottom-10 right-0 translate-x-1/3 w-96 h-96 bg-[var(--ts-red)]/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Columna Izquierda: Mensaje y CTA */}
          <div className="lg:col-span-7 text-left">
            <ScrollReveal direction="up" duration={700}>
              {/* Badge con animación sutil */}
              <div className="inline-flex items-center gap-2 bg-[var(--ts-red)]/15 border border-[var(--ts-red)]/40 text-[var(--ts-red)] text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-6 shadow-lg shadow-red-950/20">
                <ShieldCheck className="w-4 h-4 animate-pulse" />
                <span>Seguridad Electrónica & Soluciones Tecnológicas</span>
              </div>

              {/* Titular Principal Exacto */}
              <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-white leading-[1.12] tracking-tight mb-5">
                Tu seguridad es nuestra prioridad,{" "}
                <span className="text-[var(--ts-red)] relative inline-block">
                  y nos comprometemos de verdad contigo
                </span>
              </h1>

              {/* Subtítulo Aprobado */}
              <p className="text-base sm:text-lg text-[#c8c8cf] leading-relaxed mb-6">
                Instalaciones de seguridad realizadas por técnicos certificados,
                limpias y según normas internacionales, por una empresa familiar en la que puedes confiar.
              </p>

              {/* A quién va dirigido */}
              <div className="bg-[#141418] border border-[#25252e] rounded-xl p-4 mb-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--ts-red)]" />
                <p className="text-xs uppercase tracking-wider text-[var(--ts-red)] font-bold mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Soluciones diseñadas para:
                </p>
                <p className="text-sm text-[#d5d5dc]">
                  Comerciantes, dueños de empresas y hogares domésticos que necesitan sistemas de seguridad o soluciones tecnológicas confiables.
                </p>
              </div>

              {/* CTA Principal y Promesa Visible */}
              <div className="space-y-3 mb-8">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <a
                    href="#asesoria-gratuita"
                    className="relative group inline-flex items-center justify-center gap-2 bg-[var(--ts-red)] hover:bg-[#b01f25] text-white font-bold text-base px-8 py-4 rounded-xl shadow-xl shadow-red-950/50 transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                  >
                    <span className="relative z-10">Solicita tu asesoría gratuita</span>
                    <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
                  </a>

                  <a
                    href="#servicios"
                    className="inline-flex items-center justify-center gap-2 border border-[#353540] hover:border-[var(--ts-red)] text-[#d5d5dc] hover:text-white font-semibold text-base px-6 py-4 rounded-xl bg-[#141419]/60 hover:bg-[#181822] transition-all hover:shadow-lg"
                  >
                    Ver servicios
                  </a>
                </div>

                {/* Promesa Visible */}
                <p className="text-xs sm:text-sm text-[var(--ts-red)] font-medium flex items-center gap-2 pt-1">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Te llamará uno de nuestros ingenieros en menos de 24 horas hábiles.</span>
                </p>
              </div>

              {/* Estadística Real Verificada */}
              <div className="pt-6 border-t border-[#202028] flex flex-wrap items-center gap-6">
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-[var(--ts-red)] flex items-center">
                    +200
                  </div>
                  <div className="text-xs sm:text-sm text-[#90909a] uppercase tracking-wider font-semibold">
                    Proyectos instalados
                  </div>
                </div>
                <div className="h-10 w-px bg-[#252530]" />
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-white">
                    100%
                  </div>
                  <div className="text-xs sm:text-sm text-[#90909a] uppercase tracking-wider font-semibold">
                    Sin cables sueltos
                  </div>
                </div>
                <div className="h-10 w-px bg-[#252530]" />
                <div className="text-xs text-[#9a9aa5] max-w-xs leading-relaxed">
                  Instalaciones reales ejecutadas con métodos estandarizados y acabados de nivel internacional.
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Columna Derecha: Carrusel Automático de Fotos Reales */}
          <div className="lg:col-span-5 pb-20 sm:pb-24 lg:pb-16">
            <ScrollReveal direction="left" duration={800} delay={150}>
              <div
                className="relative"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                
                {/* Marco fotográfico de alta tecnología con gradiente dinámico */}
                <div className="relative p-1 rounded-3xl bg-gradient-to-br from-[#2e2e3d] via-[var(--ts-red)]/30 to-[#181822] shadow-2xl shadow-black/95">
                  <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-[22px] overflow-hidden bg-[#131318]">
                    
                    {/* Renderizado de todas las fotos con transición suave de opacidad */}
                    {heroSlides.map((slide, idx) => (
                      <div
                        key={slide.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                          activeSlide === idx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                        }`}
                      >
                        <Image
                          src={slide.src}
                          alt={slide.alt}
                          fill
                          priority={idx === 0}
                          sizes="(max-width: 1024px) 100vw, 550px"
                          className="object-cover transform transition-transform duration-7000 ease-linear scale-100 hover:scale-105"
                        />
                      </div>
                    ))}

                    {/* Gradiente inferior para legibilidad */}
                    <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-5 flex flex-col justify-end">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--ts-red)] text-white shadow-md">
                          {heroSlides[activeSlide].tag}
                        </span>
                        <span className="text-[10px] font-mono text-white/60">
                          0{activeSlide + 1} / 0{heroSlides.length}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-white leading-tight">
                        {heroSlides[activeSlide].caption}
                      </p>
                    </div>

                    {/* Flechas de Navegación Manual */}
                    <button
                      onClick={handlePrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-[var(--ts-red)] transition-colors opacity-0 hover:opacity-100 sm:group-hover:opacity-100 cursor-pointer"
                      aria-label="Foto anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-[var(--ts-red)] transition-colors opacity-0 hover:opacity-100 sm:group-hover:opacity-100 cursor-pointer"
                      aria-label="Foto siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Barra de progreso interactiva y selectores de foto (100% visible y sin obstrucción) */}
                <div className="mt-3.5 flex items-center justify-between gap-3 bg-[#121217] border border-[#23232c] px-3.5 py-2 rounded-2xl shadow-lg">
                  {/* Selector rápido con barras de tiempo animadas */}
                  <div className="flex items-center gap-2 flex-1">
                    {heroSlides.map((slide, idx) => (
                      <button
                        key={slide.id}
                        onClick={() => setActiveSlide(idx)}
                        className="group flex-1 py-1 cursor-pointer text-left"
                        aria-label={`Ver foto ${slide.title}`}
                      >
                        <div className="h-1.5 w-full bg-[#20202c] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              activeSlide === idx
                                ? "bg-[var(--ts-red)] w-full"
                                : "w-0 bg-[#353545] group-hover:w-full group-hover:bg-[#454558]"
                            }`}
                          />
                        </div>
                        <p
                          className={`text-[10px] mt-1 font-semibold truncate transition-colors ${
                            activeSlide === idx ? "text-white" : "text-[#757585]"
                          }`}
                        >
                          {slide.title}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Indicador de Pausa / Reproducción */}
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="text-[#808090] hover:text-white p-1 rounded-lg hover:bg-[#1f1f2a] transition-colors cursor-pointer"
                    title={isPaused ? "Reanudar pase automático" : "Pausar pase automático"}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Floating Badge 1: Top-Right (Hikvision Partner Oficial) */}
                <div className="absolute -top-4 -right-4 z-30 bg-[#14141c]/95 border border-[#30303e] rounded-xl p-3 shadow-xl backdrop-blur-md flex items-center gap-2.5 animate-float-slow">
                  <div className="w-8 h-8 rounded-lg bg-[var(--ts-red)]/20 border border-[var(--ts-red)]/50 flex items-center justify-center text-[var(--ts-red)]">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white tracking-wide">Hikvision Partner</p>
                    <p className="text-[9px] text-[#90909c]">Distribuidor Autorizado</p>
                  </div>
                </div>

                {/* Floating Badge 2: Bottom-Left (Radar de Cuadrillas en Ruta) - Ubicado debajo de la línea de tiempo */}
                <div className="flex mt-3.5 sm:mt-0 sm:absolute sm:top-[calc(100%+16px)] sm:-left-6 z-30 bg-[#14141c]/95 border border-[#2e2e3c] rounded-2xl p-3.5 shadow-2xl shadow-black/80 backdrop-blur-md items-center gap-3 sm:animate-float-reverse">
                  <div className="relative w-9 h-9 rounded-xl bg-emerald-950/40 border border-emerald-600/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <span className="absolute w-full h-full rounded-xl bg-emerald-500/20 animate-radar-ping" />
                    <Radio className="w-4 h-4 relative z-10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-xs font-bold text-white tracking-wide">Cuadrillas Operativas</p>
                    </div>
                    <p className="text-[10px] text-[#90909e] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[var(--ts-red)] shrink-0" />
                      <span>Valencia · San Juan · Tinaquillo · Caracas</span>
                    </p>
                  </div>
                </div>

              </div>
            </ScrollReveal>
          </div>

        </div>
      </div>
    </section>
  );
}
