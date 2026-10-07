// ─────────────────────────────────────────────────────────────
// app/cotizador/layout.tsx
// Layout del tabulador con noindex y guard de sesión básico
// ─────────────────────────────────────────────────────────────
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { FileEdit, Receipt, UploadCloud, Package, Globe, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Tabulador Comercial | TecnoSmart",
  description: "Herramienta interna de cotizaciones TecnoSmart",
  robots: { index: false, follow: false }, 
};

export default function CotizadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 md:pb-0">
      {/* ── HEADER SUPERIOR ── */}
      <header className="bg-white border-b border-[#e5e5e5] px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <Image src="/logo-color.png" alt="TecnoSmart" width={130} height={36} className="h-7 w-auto object-contain" />
          <div className="hidden sm:block border-l border-[#e5e5e5] pl-3">
            <p className="text-[#6e6e6e] text-[10px] leading-tight font-medium">RIF: J-50701960-8</p>
            <p className="text-[#6e6e6e] text-[10px] leading-tight font-medium">0412-2789273</p>
          </div>
          <span className="bg-[#c9242b]/10 text-[#c9242b] px-2 py-0.5 rounded text-[10px] font-bold hidden md:block uppercase tracking-wider ml-2">Portal Interno</span>
        </div>
        
        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link href="/cotizador" className="flex items-center gap-2 px-4 py-2 text-[#6e6e6e] hover:text-[#c9242b] hover:bg-red-50 rounded-lg transition-colors">
            <FileEdit className="w-4 h-4" /> Cotizar
          </Link>
          <Link href="/cotizador/facturacion" className="flex items-center gap-2 px-4 py-2 text-[#6e6e6e] hover:text-[#c9242b] hover:bg-red-50 rounded-lg transition-colors">
            <Receipt className="w-4 h-4" /> Facturación
          </Link>
          <Link href="/cotizador/inventario" className="flex items-center gap-2 px-4 py-2 text-[#6e6e6e] hover:text-[#c9242b] hover:bg-red-50 rounded-lg transition-colors">
            <Package className="w-4 h-4" /> Inventario
          </Link>
          <Link href="/cotizador/importar" className="flex items-center gap-2 px-4 py-2 text-[#6e6e6e] hover:text-[#c9242b] hover:bg-red-50 rounded-lg transition-colors">
            <UploadCloud className="w-4 h-4" /> Importar
          </Link>
          <Link href="/cotizador/novedades" className="flex items-center gap-2 px-4 py-2 text-[#6e6e6e] hover:text-[#c9242b] hover:bg-red-50 rounded-lg transition-colors">
            <Sparkles className="w-4 h-4" /> Novedades
          </Link>
          
          <div className="w-px h-5 bg-[#e5e5e5] mx-2"></div>
          
          <Link href="/" className="flex items-center gap-2 px-4 py-2 text-[#a0a0a0] hover:text-[#111] transition-colors">
            <Globe className="w-4 h-4" /> Web
          </Link>
        </nav>
      </header>

      {/* ── CONTENIDO ── */}
      {children}

      {/* ── BOTTOM NAVIGATION (MÓVIL) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-[#e5e5e5] flex justify-around items-center h-16 z-50 px-2 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <Link href="/cotizador" className="flex flex-col items-center justify-center w-full h-full text-[#6e6e6e] hover:text-[#c9242b]">
          <FileEdit className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Cotizar</span>
        </Link>
        <Link href="/cotizador/facturacion" className="flex flex-col items-center justify-center w-full h-full text-[#6e6e6e] hover:text-[#c9242b]">
          <Receipt className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Facturas</span>
        </Link>
        <Link href="/cotizador/inventario" className="flex flex-col items-center justify-center w-full h-full text-[#6e6e6e] hover:text-[#c9242b]">
          <Package className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Stock</span>
        </Link>
        <Link href="/cotizador/novedades" className="flex flex-col items-center justify-center w-full h-full text-[#6e6e6e] hover:text-[#c9242b]">
          <Sparkles className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Novedades</span>
        </Link>
      </nav>
    </div>
  );
}
