import Image from "next/image";
import { Wifi, Settings, CreditCard, ArrowRight } from "lucide-react";

const planes = [
  {
    titulo: "Instalación",
    precio: "Desde $80",
    descripcion: "Montaje de antena, soporte, alineación satelital y tendido de cable.",
    icono: Settings,
  },
  {
    titulo: "Configuración",
    precio: "$50",
    descripcion: "Setup completo de red, integración con router y dispositivos locales.",
    icono: Wifi,
  },
  {
    titulo: "Gestión de Pago Mensual",
    precio: "Plan + $10",
    descripcion: "Sin tarjeta internacional, nosotros gestionamos tu mensualidad. Solo $10 de comisión.",
    icono: CreditCard,
  },
];

export default function StarlinkSection() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "584122789273";

  return (
    <section id="starlink" className="py-24 bg-[#f5f5f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Imagen */}
          <div className="relative h-80 lg:h-full min-h-[400px] rounded-2xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800&q=80"
              alt="Antena Starlink instalada"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
            {/* Badge nuevo servicio */}
            <span className="absolute top-5 left-5 bg-[#c9242b] text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
              ★ Nuevo Servicio
            </span>
          </div>

          {/* Contenido */}
          <div>
            <span className="text-[#c9242b] text-xs font-bold uppercase tracking-widest">
              Internet Satelital
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#111111] mb-4">
              Starlink en Venezuela
            </h2>
            <p className="text-[#6e6e6e] mb-8 leading-relaxed">
              Instalamos y configuramos tu antena Starlink. ¿No tienes tarjeta
              internacional? Nosotros gestionamos el pago mensual de tu plan — solo
              pagas <strong className="text-[#111111]">$10 de comisión</strong>.
            </p>

            {/* Tarjetas de planes */}
            <div className="space-y-3 mb-8">
              {planes.map((p) => {
                const Icon = p.icono;
                return (
                  <div
                    key={p.titulo}
                    className="flex items-start gap-4 bg-white rounded-xl border border-[#e5e5e5] p-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#c9242b]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#c9242b]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[#111111] text-sm">{p.titulo}</p>
                        <span className="text-[#c9242b] font-bold text-sm">{p.precio}</span>
                      </div>
                      <p className="text-[#6e6e6e] text-xs mt-0.5 leading-snug">{p.descripcion}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <a
              href={`https://wa.me/${wa}?text=Hola%20TecnoSmart%2C%20me%20interesa%20el%20servicio%20de%20Starlink`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#c9242b] hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg transition-all hover:scale-105 shadow-md shadow-red-900/20"
            >
              Cotizar Starlink
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
