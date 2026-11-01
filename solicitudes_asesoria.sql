-- ====================================================================
-- TABLA: solicitudes_asesoria (Leads y Asesorías de la Landing Page)
-- ====================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase:
-- https://supabase.com/dashboard/project/oeydtomyjwxwpvjrrebx/sql

-- 1. Crear tabla para almacenar las solicitudes del formulario
create table if not exists public.solicitudes_asesoria (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text not null,
  tipo text not null default 'Cliente Final', -- 'Cliente Final' o 'Técnico-Instalador'
  necesidad text not null,                   -- Cámaras, Starlink, domótica/redes, etc.
  zona text,                                 -- Ciudad o zona de Venezuela
  problema text,                             -- Frase descriptiva de su problema
  estado text not null default 'nuevo',      -- 'nuevo', 'contactado', 'en_cotizacion', 'descartado'
  origen text default 'landing_web',
  notas_internas text,
  created_at timestamptz default now()
);

-- 2. Habilitar seguridad por filas (Row Level Security)
alter table public.solicitudes_asesoria enable row level security;

-- 3. Eliminar políticas previas si ya existían para evitar duplicados
drop policy if exists "Permitir insercion publica desde landing" on public.solicitudes_asesoria;
drop policy if exists "Permitir lectura solo a usuarios autenticados" on public.solicitudes_asesoria;
drop policy if exists "Permitir actualizacion a usuarios autenticados" on public.solicitudes_asesoria;

-- 4. Política: Los visitantes anónimos de la web pueden insertar solicitudes
create policy "Permitir insercion publica desde landing"
  on public.solicitudes_asesoria
  for insert
  to anon, authenticated
  with check (true);

-- 5. Política: Solo el equipo/ingenieros autenticados pueden leer las solicitudes
create policy "Permitir lectura solo a usuarios autenticados"
  on public.solicitudes_asesoria
  for select
  to authenticated
  using (true);

-- 6. Política: Solo usuarios autenticados pueden actualizar el estado de seguimiento
create policy "Permitir actualizacion a usuarios autenticados"
  on public.solicitudes_asesoria
  for update
  to authenticated
  using (true);

-- 7. Conceder permisos a roles anon y authenticated
grant insert on table public.solicitudes_asesoria to anon;
grant select, update, delete on table public.solicitudes_asesoria to authenticated;

-- Comentario explicativo en la tabla
comment on table public.solicitudes_asesoria is 'Registro de prospectos y solicitudes de asesoría gratuita recibidas desde la landing page.';
