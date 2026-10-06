// ─────────────────────────────────────────────────────────────
// app/cotizador/layout.tsx
// Layout del tabulador con noindex y guard de sesión básico
// ─────────────────────────────────────────────────────────────
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tabulador Comercial | TecnoSmart",
  description: "Herramienta interna de cotizaciones TecnoSmart",
  robots: { index: false, follow: false }, // noindex: evita indexación
};

export default function CotizadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header interno */}
      <header className="bg-[#111111] border-b border-[#c9242b]/30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo-blanco.png" alt="TecnoSmart" width={130} height={36} className="h-7 w-auto object-contain" />
          <div className="hidden sm:block border-l border-[#333] pl-3">
            <p className="text-[#6e6e6e] text-xs leading-tight">TECNO SMART VZL C.A · RIF: J-50701960-8</p>
            <p className="text-[#6e6e6e] text-xs leading-tight">0412-2789273 · tecnosmartvzla@gmail.com</p>
          </div>
          <span className="text-[#c9242b] text-xs font-semibold hidden md:block">· Tabulador Interno</span>
        </div>
        <nav className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/cotizador" className="text-[#d9d9d9] hover:text-white transition-colors">
              📝 Nueva Cotización
            </Link>
            <Link href="/cotizador/facturacion" className="text-[#d9d9d9] hover:text-white transition-colors">
              🧾 Facturación
            </Link>
            <Link href="/cotizador/importar" className="text-[#d9d9d9] hover:text-white transition-colors">
              📦 Importar PDF
            </Link>
          </div>
          <Link
            href="/"
            className="text-xs text-[#6e6e6e] hover:text-[#c9242b] transition-colors border-l border-[#333] pl-4 ml-2"
          >
            ← Sitio web
          </Link>
        </nav>
      </header>

      {children}
    </div>
  );
}
