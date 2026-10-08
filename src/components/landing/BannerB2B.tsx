import Image from "next/image";
import { ArrowRight, BadgeCheck } from "lucide-react";

const beneficios = [
  "Precios especiales para técnicos e instaladores",
  "Soporte técnico y asesoría comercial directa",
  "Acceso a catálogo completo de equipos",
  "Capacitación e instalación conjunta disponible",
];

export default function BannerB2B() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "584122789273";

  return (
    <section id="b2b" className="py-0 relative overflow-hidden">
      {/* Foto de fondo — técnico trabajando */}
      <div className="relative h-auto">
        <Image
          src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1400&q=80"
          alt="Técnico en instalación profesional"
          width={1400}
          height={600}
          className="w-full h-[500px] sm:h-[420px] object-cover object-center"
        />
        {/* Overlay negro fuerte */}
        <div className="absolute inset-0 bg-[var(--ts-surface-raised)]/88" />

        {/* Línea roja superior */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--ts-red)]" />

        {/* Contenido centrado */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

              {/* Texto */}
              <div>
                <span className="inline-block bg-[var(--ts-red)] text-[var(--ts-text-primary)] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                  Técnicos e Instaladores
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--ts-text-primary)] mb-3 leading-tight">
                  ¿Eres técnico o instalador independiente?
                </h2>
                <p className="text-[var(--ts-text-muted)] text-base leading-relaxed">
                  Conseguí tus equipos de seguridad a <strong className="text-white">precio especial de técnico</strong>, diferente al precio de cliente final. Sin compromisos, sin mínimos de compra.
                </p>
              </div>

              {/* Lista + CTA */}
              <div>
                <ul className="space-y-3 mb-7">
                  {beneficios.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-[#d9d9d9] text-sm">
                      <BadgeCheck className="w-5 h-5 text-[var(--ts-red)] flex-shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
                <a
                  href={`https://wa.me/${wa}?text=Hola%20TecnoSmart%2C%20soy%20t%C3%A9cnico%20instalador%20y%20me%20interesa%20precio%20especial`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[var(--ts-red)] hover:bg-red-700 text-[var(--ts-text-primary)] font-bold px-6 py-3.5 rounded-lg transition-all hover:scale-105 shadow-lg shadow-red-900/30"
                >
                  Consultar precio de técnico
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
