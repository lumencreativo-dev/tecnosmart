"use client";

import { Check, X, ShieldAlert, ArrowRight, Zap, CheckCircle2, ShieldCheck } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const incluye = [
  "Monitoreo remoto del estado de los equipos (aviso si algo falla)",
  "Atención prioritaria sin importar el día",
  "Línea de WhatsApp prioritaria y directa",
  "Reporte mensual simple del estado del sistema",
  "Respaldo preventivo de la configuración",
  "Capacitación básica para los empleados o familiares del cliente",
];

const noIncluye = [
  "Visitas presenciales de mantenimiento (ese trabajo se cotiza y factura aparte)",
  "Gestión de la mensualidad de Starlink (esa suscripción es un servicio aparte)",
];

export default function PlanPremiumSection() {
  return (
    <section id="plan-premium" className="py-24 bg-[#0a0a0d] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado con ScrollReveal */}
        <ScrollReveal direction="up">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-[var(--ts-red)] text-xs font-bold uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-3 py-1 rounded-full">
              Tranquilidad Continua
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black text-white tracking-tight">
              Plan Premium de Monitoreo & Asistencia
            </h2>
            <p className="mt-3 text-base text-[#a0a0ac] leading-relaxed">
              Diseñado para que tu sistema de seguridad se mantenga vigilado y respaldado de forma remota, con atención prioritaria para tu negocio o vivienda.
            </p>
          </div>
        </ScrollReveal>

        {/* Tarjeta del Plan Premium con ScrollReveal */}
        <ScrollReveal direction="zoom" duration={800}>
          <div className="max-w-4xl mx-auto bg-gradient-to-b from-[#16161d] to-[#111116] border border-[#2b2b36] hover:border-[var(--ts-red)]/50 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden transition-colors">
            
            {/* Badge superior */}
            <div className="absolute top-0 right-0">
              <div className="bg-[var(--ts-red)] text-white text-[11px] font-black uppercase tracking-widest py-1.5 px-6 rounded-bl-2xl shadow-md">
                Soporte Continuo
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center border-b border-[#252530] pb-10 mb-10">
              <div className="md:col-span-7">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--ts-red)] mb-2 block">
                  Suscripción Mensual
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
                  Plan Premium TecnoSmart
                </h3>
                <p className="text-sm text-[#a5a5b2] leading-relaxed">
                  Supervisión remota proactiva de tu equipamiento para detectar fallas antes de que afecten tu seguridad.
                </p>
              </div>

              <div className="md:col-span-5 text-center md:text-right">
                <div className="inline-block bg-[#121217] border border-[#262634] rounded-2xl p-5 shadow-inner">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#808090] block mb-1">
                    Inversión mensual
                  </span>
                  <div className="flex items-baseline justify-center md:justify-end gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-white">$5</span>
                    <span className="text-xs text-[#808090] font-semibold">/ mes</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
                    ✓ Sin contratos forzosos
                  </span>
                </div>
              </div>
            </div>

            {/* Listas de Lo que incluye y Lo que NO incluye */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              
              {/* Lo que incluye */}
              <div className="bg-[#14141b] rounded-2xl p-6 border border-[#232330]">
                <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lo que sí incluye</span>
                </h4>
                <ul className="space-y-3">
                  {incluye.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#c0c0d0]">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Lo que NO incluye (Honestidad) */}
              <div className="bg-[#14141b] rounded-2xl p-6 border border-[#232330]">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#e0a030] mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Claridad y Honestidad (No incluye)</span>
                </h4>
                <ul className="space-y-3">
                  {noIncluye.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#9595a4]">
                      <X className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-4 border-t border-[#20202c]">
                  <p className="text-[11px] text-[#757585] leading-relaxed">
                    Creemos en relaciones comerciales transparentes: sabes exactamente qué pagas y qué esperar de nuestro equipo.
                  </p>
                </div>
              </div>

            </div>

            {/* CTA del Plan */}
            <div className="text-center">
              <a
                href="#asesoria-gratuita"
                className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-[#b01f25] text-white font-bold text-sm sm:text-base px-8 py-4 rounded-xl shadow-xl shadow-red-950/40 transition-all hover:scale-105 active:scale-95"
              >
                <span>Activar con mi instalación</span>
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>

          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
