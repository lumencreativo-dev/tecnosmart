// src/app/(portal)/actas/page.tsx
import { Metadata } from "next";
import ProtectedView from "@/components/cotizador/ProtectedView";
import OrdenesTrabajoManager from "@/components/cotizador/OrdenesTrabajoManager";

export const metadata: Metadata = {
  title: "Actas de Entrega | TecnoSmart VZL",
};

export default function ActasPage() {
  return (
    <ProtectedView
      permiso="proyectos.actas"
      modulo="Actas de Entrega"
    >
      <OrdenesTrabajoManager />
    </ProtectedView>
  );
}
