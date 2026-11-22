"use client";

import Image from "next/image";
import { AlertTriangle, ShieldAlert, Wrench, RefreshCw, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function ProblemaSection() {
  return (
    <section id="problema" className="py-20 sm:py-24 bg-[#0e0e12] border-t border-b border-[#1c1c24] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado de la sección con ScrollReveal */}
        <ScrollReveal direction="up">
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
        </ScrollReveal>

        {/* 3 Dolores clave del cliente con Staggered Reveal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          
          {/* Tarjeta 1 */}
          <ScrollReveal direction="up" delay={50} duration={600}>
            <div className="h-full bg-[#14141a] border border-[#23232e] rounded-2xl p-7 relative hover:border-[var(--ts-red)]/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-red-950/20 group">
              <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)] mb-5 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                El miedo y la vulnerabilidad
              </h3>
              <p className="text-sm text-[#9e9ea8] leading-relaxed">
                Muchas personas acuden a nosotros tras sufrir hurtos o robos. Quieren recuperar la paz y saber que su negocio, mercancía y familia están verdaderamente resguardados.
              </p>
            </div>
          </ScrollReveal>

          {/* Tarjeta 2 */}
          <ScrollReveal direction="up" delay={150} duration={600}>
            <div className="h-full bg-[#14141a] border border-[#23232e] rounded-2xl p-7 relative hover:border-[var(--ts-red)]/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-red-950/20 group">
              <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)] mb-5 group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Técnicos que dejan trampas
              </h3>
              <p className="text-sm text-[#9e9ea8] leading-relaxed">
                En este rubro abunda la desconfianza: técnicos informales que hacen instalaciones descuidadas, cables sueltos y configuraciones improvisadas que fallan a las pocas semanas.
              </p>
            </div>
          </ScrollReveal>

          {/* Tarjeta 3 */}
          <ScrollReveal direction="up" delay={250} duration={600}>
            <div className="h-full bg-[#14141a] border border-[#23232e] rounded-2xl p-7 relative hover:border-[var(--ts-red)]/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-red-950/20 group">
              <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)] mb-5 group-hover:scale-110 transition-transform">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                El ciclo del cobro continuo
              </h3>
              <p className="text-sm text-[#9e9ea8] leading-relaxed">
                Hacen un trabajo deficiente y luego vuelven a cobrar visitas y supuestas reparaciones por lo que debió quedar bien hecho desde la primera vez. Un gasto de dinero y tiempo sin fin.
              </p>
            </div>
          </ScrollReveal>

        </div>

        {/* ── MÓDULO ANTES VS DESPUÉS (EVIDENCIA FOTOGRÁFICA REAL) ── */}
        <ScrollReveal direction="zoom" duration={800}>
          <div className="mb-14 bg-[#121218] border border-[#242430] rounded-3xl p-6 sm:p-10 shadow-2xl">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--ts-red)] font-bold bg-red-950/40 border border-red-900/40 px-3 py-1 rounded-full">
                Evidencia Real en Campo
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-3 mb-2">
                Mira la diferencia con tus propios ojos
              </h3>
              <p className="text-sm text-[#90909c]">
                Caso documentado: Cómo encontramos los equipos de un cliente que nos llamó tras una mala experiencia, frente al estándar que entregamos en TecnoSmart.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              
              {/* Tarjeta ANTES: La trampa de la competencia */}
              <ScrollReveal direction="right" delay={100} duration={700}>
                <div className="h-full flex flex-col bg-[#191922] border-2 border-red-900/40 rounded-2xl overflow-hidden shadow-xl hover:border-red-600/60 transition-colors">
                  <div className="p-4 bg-red-950/30 border-b border-red-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Lo que hacen otros técnicos (Riesgo y Desorden)</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-800/40">
                      Foto Real
                    </span>
                  </div>

                  {/* Imagen Antes */}
                  <div className="relative aspect-[4/3] w-full bg-black overflow-hidden group">
                    <Image
                      src="/landing/problema-antes.jpg"
                      alt="Instalación deficiente con cables enredados y desorden"
                      fill
                      sizes="(max-width: 1024px) 100vw, 600px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-red-950/90 border border-red-800 text-red-200 text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md">
                      ⚠️ Desastre previo encontrado
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <ul className="space-y-2 text-xs text-[#b0b0bc]">
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 font-bold">•</span>
                        <span>Cables sueltos sin canalizar, propensos a tirones o cortes deliberados.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 font-bold">•</span>
                        <span>Fuentes de poder y switches tirados en el piso sin protección térmica.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 font-bold">•</span>
                        <span>Falsos diagnósticos para forzar la compra de equipos nuevos.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </ScrollReveal>

              {/* Tarjeta DESPUÉS: El estándar TecnoSmart */}
              <ScrollReveal direction="left" delay={200} duration={700}>
                <div className="h-full flex flex-col bg-[#191922] border-2 border-emerald-600/50 rounded-2xl overflow-hidden shadow-xl shadow-emerald-950/20 hover:border-emerald-500 transition-colors">
                  <div className="p-4 bg-emerald-950/30 border-b border-emerald-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>El estándar de instalación TecnoSmart</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/40">
                      Garantía 100%
                    </span>
                  </div>

                  {/* Imagen Después */}
                  <div className="relative aspect-[4/3] w-full bg-black overflow-hidden group">
                    <Image
                      src="/landing/problema-despues.jpg"
                      alt="Instalación profesional limpia con tubería conduit y cajetín estanco"
                      fill
                      sizes="(max-width: 1024px) 100vw, 600px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md">
                      ✓ Tubería Conduit & Cero Cables Expuestos
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <ul className="space-y-2 text-xs text-[#c0c0cc]">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>Tubería conduit de PVC en curvatura limpia, anclada y sellada contra la intemperie.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>Cajetines estancos con prensaestopas que protegen conexiones y conectores BNC/RJ45.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>Diagnóstico transparente: cuidamos tu bolsillo y salvamos tus equipos existentes.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </ScrollReveal>

            </div>
          </div>
        </ScrollReveal>

        {/* El contraste con TecnoSmart */}
        <ScrollReveal direction="up" delay={100}>
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
              className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-[#b01f25] text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-red-950/40 whitespace-nowrap hover:scale-105 active:scale-95"
            >
              <span>Ver cómo lo resolvemos</span>
              <span>↓</span>
            </a>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
