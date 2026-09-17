-- =====================================================================
-- Inscripción: la pareja tiene que ser de la rama del torneo.
-- Masculino o femenino: los dos de esa rama. Mixto: uno de cada.
-- register_pair y respond_invitation son copias de 20260919030000 con el
-- control de rama agregado después del de categoría.
-- =====================================================================

-- Igual que src/lib/gender-rules.ts. Null = pueden jugar.
create function public.pair_gender_error(
  p_tournament public.tournaments,
  p_player text,
  p_partner text
)
returns text
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_player is null then
    return 'falta_rama';
  end if;
  if p_tournament.gender in ('masculino', 'femenino')
    and p_player <> p_tournament.gender then
    return 'rama_no_corresponde';
  end if;
  if p_partner is null then
    return 'pareja_sin_rama';
  end if;
  if p_tournament.gender in ('masculino', 'femenino')
    and p_partner <> p_tournament.gender then
    return 'pareja_rama_no_corresponde';
  end if;
  if p_tournament.gender = 'mixto' and p_player = p_partner then
    return 'mixto_requiere_uno_de_cada';
  end if;
  return null;
end;
$$;

revoke execute on function public.pair_gender_error(public.tournaments, text, text) from public, anon, authenticated;

create or replace function public.register_pair(
  p_tournament_id bigint,
  p_partner_username text,
  p_contact_phone text,
  p_notes text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_tournament public.tournaments;
  v_me public.profiles;
  v_partner public.profiles;
  v_error text;
  v_id bigint;
begin
  if v_uid is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;

  -- Bloquea el torneo: dos inscripciones al mismo tiempo no pasan el cupo.
  select * into v_tournament
  from public.tournaments
  where id = p_tournament_id
  for update;
  if not found or v_tournament.status <> 'inscripciones' then
    raise exception 'inscripciones_cerradas' using errcode = 'P0001';
  end if;

  select * into v_me from public.profiles where id = v_uid;
  select * into v_partner
  from public.profiles
  where username = lower(ltrim(trim(coalesce(p_partner_username, '')), '@'));

  if v_partner.id is null then
    raise exception 'pareja_no_existe' using errcode = 'P0001';
  end if;
  if v_partner.id = v_uid then
    raise exception 'pareja_sos_vos' using errcode = 'P0001';
  end if;
  if char_length(trim(coalesce(p_contact_phone, ''))) not between 6 and 30 then
    raise exception 'telefono_invalido' using errcode = 'P0001';
  end if;
  if char_length(coalesce(p_notes, '')) > 500 then
    raise exception 'notas_largas' using errcode = 'P0001';
  end if;

  v_error := public.pair_category_error(v_tournament, v_me.category, v_partner.category);
  if v_error is not null then
    raise exception '%', v_error using errcode = 'P0001';
  end if;

  -- Rama: los dos de la rama del torneo, o uno de cada en los mixtos.
  v_error := public.pair_gender_error(v_tournament, v_me.gender, v_partner.gender);
  if v_error is not null then
    raise exception '%', v_error using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.tournament_registrations r
    where r.tournament_id = p_tournament_id and r.user_id = v_uid
  ) or public.is_in_tournament(p_tournament_id, v_uid) then
    raise exception 'ya_inscripto' using errcode = 'P0001';
  end if;
  if public.is_in_tournament(p_tournament_id, v_partner.id) then
    raise exception 'pareja_ya_inscripta' using errcode = 'P0001';
  end if;
  if v_tournament.capacity is not null
    and public.tournament_taken(p_tournament_id) >= v_tournament.capacity then
    raise exception 'cupo_completo' using errcode = 'P0001';
  end if;

  insert into public.tournament_registrations (
    tournament_id, user_id, partner_id, partner_name, contact_phone, notes,
    status, player_category, partner_category
  )
  values (
    p_tournament_id,
    v_uid,
    v_partner.id,
    left(public.profile_display_name(v_partner), 120),
    trim(p_contact_phone),
    nullif(trim(coalesce(p_notes, '')), ''),
    'invitacion',
    v_me.category,
    v_partner.category
  )
  returning id into v_id;

  insert into public.notifications (user_id, title, body, href)
  values (
    v_partner.id,
    left(public.profile_display_name(v_me) || ' te invitó a jugar el ' || v_tournament.name, 200),
    'Aceptá la invitación para quedar anotados. Después el organizador confirma el lugar.',
    '/torneos/' || v_tournament.slug || '#inscripcion'
  );

  return v_id;
end;
$$;

