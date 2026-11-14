// src/app/(portal)/marketing/page.tsx
import { Metadata } from "next";
import ProtectedView from "@/components/cotizador/ProtectedView";
import MarketingManager from "@/components/cotizador/MarketingManager";

export const metadata: Metadata = {
  title: "Marketing & Leads Web | TecnoSmart VZL",
};

export default function MarketingPage() {
  return (
    <ProtectedView
      permiso={["marketing.leads", "marketing.campanas"]}
      modulo="Marketing & Leads Web"
    >
      <MarketingManager />
    </ProtectedView>
  );
}
