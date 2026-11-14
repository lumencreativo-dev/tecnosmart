// src/app/(portal)/soporte/page.tsx
import { Metadata } from "next";
import ProtectedView from "@/components/cotizador/ProtectedView";
import SoporteManager from "@/components/cotizador/SoporteManager";

export const metadata: Metadata = {
  title: "Soporte Técnico & Postventa | TecnoSmart VZL",
};

export default function SoportePage() {
  return (
    <ProtectedView
      permiso={["soporte.tickets", "soporte.garantias", "soporte.wiki"]}
      modulo="Soporte & Postventa"
    >
      <SoporteManager />
    </ProtectedView>
  );
}
