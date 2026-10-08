import { FileEdit } from "lucide-react";
import CotizadorWizard from "@/components/cotizador/CotizadorWizard";

export default function NuevaCotizacionPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[var(--ts-bg)]">
      {/* ── Banner/Header ── */}
      <div className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--ts-red)]/20 flex items-center justify-center">
              <FileEdit className="w-5 h-5 text-[var(--ts-red)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--ts-text-primary)] tracking-tight">Nueva Cotización</h1>
              <p className="text-[var(--ts-text-muted)] text-xs">Selecciona cliente, productos y servicios.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto">
        <CotizadorWizard />
      </div>
    </div>
  );
}
