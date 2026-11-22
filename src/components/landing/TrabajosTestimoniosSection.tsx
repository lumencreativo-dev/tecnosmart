"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, Quote, CheckCircle2, X, ZoomIn, MapPin, ShieldCheck, Star } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

interface TrabajoItem {
  id: string;
  src: string;
  alt: string;
  title: string;
  category: "cctv" | "racks" | "comercio" | "agro";
  categoryLabel: string;
  location: string;
  description: string;
  specs: string[];
}

const trabajosData: TrabajoItem[] = [
  {
    id: "trabajo-1",
    src: "/landing/instalacion-1.jpg",
    alt: "Instalación de cámara Hikvision con tubería conduit hermética",
    title: "Canalización Perimetral Hermética",
    category: "cctv",
    categoryLabel: "CCTV & Perímetros",
    location: "Tinaquillo, Cojedes",
    description: "Cámara bullet Hikvision montada sobre cajetín estanco con tubería conduit de PVC en curvatura exacta. Protección IP66 contra sol y lluvia tropical.",
    specs: ["Cero cables expuestos", "Cajetín estanco IP66", "Norma de seguridad"],
  },
  {
    id: "trabajo-2",
    src: "/landing/instalacion-2.jpg",
    alt: "Técnico instalando cámara en poste perimetral en altura",
    title: "Vigilancia en Altura sobre Poste",
    category: "cctv",
    categoryLabel: "CCTV & Perímetros",
    location: "San Juan de los Morros, Guárico",
    description: "Montaje técnico en altura con escaleras certificadas y fijación industrial para cobertura panorámica exterior en perímetro.",
    specs: ["Técnico certificado", "Arnés y seguridad", "Línea de vista amplia"],
  },
  {
    id: "trabajo-3",
    src: "/landing/instalacion-3.jpg",
    alt: "Rack de datos con switches de alta velocidad y puertos activos",
    title: "Cableado Estructurado & Racks",
    category: "racks",
    categoryLabel: "Networking & Racks",
    location: "Valencia, Carabobo",
    description: "Peinado profesional de cableado UTP Cat6, patch panels y switch gigabit de alta velocidad para conectar servidores y NVRs.",
    specs: ["Switch Gigabit", "Peinado de cables", "Monitoreo 24/7"],
  },
  {
    id: "trabajo-4",
    src: "/landing/instalacion-4.jpg",
    alt: "Matriz de 16 cámaras en vivo en supermercado comercial",
    title: "Centro de Monitoreo Comercial",
    category: "comercio",
    categoryLabel: "Comercios & Retail",
    location: "Tinaquillo, Cojedes",
    description: "Sistema centralizado de 16 cámaras para supermercado y tienda retail: cobertura de cajas registradoras, pasillos de alta afluencia y bodega.",
    specs: ["16 Canales en vivo", "Acceso móvil remoto", "Detección inteligente"],
  },
  {
    id: "trabajo-5",
    src: "/landing/instalacion-5.jpg",
    alt: "Cámara PTZ Ezviz vigilando finca campestre y piscina",
    title: "Vigilancia para Fincas & Agro",
    category: "agro",
    categoryLabel: "Fincas & Agro",
    location: "San Juan de los Morros, Guárico",
    description: "Cámara robótica PTZ con giro 360° y visión nocturna a color resguardando áreas verdes, piscina y accesos principales de finca recreacional.",
    specs: ["Visión nocturna color", "Giro 360° PTZ", "Resistente al clima"],
  },
];

const testimoniosReales = [
  {
    cliente: "Supermercado & Víveres La Fe",
    tipo: "Comercial / Supermercado",
    ciudad: "Tinaquillo, Cojedes",
    texto:
      "Tuvimos una pésima experiencia con unos técnicos que dejaron los cables colgando y después nos decían que los equipos estaban quemados. Llamamos a TecnoSmart y no solo salvaron los equipos sino que peinaron todo el rack. Ahora vemos las 16 cámaras desde el teléfono con total nitidez.",
    rating: 5,
    servicio: "CCTV 16 Canales + Rack",
  },
  {
    cliente: "Agropecuaria & Finca Los Pinos",
    tipo: "Agro / Finca",
    ciudad: "San Juan de los Morros, Guárico",
    texto:
      "Instalaron las cámaras robóticas y el enlace de internet satelital. Ningún cable suelto por la lluvia tropical y la cobertura de los postes cubre todo el perímetro de la propiedad. Puntuales y muy honestos.",
    rating: 5,
    servicio: "CCTV Perimetral + Conectividad",
  },
  {
    cliente: "Corporación Logística Central",
    tipo: "Empresarial / Almacén",
    ciudad: "Valencia, Carabobo",
    texto:
      "El nivel de detalle en la canalización conduit es lo que más nos convenció. Cumplieron con las normas de seguridad industrial de nuestro almacén. Tienen garantía por escrito y dan soporte de verdad.",
    rating: 5,
    servicio: "Cableado Estructurado + CCTV",
  },
];

