import SuscripcionesManager from "@/components/cotizador/SuscripcionesManager";
import { Repeat } from "lucide-react";

export default function SuscripcionesPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] bg-[var(--ts-bg)]">
      {/* ── Banner/Header ── */}
      <div className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[var(--ts-red)]/20 flex items-center justify-center">
              <Repeat className="w-5 h-5 text-[var(--ts-red)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--ts-text-primary)] tracking-tight">Suscripciones y Recurrentes</h1>
              <p className="text-[var(--ts-text-muted)] text-sm">Gestiona pagos recurrentes, servicios activos y credenciales seguras.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenedor principal ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <SuscripcionesManager />
      </div>
    </div>
  );
}
