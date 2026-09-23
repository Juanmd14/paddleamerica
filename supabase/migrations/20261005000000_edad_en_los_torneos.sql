-- =====================================================================
-- Fecha de nacimiento y torneos por edad (+30, -20, de 35 a 45).
--
-- La fecha vive en profiles, nunca en players: players es público y la
-- fecha no se muestra en ningún lado. La elige el jugador al registrarse
-- (o una sola vez en Mi cuenta); después solo la corrige un admin.
--
-- La edad se cuenta al día que arranca el torneo (tournaments.starts_on).
-- Mismas reglas que src/lib/age-rules.ts: si cambia una, cambian las dos.
-- =====================================================================

alter table public.profiles
  add column birthdate date
  -- Tope flojo a propósito: la edad razonable la controlan las funciones,
  -- y un check no puede mirar la fecha de hoy (tiene que ser inmutable).
  check (birthdate is null or birthdate > date '1900-01-01');

comment on column public.profiles.birthdate is
  'Fecha de nacimiento. Dato privado: solo la ven el dueño de la cuenta y los admins. Sirve para los torneos con límite de edad.';

-- Sin grant de update: se carga con set_my_birthdate o set_profile_birthdate.

alter table public.tournaments
  add column age_min smallint check (age_min between 5 and 99),
  add column age_max smallint check (age_max between 5 and 99),
  add constraint tournaments_age_range_check
    check (age_min is null or age_max is null or age_max >= age_min);

comment on column public.tournaments.age_min is
  'Edad mínima al día que arranca el torneo. Un +30 es age_min = 30.';
comment on column public.tournaments.age_max is
  'Edad máxima al día que arranca el torneo, inclusive. Un -20 es age_max = 20.';

-- ---------------------------------------------------------------------
-- Reglas
-- ---------------------------------------------------------------------

-- Años cumplidos a esa fecha. age() de dos argumentos es inmutable.
create function public.age_on(p_birthdate date, p_on date)
returns integer
language sql
immutable
set search_path = ''
as $$
  select extract(year from age(p_on, p_birthdate))::integer;
$$;

-- Igual que src/lib/age-rules.ts. Null = pueden jugar.
create function public.pair_age_error(
  p_tournament public.tournaments,
  p_player date,
  p_partner date
)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_age integer;
begin
  if p_tournament.age_min is null and p_tournament.age_max is null then
    return null;
  end if;

  if p_player is null then
    return 'falta_fecha_nacimiento';
  end if;
  v_age := public.age_on(p_player, p_tournament.starts_on);
  if (p_tournament.age_min is not null and v_age < p_tournament.age_min)
    or (p_tournament.age_max is not null and v_age > p_tournament.age_max) then
    return 'edad_no_corresponde';
  end if;

  if p_partner is null then
    return 'pareja_sin_fecha_nacimiento';
  end if;
  v_age := public.age_on(p_partner, p_tournament.starts_on);
  if (p_tournament.age_min is not null and v_age < p_tournament.age_min)
    or (p_tournament.age_max is not null and v_age > p_tournament.age_max) then
    return 'pareja_edad_no_corresponde';
  end if;

  return null;
end;
$$;

revoke execute on function public.age_on(date, date) from public, anon, authenticated;
revoke execute on function public.pair_age_error(public.tournaments, date, date) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Cargar la fecha
-- ---------------------------------------------------------------------

-- Una fecha de nacimiento creíble: entre 5 y 100 años. Igual que isValidBirthdate.
create function public.is_valid_birthdate(p_birthdate date)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_birthdate is not null
    and p_birthdate <= current_date - interval '5 years'
    and p_birthdate >= current_date - interval '100 years';
$$;

-- Igual que 20260924000000, más la fecha que viene del formulario de registro.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base text := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    split_part(new.email, '@', 1)
  );
  v_gender text := case
    when new.raw_user_meta_data ->> 'gender' in ('masculino', 'femenino')
      then new.raw_user_meta_data ->> 'gender'
  end;
  v_birthdate date;
begin
  -- raw_user_meta_data lo manda el navegador: una fecha rota no puede voltear
  -- el alta de la cuenta, se ignora y la carga después en Mi cuenta.
  begin
    v_birthdate := nullif(new.raw_user_meta_data ->> 'birthdate', '')::date;
  exception when others then
    v_birthdate := null;
  end;
  if not public.is_valid_birthdate(v_birthdate) then
    v_birthdate := null;
  end if;

  for v_attempt in 1..5 loop
    begin
      insert into public.profiles (
        id, full_name, avatar_url, email, username, gender, birthdate
      )
      values (
        new.id,
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'avatar_url',
        new.email,
        public.unique_username(v_base),
        v_gender,
        v_birthdate
      );
      return new;
    exception when unique_violation then
      -- Dos registros simultáneos con el mismo nombre: probamos otro sufijo.
      v_base := v_base || floor(random() * 90 + 10)::text;
    end;
  end loop;
  raise exception 'No se pudo crear el usuario';
