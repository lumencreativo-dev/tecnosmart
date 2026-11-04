import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#c9242b",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "TecnoSmart VZL | Tu seguridad es nuestra prioridad",
    template: "%s | TecnoSmart VZL",
  },
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
    images: [{ url: "/brands/isologo/isologo-rojo.png", width: 1080, height: 762, alt: "TecnoSmart VZL" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TecnoSmart VZL | Tu seguridad es nuestra prioridad",
    description: "Instalaciones de seguridad y soluciones tecnológicas en Venezuela realizadas por técnicos certificados.",
    images: ["/brands/isologo/isologo-rojo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brands/isotipo/isotipo-rojo.png", type: "image/png", sizes: "1080x1080" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/brands/isotipo/isotipo-rojo.png",
  },
  manifest: "/manifest.json",
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
