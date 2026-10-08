import { Receipt } from "lucide-react";
import HistorialFacturas from "@/components/cotizador/HistorialFacturas";

export default function HistorialFacturasPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[var(--ts-bg)]">
      <div className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--ts-red)]/20 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-[var(--ts-red)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--ts-text-primary)] tracking-tight">Historial de Facturas</h1>
              <p className="text-[var(--ts-text-muted)] text-xs">Registro completo de todas las facturas emitidas.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <HistorialFacturas />
      </div>
    </div>
  );
}
