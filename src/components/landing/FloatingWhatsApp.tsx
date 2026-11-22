"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export default function FloatingWhatsApp() {
  const [showTooltip, setShowTooltip] = useState(true);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Tooltip flotante con animación */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 bg-[#14141c]/95 border border-[#2e2e3e] text-white px-3.5 py-2 rounded-xl shadow-2xl backdrop-blur-md animate-float-slow">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs font-semibold">
            ¿Dudas técnicas? <span className="text-emerald-400 font-bold">Chatea con nosotros</span>
          </p>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-[#808090] hover:text-white ml-1 text-xs cursor-pointer"
            aria-label="Cerrar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Botón Flotante Principal de WhatsApp */}
      <a
        href="https://wa.me/584122789273?text=Hola%20TecnoSmart,%20quisiera%20información%20y%20asesoría%20sobre%20sus%20servicios%20de%20seguridad%20y%20redes."
        target="_blank"
        rel="noopener noreferrer"
        className="relative group w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-950/50 transition-all hover:scale-110 active:scale-95 cursor-pointer"
        aria-label="Contactar a TecnoSmart por WhatsApp"
      >
        {/* Anillo de pulso radar */}
        <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-radar-ping pointer-events-none" />
        
        {/* Icono de Mensaje */}
        <MessageCircle className="w-7 h-7 relative z-10" />
      </a>
    </div>
  );
}
