-- ==============================================================================
-- TECNOSMART ERP - ARQUITECTURA BIMONEDA Y BLOQUEO DE MÁRGENES
-- Migración para soportar Precio Divisas vs Precio BCV y Bloqueo de Utilidades
-- ==============================================================================

-- 1. Añadir columnas a la tabla de productos si no existen
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS precio_bcv NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS margen_bloqueado BOOLEAN DEFAULT false;

ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS margen_individual NUMERIC(5,2);

-- 2. Índices para consultas y filtros rápidos
CREATE INDEX IF NOT EXISTS idx_productos_margen_bloqueado ON public.productos(margen_bloqueado);

-- 3. Inicializar precio_bcv en productos existentes que no tengan valor
-- Se sugiere por defecto un margen de protección del 10% adicional sobre el precio de venta en divisas
UPDATE public.productos 
SET precio_bcv = ROUND(precio_venta * 1.10, 2)
WHERE (precio_bcv IS NULL OR precio_bcv = 0) AND precio_venta > 0;
