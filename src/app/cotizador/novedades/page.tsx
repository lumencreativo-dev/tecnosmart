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
    version: "1.8",
    fecha: "07 Oct 2026",
    titulo: "Navegación Rediseñada — Active Links y Menú Mobile",
    entradas: [
      { tipo: "nueva",  texto: "Página 'Menú' estilo app nativa: tarjeta de usuario, dropdown con Ajustes/Novedades/Cerrar Sesión y módulos organizados por secciones (Comercial, Gestión, Sistema)." },
      { tipo: "nueva",  texto: "Active links: el módulo activo se resalta en rojo tanto en el nav de escritorio como en la barra inferior móvil." },
      { tipo: "nueva",  texto: "Avatar 'TS' con dropdown en el header de escritorio: Ajustes, Novedades, Cerrar Sesión." },
      { tipo: "mejora", texto: "Bottom nav móvil rediseñado: Inicio, CRM, FAB (+), Stock, Menú — más limpio y centrado en el flujo de trabajo diario." },
      { tipo: "mejora", texto: "Nav de escritorio reorganizado con grupos lógicos (Comercial · Clientes · Inventario)." },
    ],
  },
  {
    version: "1.7",
    fecha: "07 Oct 2026",
    titulo: "Historial de Facturas Completo",
    entradas: [
      { tipo: "nueva",   texto: "Click en cualquier factura abre un panel lateral con todos los detalles: cliente, líneas de productos/servicios y resumen fiscal (IVA, IGTF, Bs., tasa BCV)." },
      { tipo: "nueva",   texto: "Botón 'Descargar PDF' en el panel de detalle para re-generar la factura fiscal en cualquier momento." },
      { tipo: "nueva",   texto: "Anulación de facturas con motivo obligatorio y clave de administrador (conforme Providencia 00071 SENIAT)." },
      { tipo: "nueva",   texto: "Las facturas anuladas quedan en el historial con badge visible — no se pueden eliminar para cumplir la normativa fiscal." },
      { tipo: "nueva",   texto: "Eliminación definitiva (facturas de prueba) protegida por contraseña de administrador." },
      { tipo: "nueva",   texto: "Estadísticas en el historial: Facturas Activas, Total Facturado y Total Anuladas." },
      { tipo: "fix",     texto: "Corrección del encabezado de la Factura Fiscal PDF: logo y nombre ya no se superponen." },
      { tipo: "fix",     texto: "Métricas del Dashboard excluyen correctamente las cotizaciones en papelera." },
    ],
  },
  {
    version: "1.6",
    fecha: "07 Oct 2026",
    titulo: "Módulo de Clientes con Rangos VIP",
    entradas: [
      { tipo: "nueva",  texto: "Directorio completo de Clientes accesible desde el menú y desde el CRM." },
      { tipo: "nueva",  texto: "Sistema de Rangos automático basado en total facturado: Nuevo, Bronce, Plata, Oro, VIP, VIP Premium y VIP Élite ⭐." },
      { tipo: "nueva",  texto: "Panel lateral (Drawer) por cliente con datos completos, métricas y acciones de contacto." },
      { tipo: "nueva",  texto: "Edición de datos del cliente directamente desde su perfil (se sincroniza globalmente)." },
      { tipo: "nueva",  texto: "Historial completo de cotizaciones por cliente con estado y montos." },
      { tipo: "nueva",  texto: "Ordenar clientes por Mayor Gasto, Más Cotizaciones, Más Reciente o Alfabético." },
      { tipo: "nueva",  texto: "Filtrar por Rango (VIP, Oro, Plata, etc.) desde el toolbar." },
      { tipo: "nueva",  texto: "Botones directos de WhatsApp y Email desde el perfil de cada cliente." },
    ],
  },
  {
    version: "1.5",
    fecha: "07 Oct 2026",
    titulo: "Reorganización, FAB y Papelera de Cotizaciones",
    entradas: [
      { tipo: "nueva",   texto: "Dashboard como pantalla principal del portal interno." },
      { tipo: "nueva",   texto: "Botón FAB rojo (+) central en la barra de navegación móvil para crear cotizaciones rápidamente." },
      { tipo: "nueva",   texto: "Papelera de reciclaje en el CRM: borrar cotizaciones de prueba sin perder datos reales." },
      { tipo: "nueva",   texto: "Restaurar cotizaciones desde la papelera con un solo clic." },
      { tipo: "nueva",   texto: "Eliminación definitiva de cotizaciones con confirmación de seguridad." },
      { tipo: "mejora",  texto: "Reorganización completa del menú de navegación (Desktop + Móvil) — más limpio y ordenado." },
      { tipo: "mejora",  texto: "Botón 'Nueva Cotización' prominente en el header del Desktop." },
    ],
  },
  {
    version: "1.4",
    fecha: "07 Oct 2026",
    titulo: "Dashboard de Métricas y Administración",
    entradas: [
      { tipo: "nueva",    texto: "Panel de Métricas en vivo (Ingreso Real vs Ingreso Proyectado)." },
      { tipo: "nueva",    texto: "Exclusión automática de cotizaciones vencidas en el cálculo de proyecciones." },
      { tipo: "nueva",    texto: "Panel de Administración para controlar variables globales (Ej. Porcentaje de descuento a técnicos)." },
      { tipo: "nueva",    texto: "Directorio de Clientes integrado en el Dashboard." },
    ],
  },
  {
    version: "1.3",
    fecha: "07 Oct 2026",
    titulo: "Módulo CRM y Seguridad",
    entradas: [
      { tipo: "nueva",    texto: "Módulo CRM (Pipeline) para gestión de estados de cotización (Borrador, Enviada, Aprobada, Facturada)." },
      { tipo: "nueva",    texto: "Historial completo de cotizaciones con opciones de visualización y modificación rápida de estados." },
      { tipo: "nueva",    texto: "Seguridad y Login de Acceso ('admintecno') implementado mediante cookies protegidas." },
      { tipo: "nueva",    texto: "Navegación inferior (Bottom Nav) exclusiva para dispositivos móviles tipo App." },
      { tipo: "mejora",   texto: "Rediseño completo de la barra de navegación usando iconos premium en lugar de emojis." },
      { tipo: "fix",      texto: "Base de datos ajustada para soportar nuevas categorías y marcas mediante listas desplegables seguras." },
    ],
  },
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
          <Sparkles className="w-6 h-6 text-[var(--ts-red)]" />
          <h1 className="text-2xl font-extrabold text-[var(--ts-text-primary)]">Novedades</h1>
        </div>
        <p className="text-sm text-[var(--ts-text-muted)]">
          Historial de actualizaciones del Portal Interno TecnoSmart.
        </p>
      </div>

      {/* Timeline de versiones */}
      <div className="relative">
        {/* Línea vertical */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-[var(--ts-border)]" />

        <div className="space-y-10">
          {CHANGELOG.map((v, vi) => (
            <div key={v.version} className="relative pl-9">
              {/* Punto en la línea */}
              <div className={`absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full border-2 flex items-center justify-center ${
                vi === 0
                  ? "bg-[var(--ts-red)] border-[var(--ts-red)]"
                  : "bg-[var(--ts-surface)] border-[var(--ts-border)]"
              }`}>
                {vi === 0 && <div className="w-2 h-2 rounded-full bg-[var(--ts-surface)]" />}
              </div>

              {/* Tarjeta de versión */}
              <div className="bg-[var(--ts-surface)] rounded-2xl border border-[var(--ts-border)] shadow-sm overflow-hidden">
                {/* Header de la tarjeta */}
                <div className={`px-5 py-4 border-b border-[var(--ts-border-2)] flex items-start justify-between gap-4 ${
                  vi === 0 ? "bg-[var(--ts-bg)]" : ""
                }`}>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        vi === 0
                          ? "bg-[var(--ts-red)] text-[var(--ts-text-primary)]"
                          : "bg-[var(--ts-surface-2)] text-[var(--ts-text-muted)]"
                      }`}>
                        v{v.version}
                      </span>
                      {vi === 0 && (
                        <span className="text-[10px] font-bold text-[var(--ts-red)] uppercase tracking-wider">
                          Última versión
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-[var(--ts-text-primary)] mt-1">{v.titulo}</h2>
                  </div>
                  <span className="text-xs text-[var(--ts-text-muted)] whitespace-nowrap mt-1">{v.fecha}</span>
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
                        <span className="text-sm text-[var(--ts-text-primary)] leading-snug">{e.texto}</span>
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
