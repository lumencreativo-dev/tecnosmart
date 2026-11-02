-- =========================================================================
-- MIGRACIÓN SQL: RETENCIONES FISCALES (SENIAT) PARA TECNOSMART VZL
-- Ejecutar en el SQL Editor de Supabase: https://supabase.com/dashboard/project/oeydtomyjwxwpvjrrebx/sql
-- =========================================================================

-- 1. Soporte en tabla Clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS es_contribuyente_especial BOOLEAN DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS retencion_iva_pct NUMERIC DEFAULT 75;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS retencion_islr_pct NUMERIC DEFAULT 2;

-- 2. Soporte en tabla Cotizaciones
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS aplica_retenciones BOOLEAN DEFAULT false;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS retencion_iva_pct NUMERIC DEFAULT 75;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS retencion_islr_pct NUMERIC DEFAULT 2;

-- 3. Soporte en tabla Facturas
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS aplica_retencion_iva BOOLEAN DEFAULT false;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS retencion_iva_pct NUMERIC DEFAULT 75;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS retencion_iva_bs NUMERIC DEFAULT 0;

ALTER TABLE facturas ADD COLUMN IF NOT EXISTS aplica_retencion_islr BOOLEAN DEFAULT false;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS retencion_islr_pct NUMERIC DEFAULT 2;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS retencion_islr_bs NUMERIC DEFAULT 0;

ALTER TABLE facturas ADD COLUMN IF NOT EXISTS total_neto_bs NUMERIC DEFAULT 0;

-- Comentario informativo
COMMENT ON COLUMN facturas.retencion_iva_bs IS 'Monto retenido de IVA (generalmente 75% o 100% del IVA) por agentes de retención / contribuyentes especiales';
COMMENT ON COLUMN facturas.retencion_islr_bs IS 'Monto retenido de ISLR sobre base imponible por personas jurídicas';
COMMENT ON COLUMN facturas.total_neto_bs IS 'Total líquido a pagar o transferir por el cliente (Total Fiscal - Retenciones)';
