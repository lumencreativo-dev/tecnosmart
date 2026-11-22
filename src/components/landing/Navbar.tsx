"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowRight, ShieldCheck, LifeBuoy } from "lucide-react";
import FormularioSoporteModal from "./FormularioSoporteModal";

const navLinks = [
  { label: "El Problema", href: "#problema" },
  { label: "Servicios", href: "#servicios" },
  { label: "Starlink", href: "#starlink" },
  { label: "Por Qué TecnoSmart", href: "#por-que-nosotros" },
  { label: "Plan Premium", href: "#plan-premium" },
  { label: "Garantía", href: "#garantia" },
  { label: "Trabajos", href: "#trabajos" },
  { label: "Cobertura", href: "#cobertura" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [modalSoporteOpen, setModalSoporteOpen] = useState(false);

  return (
    <>
      <FormularioSoporteModal
        isOpen={modalSoporteOpen}
        onClose={() => setModalSoporteOpen(false)}
      />
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d10]/90 backdrop-blur-md border-b border-[#222228] shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-blanco.png"
            alt="TecnoSmart VZL"
            width={180}
            height={50}
            priority
            className="h-8 sm:h-9 w-auto object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden xl:flex items-center gap-5">
          {navLinks.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-[#c8c8cf] hover:text-[var(--ts-red)] text-xs 2xl:text-sm font-medium transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Action Buttons: Soporte y Asesoría */}
        <div className="hidden sm:flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setModalSoporteOpen(true)}
            className="inline-flex items-center gap-1.5 bg-[#1a1a24] hover:bg-[#252533] active:scale-95 text-white border border-[#333347] text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2.5 rounded-lg shadow-sm transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer group"
          >
            <LifeBuoy className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
            <span>Soporte Técnico</span>
          </button>

          <a
            href="#asesoria-gratuita"
            className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-[#b01f25] text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-lg shadow-md shadow-red-950/40 transition-all hover:scale-105"
          >
            <span>Asesoría gratuita</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Mobile burger */}
        <button
          className="xl:hidden text-white p-2 focus:outline-none"
          onClick={() => setOpen(!open)}
          aria-label="Abrir Menú"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu dropdown */}
      {open && (
        <div className="xl:hidden bg-[#111116] border-b border-[#252530] px-5 py-5 space-y-3 shadow-2xl">
          <div className="grid grid-cols-2 gap-2 pb-2">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-[#d0d0d8] hover:text-[var(--ts-red)] text-sm font-medium py-2 px-2 rounded hover:bg-[#1a1a22] transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="pt-2 border-t border-[#23232c] space-y-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setModalSoporteOpen(true);
              }}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#1a1a24] hover:bg-[#252533] active:scale-95 text-white border border-[#333347] text-sm font-bold px-4 py-3 rounded-lg shadow-sm transition-all group"
            >
              <LifeBuoy className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
              <span>Abrir Ticket de Soporte Técnico</span>
            </button>

            <a
              href="#asesoria-gratuita"
              onClick={() => setOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 bg-[var(--ts-red)] hover:bg-[#b01f25] text-white text-sm font-bold px-4 py-3 rounded-lg shadow-md shadow-red-950/40 transition-all"
            >
              <span>Solicitar asesoría gratuita</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
      </header>
    </>
  );
}