export default function TrabajosTestimoniosSection() {
  const [filter, setFilter] = useState<string>("todos");
  const [lightboxItem, setLightboxItem] = useState<TrabajoItem | null>(null);

  const filteredTrabajos =
    filter === "todos"
      ? trabajosData
      : trabajosData.filter((t) => t.category === filter);

  return (
    <section id="trabajos" className="py-24 bg-[#0a0a0d] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <ScrollReveal direction="up">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-[var(--ts-red)] text-xs font-bold uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-3 py-1 rounded-full">
              Evidencia & Experiencias Reales
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black text-white tracking-tight">
              Trabajos Reales y Testimonios
            </h2>
            <p className="mt-3 text-base text-[#a0a0ac] leading-relaxed">
              Mostramos fotos auténticas de nuestras instalaciones en sitio tomadas por nuestros técnicos durante la entrega de obras.
            </p>

            {/* Filtros dinámicos de categorías */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {[
                { id: "todos", label: "Todas las Instalaciones (5)" },
                { id: "cctv", label: "CCTV & Perímetros" },
                { id: "racks", label: "Networking & Racks" },
                { id: "comercio", label: "Comercios & Retail" },
                { id: "agro", label: "Fincas & Agro" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`text-xs px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                    filter === f.id
                      ? "bg-[var(--ts-red)] text-white shadow-lg shadow-red-950/50"
                      : "bg-[#14141b] border border-[#252532] text-[#90909e] hover:text-white hover:border-[#383848]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* ── 1. GALERÍA DE TRABAJOS REALES DINÁMICA ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {filteredTrabajos.map((trabajo, idx) => (
            <ScrollReveal key={trabajo.id} direction="up" delay={idx * 80} duration={650}>
              <div
                onClick={() => setLightboxItem(trabajo)}
                className="h-full group flex flex-col bg-[#131319] border border-[#23232d] hover:border-[var(--ts-red)]/60 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-red-950/20"
              >
              {/* Contenedor de la foto con overlay de zoom */}
              <div className="relative aspect-[4/3] w-full bg-black overflow-hidden">
                <Image
                  src={trabajo.src}
                  alt={trabajo.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                
                {/* Badge de Categoría */}
                <div className="absolute top-3 left-3 bg-[#0f0f14]/90 border border-[#2c2c3a] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-md">
                  {trabajo.categoryLabel}
                </div>

                {/* Botón de Zoom en Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 bg-[var(--ts-red)] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Ver detalle</span>
                  </span>
                </div>

                {/* Ubicación */}
                <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md border border-white/10 text-white/90 text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[var(--ts-red)]" />
                  <span>{trabajo.location}</span>
                </div>
              </div>

              {/* Contenido descriptivo de la obra */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-bold text-white group-hover:text-[var(--ts-red)] transition-colors mb-2">
                    {trabajo.title}
                  </h4>
                  <p className="text-xs text-[#9595a4] leading-relaxed mb-4">
                    {trabajo.description}
                  </p>
                </div>

                {/* Especificaciones */}
                <div className="pt-3 border-t border-[#1e1e28] flex flex-wrap gap-1.5">
                  {trabajo.specs.map((spec) => (
                    <span
                      key={spec}
                      className="text-[10px] font-medium bg-[#1c1c26] text-[#b0b0be] px-2 py-0.5 rounded border border-[#282836]"
                    >
                      ✓ {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            </ScrollReveal>
          ))}
        </div>

        {/* ── 2. TESTIMONIOS REALES DE CLIENTES ── */}
        <div>
          <ScrollReveal direction="up">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#202028]">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Quote className="w-5 h-5 text-[var(--ts-red)]" />
                  <span>Experiencias de Clientes Atendidos</span>
                </h3>
                <p className="text-xs text-[#858590]">
                  Historias de empresas y familias que confiaron en nuestro equipo técnico.
                </p>
              </div>
              <div className="flex items-center gap-1 text-[var(--ts-red)] font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Garantía 100% Cumplida</span>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimoniosReales.map((t, idx) => (
              <ScrollReveal key={t.cliente} direction="up" delay={idx * 100} duration={650}>
                <div className="h-full bg-[#121217] border border-[#22222b] hover:border-[var(--ts-red)]/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-red-950/15 hover:-translate-y-1">
                  <div>
                    {/* Rating 5 estrellas */}
                    <div className="flex items-center gap-1 text-amber-400 mb-4">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>

                    <p className="text-xs sm:text-sm text-[#c0c0cf] leading-relaxed italic mb-6">
                      "{t.texto}"
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#1f1f2a]">
                    <p className="text-sm font-bold text-white">{t.cliente}</p>
                    <p className="text-xs text-[#858592]">{t.tipo} · {t.ciudad}</p>
                    <span className="inline-block mt-2 text-[10px] font-mono text-[var(--ts-red)] font-semibold bg-red-950/30 border border-red-900/40 px-2 py-0.5 rounded">
                      {t.servicio}
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

      </div>

      {/* ── MODAL LIGHTBOX INTERACTIVO ── */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="relative bg-[#14141c] border border-[#303040] rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón Cerrar */}
            <button
              onClick={() => setLightboxItem(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/70 border border-white/20 text-white flex items-center justify-center hover:bg-[var(--ts-red)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-black">
              <Image
                src={lightboxItem.src}
                alt={lightboxItem.alt}
                fill
                priority
                className="object-contain"
              />
            </div>

            <div className="p-6 bg-[#161622] border-t border-[#252536]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-[var(--ts-red)] uppercase tracking-wider">
                  {lightboxItem.categoryLabel}
                </span>
                <span className="text-xs text-[#90909e] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[var(--ts-red)]" />
                  {lightboxItem.location}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {lightboxItem.title}
              </h3>
              <p className="text-sm text-[#b0b0be] leading-relaxed mb-4">
                {lightboxItem.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {lightboxItem.specs.map((s) => (
                  <span
                    key={s}
                    className="text-xs font-medium bg-[#1e1e2d] text-emerald-400 px-3 py-1 rounded-lg border border-emerald-900/30"
                  >
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
