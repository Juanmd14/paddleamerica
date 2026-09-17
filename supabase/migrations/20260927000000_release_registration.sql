-- =====================================================================
-- Liberar una inscripción rechazada: hasta ahora, si el organizador rechazaba
-- una pareja (o se equivocaba), esa persona no podía volver a anotarse nunca
-- en ese torneo. Ahora el organizador la libera desde el panel.
-- register_pair es copia de 20260925000000 con el mensaje nuevo.
-- =====================================================================

create function public.release_registration(p_registration_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registration public.tournament_registrations;
  v_tournament public.tournaments;
  v_player uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores liberan inscripciones' using errcode = '42501';
  end if;

  select * into v_registration
  from public.tournament_registrations
  where id = p_registration_id
  for update;
  if not found then
    raise exception 'inscripcion_no_encontrada' using errcode = 'P0001';
  end if;
  if v_registration.status not in ('rechazada', 'cancelada') then
    raise exception 'no_se_puede_liberar' using errcode = 'P0001';
  end if;

  select * into v_tournament
  from public.tournaments
  where id = v_registration.tournament_id;

  delete from public.tournament_registrations where id = v_registration.id;

  -- Le avisa a quien se había anotado (a la pareja no: puede no haber aceptado).
  v_player := v_registration.user_id;
  insert into public.notifications (user_id, title, body, href)
  values (
    v_player,
    left('Podés volver a anotarte en el ' || v_tournament.name, 200),
    'El organizador liberó tu inscripción. Si las inscripciones siguen abiertas, podés anotarte de nuevo.',
    '/torneos/' || v_tournament.slug || '#inscripcion'
  );
end;
$$;

revoke execute on function public.release_registration(bigint) from public, anon;
grant execute on function public.release_registration(bigint) to authenticated;

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

  -- Una inscripción rechazada (o cancelada por el organizador) sigue bloqueando:
  -- la libera un admin con release_registration.
  if exists (
    select 1 from public.tournament_registrations r
    where r.tournament_id = p_tournament_id
      and r.user_id = v_uid
      and r.status in ('rechazada', 'cancelada')
  ) then
    raise exception 'inscripcion_rechazada' using errcode = 'P0001';
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
