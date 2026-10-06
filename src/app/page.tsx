import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ServiciosGrid from "@/components/landing/ServiciosGrid";
import BannerB2B from "@/components/landing/BannerB2B";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "TecnoSmart VZL | Seguridad Electrónica & Automatización Inteligente",
  description:
    "Distribuidor Oficial Hikvision en Venezuela. Videovigilancia, domótica, control de acceso y cableado estructurado con garantía certificada.",
};

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <ServiciosGrid />
      <BannerB2B />
      <Footer />
    </main>
  );
}
