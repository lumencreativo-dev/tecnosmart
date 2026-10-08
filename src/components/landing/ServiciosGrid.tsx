import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { ALL_BRANDS } from "@/lib/brand-logos";

const servicios = [
  {
    titulo: "Videovigilancia CCTV / IP",
    descripcion:
      "Instalación y configuración de cámaras analógicas, IP, DVR y NVR. Monitoreo remoto 24/7 desde cualquier dispositivo.",
    foto: "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=600&q=80",
    items: ["Cámaras Bullet, Domo y PTZ", "DVR / NVR hasta 64 canales", "Visión nocturna full-color", "App de monitoreo remoto"],
  },
  {
    titulo: "Domótica & Control de Acceso",
    descripcion:
      "Automatización de cerraduras inteligentes, portones eléctricos, iluminación y acceso biométrico para tu hogar o empresa.",
    foto: "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80",
    items: ["Cerraduras electrónicas", "Portones automáticos", "Control facial / huella", "Iluminación inteligente"],
  },
  {
    titulo: "Cableado Estructurado & Redes",
    descripcion:
      "Infraestructura de red Cat5e/Cat6, fibra óptica, racks y Wi-Fi empresarial certificado. Garantía hasta 5 años.",
    foto: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
    items: ["Certificación Cat5e / Cat6", "Rack y patch panel", "Wi-Fi empresarial", "Garantía hasta 5 años"],
  },
  {
    titulo: "Mantenimiento Preventivo",
    descripcion:
      "Planes de mantenimiento para sistemas de seguridad, equipos de red y domótica. Técnicos certificados.",
    foto: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&q=80",
    items: ["Limpieza y calibración", "Actualización firmware", "Revisión DVR / NVR", "Contratos anuales"],
  },
];

export default function ServiciosGrid() {
  return (
    <section id="servicios" className="py-24 bg-[var(--ts-surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Encabezado */}
        <div className="text-center mb-16">
          <span className="text-[var(--ts-red)] text-xs font-bold uppercase tracking-widest">
            Lo que hacemos
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[var(--ts-text-primary)]">
            Soluciones Tecnológicas a tu Medida
          </h2>
          <p className="mt-4 text-[var(--ts-text-muted)] max-w-2xl mx-auto text-base">
            Desde la instalación hasta el mantenimiento, con garantía certificada
            y soporte técnico continuo.
          </p>
        </div>

        {/* Grid de servicios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {servicios.map((s) => (
            <div
              key={s.titulo}
              className="group bg-[var(--ts-surface)] rounded-2xl border border-[var(--ts-border)] overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              {/* Foto */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={s.foto}
                  alt={s.titulo}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {/* Barra roja superior */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--ts-red)]" />
                {/* Título sobre foto */}
                <h3 className="absolute bottom-4 left-5 text-[var(--ts-text-primary)] font-bold text-lg leading-tight">
                  {s.titulo}
                </h3>
              </div>

              {/* Contenido */}
              <div className="p-6">
                <p className="text-[var(--ts-text-muted)] text-sm leading-relaxed mb-4">
                  {s.descripcion}
                </p>
                <ul className="space-y-2">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[var(--ts-text-primary)]">
                      <CheckCircle2 className="w-4 h-4 text-[var(--ts-red)] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* ── STRIP DE MARCAS ── */}
        <div className="mt-20 pt-12 border-t border-[var(--ts-border)]">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-[var(--ts-text-muted)] mb-8">
            Trabajamos con las mejores marcas
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {ALL_BRANDS.map(({ name, Logo }) => (
              <div
                key={name}
                className="flex items-center justify-center text-[#999] hover:text-[var(--ts-text-primary)] transition-colors duration-200"
                title={name}
              >
                <Logo className="h-6 w-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