create or replace function public.respond_invitation(
  p_registration_id bigint,
  p_accept boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_registration public.tournament_registrations;
  v_tournament public.tournaments;
  v_me public.profiles;
  v_inviter public.profiles;
  v_other record;
  v_error text;
begin
  select * into v_registration
  from public.tournament_registrations
  where id = p_registration_id and partner_id = v_uid
  for update;
  if not found or v_registration.status <> 'invitacion' then
    raise exception 'invitacion_no_encontrada' using errcode = 'P0001';
  end if;

  select * into v_tournament
  from public.tournaments
  where id = v_registration.tournament_id
  for update;
  select * into v_me from public.profiles where id = v_uid;
  select * into v_inviter from public.profiles where id = v_registration.user_id;

  if not p_accept then
    delete from public.tournament_registrations where id = v_registration.id;
    insert into public.notifications (user_id, title, body, href)
    values (
      v_registration.user_id,
      left(public.profile_display_name(v_me) || ' no aceptó jugar el ' || v_tournament.name, 200),
      'Podés invitar a otra pareja mientras sigan abiertas las inscripciones.',
      '/torneos/' || v_tournament.slug || '#inscripcion'
    );
    return 'rechazada';
  end if;

  if v_tournament.status <> 'inscripciones' then
    raise exception 'inscripciones_cerradas' using errcode = 'P0001';
  end if;
  if public.is_in_tournament(v_tournament.id, v_uid, v_registration.id) then
    raise exception 'ya_inscripto' using errcode = 'P0001';
  end if;
  if public.is_in_tournament(v_tournament.id, v_registration.user_id, v_registration.id) then
    raise exception 'pareja_ya_inscripta' using errcode = 'P0001';
  end if;

  -- Las categorías pudieron cambiar desde la invitación.
  v_error := public.pair_category_error(v_tournament, v_inviter.category, v_me.category);
  if v_error = 'falta_categoria' then
    v_error := 'pareja_sin_categoria';
  elsif v_error = 'pareja_sin_categoria' then
    v_error := 'falta_categoria';
  elsif v_error = 'categoria_fuera_de_rango' then
    v_error := 'pareja_fuera_de_rango';
  elsif v_error = 'pareja_fuera_de_rango' then
    v_error := 'categoria_fuera_de_rango';
  end if;
  if v_error is not null then
    raise exception '%', v_error using errcode = 'P0001';
  end if;

  -- Rama. Se pasa primero a quien acepta: la regla es la misma en cualquier
  -- orden y así los códigos (rama_no_corresponde / pareja_...) le hablan a él.
  v_error := public.pair_gender_error(v_tournament, v_me.gender, v_inviter.gender);
  if v_error is not null then
    raise exception '%', v_error using errcode = 'P0001';
  end if;

  if v_tournament.capacity is not null
    and public.tournament_taken(v_tournament.id) >= v_tournament.capacity then
    raise exception 'cupo_completo' using errcode = 'P0001';
  end if;

  update public.tournament_registrations
  set
    status = 'pendiente',
    accepted_at = now(),
    player_category = v_inviter.category,
    partner_category = v_me.category
  where id = v_registration.id;

  insert into public.notifications (user_id, title, body, href)
  values (
    v_registration.user_id,
    left(public.profile_display_name(v_me) || ' aceptó jugar el ' || v_tournament.name, 200),
    'Ya están anotados. Falta que el organizador confirme el lugar.',
    '/torneos/' || v_tournament.slug || '#inscripcion'
  );

  -- Otras invitaciones a este mismo torneo quedan sin efecto.
  for v_other in
    delete from public.tournament_registrations r
    where r.tournament_id = v_tournament.id
      and r.partner_id = v_uid
      and r.status = 'invitacion'
      and r.id <> v_registration.id
    returning r.user_id
  loop
    insert into public.notifications (user_id, title, body, href)
    values (
      v_other.user_id,
      left(public.profile_display_name(v_me) || ' ya se anotó con otra pareja en el ' || v_tournament.name, 200),
      'Podés invitar a otra pareja mientras sigan abiertas las inscripciones.',
      '/torneos/' || v_tournament.slug || '#inscripcion'
    );
  end loop;

  return 'aceptada';
end;
$$;

-- Los datos públicos de otros jugadores suman la rama (para armar pareja).
drop function public.search_profiles(text);
drop function public.get_public_profiles(uuid[]);

create function public.search_profiles(p_query text)
returns table (
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  category smallint,
  gender text
)
language sql
stable
security definer
set search_path = ''
as $$
  with q as (
    select translate(
      lower(ltrim(trim(coalesce(p_query, '')), '@')),
      'áàäâãéèëêíìïîóòöôõúùüûñç',
      'aaaaaeeeeiiiiooooouuuunc'
    ) as term
  )
  select p.id, p.username, p.full_name, p.avatar_url, p.category, p.gender
  from public.profiles p, q
  where (select auth.uid()) is not null
    and p.id <> (select auth.uid())
    and char_length(q.term) >= 2
    and (
      starts_with(p.username, q.term)
      or strpos(
        translate(lower(coalesce(p.full_name, '')), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc'),
        q.term
      ) > 0
    )
  order by starts_with(p.username, q.term) desc, p.username
  limit 8;
$$;

create function public.get_public_profiles(p_ids uuid[])
returns table (
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  category smallint,
  gender text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.full_name, p.avatar_url, p.category, p.gender
  from public.profiles p
  where (select auth.uid()) is not null
    and p.id = any (p_ids);
$$;

revoke execute on function public.search_profiles(text) from public, anon;
revoke execute on function public.get_public_profiles(uuid[]) from public, anon;
grant execute on function public.search_profiles(text) to authenticated;
grant execute on function public.get_public_profiles(uuid[]) to authenticated;
