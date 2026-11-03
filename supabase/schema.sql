-- GreenIT Calc · esquema para Supabase. Ejecutar completo en SQL Editor.
-- Orden de ejecución: 1) schema.sql  2) seed_catalog.sql  3) (opcional) seed_demo.sql

create extension if not exists pgcrypto;

-- Catálogo de equipos (lectura pública)
create table if not exists public.equipment_catalog (
  id text primary key,
  nombre text not null,
  categoria text not null check (categoria in ('pc','monitor','notebook','servidor','red','otro')),
  potencia_uso_w numeric,
  potencia_reposo_w numeric,
  potencia_apagado_w numeric,
  potencia_max_w numeric,
  rango text,
  fuente text,
  confianza text,
  nota text
);

-- Una organización (PyME) por cuenta
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  nombre text not null default 'Mi empresa',
  tarifa_tramo text not null default 'G1',
  tarifa_ars numeric(12,3) not null default 192.109,
  factor_emision numeric(8,4) not null default 0.283,
  factor_anio int not null default 2022,
  tipo_sala text not null default 'sala',
  pue numeric(4,2) not null default 2.5 check (pue >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete set null,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  catalog_id text references public.equipment_catalog(id),
  nombre text not null,
  cantidad int not null default 1 check (cantidad >= 0),
  ubicacion text not null default 'oficina' check (ubicacion in ('oficina','sala_servidores')),
  horas_uso numeric not null default 0 check (horas_uso >= 0 and horas_uso <= 168),
  horas_reposo numeric not null default 0 check (horas_reposo >= 0 and horas_reposo <= 168),
  carga_pct numeric not null default 100 check (carga_pct >= 0 and carga_pct <= 100),
  potencia_uso_w numeric,
  potencia_reposo_w numeric,
  potencia_apagado_w numeric,
  potencia_max_w numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint horas_en_la_semana check (horas_uso + horas_reposo <= 168)
);
create index if not exists inventory_items_org_idx on public.inventory_items(org_id);

-- Timestamps
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_org_updated on public.organizations;
create trigger trg_org_updated before update on public.organizations for each row execute function public.set_updated_at();
drop trigger if exists trg_items_updated on public.inventory_items;
create trigger trg_items_updated before update on public.inventory_items for each row execute function public.set_updated_at();

-- Organización del usuario autenticado (security definer para usarla en las políticas sin recursión)
create or replace function public.current_org_id() returns uuid
language sql stable security definer set search_path = public as $$
  select org_id from public.profiles where id = auth.uid()
$$;

-- Al registrarse un usuario: crear su organización y su perfil
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  insert into public.organizations (nombre)
  values (coalesce(nullif(new.raw_user_meta_data->>'empresa', ''), 'Mi empresa'))
  returning id into v_org;
  insert into public.profiles (id, org_id, email) values (new.id, v_org, new.email);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.equipment_catalog enable row level security;
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.inventory_items enable row level security;

drop policy if exists catalog_read on public.equipment_catalog;
create policy catalog_read on public.equipment_catalog for select to anon, authenticated using (true);

drop policy if exists org_select on public.organizations;
create policy org_select on public.organizations for select to authenticated using (id = public.current_org_id());
drop policy if exists org_update on public.organizations;
create policy org_update on public.organizations for update to authenticated
  using (id = public.current_org_id()) with check (id = public.current_org_id());

-- Perfiles: solo lectura del propio perfil (así nadie puede cambiarse de organización)
drop policy if exists profile_select on public.profiles;
create policy profile_select on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists items_all on public.inventory_items;
create policy items_all on public.inventory_items for all to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());

-- Datos de demostración (caso simulado del DIIT de la UNLaM), iguales a src/data/demo.js
create or replace function public._insertar_demo(p_org uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.inventory_items where org_id = p_org;
  update public.organizations set nombre = 'UNLaM, DIIT (caso simulado)',
    tarifa_tramo = 'G3', tarifa_ars = 216.572, factor_emision = 0.283, factor_anio = 2022,
    tipo_sala = 'sala', pue = 2.5 where id = p_org;
  insert into public.inventory_items (org_id, catalog_id, nombre, cantidad, ubicacion, horas_uso, horas_reposo, carga_pct) values
    (p_org, 'pc-escritorio', 'PCs de los 2 laboratorios de computación', 60, 'oficina', 60, 108, 100),
    (p_org, 'monitor-lcd', 'Monitores de los laboratorios', 60, 'oficina', 60, 108, 100),
    (p_org, 'pc-escritorio', 'PCs de secretaría y administración', 10, 'oficina', 40, 128, 100),
    (p_org, 'monitor-lcd', 'Monitores de secretaría y administración', 10, 'oficina', 40, 128, 100),
    (p_org, 'notebook', 'Notebooks de docentes', 15, 'oficina', 30, 20, 100),
    (p_org, 'servidor-2s', 'Servidor de entornos de laboratorio y archivos', 1, 'sala_servidores', 168, 0, 35),
    (p_org, 'servidor-1s', 'Servidor viejo de cátedras (casi sin uso)', 1, 'sala_servidores', 168, 0, 5),
    (p_org, 'switch-24', 'Switches de la red del departamento', 3, 'sala_servidores', 168, 0, 100);
end $$;
revoke all on function public._insertar_demo(uuid) from public, anon, authenticated;

-- Botón "Cargar ejemplo de demo" desde la app: rpc('cargar_demo')
create or replace function public.cargar_demo() returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.current_org_id() is null then raise exception 'Usuario sin organización'; end if;
  perform public._insertar_demo(public.current_org_id());
end $$;
revoke all on function public.cargar_demo() from public, anon;
grant execute on function public.cargar_demo() to authenticated;
