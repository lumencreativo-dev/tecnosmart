// ─────────────────────────────────────────────────────────────────────────────
// src/components/cotizador/FirmaDigital.tsx
// Canvas táctil para captura de firma digital — Sprint 8
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { PenTool, Trash2, CheckCircle2 } from "lucide-react";

interface FirmaDigitalProps {
  onCaptura: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

export default function FirmaDigital({ onCaptura, width = 500, height = 200 }: FirmaDigitalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dibujando, setDibujando] = useState(false);
  const [vacio, setVacio] = useState(true);
  const ultimoPunto = useRef<{ x: number; y: number } | null>(null);

  // Configurar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fondo blanco (para el PDF)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Línea guía punteada
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 40);
    ctx.lineTo(canvas.width - 20, canvas.height - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // Estilo del trazo
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPosicion = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const iniciarTrazo = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDibujando(true);
    setVacio(false);
    ultimoPunto.current = getPosicion(e, canvas);
  };

  const dibujar = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!dibujando || !ultimoPunto.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPosicion(e, canvas);
    ctx.beginPath();
    ctx.moveTo(ultimoPunto.current.x, ultimoPunto.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ultimoPunto.current = pos;
  };

  const terminarTrazo = () => {
    setDibujando(false);
    ultimoPunto.current = null;
  };

  const limpiar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redibujar línea guía
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 40);
    ctx.lineTo(canvas.width - 20, canvas.height - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // Restaurar estilo
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.5;

    setVacio(true);
  };

  const capturar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onCaptura(canvas.toDataURL("image/png"));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold ts-text-muted uppercase flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5" /> Firma Digital
        </p>
        <p className="text-xs ts-text-muted">Firma en el recuadro con el dedo o mouse</p>
      </div>

      <div className="relative border-2 border-dashed ts-border rounded-xl overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full touch-none cursor-crosshair"
          style={{ touchAction: "none" }}
          onMouseDown={iniciarTrazo}
          onMouseMove={dibujar}
          onMouseUp={terminarTrazo}
          onMouseLeave={terminarTrazo}
          onTouchStart={iniciarTrazo}
          onTouchMove={dibujar}
          onTouchEnd={terminarTrazo}
        />
        {vacio && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-gray-300 font-light">Firma aquí</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={limpiar}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border ts-border ts-text-muted hover:bg-[var(--ts-surface-2)] transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Limpiar
        </button>
        <button
          onClick={capturar}
          disabled={vacio}
          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition-colors font-bold"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Firma
        </button>
      </div>
    </div>
  );
}
