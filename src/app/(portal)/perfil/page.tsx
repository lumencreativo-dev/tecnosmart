import PerfilManager from "@/components/cotizador/PerfilManager";
import { UserCheck } from "lucide-react";

export const metadata = {
  title: "Mi Perfil | TecnoSmart VZL",
  description: "Perfil de empleado, insignias y datos de cuenta",
};

export default function PerfilPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] bg-[var(--ts-bg)]">
      {/* ── Banner/Header ── */}
      <div className="bg-[var(--ts-surface-2)] border-b border-[var(--ts-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[var(--ts-red)]/20 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-[var(--ts-red)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--ts-text-primary)] tracking-tight">Mi Perfil</h1>
              <p className="text-[var(--ts-text-muted)] text-sm">Gestiona tu identidad, credenciales e insignias en el portal de TecnoSmart.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenedor principal ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <PerfilManager />
      </div>
    </div>
  );
}
