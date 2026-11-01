"use client";

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

// 5 Servicios en el orden EXACTO aprobado en la sección 3
const servicios = [
  {
    num: "01",
    titulo: "Cámaras y seguridad",
    destacado: "El fuerte actual",
    icono: Video,
    descripcion:
      "Instalación de sistemas de videovigilancia CCTV e IP de alta definición. Monitoreo confiable y seguro para proteger comercios, empresas y residencias.",
    items: [
      "Instalación de sistemas CCTV y cámaras IP",
      "Configuración de visualización remota en móviles y PC",
      "Visión nocturna, detección y almacenamiento seguro",
      "Garantía oficial de 1 año en cámaras",
    ],
  },
  {
    num: "02",
    titulo: "Starlink",
    destacado: "Conectividad Satelital",
    icono: Radio,
    descripcion:
      "Instalación profesional de la antena, configuración técnica de red e intermediación en el pago de la mensualidad.",
    items: [
      "Montaje seguro de antena y alineación satelital",
      "Configuración de router y distribución de red",
      "Gestión de pago de mensualidad (sin tarjeta internacional)",
      "Sin precios fijos en la web: cotización a medida",
    ],
  },
  {
    num: "03",
    titulo: "Domótica y control de acceso",
    destacado: "Automatización & Accesos",
    icono: DoorClosed,
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
    <section id="servicios" className="py-24 bg-[#0a0a0d] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
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

        {/* Grid de Servicios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicios.map((s, idx) => {
            const Icon = s.icono;
            const isWide = idx === 4; // El servicio 5 ocupa 2 columnas en pantallas grandes para un balance perfecto
            return (
              <div
                key={s.titulo}
                className={`group bg-[#131318] border border-[#23232c] rounded-2xl p-7 hover:border-[var(--ts-red)]/50 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-red-950/10 ${
                  isWide ? "md:col-span-2 lg:col-span-2" : ""
                }`}
              >
                <div>
                  {/* Top Bar de la Tarjeta */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)] group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--ts-red)] bg-red-950/40 px-2.5 py-1 rounded-full border border-red-900/30">
                        {s.destacado}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#656570]">
                        {s.num}
                      </span>
                    </div>
                  </div>

                  {/* Título y Descripción */}
                  <h3 className="text-xl font-bold text-white mb-2.5 group-hover:text-red-400 transition-colors">
                    {s.titulo}
                  </h3>
                  <p className="text-sm text-[#9c9ca8] leading-relaxed mb-6">
                    {s.descripcion}
                  </p>

                  {/* Items */}
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

                {/* Footer de Tarjeta con Link al Formulario */}
                <div className="pt-4 border-t border-[#1f1f28]">
                  <a
                    href="#asesoria-gratuita"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b5b5c0] hover:text-[var(--ts-red)] transition-colors"
                  >
                    <span>Cotizar este servicio en asesoría</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── STRIP DE MARCAS TECNOLÓGICAS ── */}
        <div className="mt-20 pt-12 border-t border-[#1f1f28]">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-[#7a7a88] mb-8">
            Equipos y componentes de fabricantes reconocidos mundialmente
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-75 hover:opacity-100 transition-opacity">
            {ALL_BRANDS.map(({ name, Logo }) => (
              <div
                key={name}
                className="flex items-center justify-center text-[#90909c] hover:text-white transition-colors duration-200"
                title={name}
              >
                <Logo className="h-6 w-auto" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
