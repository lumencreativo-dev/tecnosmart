// ─────────────────────────────────────────────────────────────
// src/lib/permissions.ts — Catálogo de Permisos Granulares
// ─────────────────────────────────────────────────────────────

export interface PermisoDef {
  id: string;
  nombre: string;
  descripcion: string;
}

export interface GrupoPermisos {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  permisos: PermisoDef[];
}

export const GRUPOS_PERMISOS: GrupoPermisos[] = [
  {
    id: "ventas",
    nombre: "Ventas & Clientes",
    descripcion: "Gestión de propuestas comerciales, facturación y cartera de clientes",
    icono: "FileEdit",
    permisos: [
      { id: "ventas.cotizar", nombre: "Crear y editar cotizaciones", descripcion: "Generar presupuestos y descargar PDFs para clientes" },
      { id: "ventas.facturar", nombre: "Emitir facturas fiscales", descripcion: "Convertir cotizaciones en facturas o emitir venta directa" },
      { id: "ventas.anular", nombre: "Anular facturas", descripcion: "Procedimiento de reversión y nota de anulación SENIAT" },
      { id: "ventas.ver_global", nombre: "Ver historial global de facturas", descripcion: "Consultar todas las facturas de la empresa, no solo las propias" },
      { id: "ventas.crm", nombre: "Acceso al CRM Pipeline", descripcion: "Mover oportunidades comerciales por las etapas de venta" },
      { id: "ventas.clientes", nombre: "Gestionar clientes", descripcion: "Crear, editar y clasificar empresas y contactos VIP" },
    ],
  },
  {
    id: "inventario",
    nombre: "Inventario & Equipos",
    descripcion: "Control de stock, catálogo de productos y precios",
    icono: "Package",
    permisos: [
      { id: "inventario.ver", nombre: "Consultar catálogo y stock", descripcion: "Ver lista de productos y precios de venta al público" },
      { id: "inventario.costos", nombre: "Ver costos de compra y márgenes", descripcion: "Visualizar el costo unitario de adquisición de equipos" },
      { id: "inventario.gestionar", nombre: "Modificar productos y stock", descripcion: "Crear nuevos productos, cambiar existencias y editar precios" },
      { id: "inventario.importar", nombre: "Carga masiva CSV", descripcion: "Importar y actualizar lotes grandes de inventario desde Excel" },
      { id: "inventario.suscripciones", nombre: "Gestionar pagos recurrentes", descripcion: "Control de contratos de Starlink, dominios y mantenimientos" },
    ],
  },
  {
    id: "proyectos",
    nombre: "Proyectos & Operaciones Técnicas",
    descripcion: "Coordinación y ejecución de servicios en campo",
    icono: "Wrench",
    permisos: [
      { id: "proyectos.crear_ordenes", nombre: "Crear y planificar órdenes de trabajo", descripcion: "Definir misiones técnicas con alcances y direcciones de instalación" },
      { id: "proyectos.asignar_cuadrillas", nombre: "Asignar cuadrillas y técnicos", descripcion: "Designar al Técnico Líder y ayudantes para cada obra" },
      { id: "proyectos.ver_propias", nombre: "Ver órdenes asignadas propias", descripcion: "Permite al técnico revisar su hoja de ruta y misiones en campo" },
      { id: "proyectos.materiales", nombre: "Requisición de materiales de almacén", descripcion: "Aprobar y registrar salida de cables y accesorios para instalaciones" },
      { id: "proyectos.agenda", nombre: "Gestionar calendario de obras", descripcion: "Coordinar fechas y horarios de visitas técnicas" },
      { id: "proyectos.actas", nombre: "Subir actas de entrega y firmas", descripcion: "Cargar fotos de conformidad y recolectar firma digital del cliente" },
    ],
  },
  {
    id: "finanzas",
    nombre: "Finanzas & Tesorería",
    descripcion: "Reportes de flujo de caja, cuentas bancarias y balances",
    icono: "Wallet",
    permisos: [
      { id: "finanzas.dashboard", nombre: "Ver métricas financieras globales", descripcion: "Acceso a totales facturados, proyecciones e ingresos en Dashboard" },
      { id: "finanzas.cajas", nombre: "Control de cajas y cuentas bancarias", descripcion: "Ver saldos de Zelle, Efectivo, Pago Móvil y Bancos" },
      { id: "finanzas.reportes", nombre: "Reportes de rentabilidad y balances", descripcion: "Exportar reportes de utilidades y estado financiero" },
      { id: "finanzas.cxc", nombre: "Cuentas por cobrar y cobranzas", descripcion: "Gestionar créditos otorgados y registrar abonos de clientes" },
    ],
  },
  {
    id: "dashboard",
    nombre: "Widgets del Dashboard",
    descripcion: "Controla qué módulos y tarjetas informativas están disponibles en la pantalla de inicio",
    icono: "LayoutDashboard",
    permisos: [
      { id: "dashboard.finanzas", nombre: "Métricas de Ingresos y Facturación", descripcion: "Ingresos cerrados ($/Bs) y proyecciones comerciales en curso" },
      { id: "dashboard.mrr", nombre: "MRR e Ingresos Recurrentes", descripcion: "Módulo de mensualidades y suscripciones activas" },
      { id: "dashboard.tasas", nombre: "Monitor de Tasas en Vivo", descripcion: "Cotizaciones cambiarias BCV, Euro, Paralelo y Binance P2P" },
      { id: "dashboard.ticket_promedio", nombre: "Ticket Promedio", descripcion: "Métrica del promedio en USD por cada factura generada" },
      { id: "dashboard.productos_top", nombre: "Ranking de Productos Más Vendidos", descripcion: "Listado de los equipos y materiales con mayor salida" },
      { id: "dashboard.clientes_frecuentes", nombre: "Ranking de Clientes Frecuentes", descripcion: "Clientes con mayor volumen comercial y recurrencia" },
      { id: "dashboard.grafica_ventas", nombre: "Gráfico de Rendimiento Semestral", descripcion: "Flujo comparativo de cotizaciones aprobadas vs pendientes" },
      { id: "dashboard.seguimientos", nombre: "Alertas de Seguimiento Comercial", descripcion: "Avisos de seguimiento telefónico / WhatsApp a los 5 y 15 días" },
      { id: "dashboard.proximos_pagos", nombre: "Próximos Pagos de Suscripciones", descripcion: "Calendario de cobros por vencer o vencidos para cobranza" },
      { id: "dashboard.operaciones_campo", nombre: "Misiones Técnicas & Cuadrillas", descripcion: "Panel de órdenes en campo, herramientas y catálogo técnico" },
    ],
  },
  {
    id: "administracion",
    nombre: "Administración & Sistema",
    descripcion: "Configuración global de la plataforma y accesos",
    icono: "Settings",
    permisos: [
      { id: "administracion.invitar", nombre: "Invitar nuevos usuarios", descripcion: "Generar enlaces de invitación para empleados" },
      { id: "administracion.roles", nombre: "Gestionar roles y permisos", descripcion: "Crear roles personalizados y editar facultades" },
      { id: "administracion.configuracion", nombre: "Ajustes de empresa", descripcion: "Modificar datos de SENIAT, IVA, días de validez y descuentos" },
    ],
  },
];

// Helper: Comprobar si un rol tiene un permiso específico
export function tienePermiso(permisosUsuario: string[] = [], permisoRequerido: string): boolean {
  if (permisosUsuario.includes("*")) return true; // Super Admin tiene acceso universal
  return permisosUsuario.includes(permisoRequerido);
}
