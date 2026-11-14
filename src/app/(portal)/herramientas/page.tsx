// src/app/(portal)/herramientas/page.tsx
import { Metadata } from "next";
import ProtectedView from "@/components/cotizador/ProtectedView";
import HerramientasTecnicas from "@/components/cotizador/HerramientasTecnicas";

export const metadata: Metadata = {
  title: "Cálculos Técnicos & Seguridad | TecnoSmart VZL",
};

export default function HerramientasPage() {
  return (
    <ProtectedView
      permiso={["proyectos.ver_propias", "proyectos.crear_ordenes", "proyectos.asignar_cuadrillas", "inventario.ver"]}
      modulo="Cálculos Técnicos & CCTV"
    >
      <HerramientasTecnicas />
    </ProtectedView>
  );
}
