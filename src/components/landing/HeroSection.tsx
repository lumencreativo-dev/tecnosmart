"use client";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

export default function HeroSection() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "584122789273";

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #111111 0%, #1a1a2e 40%, #05235b 100%)",
      }}
    >
      {/* Grid decorativo de fondo */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(#c9242b 1px, transparent 1px), linear-gradient(90deg, #c9242b 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Círculos de acento */}
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-[#c9242b] opacity-5 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-[#05235b] opacity-20 blur-3xl" />

      {/* Contenido */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 bg-[#c9242b]/20 border border-[#c9242b]/40 text-[#c9242b] text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
          <Zap className="w-3 h-3" />
          Distribuidor Oficial Hikvision · Venezuela
        </span>

        {/* Título principal */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
          Seguridad Electrónica &{" "}
          <span className="text-[#c9242b]">Automatización Inteligente</span>
        </h1>

        <p className="text-lg sm:text-xl text-[#d9d9d9] max-w-3xl mx-auto mb-10 leading-relaxed">
          Sistemas de videovigilancia, domótica, control de acceso y redes de
          alta velocidad para empresas, comercios y hogares en Tinaquillo y toda
          Venezuela.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={`https://wa.me/${wa}?text=Quiero%20solicitar%20una%20cotizaci%C3%B3n`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#c9242b] hover:bg-red-700 text-white font-bold text-base px-8 py-4 rounded-lg shadow-lg shadow-red-900/40 transition-all hover:scale-105"
          >
            Solicitar Cotización
            <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="#servicios"
            className="inline-flex items-center gap-2 border border-[#d9d9d9]/40 hover:border-[#c9242b] text-[#d9d9d9] hover:text-white font-semibold text-base px-8 py-4 rounded-lg transition-all"
          >
            Ver Servicios
          </a>
        </div>

        {/* Stats rápidas */}
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {[
            { val: "+200", label: "Proyectos" },
            { val: "5★",   label: "Garantía hasta 5 años" },
            { val: "24h",  label: "Soporte técnico" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-extrabold text-[#c9242b]">{s.val}</div>
              <div className="text-xs text-[#6e6e6e] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[#6e6e6e] text-xs">
        <span>Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-[#6e6e6e] to-transparent" />
      </div>
    </section>
  );
}
