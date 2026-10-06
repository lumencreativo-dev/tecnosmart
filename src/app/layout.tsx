import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TecnoSmart VZL | Seguridad Electrónica & Automatización",
  description:
    "Distribuidor oficial Hikvision en Venezuela. Sistemas de videovigilancia, domótica, redes y control de acceso para empresas y hogares.",
  keywords: ["hikvision", "cámaras de seguridad", "venezuela", "tinaquillo", "CCTV", "automatización"],
  openGraph: {
    title: "TecnoSmart VZL",
    description: "Seguridad Electrónica & Automatización Inteligente",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} scroll-smooth`}>
      <body className="font-sans bg-white text-brand-black antialiased">
        {children}
      </body>
    </html>
  );
}
