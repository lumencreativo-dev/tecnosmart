"use client";

import { useState } from "react";
import { ShieldCheck, Clock, CheckCircle2, LifeBuoy, ArrowRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import FormularioSoporteModal from "./FormularioSoporteModal";

export default function GarantiaSoporteSection() {
  const [modalSoporteOpen, setModalSoporteOpen] = useState(false);

  return (
    <>
      <FormularioSoporteModal
        isOpen={modalSoporteOpen}
        onClose={() => setModalSoporteOpen(false)}
      />
      <section id="garantia" className="py-24 bg-[#0e0e12] border-t border-[#1a1a24] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado con ScrollReveal */}
        <ScrollReveal direction="up">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-[var(--ts-red)] text-xs font-bold uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-3 py-1 rounded-full">
              Sin Exageraciones Ni Falsas Promesas
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black text-white tracking-tight">
              Garantía y Soporte Reales
            </h2>
            <p className="mt-3 text-base text-[#a0a0ac] leading-relaxed">
              En un mercado donde se promete lo imposible para vender, nosotros te decimos exactamente con qué respaldo cuentas, por escrito y con seriedad técnica.
            </p>
          </div>
        </ScrollReveal>

        {/* 2 Bloques Centrales: Garantía 1 año + Soporte L-V */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          
          {/* Bloque Garantía */}
          <ScrollReveal direction="right" duration={700}>
            <div className="h-full bg-[#14141a] border border-[#23232e] hover:border-[var(--ts-red)]/50 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-red-950/15 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)] mb-6 group-hover:scale-110 group-hover:bg-[var(--ts-red)] group-hover:text-white transition-all shadow-md">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">1 Año de Garantía</span>
                  <span className="text-xs uppercase font-bold text-[var(--ts-red)] bg-red-950/50 border border-red-900/40 px-2 py-0.5 rounded">
                    En Cámaras
                  </span>
                </div>
                <p className="text-sm text-[#9c9ca8] leading-relaxed mb-6">
                  Respaldo directo en equipos de videovigilancia ante defectos de fábrica. Si una cámara presenta falla de origen dentro del primer año, tramitamos su solución con seriedad y rapidez.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-[#c5c5d0] pt-4 border-t border-[#20202c]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--ts-red)] flex-shrink-0" />
                  <span>Equipos originales y certificados de fábrica</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--ts-red)] flex-shrink-0" />
                  <span>Diagnóstico profesional y oportuno</span>
                </li>
              </ul>
            </div>
          </ScrollReveal>

          {/* Bloque Soporte Básico */}
          <ScrollReveal direction="left" duration={700} delay={100}>
            <div className="h-full bg-[#14141a] border border-[#23232e] hover:border-[var(--ts-red)]/50 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-red-950/15 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)] mb-6 group-hover:scale-110 group-hover:bg-[var(--ts-red)] group-hover:text-white transition-all shadow-md">
                  <Clock className="w-7 h-7" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">Soporte Básico Personalizado</span>
                </div>
                <p className="text-sm text-[#9c9ca8] leading-relaxed mb-6">
                  Atención directa para resolver dudas de configuración, acceso a la app móvil y preguntas sobre el funcionamiento del sistema en horario laboral, de lunes a viernes.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-[#c5c5d0] pt-4 border-t border-[#20202c]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--ts-red)] flex-shrink-0" />
                  <span>Lunes a Viernes de 8:00 AM a 5:00 PM</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--ts-red)] flex-shrink-0" />
                  <span>Atención por técnicos, no por bots genéricos</span>
                </li>
              </ul>
            </div>
          </ScrollReveal>

        </div>

        {/* Call to Action Directo: Mesa de Ayuda */}
        <ScrollReveal direction="up" delay={200}>
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#171722] via-[#1c1c28] to-[#171722] border border-[#2b2b3d] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  ¿Presentas una falla en tus equipos o internet satelital?
                </h4>
                <p className="text-xs text-[#9d9db0] mt-1">
                  Abre un ticket técnico con tu cédula o RIF para atención inmediata de guardia.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalSoporteOpen(true)}
              className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-red-950/40 transition-all hover:scale-105 shrink-0"
            >
              <span>Abrir Ticket de Soporte</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </ScrollReveal>

      </div>
    </section>
  </>
  );
}
