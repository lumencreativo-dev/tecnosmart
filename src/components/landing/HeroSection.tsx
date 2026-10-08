"use client";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function HeroSection() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "584122789273";

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Foto de fondo — cámaras de seguridad nocturnas */}
      <Image
        src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80"
        alt="Sistema de videovigilancia profesional"
        fill
        className="object-cover object-center"
        priority
      />

      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/72" />

      {/* Grid sutil */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Contenido */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 bg-[var(--ts-red)]/20 border border-[var(--ts-red)]/50 text-[var(--ts-red)] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
          <ShieldCheck className="w-3.5 h-3.5" />
          Seguridad Electrónica · Tinaquillo, Venezuela
        </span>

        {/* Título */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-[var(--ts-text-primary)] leading-[1.05] mb-4 tracking-tight">
          Seguridad Electrónica &{" "}
          <span className="text-[var(--ts-red)]">Automatización</span>{" "}
          Inteligente
        </h1>

        {/* Lema */}
        <p className="text-lg sm:text-2xl text-[#d9d9d9] font-light italic mt-4 mb-8">
          "Tu seguridad, es nuestra prioridad."
        </p>

        <p className="text-sm sm:text-base text-[var(--ts-text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
          Videovigilancia · Domótica · Redes · Control de Acceso · Starlink.<br />
          Soluciones para empresas, comercios y hogares.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={`https://wa.me/${wa}?text=Hola%20TecnoSmart%2C%20quiero%20una%20cotizaci%C3%B3n`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 text-[var(--ts-text-primary)] font-bold text-base px-8 py-4 rounded-lg shadow-xl shadow-red-900/40 transition-all hover:scale-105"
          >
            Solicitar Cotización
            <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="#servicios"
            className="inline-flex items-center gap-2 border border-white/25 hover:border-[var(--ts-red)] text-white/80 hover:text-[var(--ts-text-primary)] font-semibold text-base px-8 py-4 rounded-lg transition-all"
          >
            Ver Servicios
          </a>
        </div>

        {/* Stats */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-16">
          {[
            { val: "+200", label: "Proyectos instalados" },
            { val: "5 años", label: "Garantía en redes" },
            { val: "24/7", label: "Soporte técnico" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-[var(--ts-red)]">{s.val}</div>
              <div className="text-xs text-[var(--ts-text-muted)] mt-1 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[var(--ts-text-muted)] text-xs">
        <div className="w-px h-10 bg-gradient-to-b from-[#6e6e6e] to-transparent" />
      </div>
    </section>
  );
}
