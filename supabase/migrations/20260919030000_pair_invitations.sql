-- =====================================================================
-- Inscripción en pareja con invitación:
-- 1. Jorge se anota e invita a @juangarcia → estado "invitacion".
-- 2. Juan acepta → "pendiente" (ahí ocupa lugar en el cupo).
-- 3. El organizador ve los dos perfiles y confirma o rechaza.
-- Todo pasa por funciones que validan categoría, cupo y repetidos.
-- =====================================================================

alter table public.tournament_registrations
  add column partner_id uuid references auth.users (id) on delete cascade,
  add column player_category smallint check (player_category between 1 and 8),
  add column partner_category smallint check (partner_category between 1 and 8),
  add column accepted_at timestamptz,
  add constraint tournament_registrations_partner_check
    check (partner_id is null or partner_id <> user_id);

comment on column public.tournament_registrations.partner_id is
  'Pareja invitada (usuario del sitio). Null en inscripciones viejas con nombre libre.';

alter table public.tournament_registrations
  drop constraint tournament_registrations_status_check;
alter table public.tournament_registrations
  add constraint tournament_registrations_status_check
  check (status in ('invitacion', 'pendiente', 'confirmada', 'rechazada', 'cancelada'));

create index tournament_registrations_partner_idx
  on public.tournament_registrations (partner_id);

-- La pareja también ve la inscripción.
create policy "Cada usuario ve las inscripciones donde es pareja"
  on public.tournament_registrations for select to authenticated
  using ((select auth.uid()) = partner_id);

-- Anotarse, responder y cancelar pasan por las funciones de abajo.
drop policy "Cada usuario se inscribe en torneos abiertos"
  on public.tournament_registrations;
drop policy "Cada usuario cancela su inscripción mientras estén abiertas"
  on public.tournament_registrations;
revoke insert, delete on public.tournament_registrations from authenticated;

-- Las invitaciones sin aceptar no ocupan lugar: el cupo se controla al aceptar.
drop trigger tournament_registrations_capacity on public.tournament_registrations;

-- ---------------------------------------------------------------------
-- Reglas de categoría (igual que src/lib/categories.ts). Null = puede jugar.
-- ---------------------------------------------------------------------
create function public.pair_category_error(
  p_tournament public.tournaments,
  p_player smallint,
  p_partner smallint
)
returns text
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_tournament.category_min is null and p_tournament.category_sum is null then
    return null;
  end if;
  if p_player is null then
    return 'falta_categoria';
  end if;
  if p_partner is null then
    return 'pareja_sin_categoria';
  end if;
  if p_tournament.category_min is not null then
    if p_player not between p_tournament.category_min and p_tournament.category_max then
      return 'categoria_fuera_de_rango';
    end if;
    if p_partner not between p_tournament.category_min and p_tournament.category_max then
      return 'pareja_fuera_de_rango';
    end if;
  end if;
  if p_tournament.category_sum is not null
    and p_player + p_partner < p_tournament.category_sum then
    return 'suma_insuficiente';
  end if;
  return null;
end;
$$;

-- Nombre para mostrar en los avisos.
create function public.profile_display_name(p_profile public.profiles)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(nullif(trim(p_profile.full_name), ''), '@' || p_profile.username);
$$;

-- ¿El usuario ya juega este torneo (anotado, invitando o como pareja aceptada)?
create function public.is_in_tournament(
  p_tournament_id bigint,
  p_user_id uuid,
  p_except_id bigint default null
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.tournament_registrations r
    where r.tournament_id = p_tournament_id
      and r.id is distinct from p_except_id
      and (
        (r.user_id = p_user_id and r.status in ('invitacion', 'pendiente', 'confirmada'))
        or (r.partner_id = p_user_id and r.status in ('pendiente', 'confirmada'))
      )
  );
$$;

-- Lugares ocupados (pendientes y confirmadas).
create function public.tournament_taken(p_tournament_id bigint)
returns integer
language sql
stable
set search_path = ''
as $$
  select count(*)::integer
  from public.tournament_registrations r
  where r.tournament_id = p_tournament_id
    and r.status in ('pendiente', 'confirmada');
$$;

revoke execute on function public.pair_category_error(public.tournaments, smallint, smallint) from public, anon, authenticated;
revoke execute on function public.profile_display_name(public.profiles) from public, anon, authenticated;
revoke execute on function public.is_in_tournament(bigint, uuid, bigint) from public, anon, authenticated;
revoke execute on function public.tournament_taken(bigint) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 1. Anotarse invitando a la pareja
-- ---------------------------------------------------------------------
create function public.register_pair(
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

-- ---------------------------------------------------------------------
-- 2. La pareja acepta o rechaza
-- ---------------------------------------------------------------------
create function public.respond_invitation(
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

-- ---------------------------------------------------------------------
-- 3. Cancelar (quien invitó o la pareja), mientras estén abiertas
-- ---------------------------------------------------------------------
create function public.cancel_registration(p_registration_id bigint)
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
  v_other uuid;
begin
  select * into v_registration
  from public.tournament_registrations
  where id = p_registration_id
    and (user_id = v_uid or (partner_id = v_uid and status in ('pendiente', 'confirmada')))
  for update;
  if not found or v_registration.status not in ('invitacion', 'pendiente', 'confirmada') then
    raise exception 'inscripcion_no_encontrada' using errcode = 'P0001';
  end if;

  select * into v_tournament from public.tournaments where id = v_registration.tournament_id;
  if v_tournament.status <> 'inscripciones' then
    raise exception 'inscripciones_cerradas' using errcode = 'P0001';
  end if;

  delete from public.tournament_registrations where id = v_registration.id;

  select * into v_me from public.profiles where id = v_uid;
  v_other := case when v_uid = v_registration.user_id
    then v_registration.partner_id
    else v_registration.user_id end;

  if v_other is not null then
    insert into public.notifications (user_id, title, body, href)
    values (
      v_other,
      left(
        public.profile_display_name(v_me)
          || case when v_registration.status = 'invitacion'
            then ' retiró la invitación al '
            else ' canceló la inscripción al ' end
          || v_tournament.name,
        200
      ),
      'Si querés jugarlo, podés anotarte con otra pareja mientras sigan abiertas las inscripciones.',
      '/torneos/' || v_tournament.slug || '#inscripcion'
    );
  end if;

  return 'cancelada';
end;
$$;

revoke execute on function public.register_pair(bigint, text, text, text) from public, anon;
revoke execute on function public.respond_invitation(bigint, boolean) from public, anon;
revoke execute on function public.cancel_registration(bigint) from public, anon;
grant execute on function public.register_pair(bigint, text, text, text) to authenticated;
grant execute on function public.respond_invitation(bigint, boolean) to authenticated;
grant execute on function public.cancel_registration(bigint) to authenticated;
