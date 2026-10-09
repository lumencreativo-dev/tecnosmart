import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TecnoSmart VZL | Tienda Especializada en Soluciones Tecnológicas",
  description:
    "Tienda especializada en tecnología, seguridad electrónica y automatización en Tinaquillo, Venezuela. Ofrecemos equipos CCTV, Starlink, redes, control de acceso y servicio técnico profesional.",
  keywords: [
    "cámaras de seguridad", "CCTV", "Starlink", "internet satelital", "redes", "domótica",
    "Hikvision", "Ezviz", "Tapo", "HiLook", "Tinaquillo", "Cojedes", "Venezuela", "tecnología"
  ],
  openGraph: {
    title: "TecnoSmart VZL | Seguridad & Tecnología",
    description: "Equipos de seguridad, redes e internet satelital en Venezuela. Instalación y servicio técnico profesional.",
    url: "https://tecnosmartvzl.com",
    siteName: "TecnoSmart VZL",
    type: "website",
    locale: "es_VE",
    images: [{ url: "/isologo-rojo.png", width: 512, height: 512 }],
  },
  icons: {
    icon: [
      { url: "/isotipo-rojo.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/isotipo-rojo.png",
  },
  manifest: "/manifest.json",
  themeColor: "#c9242b",
  appleWebApp: {
    capable: true,
    title: "TecnoSmart",
    statusBarStyle: "black-translucent",
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} scroll-smooth`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
