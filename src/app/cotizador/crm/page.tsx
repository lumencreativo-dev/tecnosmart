import { Kanban, Users } from "lucide-react";
import Link from "next/link";
import CRMManager from "@/components/cotizador/CRMManager";

export default function CRMPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[var(--ts-bg)]">
      {/* ── Banner/Header ── */}
      <div className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--ts-red)]/20 flex items-center justify-center">
                <Kanban className="w-5 h-5 text-[var(--ts-red)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--ts-text-primary)] tracking-tight">CRM & Historial</h1>
                <p className="text-[var(--ts-text-muted)] text-xs">Gestiona estados de cotizaciones y haz seguimiento.</p>
              </div>
            </div>

            {/* Acceso rápido a Clientes */}
            <Link
              href="/cotizador/clientes"
              className="flex items-center gap-2 bg-[var(--ts-surface)]/10 hover:bg-[var(--ts-surface)]/20 text-[var(--ts-text-primary)] text-xs font-bold px-4 py-2 rounded-lg transition-colors border border-white/10"
            >
              <Users className="w-4 h-4" />
              Ver Clientes
            </Link>
          </div>
        </div>
      </div>

      {/* ── Contenedor principal ── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <CRMManager />
      </div>
    </div>
  );
}
