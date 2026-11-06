-- ====================================================================
-- TABLA: starlink_email_pool (Inventario de Alias Cloudflare Starlink)
-- ====================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase:
-- https://supabase.com/dashboard/project/oeydtomyjwxwpvjrrebx/sql

create table if not exists public.starlink_email_pool (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  estado text not null default 'disponible', -- 'disponible', 'asignado', 'reservado'
  cliente_nombre text,
  kit_serial text,
  suscripcion_id uuid,
  notas text,
  fecha_asignacion timestamptz,
  created_at timestamptz default now()
);

-- 2. Habilitar seguridad por filas (Row Level Security)
alter table public.starlink_email_pool enable row level security;

-- 3. Políticas de inserción, lectura, actualización y eliminación
drop policy if exists "Permitir todo a anon y auth" on public.starlink_email_pool;
create policy "Permitir todo a anon y auth"
  on public.starlink_email_pool
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- 4. Registrar los primeros alias ya utilizados históricamente (300 y 301)
insert into public.starlink_email_pool (email, estado, cliente_nombre, notas, fecha_asignacion)
values 
  ('starlink.300@somostecnosmart.com', 'asignado', 'Cliente Histórico Starlink #300', 'Asignado previamente en Cloudflare', now()),
  ('starlink.301@somostecnosmart.com', 'asignado', 'Cliente Histórico Starlink #301', 'Asignado previamente en Cloudflare', now())
on conflict (email) do nothing;
