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
    nombre: "Ventas & Facturación",
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
      { id: "finanzas.cxp", nombre: "Cuentas por pagar (Proveedores & Nómina)", descripcion: "Registrar y liquidar pagos a proveedores, mayoristas y honorarios de técnicos" },
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
  {
    id: "soporte",
    nombre: "Soporte, Postventa & Garantías",
    descripcion: "Gestión de incidencias de clientes, garantías y manuales técnicos",
    icono: "LifeBuoy",
    permisos: [
      { id: "soporte.tickets", nombre: "Gestionar tickets de soporte", descripcion: "Crear, atender y cerrar reportes de fallas técnicas" },
      { id: "soporte.garantias", nombre: "Consultar y registrar garantías", descripcion: "Verificar seriales y vigencia de equipos instalados" },
      { id: "soporte.wiki", nombre: "Acceso a la base de conocimiento", descripcion: "Consultar manuales de configuración y diagramas" },
    ],
  },
  {
    id: "marketing",
    nombre: "Marketing & Leads Web",
    descripcion: "Captura de prospectos desde la web y campañas de correo",
    icono: "Megaphone",
    permisos: [
      { id: "marketing.leads", nombre: "Gestionar solicitudes web", descripcion: "Revisar y contactar prospectos de la Landing Page" },
      { id: "marketing.campanas", nombre: "Campañas de correo por Resend", descripcion: "Envío masivo de avisos, promociones y novedades" },
    ],
  },
];

// ── Catálogo Maestro de Roles Predeterminados ──────────────────────────
export interface RolDef {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  es_sistema: boolean;
  permisos: string[];
}

export const ROLES_PREDETERMINADOS: RolDef[] = [
  {
    id: "admin",
    nombre: "Super Admin (Gerencia)",
    descripcion: "Acceso total sin restricciones a todos los módulos y ajustes.",
    color: "#c9242b",
    es_sistema: true,
    permisos: ["*"],
  },
  {
    id: "administrador",
    nombre: "Administración & Finanzas",
    descripcion: "Facturación, cuentas bancarias, pagos a proveedores y cobranzas.",
    color: "#2563eb",
    es_sistema: true,
    permisos: [
      "ventas.facturar",
      "ventas.ver_global",
      "finanzas.dashboard",
      "finanzas.cajas",
      "finanzas.reportes",
      "finanzas.cxc",
      "finanzas.cxp",
      "dashboard.finanzas",
      "dashboard.tasas",
    ],
  },
  {
    id: "vendedor",
    nombre: "Asesor Comercial",
    descripcion: "Cotizaciones, CRM Pipeline, directorio de clientes y catálogo.",
    color: "#059669",
    es_sistema: true,
    permisos: [
      "ventas.cotizar",
      "ventas.crm",
      "ventas.clientes",
      "inventario.ver",
      "dashboard.tasas",
      "dashboard.productos_top",
      "dashboard.clientes_frecuentes",
      "dashboard.seguimientos",
    ],
  },
  {
    id: "gerente",
    nombre: "Gerente Operativo",
    descripcion: "Obras, cuadrillas técnicas, requisición de materiales y catálogo.",
    color: "#d97706",
    es_sistema: true,
    permisos: [
      "proyectos.crear_ordenes",
      "proyectos.asignar_cuadrillas",
      "proyectos.agenda",
      "proyectos.materiales",
      "proyectos.actas",
      "inventario.ver",
      "ventas.cotizar",
      "dashboard.operaciones_campo",
    ],
  },
  {
    id: "tecnico",
    nombre: "Técnico Líder / Cuadrilla",
    descripcion: "App móvil (tec.): órdenes asignadas, materiales y actas en campo.",
    color: "#9333ea",
    es_sistema: true,
    permisos: [
      "proyectos.ver_propias",
      "proyectos.materiales",
      "proyectos.actas",
      "inventario.ver",
    ],
  },
  {
    id: "tecnico_aliado",
    nombre: "Técnico Aliado B2B",
    descripcion: "App móvil (tec.): catálogo con 15% de descuento, calculadora CCTV y libreta de obras.",
    color: "#06b6d4",
    es_sistema: true,
    permisos: [
      "inventario.ver",
      "proyectos.ver_propias",
      "soporte.tickets",
      "soporte.wiki",
    ],
  },
];

// Helper: Comprobar si un rol tiene un permiso específico
export function tienePermiso(permisosUsuario: string[] = [], permisoRequerido: string): boolean {
  if (permisosUsuario.includes("*")) return true; // Super Admin tiene acceso universal
  return permisosUsuario.includes(permisoRequerido);
}

// Helper: Comprueba si el usuario tiene acceso a un módulo completo (al menos un permiso del grupo)
export function tieneAccesoModulo(permisosUsuario: string[] = [], moduloId: string): boolean {
  if (permisosUsuario.includes("*")) return true;
  const grupo = GRUPOS_PERMISOS.find(g => g.id === moduloId);
  if (!grupo) return false;
  return grupo.permisos.some(p => permisosUsuario.includes(p.id));
}

// Helper: Activa o desactiva todos los permisos de un módulo para un usuario
export function alternarModuloCompleto(permisosActuales: string[], moduloId: string, activar: boolean): string[] {
  const grupo = GRUPOS_PERMISOS.find(g => g.id === moduloId);
  if (!grupo) return permisosActuales;
  const idsGrupo = grupo.permisos.map(p => p.id);
  if (activar) {
    const nuevos = new Set([...permisosActuales, ...idsGrupo]);
    return Array.from(nuevos);
  } else {
    return permisosActuales.filter(p => !idsGrupo.includes(p));
  }
}
