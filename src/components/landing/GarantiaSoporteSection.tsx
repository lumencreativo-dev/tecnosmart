"use client";

import { ShieldCheck, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default function GarantiaSoporteSection() {
  return (
    <section id="garantia" className="py-24 bg-[#0e0e12] border-t border-[#1a1a24] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
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

        {/* 2 Bloques Centrales: Garantía 1 año + Soporte L-V */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          
          {/* Bloque Garantía */}
          <div className="bg-[#14141a] border border-[#23232e] rounded-2xl p-8 hover:border-[var(--ts-red)]/40 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)] mb-6">
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
            <ul className="space-y-2 text-xs text-[#c5c5d0]">
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

          {/* Bloque Soporte Básico */}
          <div className="bg-[#14141a] border border-[#23232e] rounded-2xl p-8 hover:border-[var(--ts-red)]/40 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)] mb-6">
              <Clock className="w-7 h-7" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl sm:text-3xl font-black text-white">Soporte Básico Personalizado</span>
            </div>
            <p className="text-sm text-[#9c9ca8] leading-relaxed mb-6">
              Atención directa de lunes a viernes en horario de oficina. Hablas con técnicos e ingenieros reales, no con contestadores automáticos que no entienden tu sistema.
            </p>
            <ul className="space-y-2 text-xs text-[#c5c5d0]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--ts-red)] flex-shrink-0" />
                <span>Horario de lunes a viernes (horas hábiles de oficina)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--ts-red)] flex-shrink-0" />
                <span>Orientación personalizada por técnicos capacitados</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Nota de Honestidad Profesional */}
        <div className="max-w-4xl mx-auto bg-[#171720] border border-[#2a2a38] rounded-xl p-5 flex items-start sm:items-center gap-4 text-xs sm:text-sm text-[#a5a5b0]">
          <AlertCircle className="w-5 h-5 text-[var(--ts-red)] flex-shrink-0 mt-0.5 sm:mt-0" />
          <p>
            <strong>Cero letras pequeñas:</strong> No prometemos garantías irreales que luego nadie respalda. Te aseguramos soporte honesto y transparente con el que verdaderamente puedes contar.
          </p>
        </div>

      </div>
    </section>
  );
}
