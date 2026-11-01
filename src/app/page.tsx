import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProblemaSection from "@/components/landing/ProblemaSection";
import ServiciosGrid from "@/components/landing/ServiciosGrid";
import StarlinkSection from "@/components/landing/StarlinkSection";
import PorQueTecnoSmart from "@/components/landing/PorQueTecnoSmart";
import VideoLeadMagnet from "@/components/landing/VideoLeadMagnet";
import PlanPremiumSection from "@/components/landing/PlanPremiumSection";
import GarantiaSoporteSection from "@/components/landing/GarantiaSoporteSection";
import TrabajosTestimoniosSection from "@/components/landing/TrabajosTestimoniosSection";
import CoberturaSection from "@/components/landing/CoberturaSection";
import FormularioAsesoria from "@/components/landing/FormularioAsesoria";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "TecnoSmart VZL | Tu seguridad es nuestra prioridad",
  description:
    "Instalaciones de seguridad realizadas por técnicos certificados, limpias y según normas internacionales, por una empresa familiar en la que puedes confiar. Videovigilancia CCTV/IP, Starlink, domótica, redes y automatizaciones en Venezuela.",
  keywords: [
    "cámaras de seguridad",
    "videovigilancia CCTV",
    "cámaras IP",
    "Starlink venezuela",
    "control de acceso",
    "domótica",
    "cableado estructurado",
    "automatizaciones para empresas",
    "Tinaquillo",
    "Cojedes",
    "Valencia",
    "Caracas",
    "TecnoSmart",
    "somostecnosmart",
  ],
  openGraph: {
    title: "TecnoSmart VZL — Tu seguridad es nuestra prioridad, y nos comprometemos de verdad contigo",
    description:
      "Instalaciones de seguridad por técnicos certificados, limpias y según normas internacionales. Tinaquillo, Cojedes, Valencia y toda Venezuela.",
    url: "https://www.somostecnosmart.com",
    siteName: "TecnoSmart VZL",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0d] text-white selection:bg-[var(--ts-red)] selection:text-white">
      {/* 1. Navbar (logo + botón «Asesoría gratuita») */}
      <Navbar />

      <main>
        {/* 2. Hero: titular + subtítulo + CTA + [FOTO: hero] */}
        <HeroSection />

        {/* 3. El problema: robos y malas instalaciones (prepara al vídeo) */}
        <ProblemaSection />

        {/* 4. Servicios (en el orden aprobado) */}
        <ServiciosGrid />

        {/* 5. Starlink destacado (sin precios) */}
        <StarlinkSection />

        {/* 6. Por qué TecnoSmart (diferenciadores + «+200 proyectos instalados») */}
        <PorQueTecnoSmart />

        {/* 7. Vídeo lead magnet [VÍDEO] */}
        <VideoLeadMagnet />

        {/* 8. Plan premium $5/mes (con lo que incluye y lo que NO incluye) */}
        <PlanPremiumSection />

        {/* 9. Garantía y soporte reales */}
        <GarantiaSoporteSection />

        {/* 10. Trabajos reales y testimonios [FOTOS + COMENTARIOS] */}
        <TrabajosTestimoniosSection />

        {/* 11. Cobertura */}
        <CoberturaSection />

        {/* 12. Formulario de asesoría gratuita (campos de la sección 3) */}
        <FormularioAsesoria />
      </main>

      {/* 13. Footer (contacto, RIF, dirección) */}
      <Footer />
    </div>
  );
}
