import { Suspense } from "react";
import CotizadorWizard from "@/components/cotizador/CotizadorWizard";
import ProtectedView from "@/components/cotizador/ProtectedView";

export default function NuevaCotizacionPage() {
  return (
    <ProtectedView permiso="ventas.cotizar" modulo="Generador de Cotizaciones">
      <div className="min-h-[calc(100vh-56px)] bg-[var(--ts-bg)]">
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[var(--ts-red)] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[var(--ts-text-muted)] font-medium">Cargando cotizador comercial...</p>
            </div>
          }
        >
          <CotizadorWizard />
        </Suspense>
      </div>
    </ProtectedView>
  );
}
