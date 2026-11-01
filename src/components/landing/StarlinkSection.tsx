"use client";

import { Radio, Wifi, CreditCard, ArrowRight, CheckCircle2 } from "lucide-react";
import LandingImage from "./LandingImage";

const starlinkFeatures = [
  {
    titulo: "Instalación Física Profesional",
    descripcion:
      "Montaje en mástil o pared con soportes de grado industrial, alineación satelital con línea de vista despejada y tendido de cableado limpio.",
    icono: Radio,
  },
  {
    titulo: "Configuración y Red Interna",
    descripcion:
      "Setup del router Starlink, configuración de red Wi-Fi de alta cobertura e integración con switches o sistemas de videovigilancia.",
    icono: Wifi,
  },
  {
    titulo: "Gestión de Mensualidad",
    descripcion:
      "Si no posees tarjeta internacional, nosotros nos encargamos de tramitar y gestionar el pago mensual directo de tu servicio satelital.",
    icono: CreditCard,
  },
];

export default function StarlinkSection() {
  return (
    <section id="starlink" className="py-24 bg-[#0e0e12] border-t border-[#1a1a22] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Columna Izquierda: [FOTO: starlink] */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/80">
              <LandingImage
                src="/landing/starlink.jpg"
                alt="Instalación de antena Starlink por TecnoSmart"
                label="[FOTO: Instalación Starlink]"
                fileHint="public/landing/starlink.jpg"
                fill
                className="w-full h-full min-h-[320px]"
              />
            </div>
            <p className="text-center text-xs text-[#80808c] mt-3">
              Instalación satelital en hogares, comercios, empresas y fincas.
            </p>
          </div>

          {/* Columna Derecha: Contenido y Características (Sin precios) */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <span className="text-[var(--ts-red)] text-xs font-bold uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-3 py-1 rounded-full">
              Internet Satelital de Alta Velocidad
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
              Starlink en Venezuela: Instalación, Configuración y Pago de Mensualidad
            </h2>
            <p className="text-base text-[#a5a5b2] mb-8 leading-relaxed">
              Disfruta de conectividad satelital estable en cualquier rincón del país. Nos encargamos de todo el proceso técnico y administrativo para que no tengas complicaciones.
            </p>

            {/* Lista de características técnicas */}
            <div className="space-y-4 mb-8">
              {starlinkFeatures.map((f) => {
                const Icon = f.icono;
                return (
                  <div
                    key={f.titulo}
                    className="flex items-start gap-4 bg-[#14141a] rounded-xl border border-[#23232c] p-4.5 hover:border-[#383848] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-950/30 border border-red-900/40 flex items-center justify-center text-[var(--ts-red)] flex-shrink-0 mt-0.5">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white mb-1">
                        {f.titulo}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#9595a0] leading-relaxed">
                        {f.descripcion}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Aviso de cotización */}
            <div className="bg-[#181822] border border-[#2b2b3a] rounded-xl p-4 mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#c5c5d0]">
                <CheckCircle2 className="w-4 h-4 text-[var(--ts-red)] flex-shrink-0" />
                <span>
                  Los costos varían según el tipo de montaje, altura y distancia de tendido. Recibe tu presupuesto exacto en la asesoría telefónica.
                </span>
              </div>
            </div>

            {/* Botón CTA hacia formulario */}
            <a
              href="#asesoria-gratuita"
              className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-[#b01f25] text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-red-950/40 transition-all hover:scale-105"
            >
              <span>Solicitar asesoría para Starlink</span>
              <ArrowRight className="w-4 h-4" />
            </a>

          </div>

        </div>
      </div>
    </section>
  );
}
