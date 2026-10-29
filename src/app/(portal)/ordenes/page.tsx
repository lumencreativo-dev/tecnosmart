// src/app/(portal)/ordenes/page.tsx
import { Metadata } from "next";
import ProtectedView from "@/components/cotizador/ProtectedView";
import OrdenesTrabajoManager from "@/components/cotizador/OrdenesTrabajoManager";

export const metadata: Metadata = {
  title: "Órdenes de Trabajo | TecnoSmart VZL",
};

export default function OrdenesPage() {
  return (
    <ProtectedView
      permiso="proyectos.ver_propias"
      modulo="Órdenes de Trabajo"
    >
      <OrdenesTrabajoManager />
    </ProtectedView>
  );
}
