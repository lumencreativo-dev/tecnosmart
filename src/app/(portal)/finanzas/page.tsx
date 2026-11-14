// src/app/(portal)/finanzas/page.tsx
import { Metadata } from "next";
import ProtectedView from "@/components/cotizador/ProtectedView";
import FinanzasManager from "@/components/cotizador/FinanzasManager";

export const metadata: Metadata = {
  title: "Finanzas & Tesorería | TecnoSmart VZL",
};

export default function FinanzasPage() {
  return (
    <ProtectedView
      permiso={["finanzas.dashboard", "finanzas.cajas", "finanzas.reportes", "finanzas.cxc", "finanzas.cxp"]}
      modulo="Finanzas & Tesorería"
    >
      <FinanzasManager />
    </ProtectedView>
  );
}
