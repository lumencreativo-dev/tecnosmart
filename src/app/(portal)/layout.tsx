import type { Metadata } from "next";
import NavShell from "@/components/cotizador/NavShell";

export const metadata: Metadata = {
  title: {
    default: "Portal Interno | TecnoSmart",
    template: "%s · TecnoSmart ERP",
  },
  description: "Sistema integral de gestión comercial, técnica y operativa de TecnoSmart VZL.",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brands/isotipo/isotipo-rojo.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

export default function CotizadorLayout({ children }: { children: React.ReactNode }) {
  return <NavShell>{children}</NavShell>;
}
