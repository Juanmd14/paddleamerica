-- =====================================================================
-- El dueño del club ve el teléfono de contacto de las parejas anotadas en
-- los torneos de SU club, para poder escribirles.
--
-- Es el teléfono que la pareja dejó al anotarse (contact_phone). Sigue sin
-- ver emails, notas ni el teléfono de la cuenta, ni nada de otros torneos.
-- =====================================================================

-- Cambia lo que devuelve la función: hay que borrarla y crearla de nuevo.
drop function public.club_tournament_registrations(bigint);

create function public.club_tournament_registrations(p_tournament_id bigint)
returns table (
  id bigint,
  status text,
  user_id uuid,
  partner_id uuid,
  partner_name text,
  player_category smallint,
  partner_category smallint,
  contact_phone text,
  created_at timestamptz,
  accepted_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id, r.status, r.user_id, r.partner_id, r.partner_name,
    r.player_category, r.partner_category, r.contact_phone,
    r.created_at, r.accepted_at
  from public.tournament_registrations r
  join public.tournaments t on t.id = r.tournament_id
  where r.tournament_id = p_tournament_id
    and t.club_id is not null
    and public.is_club_owner(t.club_id)
  order by r.created_at;
$$;

revoke execute on function public.club_tournament_registrations(bigint) from public, anon;
grant execute on function public.club_tournament_registrations(bigint) to authenticated;
