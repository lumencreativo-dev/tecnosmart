"use client";

import { useState } from "react";
import { Play, Film, AlertCircle } from "lucide-react";

interface LandingVideoProps {
  videoSrc: string;
  posterSrc: string;
  title: string;
}

export default function LandingVideo({
  videoSrc,
  posterSrc,
  title,
}: LandingVideoProps) {
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#121214] border border-[#2b2b32] shadow-2xl flex flex-col items-center justify-center">
      {!hasError ? (
        <video
          controls
          poster={posterSrc}
          className="w-full h-full object-cover"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setHasError(true)}
        >
          <source
            src={videoSrc}
            type="video/mp4"
            onError={() => setHasError(true)}
          />
          Tu navegador no soporta reproducción de vídeo HTML5.
        </video>
      ) : null}

      {/* Fallback elegante cuando el vídeo o poster aún no existen */}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#18181c] to-[#0e0e11] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--ts-red)]/15 border border-[var(--ts-red)]/40 flex items-center justify-center text-[var(--ts-red)] mb-4 shadow-lg shadow-red-950/30">
            <Play className="w-7 h-7 ml-1 fill-current" />
          </div>

          <span className="inline-block text-[11px] font-mono uppercase tracking-widest text-[var(--ts-red)] font-bold bg-red-950/40 border border-red-900/40 px-3 py-1 rounded-full mb-2">
            [VÍDEO: lead magnet]
          </span>

          <h3 className="text-base sm:text-xl font-bold text-white max-w-lg mb-2">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-[#a0a0a0] max-w-md mb-4 leading-relaxed">
            Historia en 3 actos: Alguien que sufrió robos → Contrató una instalación mala → Llamó a TecnoSmart y puso fin a sus problemas.
          </p>

          <div className="bg-[#1c1c22] border border-[#2e2e38] rounded-lg p-3 text-left max-w-sm w-full text-xs text-[#8e8e98] space-y-1 font-mono">
            <p className="flex items-center gap-2 text-white/90 font-semibold">
              <Film className="w-3.5 h-3.5 text-[var(--ts-red)]" />
              Archivos esperados:
            </p>
            <p className="truncate">📹 {videoSrc}</p>
            <p className="truncate">🖼️ {posterSrc}</p>
          </div>

          <p className="text-[11px] text-[#707078] mt-3">
            Al subir los archivos en la carpeta correspondiente, el reproductor de vídeo cargará automáticamente.
          </p>
        </div>
      )}
    </div>
  );
}
