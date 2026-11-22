"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Building2, Globe, ShieldCheck, LifeBuoy } from "lucide-react";
import FormularioSoporteModal from "./FormularioSoporteModal";

export default function Footer() {
  const [modalSoporteOpen, setModalSoporteOpen] = useState(false);
  const year = new Date().getFullYear();

  return (
    <>
      <FormularioSoporteModal
        isOpen={modalSoporteOpen}
        onClose={() => setModalSoporteOpen(false)}
      />

      <footer id="contacto" className="bg-[#0b0b0e] border-t border-[#1e1e26] text-[#c8c8cf]">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Columna 1: Empresa & Legal (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Image
                src="/logo-blanco.png"
                alt="TecnoSmart VZL"
                width={160}
                height={45}
                className="h-9 w-auto object-contain"
              />
            </div>

            <p className="text-sm font-semibold text-white italic">
              «Tu seguridad es nuestra prioridad, y nos comprometemos de verdad contigo»
            </p>

            <p className="text-xs text-[#8e8e9c] leading-relaxed max-w-sm">
              Empresa familiar especializada en instalaciones de seguridad electrónica, videovigilancia, redes, Starlink y automatizaciones tecnológicas para empresas y hogares.
            </p>

            <div className="pt-2 space-y-1.5 text-xs text-[#9595a2]">
              <p className="flex items-center gap-2 font-medium text-white">
                <Building2 className="w-3.5 h-3.5 text-[var(--ts-red)] flex-shrink-0" />
                <span>TECNO SMART VZL C.A</span>
              </p>
              <p className="font-mono text-[#80808e]">
                RIF: J-50701960-8
              </p>
              <p className="flex items-center gap-2 text-[#80808e]">
                <Globe className="w-3.5 h-3.5 text-[var(--ts-red)] flex-shrink-0" />
                <span>www.somostecnosmart.com</span>
              </p>
            </div>
          </div>

          {/* Columna 2: Contacto y Soporte Técnico (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">
              Contacto y Soporte
            </h4>

            <ul className="space-y-3 text-xs sm:text-sm text-[#b0b0bc]">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[var(--ts-red)] mt-0.5 flex-shrink-0" />
                <span className="leading-snug">
                  Av. Bolívar c/c Páez, Edif. Sta. Eduviges II, local-02, Tinaquillo, Edo. Cojedes
                </span>
              </li>

              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[var(--ts-red)] flex-shrink-0" />
                <a
                  href="https://wa.me/584122789273"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp: 0412-2789273
                </a>
              </li>

              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[var(--ts-red)] flex-shrink-0" />
                <a
                  href="mailto:contacto@somostecnosmart.com"
                  className="hover:text-white transition-colors"
                >
                  Ventas: contacto@somostecnosmart.com
                </a>
              </li>

              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[var(--ts-red)] flex-shrink-0" />
                <a
                  href="mailto:soporte@somostecnosmart.com"
                  className="hover:text-white transition-colors"
                >
                  Soporte: soporte@somostecnosmart.com
                </a>
              </li>

              {/* Botón Mesa de Ayuda Omnicanal */}
              <li className="pt-2">
                <button
                  type="button"
                  onClick={() => setModalSoporteOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1a1a24] hover:bg-[#252535] active:scale-95 text-white border border-[#333348] hover:border-cyan-500/50 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer group"
                >
                  <LifeBuoy className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
                  <span>Mesa de Ayuda & Tickets</span>
                </button>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#787888]">
                  <span>Acceso directo:</span>
                  <Link href="/ayuda" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                    somostecnosmart.com/ayuda
                  </Link>
                </div>
              </li>
            </ul>
          </div>

          {/* Columna 3: Servicios Aprobados (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">
              Servicios
            </h4>

            <ul className="space-y-2 text-xs text-[#8e8e9c]">
              <li className="hover:text-[var(--ts-red)] transition-colors cursor-default">
                › Cámaras y seguridad (CCTV/IP)
              </li>
              <li className="hover:text-[var(--ts-red)] transition-colors cursor-default">
                › Starlink (antena y red)
              </li>
              <li className="hover:text-[var(--ts-red)] transition-colors cursor-default">
                › Domótica y control de acceso
              </li>
              <li className="hover:text-[var(--ts-red)] transition-colors cursor-default">
                › Cableado estructurado y redes
              </li>
              <li className="hover:text-[var(--ts-red)] transition-colors cursor-default">
                › Automatizaciones para empresas
              </li>
              <li className="hover:text-[var(--ts-red)] transition-colors cursor-default">
                › Plan Premium ($5/mes)
              </li>
              <li className="pt-1 border-t border-[#1a1a22]">
                <button
                  type="button"
                  onClick={() => setModalSoporteOpen(true)}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer font-medium flex items-center gap-1.5 text-xs text-left"
                >
                  <LifeBuoy className="w-3.5 h-3.5 shrink-0" />
                  <span>› Mesa de Ayuda / Tickets</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Barra Inferior */}
        <div className="border-t border-[#181820] py-5 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#70707c]">
            <span>
              © {year} TECNO SMART VZL C.A · RIF: J-50701960-8 · Tinaquillo, Cojedes, Venezuela.
            </span>

            {/* Acceso discreto al portal interno (sin tocar rutas) */}
            <Link
              href="/dashboard"
              className="hover:text-[var(--ts-red)] transition-colors font-medium"
            >
              Acceso Interno
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
