// src/app/(portal)/cuadrillas/page.tsx
import { Metadata } from "next";
import ProtectedView from "@/components/cotizador/ProtectedView";
import OrdenesTrabajoManager from "@/components/cotizador/OrdenesTrabajoManager";

export const metadata: Metadata = {
  title: "Cuadrillas & Técnicos | TecnoSmart VZL",
};

// Las cuadrillas se gestionan desde la vista de órdenes de trabajo.
// Esta ruta pre-filtra para mostrar solo la vista de asignación.
export default function CuadrillasPage() {
  return (
    <ProtectedView
      permiso="proyectos.asignar_cuadrillas"
      modulo="Cuadrillas & Técnicos"
    >
      <OrdenesTrabajoManager />
    </ProtectedView>
  );
}
