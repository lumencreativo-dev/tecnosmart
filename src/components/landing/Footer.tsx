import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Building2 } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="contacto" className="bg-[var(--ts-surface-raised)] text-[#d9d9d9]">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Columna 1: Marca */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Image
              src="/logo-blanco.png"
              alt="TecnoSmart"
              width={160}
              height={45}
              className="h-10 w-auto object-contain"
            />
          </div>
          <p className="text-sm leading-relaxed text-[var(--ts-text-muted)] italic mt-2">
            "Tu seguridad, es nuestra prioridad."
          </p>
          <p className="text-sm leading-relaxed text-[var(--ts-text-muted)] mt-2">
            Tienda especializada en seguridad electrónica, automatización y redes.
            Equipos Hikvision, HiLook, EZVIZ, Tapo, TP-Link y más.
          </p>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-[var(--ts-text-muted)] flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-[var(--ts-red)] flex-shrink-0" />
              TECNO SMART VZL C.A
            </p>
            <p className="text-xs text-[var(--ts-text-muted)]">RIF: J-50701960-8</p>
          </div>
        </div>

        {/* Columna 2: Contacto */}
        <div>
          <h4 className="text-[var(--ts-text-primary)] font-semibold mb-4 text-sm uppercase tracking-wider">
            Contacto
          </h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[var(--ts-red)] mt-0.5 flex-shrink-0" />
              <span className="leading-snug">
                Av. Bolívar C/C c. Páez, Edif. Sta. Eduviges II,
                local-02, Tinaquillo, Edo. Cojedes
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[var(--ts-red)] flex-shrink-0" />
              <a
                href="https://wa.me/584122789273"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--ts-text-primary)] transition-colors"
              >
                0412-2789273
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[var(--ts-red)] flex-shrink-0" />
              <a
                href="mailto:tecnosmartvzla@gmail.com"
                className="hover:text-[var(--ts-text-primary)] transition-colors"
              >
                tecnosmartvzla@gmail.com
              </a>
            </li>
          </ul>
        </div>

        {/* Columna 3: Servicios rápidos */}
        <div>
          <h4 className="text-[var(--ts-text-primary)] font-semibold mb-4 text-sm uppercase tracking-wider">
            Servicios
          </h4>
          <ul className="space-y-2 text-sm text-[var(--ts-text-muted)]">
            {[
              "Videovigilancia CCTV / IP",
              "Domótica & Control de Acceso",
              "Cableado Estructurado",
              "Mantenimiento Industrial",
              "Distribución Hikvision B2B",
            ].map((s) => (
              <li key={s} className="hover:text-[var(--ts-red)] cursor-default transition-colors">
                › {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-[#222] py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--ts-text-muted)]">
          <span>
            © {year} TECNO SMART VZL C.A · RIF: J-50701960-8 · Todos los derechos reservados.
          </span>
          {/* Acceso discreto al cotizador — NO indexado */}
          <Link
            href="/cotizador"
            className="hover:text-[var(--ts-red)] transition-colors"
          >
            Acceso Interno
          </Link>
        </div>
      </div>
    </footer>
  );
}
