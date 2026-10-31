// src/app/(portal)/materiales/page.tsx
import { Metadata } from "next";
import ProtectedView from "@/components/cotizador/ProtectedView";
import MaterialesManager from "@/components/cotizador/MaterialesManager";

export const metadata: Metadata = {
  title: "Requisición de Materiales | TecnoSmart VZL",
};

export default function MaterialesPage() {
  return (
    <ProtectedView
      permiso="proyectos.materiales"
      modulo="Requisición de Materiales"
    >
      <MaterialesManager />
    </ProtectedView>
  );
}
