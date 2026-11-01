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
  title: "TecnoSmart VZL | Tu seguridad es nuestra prioridad",
  description:
    "Instalaciones de seguridad realizadas por técnicos certificados, limpias y según normas internacionales, por una empresa familiar en la que puedes confiar. Videovigilancia CCTV/IP, Starlink, domótica, redes y automatizaciones en Venezuela.",
  keywords: [
    "cámaras de seguridad", "CCTV", "Starlink", "internet satelital", "redes", "domótica",
    "Hikvision", "Ezviz", "Tapo", "HiLook", "Tinaquillo", "Cojedes", "Valencia", "Caracas", "Venezuela", "tecnología"
  ],
  openGraph: {
    title: "TecnoSmart VZL | Tu seguridad es nuestra prioridad",
    description: "Instalaciones de seguridad y soluciones tecnológicas en Venezuela realizadas por técnicos certificados.",
    url: "https://www.somostecnosmart.com",
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
