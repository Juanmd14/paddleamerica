-- =====================================================================
-- Clubes, parejas confirmadas y torneos jugados.
--
-- 1. clubs: las canchas de la zona, cada una con su perfil público. Un
--    torneo puede apuntar a su club (tournaments.club_id) para que el club
--    muestre sus próximos torneos.
-- 2. tournament_confirmed_pairs: las parejas confirmadas de un torneo, para
--    mostrarlas en su página a cualquiera (también sin cuenta). Solo nombre,
--    foto y ficha del ranking; nunca email ni teléfono.
-- 3. player_tournaments: los torneos que jugó un jugador del ranking, a
--    través de la cuenta vinculada (profiles.player_id).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Clubes
-- ---------------------------------------------------------------------
create table public.clubs (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null check (char_length(name) between 2 and 80),
  city text not null check (char_length(city) between 2 and 80),
  address text check (char_length(address) <= 200),
  maps_url text check (maps_url is null or maps_url ~ '^https://'),
  description text check (char_length(description) <= 2000),
  courts smallint check (courts is null or courts between 1 and 50),
  phone text check (char_length(phone) <= 30),
  instagram text check (char_length(instagram) <= 60),
  cover_url text,
  created_at timestamptz not null default now()
);

alter table public.clubs enable row level security;

create policy "Clubes visibles para todos"
  on public.clubs for select to anon, authenticated
  using (true);
create policy "Admins cargan clubes"
  on public.clubs for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins editan clubes"
  on public.clubs for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins borran clubes"
  on public.clubs for delete to authenticated
  using ((select public.is_admin()));

grant select on public.clubs to anon, authenticated;
grant insert, update, delete on public.clubs to authenticated;

alter table public.tournaments
  add column club_id bigint references public.clubs (id) on delete set null;

create index tournaments_club_idx on public.tournaments (club_id);

-- ---------------------------------------------------------------------
-- Parejas confirmadas de un torneo (lectura pública)
-- ---------------------------------------------------------------------
create function public.tournament_confirmed_pairs(p_tournament_id bigint)
returns table (
  registration_id bigint,
  player_name text,
  player_avatar_url text,
  player_slug text,
  partner_name text,
  partner_avatar_url text,
  partner_slug text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    coalesce(nullif(trim(p.full_name), ''), '@' || p.username, 'Jugador'),
    p.avatar_url,
    pp.slug,
    coalesce(nullif(trim(q.full_name), ''), '@' || q.username, r.partner_name),
    q.avatar_url,
    qp.slug
  from public.tournament_registrations r
  left join public.profiles p on p.id = r.user_id
  left join public.players pp on pp.id = p.player_id
  left join public.profiles q on q.id = r.partner_id
  left join public.players qp on qp.id = q.player_id
  where r.tournament_id = p_tournament_id
    and r.status = 'confirmada'
  order by coalesce(r.accepted_at, r.created_at), r.id;
$$;

revoke execute on function public.tournament_confirmed_pairs(bigint) from public;
grant execute on function public.tournament_confirmed_pairs(bigint) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Torneos que jugó un jugador del ranking (lectura pública)
-- ---------------------------------------------------------------------
create function public.player_tournaments(p_player_id bigint)
returns table (
  tournament_id bigint,
  partner_name text,
  partner_slug text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.tournament_id,
    case
      when r.user_id = me.id then
        coalesce(nullif(trim(q.full_name), ''), '@' || q.username, r.partner_name)
      else
        coalesce(nullif(trim(p.full_name), ''), '@' || p.username, 'Jugador')
    end,
    case when r.user_id = me.id then qp.slug else pp.slug end
  from public.profiles me
  join public.tournament_registrations r
    on me.id in (r.user_id, r.partner_id)
  join public.tournaments t on t.id = r.tournament_id
  left join public.profiles p on p.id = r.user_id
  left join public.players pp on pp.id = p.player_id
  left join public.profiles q on q.id = r.partner_id
  left join public.players qp on qp.id = q.player_id
  where me.player_id = p_player_id
    and r.status = 'confirmada'
    and t.status in ('en_juego', 'finalizado');
$$;

revoke execute on function public.player_tournaments(bigint) from public;
grant execute on function public.player_tournaments(bigint) to anon, authenticated;
