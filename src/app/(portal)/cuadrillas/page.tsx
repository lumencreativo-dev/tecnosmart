// src/app/(portal)/cuadrillas/page.tsx
import { Metadata } from "next";
import ProtectedView from "@/components/cotizador/ProtectedView";
import CuadrillasManager from "@/components/cotizador/CuadrillasManager";

export const metadata: Metadata = {
  title: "Cuadrillas & Técnicos | TecnoSmart VZL",
};

export default function CuadrillasPage() {
  return (
    <ProtectedView
      permiso="proyectos.asignar_cuadrillas"
      modulo="Cuadrillas & Técnicos"
    >
      <CuadrillasManager />
    </ProtectedView>
  );
}
