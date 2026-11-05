-- ====================================================================
-- TABLA: solicitudes_starlink (Onboarding y Activaciones de Antenas)
-- ====================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase:
-- https://supabase.com/dashboard/project/oeydtomyjwxwpvjrrebx/sql

create table if not exists public.solicitudes_starlink (
  id uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  cedula_rif text not null,
  telefono text not null,
  email text,
  direccion text not null,
  coordenadas_gps text,
  plan_deseado text not null default 'Starlink Residencial',
  wifi_ssid_preferido text,
  wifi_password_preferido text,
  cedula_frontal_url text,
  cedula_trasera_url text,
  notas text,
  estado text not null default 'pendiente', -- 'pendiente', 'en_proceso', 'activada', 'rechazada'
  origen text default 'web_cliente',       -- 'web_cliente' o 'asistida_tienda'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Habilitar seguridad por filas (Row Level Security)
alter table public.solicitudes_starlink enable row level security;

-- 3. Políticas de inserción y lectura
drop policy if exists "Permitir insercion onboarding" on public.solicitudes_starlink;
create policy "Permitir insercion onboarding"
  on public.solicitudes_starlink
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Permitir lectura onboarding" on public.solicitudes_starlink;
create policy "Permitir lectura onboarding"
  on public.solicitudes_starlink
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Permitir actualizacion onboarding" on public.solicitudes_starlink;
create policy "Permitir actualizacion onboarding"
  on public.solicitudes_starlink
  for update
  to anon, authenticated
  using (true);
