-- =====================================================================
-- Torneos: ubicación, cupo y apertura de inscripciones.
-- Configuración del sitio editable desde el panel (hero y números).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Torneos
-- ---------------------------------------------------------------------
alter table public.tournaments
  add column address text check (char_length(address) <= 200),
  add column maps_url text check (maps_url is null or maps_url ~ '^https://'),
  add column capacity integer check (capacity is null or capacity > 0),
  add column registration_opens_on date;

comment on column public.tournaments.capacity is
  'Cupo en parejas. Null = sin cupo. Cuentan las inscripciones pendientes y confirmadas.';

-- Lugares ocupados por torneo. Security definer: el público ve el conteo
-- sin poder leer las inscripciones.
create function public.tournament_spots()
returns table (tournament_id bigint, taken integer)
language sql
stable
security definer
set search_path = ''
as $$
  select r.tournament_id, count(*)::integer
  from public.tournament_registrations r
  where r.status in ('pendiente', 'confirmada')
  group by r.tournament_id;
$$;

revoke execute on function public.tournament_spots() from public;
grant execute on function public.tournament_spots() to anon, authenticated;

-- Corta la inscripción si el torneo ya llenó el cupo. Bloquea la fila del
-- torneo para que dos inscripciones simultáneas no pasen el límite.
-- Los cambios de estado del admin no pasan por acá (puede excederse a propósito).
create function public.check_tournament_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_capacity integer;
  v_taken integer;
begin
  select t.capacity into v_capacity
  from public.tournaments t
  where t.id = new.tournament_id
  for update;

  if v_capacity is null then
    return new;
  end if;

  select count(*) into v_taken
  from public.tournament_registrations r
  where r.tournament_id = new.tournament_id
    and r.status in ('pendiente', 'confirmada');

  if v_taken >= v_capacity then
    raise exception 'cupo_completo'
      using errcode = 'P0001', hint = 'El torneo no tiene lugares disponibles.';
  end if;

  return new;
end;
$$;

create trigger tournament_registrations_capacity
  before insert on public.tournament_registrations
  for each row execute function public.check_tournament_capacity();

-- ---------------------------------------------------------------------
-- Configuración del sitio (una sola fila)
-- ---------------------------------------------------------------------
create table public.site_settings (
  id boolean primary key default true check (id),
  hero_image_url text check (hero_image_url is null or hero_image_url ~ '^https://'),
  -- Hasta 4 números del inicio: [{ "key": "players", "label"?: "...", "value"?: 12 }]
  stats jsonb not null default '[
    {"key": "players"},
    {"key": "tournaments_year"},
    {"key": "tournaments_month"},
    {"key": "cities"}
  ]'::jsonb
    check (jsonb_typeof(stats) = 'array' and jsonb_array_length(stats) <= 4),
  updated_at timestamptz not null default now()
);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;

create policy "Configuración del sitio visible para todos"
  on public.site_settings for select to anon, authenticated
  using (true);
create policy "Admins editan la configuración del sitio"
  on public.site_settings for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.site_settings to anon, authenticated;
grant update (hero_image_url, stats) on public.site_settings to authenticated;

insert into public.site_settings (id) values (true) on conflict (id) do nothing;
