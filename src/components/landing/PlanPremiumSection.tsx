"use client";

import { Check, X, ShieldAlert, ArrowRight, Zap, CheckCircle2 } from "lucide-react";

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
    <section id="plan-premium" className="py-24 bg-[#0a0a0d] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
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

        {/* Tarjeta del Plan Premium */}
        <div className="max-w-4xl mx-auto bg-gradient-to-b from-[#16161d] to-[#111116] border border-[#2b2b36] rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          
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
              <div className="inline-block bg-[#1a1a24] border border-[#30303e] rounded-2xl p-6">
                <span className="text-xs text-[#90909c] uppercase font-semibold block mb-1">
                  Inversión mensual
                </span>
                <div className="flex items-baseline justify-center md:justify-end gap-1">
                  <span className="text-5xl font-black text-white">$5</span>
                  <span className="text-lg font-bold text-[#80808c]">/mes</span>
                </div>
                <span className="text-[11px] text-[#70707a] mt-1 block">
                  Sin contratos forzosos
                </span>
              </div>
            </div>
          </div>

          {/* Comparativa: Lo que SÍ incluye vs Lo que NO incluye */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            
            {/* Columna INCLUYE */}
            <div className="bg-[#121217] border border-green-900/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4 text-green-400 font-bold text-sm uppercase tracking-wide">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>Lo que incluye</span>
              </div>
              <ul className="space-y-3.5">
                {incluye.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#d5d5de]">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Columna NO INCLUYE (Transparencia Total) */}
            <div className="bg-[#121217] border border-red-900/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4 text-[var(--ts-red)] font-bold text-sm uppercase tracking-wide">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <span>Lo que NO incluye (transparencia total)</span>
              </div>
              <ul className="space-y-4">
                {noIncluye.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#b5b5c0]">
                    <X className="w-4 h-4 text-[var(--ts-red)] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-xs text-[#9a9aa8] leading-relaxed">
                Nos caracteriza la honestidad: te explicamos con claridad el alcance exacto de tu servicio desde el primer momento.
              </div>
            </div>

          </div>

          {/* CTA del Plan Premium */}
          <div className="text-center pt-4">
            <a
              href="#asesoria-gratuita"
              className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-[#b01f25] text-white font-bold text-base px-8 py-3.5 rounded-xl shadow-lg shadow-red-950/40 transition-all hover:scale-105"
            >
              <span>Solicitar Plan Premium en mi asesoría</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}
