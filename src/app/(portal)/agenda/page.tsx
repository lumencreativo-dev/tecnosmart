// src/app/(portal)/agenda/page.tsx
import { Metadata } from "next";
import ProtectedView from "@/components/cotizador/ProtectedView";
import CalendarioObras from "@/components/cotizador/CalendarioObras";

export const metadata: Metadata = {
  title: "Calendario de Obras | TecnoSmart VZL",
};

export default function AgendaPage() {
  return (
    <ProtectedView
      permiso="proyectos.agenda"
      modulo="Calendario de Obras"
    >
      <CalendarioObras />
    </ProtectedView>
  );
}
