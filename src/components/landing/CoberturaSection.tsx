"use client";

import { MapPin, Navigation, Car, CheckCircle2 } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const zonasPrincipales = [
  {
    ciudad: "Tinaquillo",
    estado: "Edo. Cojedes",
    status: "Sede Principal & Fuerte Actual",
    descripcion: "Atención inmediata, disponibilidad de inventario físico y despacho de cuadrillas directas.",
  },
  {
    ciudad: "Valencia",
    estado: "Edo. Carabobo",
    status: "Zona Activa & Fuerte Actual",
    descripcion: "Cobertura para empresas, zonas industriales, comercios y urbanismos residenciales.",
  },
  {
    ciudad: "Caracas",
    estado: "Distrito Capital",
    status: "Próximamente Presencia Más Fuerte",
    descripcion: "Expansión planificada para atención corporativa y proyectos de envergadura en la capital.",
  },
];

export default function CoberturaSection() {
  return (
    <section id="cobertura" className="py-24 bg-[#0e0e12] border-t border-[#1a1a24] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado con ScrollReveal */}
        <ScrollReveal direction="up">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-[var(--ts-red)] text-xs font-bold uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-3 py-1 rounded-full">
              Alcance Geográfico
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black text-white tracking-tight">
              Cobertura a Nivel Nacional
            </h2>
            <p className="mt-3 text-base text-[#a0a0ac] leading-relaxed">
              Trabajamos en toda Venezuela. Nuestros ingenieros y técnicos se trasladan donde tu proyecto lo requiera.
            </p>
          </div>
        </ScrollReveal>

        {/* 3 Bloques de Cobertura con Staggered ScrollReveal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {zonasPrincipales.map((z, idx) => (
            <ScrollReveal
              key={z.ciudad}
              direction="up"
              delay={idx * 100}
              duration={650}
            >
              <div className="h-full bg-[#14141a] border border-[#23232c] hover:border-[var(--ts-red)]/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-red-950/15 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-950/30 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)] group-hover:scale-110 group-hover:bg-[var(--ts-red)] group-hover:text-white transition-all shadow-md">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ts-red)] bg-red-950/40 border border-red-900/30 px-2 py-0.5 rounded">
                      {z.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                    {z.ciudad}
                  </h3>
                  <p className="text-xs font-semibold text-[#808090] mb-3">
                    {z.estado}
                  </p>
                  <p className="text-xs text-[#a0a0b0] leading-relaxed">
                    {z.descripcion}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Banner de Traslado Nacional con ScrollReveal */}
        <ScrollReveal direction="zoom" duration={700}>
          <div className="bg-[#14141a] border border-[#23232c] rounded-2xl p-6 sm:p-8 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)] flex-shrink-0">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  ¿Tu proyecto está en otro estado del país?
                </h4>
                <p className="text-xs sm:text-sm text-[#9595a4] leading-relaxed">
                  Despachamos cuadrillas técnicas para proyectos de seguridad, cableado o enlaces satelitales en cualquier región de Venezuela.
                </p>
              </div>
            </div>
            <a
              href="#asesoria-gratuita"
              className="inline-flex items-center gap-2 bg-[#20202a] hover:bg-[#282835] border border-[#333342] text-white text-xs sm:text-sm font-semibold px-5 py-3 rounded-xl transition-all whitespace-nowrap hover:scale-105"
            >
              Consultar viáticos y traslado
            </a>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
