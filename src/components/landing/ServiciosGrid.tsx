"use client";

import Image from "next/image";
import {
  Video,
  Radio,
  DoorClosed,
  Network,
  Cpu,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { ALL_BRANDS } from "@/lib/brand-logos";
import ScrollReveal from "./ScrollReveal";

const servicios = [
  {
    num: "01",
    titulo: "Cámaras y seguridad",
    destacado: "El fuerte actual",
    icono: Video,
    image: "/landing/instalacion-1.jpg",
    descripcion:
      "Instalación de sistemas de videovigilancia CCTV e IP de alta definición. Monitoreo confiable y seguro para proteger comercios, empresas y residencias.",
    items: [
      "Instalación de sistemas CCTV y cámaras IP",
      "Configuración de visualización remota en móviles y PC",
      "Visión nocturna a color, detección IA y almacenamiento",
      "Garantía oficial de 1 año en cámaras",
    ],
  },
  {
    num: "02",
    titulo: "Starlink",
    destacado: "Conectividad Satelital",
    icono: Radio,
    image: "/landing/starlink-mini.jpg",
    descripcion:
      "Instalación profesional de antenas Mini y Standard, configuración técnica de red e intermediación en el pago de la mensualidad.",
    items: [
      "Montaje seguro de antena y alineación satelital",
      "Configuración de router y distribución de red Wi-Fi",
      "Gestión de pago de mensualidad (sin tarjeta internacional)",
      "Sin precios fijos en la web: cotización a medida",
    ],
  },
  {
    num: "03",
    titulo: "Domótica y control de acceso",
    destacado: "Automatización & Accesos",
    icono: DoorClosed,
    image: "/landing/instalacion-5.jpg",
    descripcion:
      "Control inteligente de accesos para empresas y hogares. Cerraduras digitales, biometría y automatización de puntos de entrada.",
    items: [
      "Control de acceso biométrico, tarjeta y teclado",
      "Cerraduras electrónicas e inteligentes",
      "Automatización de portones y puntos de paso",
      "Gestión de permisos de acceso por usuario",
    ],
  },
  {
    num: "04",
    titulo: "Cableado estructurado y redes",
    destacado: "Infraestructura",
    icono: Network,
    image: "/landing/instalacion-3.jpg",
    descripcion:
      "Tendido ordenado de cableado de red bajo normas internacionales, organización de racks y conectividad de alta estabilidad.",
    items: [
      "Cableado estructurado para datos y telefonía",
      "Peinado y organización profesional de racks",
      "Switches, routers y puntos de acceso Wi-Fi",
      "Terminaciones limpias y rotuladas",
    ],
  },
  {
    num: "05",
    titulo: "Automatizaciones y soluciones tecnológicas para empresas",
    destacado: "Software & Procesos",
    icono: Cpu,
    image: "/landing/hero.jpg",
    descripcion:
      "Desarrollo web, aplicaciones y sistemas digitales diseñados para resolver procesos reales y optimizar la operativa de tu empresa.",
    items: [
      "Desarrollo web corporativo y plataformas a medida",
      "Sistemas internos y aplicaciones para gestión de procesos",
      "Integraciones de hardware con software empresarial",
      "Soluciones tecnológicas diseñadas para tu negocio",
    ],
  },
];

export default function ServiciosGrid() {
  return (
    <section id="servicios" className="py-24 bg-[#0a0a0d] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado con ScrollReveal */}
        <ScrollReveal direction="up">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[var(--ts-red)] text-xs font-bold uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-3 py-1 rounded-full">
              Servicios Profesionales
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black text-white tracking-tight">
              Soluciones Tecnológicas a la Medida de tu Negocio y Hogar
            </h2>
            <p className="mt-3 text-base text-[#a0a0ac] leading-relaxed">
              Servicios ejecutados por técnicos certificados, con métodos de trabajo estandarizados y acabados limpios según normas internacionales.
            </p>
          </div>
        </ScrollReveal>

        {/* Grid de Servicios con Staggered ScrollReveal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicios.map((s, idx) => {
            const Icon = s.icono;
            const isWide = idx === 4;
            return (
              <ScrollReveal
                key={s.titulo}
                direction="up"
                delay={idx * 80}
                duration={650}
                className={isWide ? "md:col-span-2 lg:col-span-2" : ""}
              >
                <div className="h-full group bg-[#131318] border border-[#23232c] rounded-2xl overflow-hidden hover:border-[var(--ts-red)]/50 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-red-950/20 hover:-translate-y-1.5">
                  <div>
                    {/* Foto de cabecera sutil del servicio */}
                    <div className="relative aspect-[16/7] w-full bg-black overflow-hidden">
                      <Image
                        src={s.image}
                        alt={s.titulo}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#131318] via-[#131318]/50 to-transparent" />
                      
                      {/* Badge destacado sobre la foto */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--ts-red)] bg-[#0d0d12]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-red-900/40">
                          {s.destacado}
                        </span>
                        <span className="text-xs font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded backdrop-blur-md">
                          {s.num}
                        </span>
                      </div>

                      {/* Icono flotante superpuesto */}
                      <div className="absolute -bottom-3 left-6 w-12 h-12 rounded-xl bg-[#1a1a24] border border-[#353545] flex items-center justify-center text-[var(--ts-red)] group-hover:bg-[var(--ts-red)] group-hover:text-white transition-all shadow-xl">
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-7 pt-7">
                      <h3 className="text-xl font-bold text-white mb-2.5 group-hover:text-red-400 transition-colors">
                        {s.titulo}
                      </h3>
                      <p className="text-sm text-[#9c9ca8] leading-relaxed mb-6">
                        {s.descripcion}
                      </p>

                      {/* Items de características */}
                      <ul className="space-y-2.5 mb-6">
                        {s.items.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2.5 text-xs sm:text-sm text-[#d0d0d8]"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[var(--ts-red)] flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer de Tarjeta con Link al Formulario */}
                  <div className="p-7 pt-0 border-t border-[#1f1f28] mt-auto">
                    <a
                      href="#asesoria-gratuita"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b5b5c0] hover:text-[var(--ts-red)] transition-colors pt-4 group-hover:translate-x-1 duration-200"
                    >
                      <span>Cotizar este servicio en asesoría</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* ── STRIP DE MARCAS TECNOLÓGICAS: MARQUEE INFINITO FLUIDO ── */}
        <ScrollReveal direction="up" delay={200}>
          <div className="mt-20 pt-12 border-t border-[#1f1f28]">
            <div className="text-center mb-8">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-white/[0.03] border border-white/10 px-3.5 py-1.5 rounded-full inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--ts-red)] animate-pulse" />
                Equipos y componentes de fabricantes reconocidos mundialmente
              </span>
            </div>

            {/* Carrusel continuo tipo ticker tape con máscara de desvanecimiento lateral */}
            <div className="relative w-full overflow-hidden mask-marquee-fade py-3">
              <div className="animate-marquee-infinite flex items-center gap-12 sm:gap-16">
                {/* Primer ciclo de marcas */}
                {ALL_BRANDS.map(({ name, category, Logo }) => (
                  <div
                    key={`${name}-1`}
                    className="flex-shrink-0 flex items-center justify-center opacity-65 hover:opacity-100 transition-all duration-300 hover:scale-105 cursor-pointer group"
                    title={`${name} — ${category}`}
                  >
                    <div className="h-8 max-w-[150px] flex items-center justify-center text-slate-300 group-hover:text-white transition-colors">
                      <Logo className="h-7 w-auto object-contain max-h-7" />
                    </div>
                  </div>
                ))}

                {/* Segundo ciclo duplicado para empalme infinito sin saltos */}
                {ALL_BRANDS.map(({ name, category, Logo }) => (
                  <div
                    key={`${name}-2`}
                    className="flex-shrink-0 flex items-center justify-center opacity-65 hover:opacity-100 transition-all duration-300 hover:scale-105 cursor-pointer group"
                    title={`${name} — ${category}`}
                  >
                    <div className="h-8 max-w-[150px] flex items-center justify-center text-slate-300 group-hover:text-white transition-colors">
                      <Logo className="h-7 w-auto object-contain max-h-7" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-[11px] text-[#606070] mt-5">
              Pasa el cursor o pulsa para pausar · Instalación bajo especificaciones oficiales de cada fabricante
            </p>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
