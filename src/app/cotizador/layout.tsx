import type { Metadata } from "next";
import NavShell from "@/components/cotizador/NavShell";

export const metadata: Metadata = {
  title: "Portal Interno | TecnoSmart",
  description: "Herramienta interna de cotizaciones TecnoSmart",
  robots: { index: false, follow: false },
};

export default function CotizadorLayout({ children }: { children: React.ReactNode }) {
  return <NavShell>{children}</NavShell>;
}