end;
$$;

-- El jugador la carga una sola vez (si todavía no la tiene).
create function public.set_my_birthdate(p_birthdate date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  if not public.is_valid_birthdate(p_birthdate) then
    raise exception 'fecha_invalida' using errcode = 'P0001';
  end if;

  update public.profiles
  set birthdate = p_birthdate
  where id = (select auth.uid()) and birthdate is null;
  if not found then
    raise exception 'fecha_ya_cargada' using errcode = 'P0001';
  end if;
end;
$$;

-- Un admin la corrige (null la borra). Sin aviso: no cambia nada que el
-- jugador tenga que hacer, y es un dato que él mismo cargó.
create function public.set_profile_birthdate(
  p_user_id uuid,
  p_birthdate date default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores cambian la fecha de nacimiento' using errcode = '42501';
  end if;
  if p_birthdate is not null and not public.is_valid_birthdate(p_birthdate) then
    raise exception 'fecha_invalida' using errcode = 'P0001';
  end if;

  update public.profiles set birthdate = p_birthdate where id = p_user_id;
  if not found then
    raise exception 'usuario_no_existe' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.is_valid_birthdate(date) from public, anon;
revoke execute on function public.set_my_birthdate(date) from public, anon;
revoke execute on function public.set_profile_birthdate(uuid, date) from public, anon;
grant execute on function public.set_my_birthdate(date) to authenticated;
grant execute on function public.set_profile_birthdate(uuid, date) to authenticated;

-- ---------------------------------------------------------------------
-- Inscripción: copias de las versiones vigentes (20260927000000 y
-- 20260925000000) con el control de edad agregado después del de rama.
-- ---------------------------------------------------------------------
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

  -- Edad al día que arranca el torneo (+30, -20...).
  v_error := public.pair_age_error(v_tournament, v_me.birthdate, v_partner.birthdate);
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

  -- Edad, también desde quien acepta.
  v_error := public.pair_age_error(v_tournament, v_me.birthdate, v_inviter.birthdate);
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

-- Copia de 20261003000000 con la edad: a la lista de espera solo entra quien
-- podría jugar el torneo.
create or replace function public.join_waitlist(p_tournament_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_tournament public.tournaments;
  v_category smallint;
  v_gender text;
  v_birthdate date;
  v_error text;
begin
  if v_uid is null then
    raise exception 'sin_sesion';
  end if;

  select * into v_tournament
  from public.tournaments
  where id = p_tournament_id;
  if not found or v_tournament.status <> 'inscripciones' then
    raise exception 'inscripciones_cerradas';
  end if;
  if v_tournament.capacity is null
     or public.tournament_taken(p_tournament_id) < v_tournament.capacity then
    raise exception 'hay_lugar';
  end if;
  if public.is_in_tournament(p_tournament_id, v_uid) then
    raise exception 'ya_anotado';
  end if;

  -- Solo puede esperar un lugar quien podría jugarlo: mismas reglas de rama,
  -- categoría y edad que al anotarse, pero de la persona sola (la pareja se ve después).
  select p.category, p.gender, p.birthdate into v_category, v_gender, v_birthdate
  from public.profiles p
  where p.id = v_uid;

  v_error := public.pair_gender_error(v_tournament, v_gender, v_gender);
  if v_error in ('falta_rama', 'rama_no_corresponde') then
    raise exception '%', v_error;
  end if;

  v_error := public.pair_age_error(v_tournament, v_birthdate, v_birthdate);
  if v_error in ('falta_fecha_nacimiento', 'edad_no_corresponde') then
    raise exception '%', v_error;
  end if;

  if v_tournament.category_min is not null or v_tournament.category_sum is not null then
    if v_category is null then
      raise exception 'falta_categoria';
    end if;
    if v_tournament.category_min is not null
       and v_tournament.category_max is not null
       and (v_category < v_tournament.category_min
            or v_category > v_tournament.category_max) then
      raise exception 'categoria_fuera_de_rango';
    end if;
  end if;

  insert into public.tournament_waitlist (tournament_id, user_id)
  values (p_tournament_id, v_uid)
  on conflict do nothing;
end;
$$;
