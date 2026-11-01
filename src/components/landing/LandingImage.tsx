"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";

interface LandingImageProps {
  src: string;
  alt: string;
  label: string;
  fileHint: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
}

export default function LandingImage({
  src,
  alt,
  label,
  fileHint,
  fill = false,
  width,
  height,
  className = "",
  imageClassName = "",
  priority = false,
  sizes,
}: LandingImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`relative w-full h-full min-h-[220px] bg-[#141416] border border-dashed border-[#333339] rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center p-6 select-none ${className}`}
    >
      {/* Marcador elegante visible mientras no esté cargada o si el archivo aún no existe */}
      {(!loaded || failed) && (
        <div className="flex flex-col items-center justify-center gap-3 z-0 max-w-sm px-4">
          <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-[var(--ts-red)]/40 flex items-center justify-center text-[var(--ts-red)] shadow-lg shadow-red-950/20">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <span className="inline-block text-[11px] font-mono uppercase tracking-wider text-[var(--ts-red)] font-semibold bg-red-950/50 border border-red-800/40 px-2.5 py-0.5 rounded-full mb-2">
              Marcador de Foto
            </span>
            <p className="text-sm sm:text-base font-bold text-white tracking-wide">
              {label}
            </p>
            <p className="text-xs text-[#a0a0a0] font-mono mt-1 break-all bg-[#1c1c20] px-2.5 py-1 rounded border border-[#2a2a30]">
              {fileHint}
            </p>
          </div>
          <p className="text-[11px] text-[#808088] leading-tight">
            Al colocar el archivo en la carpeta, aparecerá automáticamente sin tocar código.
          </p>
        </div>
      )}

      {/* Imagen real apuntando a public/landing/... */}
      {!failed && (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          priority={priority}
          sizes={sizes}
          className={`transition-opacity duration-500 object-cover ${
            fill ? "absolute inset-0 w-full h-full" : ""
          } ${imageClassName} ${
            loaded ? "opacity-100 z-10" : "opacity-0 pointer-events-none"
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
