-- ====================================================================
-- TECNOSMART VZL C.A. — MIGRACIÓN SQL PARA MÓDULOS DEL ERP
-- ====================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase:
-- https://supabase.com/dashboard/project/oeydtomyjwxwpvjrrebx/sql
-- ====================================================================

-- ────────────────────────────────────────────────────────────────────
-- 1. SIEMBRA MAESTRA DE ROLES DEL ERP (public.roles)
-- ────────────────────────────────────────────────────────────────────
INSERT INTO public.roles (id, nombre, descripcion, color, es_sistema, permisos)
VALUES
  (
    'admin',
    'Super Admin',
    'Acceso total sin restricciones a todos los módulos y ajustes del sistema.',
    '#c9242b',
    true,
    '["*"]'::jsonb
  ),
  (
    'administrador',
    'Administración & Finanzas',
    'Control de facturación SENIAT, cajas bancarias, cuentas por pagar y balances.',
    '#2563eb',
    true,
    '["ventas.facturar", "ventas.ver_global", "finanzas.dashboard", "finanzas.cajas", "finanzas.reportes", "finanzas.cxc", "finanzas.cxp", "dashboard.finanzas", "dashboard.tasas"]'::jsonb
  ),
  (
    'vendedor',
    'Asesor Comercial',
    'Emisión de cotizaciones, gestión de CRM Pipeline, directorio de clientes y catálogo.',
    '#059669',
    true,
    '["ventas.cotizar", "ventas.crm", "ventas.clientes", "inventario.ver", "dashboard.tasas", "dashboard.productos_top", "dashboard.clientes_frecuentes", "dashboard.seguimientos"]'::jsonb
  ),
  (
    'gerente',
    'Gerente Operativo',
    'Planificación de obras, asignación de cuadrillas, calendario técnico e inventario.',
    '#d97706',
    true,
    '["proyectos.crear_ordenes", "proyectos.asignar_cuadrillas", "proyectos.agenda", "proyectos.materiales", "proyectos.actas", "inventario.ver", "ventas.cotizar", "dashboard.operaciones_campo"]'::jsonb
  ),
  (
    'tecnico',
    'Técnico Líder / Cuadrilla',
    'Acceso a app móvil de campo (tec.): órdenes asignadas, materiales y actas firmadas.',
    '#9333ea',
    true,
    '["proyectos.ver_propias", "proyectos.materiales", "proyectos.actas", "inventario.ver"]'::jsonb
  ),
  (
    'tecnico_aliado',
    'Técnico Aliado B2B',
    'Instalador independiente aliado. Catálogo con 15% de descuento, calculadora CCTV y libreta de obras.',
    '#06b6d4',
    true,
    '["inventario.ver", "proyectos.ver_propias", "soporte.tickets", "soporte.wiki"]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  color = EXCLUDED.color,
  permisos = EXCLUDED.permisos;

-- Soporte para permisos personalizados individuales por usuario (Estilo Odoo / Multi-Rol)
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS permisos_custom jsonb DEFAULT '[]'::jsonb;


-- ────────────────────────────────────────────────────────────────────
-- 2. TABLA: solicitudes_asesoria (Leads de la Landing somostecnosmart.com)
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.solicitudes_asesoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  telefono text NOT NULL,
  tipo text NOT NULL DEFAULT 'Cliente Final', -- 'Cliente Final' o 'Técnico-Instalador'
  necesidad text NOT NULL,                   -- Cámaras, Starlink, domótica/redes, automatización, soporte premium
  zona text,                                 -- Ciudad / Región
  problema text,                             -- Resumen del problema reportado
  estado text NOT NULL DEFAULT 'nuevo',      -- 'nuevo', 'contactado', 'en_cotizacion', 'ganado', 'descartado'
  origen text DEFAULT 'landing_web',
  notas_internas text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.solicitudes_asesoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir insercion publica desde landing" ON public.solicitudes_asesoria;
DROP POLICY IF EXISTS "Permitir lectura solo a usuarios autenticados" ON public.solicitudes_asesoria;
DROP POLICY IF EXISTS "Permitir actualizacion a usuarios autenticados" ON public.solicitudes_asesoria;

CREATE POLICY "Permitir insercion publica desde landing"
  ON public.solicitudes_asesoria FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir lectura solo a usuarios autenticados"
  ON public.solicitudes_asesoria FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir actualizacion a usuarios autenticados"
  ON public.solicitudes_asesoria FOR UPDATE
  TO authenticated
  USING (true);

GRANT INSERT ON TABLE public.solicitudes_asesoria TO anon;
GRANT SELECT, UPDATE, DELETE ON TABLE public.solicitudes_asesoria TO authenticated;


-- ────────────────────────────────────────────────────────────────────
-- 3. MÓDULO DE FINANZAS: CUENTAS, MOVIMIENTOS Y CUENTAS POR PAGAR (CxP)
-- ────────────────────────────────────────────────────────────────────

-- 3.1 Cuentas Bancarias y Cajas
CREATE TABLE IF NOT EXISTS public.cuentas_bancarias (
  id text PRIMARY KEY,
  nombre text NOT NULL,
  tipo text NOT NULL, -- 'zelle', 'efectivo_usd', 'pago_movil', 'banco_bs', 'binance'
  moneda text NOT NULL DEFAULT 'USD', -- 'USD' o 'VES'
  saldo numeric(14,2) NOT NULL DEFAULT 0.00,
  titular text,
  identificador text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cuentas_bancarias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura cuentas autenticados" ON public.cuentas_bancarias;
CREATE POLICY "Lectura cuentas autenticados" ON public.cuentas_bancarias FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Modificacion cuentas autenticados" ON public.cuentas_bancarias;
CREATE POLICY "Modificacion cuentas autenticados" ON public.cuentas_bancarias FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.2 Movimientos Financieros (Libro de Caja y Bancos)
CREATE TABLE IF NOT EXISTS public.movimientos_financieros (
  id text PRIMARY KEY,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  tipo text NOT NULL, -- 'ingreso', 'egreso', 'transferencia'
  categoria text NOT NULL, -- 'facturacion', 'abono_cliente', 'proveedor', 'nomina_cuadrilla', 'viatico', 'servicios_operativos', 'otro'
  concepto text NOT NULL,
  monto_usd numeric(12,2) NOT NULL DEFAULT 0.00,
  monto_ves numeric(14,2) NOT NULL DEFAULT 0.00,
  cuenta_id text REFERENCES public.cuentas_bancarias(id) ON DELETE SET NULL,
  referencia text,
  beneficiario_o_cliente text,
  estado text NOT NULL DEFAULT 'conciliado', -- 'conciliado', 'pendiente', 'anulado'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.movimientos_financieros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso total movimientos autenticados" ON public.movimientos_financieros;
CREATE POLICY "Acceso total movimientos autenticados" ON public.movimientos_financieros FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3.3 Cuentas por Pagar (CxP - Proveedores, Cuadrillas y Viáticos)
CREATE TABLE IF NOT EXISTS public.cuentas_por_pagar (
  id text PRIMARY KEY,
  beneficiario text NOT NULL,
  tipo_beneficiario text NOT NULL, -- 'proveedor', 'tecnico_cuadrilla', 'servicio'
  concepto text NOT NULL,
  monto_usd numeric(12,2) NOT NULL DEFAULT 0.00,
  fecha_vencimiento date,
  estado text NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'parcial', 'pagado'
  monto_abonado_usd numeric(12,2) NOT NULL DEFAULT 0.00,
  notas text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cuentas_por_pagar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso total cxp autenticados" ON public.cuentas_por_pagar;
CREATE POLICY "Acceso total cxp autenticados" ON public.cuentas_por_pagar FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ────────────────────────────────────────────────────────────────────
-- 4. MÓDULO DE SOPORTE & POSTVENTA: TICKETS Y GARANTÍAS
-- ────────────────────────────────────────────────────────────────────

-- 4.1 Tickets de Soporte
CREATE TABLE IF NOT EXISTS public.tickets_soporte (
  id text PRIMARY KEY,
  codigo text NOT NULL,
  cliente text NOT NULL,
  telefono text,
  servicio text NOT NULL DEFAULT 'cctv', -- 'cctv', 'starlink', 'redes', 'domotica', 'automatizacion', 'otro'
  tipo_plan text NOT NULL DEFAULT 'basico', -- 'basico' (L-V) o 'premium' ($5/mes prioritario)
  prioridad text NOT NULL DEFAULT 'media', -- 'baja', 'media', 'alta', 'urgente'
  estado text NOT NULL DEFAULT 'abierto', -- 'abierto', 'en_diagnostico', 'visita_programada', 'resuelto', 'cerrado'
  asunto text NOT NULL,
  descripcion text,
  tecnico_asignado text,
  fecha_cierre timestamptz,
  solucion text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tickets_soporte ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso total tickets autenticados" ON public.tickets_soporte;
CREATE POLICY "Acceso total tickets autenticados" ON public.tickets_soporte FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4.2 Registro de Garantías y Seriales (1 Año en Cámaras y CCTV)
CREATE TABLE IF NOT EXISTS public.garantias_equipos (
  id text PRIMARY KEY,
  serial text NOT NULL UNIQUE,
  equipo text NOT NULL,
  cliente text NOT NULL,
  fecha_instalacion date NOT NULL DEFAULT CURRENT_DATE,
  meses_garantia integer NOT NULL DEFAULT 12, -- 1 año de garantía oficial
  factura_ref text,
  estado text NOT NULL DEFAULT 'activa', -- 'activa', 'por_vencer', 'vencida'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.garantias_equipos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso total garantias autenticados" ON public.garantias_equipos;
CREATE POLICY "Acceso total garantias autenticados" ON public.garantias_equipos FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
