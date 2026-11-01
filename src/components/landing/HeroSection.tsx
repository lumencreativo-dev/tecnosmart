"use client";

import { ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import LandingImage from "./LandingImage";

export default function HeroSection() {
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

      {/* Gradientes decorativos de marca */}
      <div className="absolute top-1/4 left-0 -translate-x-1/2 w-96 h-96 bg-[var(--ts-red)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 translate-x-1/3 w-96 h-96 bg-[var(--ts-red)]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Columna Izquierda: Mensaje y CTA */}
          <div className="lg:col-span-7 text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[var(--ts-red)]/15 border border-[var(--ts-red)]/40 text-[var(--ts-red)] text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-6">
              <ShieldCheck className="w-4 h-4" />
              <span>Seguridad Electrónica & Soluciones Tecnológicas</span>
            </div>

            {/* Titular Principal Exacto */}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-white leading-[1.12] tracking-tight mb-5">
              Tu seguridad es nuestra prioridad,{" "}
              <span className="text-[var(--ts-red)]">
                y nos comprometemos de verdad contigo
              </span>
            </h1>

            {/* Subtítulo Aprobado */}
            <p className="text-base sm:text-lg text-[#c8c8cf] leading-relaxed mb-6">
              Instalaciones de seguridad realizadas por técnicos certificados,
              limpias y según normas internacionales, por una empresa familiar en la que puedes confiar.
            </p>

            {/* A quién va dirigido */}
            <div className="bg-[#141418] border border-[#25252e] rounded-xl p-4 mb-8">
              <p className="text-xs uppercase tracking-wider text-[var(--ts-red)] font-bold mb-1.5">
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
                  className="inline-flex items-center justify-center gap-2 bg-[var(--ts-red)] hover:bg-[#b01f25] text-white font-bold text-base px-8 py-4 rounded-xl shadow-xl shadow-red-950/50 transition-all hover:scale-[1.02]"
                >
                  <span>Solicita tu asesoría gratuita</span>
                  <ArrowRight className="w-5 h-5" />
                </a>

                <a
                  href="#servicios"
                  className="inline-flex items-center justify-center gap-2 border border-[#353540] hover:border-[var(--ts-red)] text-[#d5d5dc] hover:text-white font-semibold text-base px-6 py-4 rounded-xl bg-[#141419]/60 hover:bg-[#181822] transition-all"
                >
                  Ver servicios
                </a>
              </div>

              {/* Promesa Visible */}
              <p className="text-xs sm:text-sm text-[var(--ts-red)] font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Te llamará uno de nuestros ingenieros en menos de 24 horas hábiles.</span>
              </p>
            </div>

            {/* Estadística Real Verificada */}
            <div className="pt-6 border-t border-[#202028] flex items-center gap-6">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-[var(--ts-red)]">
                  +200
                </div>
                <div className="text-xs sm:text-sm text-[#90909a] uppercase tracking-wider font-semibold">
                  Proyectos instalados
                </div>
              </div>
              <div className="h-10 w-px bg-[#252530]" />
              <div className="text-xs text-[#9a9aa5] max-w-xs leading-relaxed">
                Instalaciones reales ejecutadas con métodos estandarizados y acabados de nivel internacional.
              </div>
            </div>
          </div>

          {/* Columna Derecha: [FOTO: hero] */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="w-full aspect-[4/3] sm:aspect-[16/11] rounded-2xl overflow-hidden shadow-2xl shadow-black/80">
                <LandingImage
                  src="/landing/hero.jpg"
                  alt="Instalación profesional de seguridad TecnoSmart"
                  label="[FOTO: hero]"
                  fileHint="public/landing/hero.jpg"
                  fill
                  priority
                  className="w-full h-full min-h-[320px] sm:min-h-[380px]"
                />
              </div>

              {/* Tarjeta flotante con sello de calidad */}
              <div className="hidden sm:flex absolute -bottom-5 -left-5 bg-[#17171d] border border-[#2e2e38] rounded-xl p-3.5 shadow-xl items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--ts-red)]/20 border border-[var(--ts-red)]/40 flex items-center justify-center text-[var(--ts-red)] font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Instalaciones Limpias</p>
                  <p className="text-[11px] text-[#909098]">Normas técnicas internacionales</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
