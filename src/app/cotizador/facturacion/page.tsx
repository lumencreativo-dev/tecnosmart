import Link from "next/link";
import { FileCheck, History } from "lucide-react";
import FacturadorWizard from "@/components/cotizador/FacturadorWizard";
import { Suspense } from "react";

export default function FacturacionPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[var(--ts-bg)]">
      {/* ── Banner/Header ── */}
      <div className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--ts-red)]/20 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-[var(--ts-red)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--ts-text-primary)] tracking-tight">Módulo de Facturación</h1>
                <p className="text-[var(--ts-text-muted)] text-xs">Convierte cotizaciones aprobadas o servicios en facturas SENIAT.</p>
              </div>
            </div>
            {/* Acceso rápido al historial */}
            <Link
              href="/cotizador/historial-facturas"
              className="flex items-center gap-2 bg-[var(--ts-surface)]/10 hover:bg-[var(--ts-surface)]/20 text-[var(--ts-text-primary)] text-xs font-bold px-4 py-2 rounded-lg transition-colors border border-[var(--ts-border)]"
            >
              <History className="w-4 h-4" />
              Ver Historial
            </Link>
          </div>
        </div>
      </div>

      {/* ── Contenedor principal ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Suspense fallback={<div className="p-8 text-center text-[var(--ts-text-muted)]">Cargando Facturador...</div>}>
          <FacturadorWizard />
        </Suspense>
      </div>
    </div>
  );
}
