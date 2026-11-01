"use client";

import { AlertTriangle, ShieldAlert, Wrench, RefreshCw, CheckCircle2 } from "lucide-react";

export default function ProblemaSection() {
  return (
    <section id="problema" className="py-20 sm:py-24 bg-[#0e0e12] border-t border-b border-[#1c1c24] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado de la sección */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-flex items-center gap-1.5 text-[var(--ts-red)] text-xs font-bold uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-3 py-1 rounded-full mb-4">
            <AlertTriangle className="w-3.5 h-3.5" />
            La realidad de la seguridad en el país
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
            El problema: la experiencia de robos y la trampa de las malas instalaciones
          </h2>
          <p className="text-base text-[#a5a5b2] leading-relaxed">
            Sabemos por qué buscas seguridad: proteger lo tuyo después de vivir un robo o por la necesidad urgente de prevenirlo. Pero en este sector es muy fácil toparse con malas prácticas.
          </p>
        </div>

        {/* 3 Dolores clave del cliente */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          
          {/* Tarjeta 1 */}
          <div className="bg-[#14141a] border border-[#23232e] rounded-2xl p-7 relative hover:border-[var(--ts-red)]/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)] mb-5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              El miedo y la vulnerabilidad
            </h3>
            <p className="text-sm text-[#9e9ea8] leading-relaxed">
              Muchas personas acuden a nosotros tras sufrir hurtos o robos. Quieren recuperar la paz y saber que su negocio, mercancía y familia están verdaderamente resguardados.
            </p>
          </div>

          {/* Tarjeta 2 */}
          <div className="bg-[#14141a] border border-[#23232e] rounded-2xl p-7 relative hover:border-[var(--ts-red)]/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)] mb-5">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Técnicos que dejan trampas
            </h3>
            <p className="text-sm text-[#9e9ea8] leading-relaxed">
              En este rubro abunda la desconfianza: técnicos informales que hacen instalaciones descuidadas, cables sueltos y configuraciones improvisadas que fallan a las pocas semanas.
            </p>
          </div>

          {/* Tarjeta 3 */}
          <div className="bg-[#14141a] border border-[#23232e] rounded-2xl p-7 relative hover:border-[var(--ts-red)]/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)] mb-5">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              El ciclo del cobro continuo
            </h3>
            <p className="text-sm text-[#9e9ea8] leading-relaxed">
              Hacen un trabajo deficiente y luego vuelven a cobrar visitas y supuestas reparaciones por lo que debió quedar bien hecho desde la primera vez. Un gasto de dinero y tiempo sin fin.
            </p>
          </div>

        </div>

        {/* El contraste con TecnoSmart */}
        <div className="bg-gradient-to-r from-[#171720] via-[#1a1a24] to-[#171720] border border-[#2b2b38] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <p className="text-xs font-bold text-[var(--ts-red)] uppercase tracking-wider">
              La diferencia TecnoSmart
            </p>
            <h4 className="text-xl font-bold text-white">
              Nosotros ponemos fin a ese ciclo desde el día uno
            </h4>
            <p className="text-sm text-[#a5a5b0] max-w-2xl leading-relaxed">
              Trabajamos con técnicos certificados, protocolos de instalación limpios según normas internacionales y un compromiso honesto: lo que instalamos funciona y se mantiene funcionando.
            </p>
          </div>
          <a
            href="#video"
            className="inline-flex items-center gap-2 bg-[#22222d] hover:bg-[#2b2b3a] border border-[#373748] text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all whitespace-nowrap"
          >
            <span>Ver cómo lo resolvemos</span>
            <span className="text-[var(--ts-red)]">↓</span>
          </a>
        </div>

      </div>
    </section>
  );
}
