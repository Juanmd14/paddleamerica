-- =====================================================================
-- Esquema inicial: perfiles, jugadores, torneos y noticias
-- =====================================================================

-- Actualiza updated_at automáticamente
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Perfiles (1 a 1 con auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "Cada usuario ve su perfil"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Cada usuario edita su perfil"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

grant select, update on public.profiles to authenticated;

-- Crea el perfil automáticamente cuando alguien se registra
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Jugadores
-- ---------------------------------------------------------------------
create table public.players (
  id bigint generated always as identity primary key,
  slug text not null unique,
  first_name text not null,
  last_name text not null,
  photo_url text,
  city text,
  club text,
  category text not null,
  gender text not null check (gender in ('masculino', 'femenino')),
  side text check (side in ('drive', 'reves')),
  ranking_points integer not null default 0,
  matches_played integer not null default 0,
  matches_won integer not null default 0,
  titles integer not null default 0,
  bio text,
  created_at timestamptz not null default now(),
  constraint players_matches_check check (matches_won <= matches_played)
);

create index players_ranking_idx on public.players (gender, ranking_points desc);

-- ---------------------------------------------------------------------
-- Torneos
-- ---------------------------------------------------------------------
create table public.tournaments (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  description text,
  city text not null,
  venue text,
  starts_on date not null,
  ends_on date not null,
  category text not null,
  gender text not null check (gender in ('masculino', 'femenino', 'mixto')),
  status text not null default 'proximo'
    check (status in ('proximo', 'inscripciones', 'en_juego', 'finalizado')),
  prize text,
  champions text,
  cover_url text,
  created_at timestamptz not null default now(),
  constraint tournaments_dates_check check (ends_on >= starts_on)
);

create index tournaments_starts_on_idx on public.tournaments (starts_on);

-- ---------------------------------------------------------------------
-- Noticias
-- ---------------------------------------------------------------------
create table public.news (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  excerpt text,
  body text not null,
  tag text,
  author text,
  cover_url text,
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index news_published_at_idx on public.news (published_at desc);

-- ---------------------------------------------------------------------
-- Seguridad: lectura pública. La carga de contenido se hace desde el
-- dashboard de Supabase (o agregá políticas de admin más adelante).
-- ---------------------------------------------------------------------
alter table public.players enable row level security;
alter table public.tournaments enable row level security;
alter table public.news enable row level security;

create policy "Jugadores visibles para todos"
  on public.players for select to anon, authenticated
  using (true);

create policy "Torneos visibles para todos"
  on public.tournaments for select to anon, authenticated
  using (true);

create policy "Noticias publicadas visibles para todos"
  on public.news for select to anon, authenticated
  using (is_published and published_at <= now());

grant select on public.players, public.tournaments, public.news to anon, authenticated;
