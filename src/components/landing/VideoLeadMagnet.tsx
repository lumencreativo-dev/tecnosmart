"use client";

import { ArrowRight, Play, CheckCircle2 } from "lucide-react";
import LandingVideo from "./LandingVideo";

export default function VideoLeadMagnet() {
  return (
    <section id="video" className="py-24 bg-[#0d0d11] border-t border-[#1a1a24] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="text-[var(--ts-red)] text-xs font-bold uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-3 py-1 rounded-full">
            El Embudo en Acción
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-black text-white tracking-tight">
            Cómo Resolvemos tu Seguridad de Forma Definitiva
          </h2>
          <p className="mt-3 text-base text-[#a0a0b0] leading-relaxed">
            Observa esta historia en 3 actos: desde la frustración de las malas instalaciones hasta la tranquilidad de una solución profesional.
          </p>
        </div>

        {/* Contenedor del Vídeo Lead Magnet */}
        <div className="max-w-4xl mx-auto mb-16">
          <LandingVideo
            videoSrc="/landing/video-lead-magnet.mp4"
            posterSrc="/landing/video-poster.jpg"
            title="Historia en 3 Actos: Del Robo a la Solución Definitiva TecnoSmart"
          />
        </div>

        {/* Desglose de los 3 Actos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          
          <div className="bg-[#14141b] border border-[#242430] rounded-xl p-5 relative">
            <span className="text-xs font-bold text-[var(--ts-red)] uppercase tracking-wider block mb-2">
              Acto 1 · El Incidente
            </span>
            <h4 className="text-base font-bold text-white mb-2">
              Sufre robos o pérdidas
            </h4>
            <p className="text-xs sm:text-sm text-[#9595a2] leading-relaxed">
              La angustia de ver vulnerado el patrimonio familiar o comercial exige una respuesta inmediata de seguridad.
            </p>
          </div>

          <div className="bg-[#14141b] border border-[#242430] rounded-xl p-5 relative">
            <span className="text-xs font-bold text-[#e0a030] uppercase tracking-wider block mb-2">
              Acto 2 · La Mala Experiencia
            </span>
            <h4 className="text-base font-bold text-white mb-2">
              Contrata una instalación mala
            </h4>
            <p className="text-xs sm:text-sm text-[#9595a2] leading-relaxed">
              Técnicos informales dejan cables sueltos, equipos mal configurados y vuelven una y otra vez cobrando visitas sin resolver nada.
            </p>
          </div>

          <div className="bg-[#14141b] border border-green-900/40 bg-green-950/10 rounded-xl p-5 relative">
            <span className="text-xs font-bold text-green-400 uppercase tracking-wider block mb-2">
              Acto 3 · La Solución Definitiva
            </span>
            <h4 className="text-base font-bold text-white mb-2">
              Llama a TecnoSmart
            </h4>
            <p className="text-xs sm:text-sm text-[#9595a2] leading-relaxed">
              Un ingeniero escucha su caso, instala con normas internacionales y pone fin definitivo a sus dolores de cabeza.
            </p>
          </div>

        </div>

        {/* CTA tras ver el vídeo */}
        <div className="text-center">
          <a
            href="#asesoria-gratuita"
            className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-[#b01f25] text-white font-bold text-base px-8 py-4 rounded-xl shadow-xl shadow-red-950/40 transition-all hover:scale-105"
          >
            <span>Paso 2: Llena el formulario de asesoría gratuita</span>
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-xs text-[#80808c] mt-2.5">
            Uno de nuestros ingenieros te llamará en menos de 24 horas hábiles.
          </p>
        </div>

      </div>
    </section>
  );
}
