import { FileCheck } from "lucide-react";
import FacturadorWizard from "@/components/cotizador/FacturadorWizard";

export default function FacturacionPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#f5f5f5]">
      {/* ── Banner/Header ── */}
      <div className="bg-[#111111] border-b border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#c9242b]/20 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-[#c9242b]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Módulo de Facturación</h1>
              <p className="text-[#a0a0a0] text-sm">Convierte cotizaciones aprobadas en facturas formales.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenedor principal ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <FacturadorWizard />
      </div>
    </div>
  );
}
