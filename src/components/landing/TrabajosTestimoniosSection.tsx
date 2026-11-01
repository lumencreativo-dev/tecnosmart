"use client";

import { Camera, Quote, MessageSquare, CheckCircle2 } from "lucide-react";
import LandingImage from "./LandingImage";

const fotosTrabajos = [
  {
    src: "/landing/instalacion-1.jpg",
    alt: "Instalación real 1 de videovigilancia o redes",
    label: "[FOTO: Instalación real 1]",
    fileHint: "public/landing/instalacion-1.jpg",
    sublabel: "Proyecto comercial / residencial",
  },
  {
    src: "/landing/instalacion-2.jpg",
    alt: "Instalación real 2 de seguridad o cableado",
    label: "[FOTO: Instalación real 2]",
    fileHint: "public/landing/instalacion-2.jpg",
    sublabel: "Orden y canalización técnica",
  },
  {
    src: "/landing/instalacion-3.jpg",
    alt: "Instalación real 3 de Starlink o automatización",
    label: "[FOTO: Instalación real 3]",
    fileHint: "public/landing/instalacion-3.jpg",
    sublabel: "Acabados limpios bajo normas",
  },
];

const testimoniosPendientes = [
  {
    tipo: "Comercial / Tienda",
    marcador: "[PENDIENTE: Testimonio de cliente comercial sobre instalación de cámaras y videovigilancia]",
    nota: "Espacio reservado para la reseña real de un comerciante atendido.",
  },
  {
    tipo: "Empresa / Corporativo",
    marcador: "[PENDIENTE: Testimonio de cliente corporativo sobre cableado estructurado y orden en racks]",
    nota: "Espacio reservado para la reseña real de una empresa local.",
  },
  {
    tipo: "Residencial / Hogar",
    marcador: "[PENDIENTE: Testimonio de cliente residencial sobre Starlink o domótica]",
    nota: "Espacio reservado para la reseña real de un cliente residencial.",
  },
];

export default function TrabajosTestimoniosSection() {
  return (
    <section id="trabajos" className="py-24 bg-[#0a0a0d] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-[var(--ts-red)] text-xs font-bold uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-3 py-1 rounded-full">
            Evidencia & Experiencias
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-black text-white tracking-tight">
            Trabajos Reales y Testimonios
          </h2>
          <p className="mt-3 text-base text-[#a0a0ac] leading-relaxed">
            Mostramos fotos auténticas de nuestras instalaciones en sitio y testimonios reales de clientes atendidos, sin montajes ni imágenes falsas.
          </p>
        </div>

        {/* ── 1. GALERÍA DE TRABAJOS REALES ── */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#202028]">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-[var(--ts-red)]" />
                <span>Instalaciones en Sitio</span>
              </h3>
              <p className="text-xs text-[#858590]">
                Fotografías tomadas por nuestros técnicos durante la entrega de obras.
              </p>
            </div>
            <span className="text-xs font-mono text-[#a0a0b0] bg-[#16161d] px-3 py-1 rounded-full border border-[#272733]">
              Normas internacionales
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {fotosTrabajos.map((foto) => (
              <div key={foto.label} className="flex flex-col">
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl shadow-black/60 bg-[#131317]">
                  <LandingImage
                    src={foto.src}
                    alt={foto.alt}
                    label={foto.label}
                    fileHint={foto.fileHint}
                    fill
                    className="w-full h-full"
                  />
                </div>
                <div className="mt-2.5 px-2 flex items-center justify-between text-xs text-[#858590]">
                  <span>{foto.sublabel}</span>
                  <span className="text-[11px] text-[var(--ts-red)] font-medium">Verificado</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2. TESTIMONIOS DE CLIENTES (MARCADORES VISIBLES PENDIENTES) ── */}
        <div>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#202028]">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[var(--ts-red)]" />
                <span>Opiniones de Quienes Confían en Nosotros</span>
              </h3>
              <p className="text-xs text-[#858590]">
                Sin testimonios inventados: espacio reservado exclusivamente para opiniones verificadas de clientes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimoniosPendientes.map((test) => (
              <div
                key={test.marcador}
                className="bg-[#121217] border border-dashed border-[#2b2b36] rounded-2xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Quote className="w-8 h-8 text-[var(--ts-red)]/40" />
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--ts-red)] bg-red-950/40 border border-red-900/30 px-2 py-0.5 rounded">
                      {test.tipo}
                    </span>
                  </div>

                  {/* Marcador visible obligatorio de la regla 2 */}
                  <div className="bg-[#181820] border border-[#2d2d3a] rounded-xl p-4 mb-4">
                    <p className="text-xs sm:text-sm font-semibold text-white/90 leading-relaxed font-mono">
                      {test.marcador}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1e1e26] text-[11px] text-[#70707c]">
                  {test.nota}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
