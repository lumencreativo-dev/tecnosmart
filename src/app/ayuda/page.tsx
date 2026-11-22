import { Metadata } from "next";
import AyudaClient from "./AyudaClient";

export const metadata: Metadata = {
  title: "Mesa de Ayuda & Soporte Técnico | TecnoSmart Vzl",
  description: "Apertura de tickets de soporte técnico para Starlink, cámaras de seguridad CCTV, redes y automatizaciones en Venezuela.",
};

export default function AyudaPage() {
  return <AyudaClient />;
}
