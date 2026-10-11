import { Database } from "lucide-react";
import InventarioManager from "@/components/cotizador/InventarioManager";
import ProtectedView from "@/components/cotizador/ProtectedView";

export default function InventarioPage() {
  return (
    <ProtectedView permiso="inventario.ver" modulo="Inventario de Productos">
      <div className="min-h-[calc(100vh-140px)] bg-[var(--ts-bg)]">
        {/* ── Banner/Header ── */}
        <div className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[var(--ts-red)]/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-[var(--ts-red)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--ts-text-primary)] tracking-tight">Inventario de Productos</h1>
                <p className="text-[var(--ts-text-muted)] text-sm">Administra tu catálogo de equipos y verifica el stock actual.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Contenedor principal ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <InventarioManager />
        </div>
      </div>
    </ProtectedView>
  );
}
