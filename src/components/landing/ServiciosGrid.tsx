import { Camera, Home, Network, Wrench } from "lucide-react";

const servicios = [
  {
    icon: Camera,
    titulo: "Videovigilancia (CCTV / IP / Hikvision)",
    descripcion:
      "Instalación y configuración de cámaras analógicas, IP y DVR/NVR Hikvision. Monitoreo remoto 24/7 desde cualquier dispositivo.",
    acento: "#c9242b",
    items: ["Cámaras Bullet y Domo", "DVR / NVR hasta 64ch", "Visión nocturna y PTZ", "App Hik-Connect"],
  },
  {
    icon: Home,
    titulo: "Domótica & Control de Acceso",
    descripcion:
      "Automatización de cerraduras inteligentes, portones eléctricos, iluminación y control de acceso biométrico.",
    acento: "#c9242b",
    items: ["Cerraduras electrónicas", "Portones automáticos", "Control biométrico / facial", "Iluminación inteligente"],
  },
  {
    icon: Network,
    titulo: "Cableado Estructurado & Redes",
    descripcion:
      "Diseño e instalación de infraestructura de red Cat5e/Cat6, fibra óptica, racks, switches y Wi-Fi empresarial.",
    acento: "#05235b",
    items: ["Certificación Cat5e / Cat6", "Rack y patchpanel", "Wi-Fi empresarial", "Garantía hasta 5 años"],
  },
  {
    icon: Wrench,
    titulo: "Mantenimiento Industrial & Residencial",
    descripcion:
      "Planes de mantenimiento preventivo y correctivo para sistemas de seguridad, equipos de red e instalaciones eléctricas.",
    acento: "#05235b",
    items: ["Mantenimiento de cámaras", "Revisión DVR / NVR", "Reparación de equipos", "Contratos anuales"],
  },
];

export default function ServiciosGrid() {
  return (
    <section id="servicios" className="py-24 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center mb-16">
          <span className="text-[#c9242b] text-sm font-semibold uppercase tracking-widest">
            Lo que hacemos
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#111111]">
            Soluciones Tecnológicas a tu Medida
          </h2>
          <p className="mt-4 text-[#6e6e6e] max-w-2xl mx-auto text-base">
            Cobertura completa desde la instalación hasta el mantenimiento, con
            garantía certificada y soporte técnico continuo.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {servicios.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.titulo}
                className="bg-white rounded-2xl shadow-sm border border-[#d9d9d9] hover:shadow-md hover:-translate-y-1 transition-all overflow-hidden group"
              >
                {/* Barra de acento superior */}
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: s.acento }}
                />
                <div className="p-8">
                  {/* Ícono */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${s.acento}15` }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: s.acento }}
                    />
                  </div>

                  <h3 className="text-xl font-bold text-[#111111] mb-3">
                    {s.titulo}
                  </h3>
                  <p className="text-[#6e6e6e] text-sm leading-relaxed mb-5">
                    {s.descripcion}
                  </p>

                  {/* Lista */}
                  <ul className="space-y-2">
                    {s.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-[#111111]">
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: s.acento }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
