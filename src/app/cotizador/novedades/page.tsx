// ─────────────────────────────────────────────────────────────
// app/cotizador/novedades/page.tsx — Changelog TecnoSmart Portal
// ─────────────────────────────────────────────────────────────
import { Sparkles, Wrench, Bug, Zap } from "lucide-react";

type TipoEntrada = "nueva" | "mejora" | "fix" | "importante";

interface Entrada {
  tipo: TipoEntrada;
  texto: string;
}

interface Version {
  version: string;
  fecha: string;
  titulo: string;
  entradas: Entrada[];
}

const CHANGELOG: Version[] = [
  {
    version: "1.2",
    fecha: "07 Oct 2025",
    titulo: "Importador mejorado y eliminación de productos",
    entradas: [
      { tipo: "nueva",    texto: "Importador PDF con parser columnar real — extrae SKU, nombre y los 3 precios directamente de la tabla del PDF." },
      { tipo: "nueva",    texto: "Soporte para todos los prefijos de SKU: DS-, iDS-, IDS-, THC-, THC-B, etc. (ya no solo DS-)." },
      { tipo: "nueva",    texto: "Columnas nuevas en el importador: Precio de Costo y Precio Técnico (15%)." },
      { tipo: "nueva",    texto: "Selector global de Marca y Categoría en el importador con botón 'Aplicar a todos'." },
      { tipo: "nueva",    texto: "Botón eliminar (🗑️) por fila en el importador para quitar productos antes de importar." },
      { tipo: "nueva",    texto: "Botón eliminar en el inventario con modal de confirmación para evitar borrados accidentales." },
      { tipo: "mejora",   texto: "Campo Costo (precio de compra) añadido al formulario de creación/edición de productos." },
      { tipo: "mejora",   texto: "Etiqueta 'Precio Técnico' ahora indica '(15% menos)' para mayor claridad." },
      { tipo: "mejora",   texto: "Sin límite de 50 items al importar: se procesan todos los productos del PDF." },
      { tipo: "nueva",    texto: "Módulo de Novedades (este panel) para seguimiento de versiones." },
    ],
  },
  {
    version: "1.1",
    fecha: "Sep 2025",
    titulo: "Filtros de inventario y precios técnicos",
    entradas: [
      { tipo: "nueva",    texto: "Filtros por Categoría y Marca en el inventario." },
      { tipo: "nueva",    texto: "Precio Técnico: precio especial con descuento para técnicos aliados." },
      { tipo: "nueva",    texto: "Tipo de cliente: Normal vs. Técnico — el cotizador aplica el precio correcto automáticamente." },
      { tipo: "mejora",   texto: "Estadísticas rápidas en el inventario: Total productos, Con stock, Sin stock." },
      { tipo: "mejora",   texto: "Búsqueda combinada en inventario: por nombre y por SKU simultáneamente." },
    ],
  },
  {
    version: "1.0",
    fecha: "Ago 2025",
    titulo: "Lanzamiento inicial del portal",
    entradas: [
      { tipo: "nueva",    texto: "Cotizador wizard completo: selección de cliente, productos, servicios y resumen financiero." },
      { tipo: "nueva",    texto: "Generación de PDF de cotización con logo, datos fiscales y desglose de items." },
      { tipo: "nueva",    texto: "Módulo de Facturación con Factura Fiscal en PDF." },
      { tipo: "nueva",    texto: "Inventario de productos con búsqueda, creación y edición de productos." },
      { tipo: "nueva",    texto: "Importador básico de catálogo PDF (Hikvision DS-)." },
      { tipo: "nueva",    texto: "Módulo de servicios con mano de obra y precios por categoría." },
      { tipo: "nueva",    texto: "Autenticación con Supabase — acceso restringido al portal interno." },
      { tipo: "nueva",    texto: "Diseño responsivo: funciona en desktop y móvil." },
    ],
  },
];

const TIPO_CONFIG: Record<TipoEntrada, { label: string; color: string; Icon: React.ElementType }> = {
  nueva:      { label: "Nuevo",    color: "bg-green-100 text-green-700",  Icon: Sparkles },
  mejora:     { label: "Mejora",   color: "bg-blue-100 text-blue-700",    Icon: Zap },
  fix:        { label: "Fix",      color: "bg-amber-100 text-amber-700",  Icon: Wrench },
  importante: { label: "¡Importante!", color: "bg-red-100 text-red-700", Icon: Zap },
};

export default function NovedadesPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
      {/* Encabezado */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Sparkles className="w-6 h-6 text-[#c9242b]" />
          <h1 className="text-2xl font-extrabold text-[#111]">Novedades</h1>
        </div>
        <p className="text-sm text-[#6e6e6e]">
          Historial de actualizaciones del Portal Interno TecnoSmart.
        </p>
      </div>

      {/* Timeline de versiones */}
      <div className="relative">
        {/* Línea vertical */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-[#e5e5e5]" />

        <div className="space-y-10">
          {CHANGELOG.map((v, vi) => (
            <div key={v.version} className="relative pl-9">
              {/* Punto en la línea */}
              <div className={`absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full border-2 flex items-center justify-center ${
                vi === 0
                  ? "bg-[#c9242b] border-[#c9242b]"
                  : "bg-white border-[#d9d9d9]"
              }`}>
                {vi === 0 && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>

              {/* Tarjeta de versión */}
              <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-sm overflow-hidden">
                {/* Header de la tarjeta */}
                <div className={`px-5 py-4 border-b border-[#f0f0f0] flex items-start justify-between gap-4 ${
                  vi === 0 ? "bg-[#fff5f5]" : ""
                }`}>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        vi === 0
                          ? "bg-[#c9242b] text-white"
                          : "bg-[#f0f0f0] text-[#6e6e6e]"
                      }`}>
                        v{v.version}
                      </span>
                      {vi === 0 && (
                        <span className="text-[10px] font-bold text-[#c9242b] uppercase tracking-wider">
                          Última versión
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-[#111] mt-1">{v.titulo}</h2>
                  </div>
                  <span className="text-xs text-[#a0a0a0] whitespace-nowrap mt-1">{v.fecha}</span>
                </div>

                {/* Lista de entradas */}
                <ul className="divide-y divide-[#f8f8f8]">
                  {v.entradas.map((e, ei) => {
                    const cfg = TIPO_CONFIG[e.tipo];
                    const Icon = cfg.Icon;
                    return (
                      <li key={ei} className="flex items-start gap-3 px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5 ${cfg.color}`}>
                          <Icon className="w-2.5 h-2.5" />
                          {cfg.label}
                        </span>
                        <span className="text-sm text-[#333] leading-snug">{e.texto}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-[#c0c0c0]">
        TecnoSmart Portal Interno · Desarrollado por Lumen Creativo
      </p>
    </div>
  );
}
