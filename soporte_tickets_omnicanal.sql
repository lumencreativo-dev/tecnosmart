-- ====================================================================
-- TECNOSMART VZL C.A. — MIGRACIÓN SQL MESA DE AYUDA & SOPORTE OMNICANAL
-- ====================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase:
-- https://supabase.com/dashboard/project/oeydtomyjwxwpvjrrebx/sql
-- ====================================================================

-- ────────────────────────────────────────────────────────────────────
-- 1. TABLA: soporte_categorias (Categorías Dinámicas de Servicios)
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.soporte_categorias (
  id text PRIMARY KEY,
  nombre text NOT NULL,
  icono text NOT NULL DEFAULT 'HelpCircle',
  color text NOT NULL DEFAULT '#c9242b',
  descripcion text,
  preguntas_guia jsonb DEFAULT '[]'::jsonb,
  activo boolean DEFAULT true,
  orden integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Asegurar que las columnas existan si la tabla ya había sido creada antes
ALTER TABLE public.soporte_categorias ADD COLUMN IF NOT EXISTS icono text NOT NULL DEFAULT 'HelpCircle';
ALTER TABLE public.soporte_categorias ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#c9242b';
ALTER TABLE public.soporte_categorias ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE public.soporte_categorias ADD COLUMN IF NOT EXISTS preguntas_guia jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.soporte_categorias ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;
ALTER TABLE public.soporte_categorias ADD COLUMN IF NOT EXISTS orden integer DEFAULT 0;
ALTER TABLE public.soporte_categorias ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.soporte_categorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica categorias soporte" ON public.soporte_categorias;
CREATE POLICY "Lectura publica categorias soporte" 
  ON public.soporte_categorias FOR SELECT 
  TO anon, authenticated 
  USING (activo = true);

DROP POLICY IF EXISTS "Gestion categorias soporte autenticados" ON public.soporte_categorias;
CREATE POLICY "Gestion categorias soporte autenticados" 
  ON public.soporte_categorias FOR ALL 
  TO authenticated 
  USING (true) WITH CHECK (true);

GRANT SELECT ON TABLE public.soporte_categorias TO anon;
GRANT ALL ON TABLE public.soporte_categorias TO authenticated;

-- Semilla de Categorías Oficiales con Preguntas Guía Técnicas Inteligentes
INSERT INTO public.soporte_categorias (id, nombre, icono, color, descripcion, preguntas_guia, orden) VALUES
(
  'starlink',
  'Starlink / Internet Satelital',
  'Wifi',
  '#6366f1',
  'Fallas de conexión, router, antenas satelitales y soporte de flota.',
  '[
    {"id": "led_router", "pregunta": "¿Cómo se encuentra la luz LED del router Starlink?", "opciones": ["Luz blanca fija encendida", "Luz parpadeando intermitente", "Luz roja / desconectada", "Apagada por completo (sin energía)"]},
    {"id": "estado_app", "pregunta": "¿Qué mensaje muestra la app móvil de Starlink?", "opciones": ["En Línea / Conectado", "Desconectado", "Buscando Satélites / Obstruido", "Calentando / Reiniciando", "No puedo abrir la app"]},
    {"id": "origen_falla", "pregunta": "¿La falla ocurrió tras algún evento eléctrico?", "opciones": ["Sí, hubo bajón o corte de energía", "Sí, hubo tormenta eléctrica con rayos", "No, ocurrió de manera espontánea", "Es una antena nueva recién instalada"]}
  ]'::jsonb,
  1
),
(
  'cctv',
  'Seguridad Electrónica & CCTV',
  'Camera',
  '#c9242b',
  'Cámaras de seguridad, DVR, NVR, fuentes de poder y monitoreo Hik-Connect / DMSS.',
  '[
    {"id": "alcance_falla", "pregunta": "¿En cuántas cámaras se presenta la falla?", "opciones": ["En una sola cámara específica", "En varias cámaras del mismo sector", "En todas las cámaras (pantalla en negro)", "Falla en la grabación / disco duro"]},
    {"id": "estado_grabador", "pregunta": "¿El grabador (DVR/NVR) emite algún sonido o luces?", "opciones": ["Luces normales pero emite pitidos constantes (beeps)", "Enciende luces frontales normales", "Completamente apagado / sin luces", "Se reinicia constantemente en bucle"]},
    {"id": "acceso_remoto", "pregunta": "¿El problema es ver las cámaras en el celular?", "opciones": ["Sí, en monitor local se ven pero en móvil dice ''Desconectado''", "No, no se ven ni en monitor ni en celular", "Olvidé la contraseña o cambié de teléfono"]}
  ]'::jsonb,
  2
),
(
  'redes',
  'Redes, Fibra Óptica & Wi-Fi',
  'Network',
  '#06b6d4',
  'Switches, routers Mikrotik/Omada, cableado estructurado y cobertura Wi-Fi.',
  '[
    {"id": "tipo_conexion", "pregunta": "¿Dónde se manifiesta la lentitud o caída?", "opciones": ["Tanto por cable de red como por Wi-Fi", "Solo en la señal inalámbrica (Wi-Fi)", "En una computadora o punto de red específico", "En toda la empresa / red principal"]},
    {"id": "luces_switch", "pregunta": "¿Cómo están las luces del Switch o Router principal?", "opciones": ["Luces verdes parpadeando con tráfico", "Luces fijas en naranja/ámbar", "Luces apagadas", "No tengo acceso al rack/equipo"]}
  ]'::jsonb,
  3
),
(
  'automatizacion',
  'Automatización de Portones & Motores',
  'Cpu',
  '#10b981',
  'Motores corredizos, brazos abatibles, tarjetas electrónicas y controles remotos.',
  '[
    {"id": "comportamiento_motor", "pregunta": "¿Qué ocurre al presionar el control remoto?", "opciones": ["El motor hace ''clic'' o zumba pero el portón no abre", "El portón abre unos centímetros y se frena", "No hace absolutamente nada ni enciende luz", "Abre bien pero no quiere cerrar"]},
    {"id": "fotocelula", "pregunta": "¿Las fotocélulas o sensores de seguridad emiten luz?", "opciones": ["Luz fija (alineadas correctamente)", "Luz parpadeando (posible desalineación)", "Sin luz / tapadas con suciedad", "No dispone de fotocélulas"]}
  ]'::jsonb,
  4
),
(
  'domotica',
  'Domótica & Control de Acceso',
  'KeyRound',
  '#8b5cf6',
  'Cerraduras inteligentes, biométricos, sensores y alarmas de intrusión.',
  '[
    {"id": "tipo_dispositivo", "pregunta": "¿Qué dispositivo presenta la incidencia?", "opciones": ["Cerradura inteligente digital", "Control de asistencia / biométrico", "Central de alarma de intrusión", "Sensores de movimiento / magnéticos"]}
  ]'::jsonb,
  5
),
(
  'garantia',
  'Garantía Oficial de Hardware (1 Año)',
  'ShieldCheck',
  '#f59e0b',
  'Activación de garantía por defecto de fábrica en cámaras y equipos TecnoSmart.',
  '[
    {"id": "posee_serial", "pregunta": "¿Tiene a mano el número de Serial (S/N) del equipo?", "opciones": ["Sí, lo tengo ubicado en la etiqueta del equipo", "Tengo el número de Factura / Nota de Entrega", "No lo tengo a mano, instalado en altura"]}
  ]'::jsonb,
  6
),
(
  'otro',
  'Consultas Generales & Otro Requerimiento',
  'LifeBuoy',
  '#64748b',
  'Requerimientos técnicos diversos o consultas de soporte general.',
  '[]'::jsonb,
  99
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  icono = EXCLUDED.icono,
  color = EXCLUDED.color,
  descripcion = EXCLUDED.descripcion,
  preguntas_guia = EXCLUDED.preguntas_guia,
  orden = EXCLUDED.orden;


-- ────────────────────────────────────────────────────────────────────
-- 2. AMPLIACIÓN DE TABLA: tickets_soporte
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tickets_soporte (
  id text PRIMARY KEY,
  codigo text NOT NULL,
  cliente text NOT NULL,
  telefono text,
  servicio text NOT NULL DEFAULT 'cctv',
  tipo_plan text NOT NULL DEFAULT 'basico',
  prioridad text NOT NULL DEFAULT 'media',
  estado text NOT NULL DEFAULT 'abierto',
  asunto text NOT NULL,
  descripcion text,
  tecnico_asignado text,
  fecha_cierre timestamptz,
  solucion text,
  created_at timestamptz DEFAULT now()
);

-- Nuevas columnas para trazabilidad inteligente y enlace al CRM
ALTER TABLE public.tickets_soporte
  ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cedula_rif text,
  ADD COLUMN IF NOT EXISTS email_cliente text,
  ADD COLUMN IF NOT EXISTS categoria_id text REFERENCES public.soporte_categorias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS canal_origen text DEFAULT 'web_form',
  ADD COLUMN IF NOT EXISTS respuestas_guia jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS notas_internas text;

-- Índices de búsqueda
CREATE INDEX IF NOT EXISTS idx_tickets_codigo ON public.tickets_soporte(codigo);
CREATE INDEX IF NOT EXISTS idx_tickets_cliente_id ON public.tickets_soporte(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tickets_cedula_rif ON public.tickets_soporte(cedula_rif);
CREATE INDEX IF NOT EXISTS idx_tickets_email ON public.tickets_soporte(email_cliente);

-- Habilitar RLS en tickets_soporte
ALTER TABLE public.tickets_soporte ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir crear tickets publicos desde landing" ON public.tickets_soporte;
DROP POLICY IF EXISTS "Acceso total tickets autenticados" ON public.tickets_soporte;
DROP POLICY IF EXISTS "Acceso total tickets" ON public.tickets_soporte;
CREATE POLICY "Acceso total tickets" 
  ON public.tickets_soporte FOR ALL 
  TO public 
  USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.tickets_soporte TO anon, authenticated, service_role;


-- ────────────────────────────────────────────────────────────────────
-- 3. TABLA: ticket_mensajes (Historial Completo de Conversación)
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ticket_mensajes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id text REFERENCES public.tickets_soporte(id) ON DELETE CASCADE,
  remitente_tipo text NOT NULL,
  remitente_nombre text NOT NULL,
  remitente_email text,
  contenido text NOT NULL,
  canal text NOT NULL DEFAULT 'web_form',
  es_privado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_mensajes_ticket_id ON public.ticket_mensajes(ticket_id);

ALTER TABLE public.ticket_mensajes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir insertar mensajes publicos" ON public.ticket_mensajes;
DROP POLICY IF EXISTS "Acceso total mensajes autenticados" ON public.ticket_mensajes;
DROP POLICY IF EXISTS "Acceso total mensajes" ON public.ticket_mensajes;
CREATE POLICY "Acceso total mensajes" 
  ON public.ticket_mensajes FOR ALL 
  TO public 
  USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.ticket_mensajes TO anon, authenticated, service_role;
