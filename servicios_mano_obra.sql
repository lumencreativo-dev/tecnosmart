-- ==============================================================================
-- TECNOSMART ERP - CATÁLOGO DE SERVICIOS & MANO DE OBRA
-- Tabla para gestionar servicios técnicos, instalaciones, cableado y configuraciones
-- ==============================================================================

-- 1. Crear tabla si no existe
CREATE TABLE IF NOT EXISTS public.servicios_mano_obra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    concepto TEXT NOT NULL,
    categoria TEXT NOT NULL DEFAULT 'Instalación',
    unidad TEXT NOT NULL DEFAULT 'punto',
    precio_base NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- 2. Asegurar que todas las columnas existan (por si la tabla ya había sido creada antes)
ALTER TABLE public.servicios_mano_obra ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Instalación';
ALTER TABLE public.servicios_mano_obra ADD COLUMN IF NOT EXISTS unidad TEXT DEFAULT 'punto';
ALTER TABLE public.servicios_mano_obra ADD COLUMN IF NOT EXISTS precio_base NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.servicios_mano_obra ADD COLUMN IF NOT EXISTS precio_max NUMERIC(12,2);
ALTER TABLE public.servicios_mano_obra ADD COLUMN IF NOT EXISTS precio_tecnico NUMERIC(12,2);
ALTER TABLE public.servicios_mano_obra ADD COLUMN IF NOT EXISTS detalles TEXT;
ALTER TABLE public.servicios_mano_obra ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE public.servicios_mano_obra ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.servicios_mano_obra ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_servicios_codigo ON public.servicios_mano_obra(codigo);
CREATE INDEX IF NOT EXISTS idx_servicios_categoria ON public.servicios_mano_obra(categoria);
CREATE INDEX IF NOT EXISTS idx_servicios_activo ON public.servicios_mano_obra(activo);

-- 4. Habilitar RLS y Políticas de acceso
ALTER TABLE public.servicios_mano_obra ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura de servicios" ON public.servicios_mano_obra;
CREATE POLICY "Lectura de servicios" ON public.servicios_mano_obra
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Gestion de servicios" ON public.servicios_mano_obra;
CREATE POLICY "Gestion de servicios" ON public.servicios_mano_obra
    FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. Semilla de Servicios Iniciales de TecnoSmart
INSERT INTO public.servicios_mano_obra (codigo, concepto, categoria, unidad, precio_base, precio_max, precio_tecnico, activo)
VALUES
  ('CAB-ELEC-M',   'Tendido Cable Eléctrico',                 'Cableado',      'metro',   0.25, 0.25, 0.20, true),
  ('CAB-UTP-M',    'Tendido UTP / Red / Canaleta / Tubería',   'Cableado',      'metro',   0.50, 0.50, 0.40, true),
  ('CFG-DVR-16',   'Configuración DVR / NVR ≤ 16ch',          'Configuración', 'equipo', 50.00, 50.00, 40.00, true),
  ('CFG-DVR-32',   'Configuración DVR / NVR > 16ch',          'Configuración', 'equipo', 80.00, 80.00, 65.00, true),
  ('CFG-RACK',     'Instalación y peinado de Rack',           'Configuración', 'global', 40.00, 40.00, 35.00, true),
  ('CFG-ACC-CTL',  'Mano de Obra Control de Acceso',          'Configuración', 'punto', 150.00,250.00,120.00, true),
  ('INS-CAM-BAJO', 'Instalación Cámara – Centro < 2.5m',     'Instalación',   'punto',  25.00, 25.00, 20.00, true),
  ('INS-CAM-STD',  'Instalación de Cámara – Estándar',        'Instalación',   'punto',  30.00, 35.00, 25.00, true),
  ('LOG-LOCAL',    'Logística / Viáticos Local (Tinaquillo)', 'Logística',     'día',     5.00, 10.00,  5.00, true),
  ('LOG-FORANEO',  'Transporte + Comida Foráneo / técnico',   'Logística',     'día',    30.00, 30.00, 30.00, true),
  ('MTO-DVR',      'Mantenimiento DVR (batería/firmware)',    'Mantenimiento', 'equipo', 50.00, 50.00, 40.00, true),
  ('MTO-CAM',      'Mantenimiento preventivo por cámara',     'Mantenimiento', 'punto',  30.00, 30.00, 25.00, true),
  ('SL-INS',       'Instalación de Antena Starlink',          'Starlink',      'global', 80.00,120.00, 70.00, true),
  ('SL-CFG',       'Configuración de red Starlink',           'Starlink',      'equipo', 50.00, 50.00, 40.00, true),
  ('SL-MENS',      'Gestión mensual Starlink (Comisión)',     'Starlink',      'mes',    10.00, 10.00, 10.00, true)
ON CONFLICT (codigo) DO UPDATE SET
  concepto = EXCLUDED.concepto,
  precio_base = EXCLUDED.precio_base,
  precio_tecnico = EXCLUDED.precio_tecnico,
  unidad = EXCLUDED.unidad,
  categoria = EXCLUDED.categoria,
  activo = EXCLUDED.activo,
  updated_at = NOW();
