"use client";

import { MapPin, Navigation, Car, CheckCircle2 } from "lucide-react";

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
    <section id="cobertura" className="py-24 bg-[#0e0e12] border-t border-[#1a1a24] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
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

        {/* 3 Bloques de Cobertura */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {zonasPrincipales.map((z) => (
            <div
              key={z.ciudad}
              className="bg-[#14141a] border border-[#23232c] rounded-2xl p-6 hover:border-[var(--ts-red)]/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-950/30 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)]">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ts-red)] bg-red-950/40 border border-red-900/30 px-2 py-0.5 rounded">
                  {z.status}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">
                {z.ciudad}
              </h3>
              <p className="text-xs font-semibold text-[#80808a] mb-3">
                {z.estado}
              </p>
              <p className="text-xs sm:text-sm text-[#9c9ca8] leading-relaxed">
                {z.descripcion}
              </p>
            </div>
          ))}
        </div>

        {/* Bloque Informativo de Viáticos para Otras Ciudades */}
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#171722] via-[#1b1b26] to-[#171722] border border-[#2d2d3c] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)] flex-shrink-0">
            <Car className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 text-center sm:text-left">
            <h4 className="text-lg font-bold text-white">
              ¿Estás en otra ciudad o localidad del país?
            </h4>
            <p className="text-xs sm:text-sm text-[#a5a5b2] leading-relaxed">
              Podemos trasladar nuestras cuadrillas técnicas a cualquier estado o ciudad de Venezuela, <strong>siempre y cuando el cliente cubra los viáticos de traslado y logística</strong>.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
