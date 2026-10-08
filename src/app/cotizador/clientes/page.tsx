import { Users } from "lucide-react";
import ClientesManager from "@/components/cotizador/ClientesManager";

export default function ClientesPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[var(--ts-bg)]">
      <div className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--ts-red)]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[var(--ts-red)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--ts-text-primary)] tracking-tight">Directorio de Clientes</h1>
              <p className="text-[var(--ts-text-muted)] text-xs">Gestiona, edita y analiza el historial de cada cliente.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <ClientesManager />
      </div>
    </div>
  );
}
