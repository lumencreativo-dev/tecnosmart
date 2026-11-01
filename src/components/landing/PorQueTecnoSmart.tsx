"use client";

import {
  Award,
  ClipboardCheck,
  Sparkles,
  Lock,
  Users,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

const diferenciadores = [
  {
    titulo: "Técnicos Certificados",
    descripcion:
      "Personal con capacitación formal y certificaciones de fabricantes líderes. No improvisamos con personal sin credenciales.",
    icono: Award,
  },
  {
    titulo: "Protocolos de Trabajo Seguros y Profesionales",
    descripcion:
      "Aplicamos métodos de ingeniería estandarizados en cada fase: diagnóstico, tendido, anclaje, energización y pruebas.",
    icono: ClipboardCheck,
  },
  {
    titulo: "Instalaciones Limpias (Normas Internacionales)",
    descripcion:
      "Cero acabados descuidados, cables sueltos o empates precarios. Cada instalación cumple con estética y orden técnico riguroso.",
    icono: Sparkles,
  },
  {
    titulo: "Confidencialidad y Confianza Total",
    descripcion:
      "Garantizamos estricta reserva de tus accesos, claves, planos de cámaras y puntos vulnerables de tu comercio, empresa u hogar.",
    icono: Lock,
  },
  {
    titulo: "Empresa Familiar con Alta Cohesión",
    descripcion:
      "La solidez y compromiso de un equipo familiar donde cada proyecto se cuida como propio, garantizando responsabilidad directa.",
    icono: Users,
  },
  {
    titulo: "+200 Proyectos Instalados",
    descripcion:
      "Cifra real, verificada y en constante crecimiento en sistemas de videovigilancia, redes, enlaces satelitales y automatización.",
    icono: TrendingUp,
  },
];

export default function PorQueTecnoSmart() {
  return (
    <section id="por-que-nosotros" className="py-24 bg-[#0a0a0d] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-[var(--ts-red)] text-xs font-bold uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-3 py-1 rounded-full">
            Diferenciadores Clave
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-black text-white tracking-tight">
            ¿Por Qué Confiar en TecnoSmart?
          </h2>
          <p className="mt-3 text-base text-[#a0a0ac] leading-relaxed">
            En un mercado con tantas malas experiencias, construimos una reputación basada en la seriedad técnica, acabados impecables y honestidad comercial.
          </p>
        </div>

        {/* Grid de 6 Diferenciadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {diferenciadores.map((d) => {
            const Icon = d.icono;
            return (
              <div
                key={d.titulo}
                className="bg-[#121217] border border-[#22222b] rounded-2xl p-7 hover:border-[var(--ts-red)]/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-950/10 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)] mb-5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {d.titulo}
                  </h3>
                  <p className="text-sm text-[#9c9ca6] leading-relaxed">
                    {d.descripcion}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Banner de Impacto: +200 Proyectos Verificados */}
        <div className="bg-gradient-to-r from-red-950/30 via-[#16161f] to-red-950/30 border border-red-900/30 rounded-2xl p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-white">
              Más de <span className="text-[var(--ts-red)]">+200 proyectos instalados</span> con éxito
            </div>
            <p className="text-sm text-[#a5a5b2]">
              Respaldando la tranquilidad de comercios, empresas familiares y hogares en Venezuela.
            </p>
          </div>
          <a
            href="#asesoria-gratuita"
            className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-[#b01f25] text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-all whitespace-nowrap shadow-lg shadow-red-950/30"
          >
            Solicita tu asesoría gratuita
          </a>
        </div>

      </div>
    </section>
  );
}
