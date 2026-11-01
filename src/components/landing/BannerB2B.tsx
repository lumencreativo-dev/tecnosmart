"use client";

import { ArrowRight, Wrench, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function BannerB2B() {
  return (
    <section id="b2b" className="py-16 bg-[#101015] border-t border-b border-[#20202a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#15151e] via-[#1a1a26] to-[#15151e] border border-[#282836] rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
          
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[var(--ts-red)]/15 border border-[var(--ts-red)]/40 text-[var(--ts-red)] text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full">
              <Wrench className="w-3.5 h-3.5" />
              <span>Para Técnicos e Instaladores</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white">
              ¿Eres instalador o técnico independiente?
            </h3>

            <p className="text-sm text-[#a5a5b2] leading-relaxed">
              Trabajamos de la mano con profesionales del área en todo el país. En nuestro formulario de asesoría puedes identificarte como <strong>Técnico-Instalador</strong> para coordinar requerimientos técnicos, soporte y proyectos conjuntos con nuestros ingenieros.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#c0c0cc]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--ts-red)]" />
                Coordinación con ingenieros certificados
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--ts-red)]" />
                Respaldo en proyectos a nivel nacional
              </span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <a
              href="#asesoria-gratuita"
              className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-[#b01f25] text-white font-bold px-7 py-4 rounded-xl shadow-lg shadow-red-950/40 transition-all hover:scale-105"
            >
              <span>Solicitar asesoría técnica</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
