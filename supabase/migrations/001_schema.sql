-- ============================================================
-- Mianca — Schema principal
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ─── Tabla: dealers (perfil de la empresa/vendedor) ───────────
create table if not exists dealers (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text,
  empresa     text,
  telefono    text,
  created_at  timestamptz not null default now()
);

alter table dealers enable row level security;

create policy "Dealers ven su propio perfil"
  on dealers for select using (auth.uid() = id);

create policy "Dealers editan su propio perfil"
  on dealers for update using (auth.uid() = id);

-- ─── Tabla: equipos ──────────────────────────────────────────
create table if not exists equipos (
  id                    uuid primary key default gen_random_uuid(),
  dealer_id             uuid not null references dealers(id) on delete cascade,
  nombre                text not null,
  marca                 text,
  modelo                text,
  anio                  int,
  horas                 int,
  estado                text not null default 'borrador'
                        check (estado in ('borrador', 'valuado', 'publicado')),
  fotos                 text[] not null default '{}',
  precio_sugerido_min   decimal(12,2),
  precio_sugerido_max   decimal(12,2),
  comparables           jsonb not null default '[]',
  titulo_anuncio        text,
  descripcion_anuncio   text,
  ml_item_id            text,
  created_at            timestamptz not null default now()
);

alter table equipos enable row level security;

create policy "Dealers gestionan sus propios equipos"
  on equipos for all using (auth.uid() = dealer_id);

-- ─── Tabla: ml_conexiones (tokens OAuth de Mercado Libre) ─────
create table if not exists ml_conexiones (
  dealer_id       uuid primary key references dealers(id) on delete cascade,
  ml_user_id      text not null,
  access_token    text not null,
  refresh_token   text not null,
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table ml_conexiones enable row level security;

create policy "Dealers ven su propia conexión de ML"
  on ml_conexiones for select using (auth.uid() = dealer_id);

-- Nota: los inserts/updates de esta tabla los hace el callback de OAuth
-- con la service role key (el dealer nunca escribe tokens directamente).

-- ─── Trigger: crear perfil de dealer al registrarse ───────────
create or replace function handle_new_dealer()
returns trigger language plpgsql security definer as $$
begin
  insert into public.dealers (id, nombre, empresa)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', new.email),
    new.raw_user_meta_data->>'empresa'
  );
  return new;
end;
$$;

create or replace trigger on_auth_dealer_created
  after insert on auth.users
  for each row execute procedure handle_new_dealer();
