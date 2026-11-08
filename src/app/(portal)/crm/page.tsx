import { Suspense } from "react";
import { Kanban, Users } from "lucide-react";
import Link from "next/link";
import CRMManager from "@/components/cotizador/CRMManager";
import ProtectedView from "@/components/cotizador/ProtectedView";

export default function CRMPage() {
  return (
    <ProtectedView permiso="ventas.crm" modulo="CRM Pipeline">
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
                  <h1 className="text-xl font-bold text-[var(--ts-text-primary)] tracking-tight">CRM & Historial de Cotizaciones</h1>
                  <p className="text-[var(--ts-text-muted)] text-xs">Gestiona estados de cotizaciones, haz seguimiento y consulta el historial comercial.</p>
                </div>
              </div>

              {/* Acceso rápido a Clientes */}
              <Link
                href="/clientes"
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
          <Suspense fallback={
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-[var(--ts-red)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-[var(--ts-text-muted)]">Cargando cotizaciones...</p>
            </div>
          }>
            <CRMManager />
          </Suspense>
        </div>
      </div>
    </ProtectedView>
  );
}
