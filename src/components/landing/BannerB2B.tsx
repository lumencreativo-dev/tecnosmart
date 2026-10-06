import { ArrowRight, BadgeCheck } from "lucide-react";

const beneficios = [
  "Precios de distribuidor mayorista",
  "Soporte técnico y asesoría comercial",
  "Acceso a catálogo completo Hikvision",
  "Capacitación e instalación conjunta",
];

export default function BannerB2B() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "584122789273";

  return (
    <section id="b2b" className="py-20 bg-[#05235b] relative overflow-hidden">
      {/* Patrón de fondo */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <span className="inline-block bg-[#c9242b] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          Canal B2B · Distribución Oficial
        </span>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
          ¿Eres instalador independiente o técnico de seguridad?
        </h2>
        <p className="text-[#d9d9d9] text-lg max-w-3xl mx-auto mb-10 leading-relaxed">
          Únete a nuestro canal de distribución oficial Hikvision y obtén{" "}
          <strong className="text-white">precios preferenciales</strong>,
          capacitación y soporte técnico para hacer crecer tu negocio.
        </p>

        {/* Beneficios */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-10 text-left">
          {beneficios.map((b) => (
            <li key={b} className="flex items-start gap-3 text-[#d9d9d9] text-sm">
              <BadgeCheck className="w-5 h-5 text-[#c9242b] flex-shrink-0 mt-0.5" />
              {b}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href={`https://wa.me/${wa}?text=Hola%20TecnoSmart%2C%20me%20interesa%20el%20canal%20de%20distribuci%C3%B3n%20B2B`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#c9242b] hover:bg-red-700 text-white font-bold text-base px-8 py-4 rounded-lg shadow-lg transition-all hover:scale-105"
        >
          Quiero ser Distribuidor
          <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    </section>
  );
}
