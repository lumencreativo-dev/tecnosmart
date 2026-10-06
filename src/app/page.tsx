import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ServiciosGrid from "@/components/landing/ServiciosGrid";
import StarlinkSection from "@/components/landing/StarlinkSection";
import BannerB2B from "@/components/landing/BannerB2B";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "TecnoSmart VZL | Tu seguridad, es nuestra prioridad",
  description:
    "Tienda especializada en seguridad electrónica. Videovigilancia, domótica, redes, control de acceso e instalación Starlink en Tinaquillo, Venezuela.",
  keywords: [
    "cámaras de seguridad", "hikvision venezuela", "tinaquillo", "CCTV",
    "automatización", "starlink venezuela", "redes estructuradas", "tecnosmart"
  ],
  openGraph: {
    title: "TecnoSmart VZL — Tu seguridad, es nuestra prioridad",
    description: "Seguridad Electrónica & Automatización Inteligente · Tinaquillo, Venezuela",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <ServiciosGrid />
      <StarlinkSection />
      <BannerB2B />
      <Footer />
    </main>
  );
}
