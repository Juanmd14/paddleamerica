-- =====================================================================
-- Cuenta vinculada a su jugador del ranking. La vincula un admin; desde ahí
-- la categoría y la rama de la cuenta salen del jugador y lo siguen.
-- El vínculo vive en profiles (privada), no en players (pública).
-- =====================================================================

alter table public.profiles
  add column player_id bigint unique references public.players (id) on delete set null;

comment on column public.profiles.player_id is
  'Jugador del ranking de esta cuenta (lo vincula un admin). Categoría y rama salen de ese jugador.';

-- "6ta" → 6, " 1RA " → 1. Null si no es de 1ra a 8va.
create function public.category_from_label(p_label text)
returns smallint
language sql
immutable
set search_path = ''
as $$
  select (regexp_match(
    lower(trim(coalesce(p_label, ''))),
    '^([1-8])\s*(?:ra|da|ta|ma|va|°|º)?$'
  ))[1]::smallint;
$$;

-- 6 → "6ta".
create function public.category_name(p_category smallint)
returns text
language sql
immutable
set search_path = ''
as $$
  select p_category::text
    || (array['ra', 'da', 'ra', 'ta', 'ta', 'ta', 'ma', 'va'])[p_category];
$$;

revoke execute on function public.category_from_label(text) from public, anon, authenticated;
revoke execute on function public.category_name(smallint) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Vincular (o desvincular, con null) una cuenta con un jugador
-- ---------------------------------------------------------------------
create function public.link_profile_player(
  p_user_id uuid,
  p_player_id bigint default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current bigint;
  v_player public.players;
  v_category smallint;
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores vinculan cuentas' using errcode = '42501';
  end if;

  select p.player_id into v_current
  from public.profiles p
  where p.id = p_user_id
  for update;
  if not found then
    raise exception 'usuario_no_existe' using errcode = 'P0001';
  end if;

  -- Desvincular: la cuenta conserva la categoría y la rama que tenía.
  if p_player_id is null then
    update public.profiles set player_id = null where id = p_user_id;
    return;
  end if;
  if v_current = p_player_id then
    return;
  end if;

  select * into v_player from public.players where id = p_player_id for update;
  if not found then
    raise exception 'jugador_no_existe' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.profiles
    where player_id = p_player_id and id <> p_user_id
  ) then
    raise exception 'jugador_ya_vinculado' using errcode = 'P0001';
  end if;

  v_category := public.category_from_label(v_player.category);
  if v_category is null then
    raise exception 'categoria_del_jugador_invalida' using errcode = 'P0001';
  end if;

  update public.profiles
  set player_id = p_player_id, category = v_category, gender = v_player.gender
  where id = p_user_id;

  insert into public.notifications (user_id, title, body, href)
  values (
    p_user_id,
    'Tu cuenta quedó vinculada al ranking',
    'Sos ' || public.category_name(v_category)
      || case v_player.gender when 'femenino' then ' damas' else ' caballeros' end
      || '. En Mi cuenta ves tu puesto y tus puntos.',
    '/jugadores/' || v_player.slug
  );
end;
$$;

revoke execute on function public.link_profile_player(uuid, bigint) from public, anon;
grant execute on function public.link_profile_player(uuid, bigint) to authenticated;

-- ---------------------------------------------------------------------
-- Si cambia la categoría o la rama del jugador, cambia en su cuenta.
-- Solo avisa si cambió el número de categoría (no por la rama ni por "6ta"→"6TA").
-- ---------------------------------------------------------------------
create function public.sync_linked_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_old smallint;
  v_new smallint;
begin
  select p.id, p.category into v_profile_id, v_old
  from public.profiles p
  where p.player_id = new.id
  for update;
  if not found then
    return new;
  end if;

  v_new := public.category_from_label(new.category);
  if v_new is null then
    raise exception 'categoria_del_jugador_invalida' using errcode = 'P0001';
  end if;

  update public.profiles
  set category = v_new, gender = new.gender
  where id = v_profile_id;

  if v_old is distinct from v_new then
    insert into public.notifications (user_id, title, body, href)
    values (
      v_profile_id,
      'Tu categoría es ' || public.category_name(v_new),
      'La actualizó el organizador en el ranking.',
      '/jugadores/' || new.slug
    );
  end if;
  return new;
end;
$$;

create trigger players_sync_linked_profile
  after update of category, gender on public.players
  for each row
  when (old.category is distinct from new.category or old.gender is distinct from new.gender)
  execute function public.sync_linked_profile();

-- ---------------------------------------------------------------------
-- Categoría y rama de una cuenta vinculada se cambian en el jugador.
-- (Copias de 20260920000000 y 20260924000000 con ese control.)
-- ---------------------------------------------------------------------
create or replace function public.set_profile_category(
  p_user_id uuid,
  p_category smallint default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old smallint;
  v_player bigint;
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores asignan categorías' using errcode = '42501';
  end if;
  if p_category is not null and p_category not between 1 and 8 then
    raise exception 'categoria_invalida' using errcode = 'P0001';
  end if;

  select p.category, p.player_id into v_old, v_player
  from public.profiles p
  where p.id = p_user_id
  for update;
  if not found then
    raise exception 'usuario_no_existe' using errcode = 'P0001';
  end if;
  if v_player is not null then
    raise exception 'cuenta_vinculada' using errcode = 'P0001';
  end if;
  if v_old is not distinct from p_category then
    return;
  end if;

  update public.profiles set category = p_category where id = p_user_id;

  if p_category is not null then
    insert into public.notifications (user_id, title, body, href)
    values (
      p_user_id,
      'Tu categoría es ' || p_category
        || (array['ra', 'da', 'ra', 'ta', 'ta', 'ta', 'ma', 'va'])[p_category],
      'La asignó el organizador. Ya podés anotarte en los torneos de tu categoría.',
      '/torneos'
    );
  end if;
end;
$$;

create or replace function public.set_profile_gender(
  p_user_id uuid,
  p_gender text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old text;
  v_player bigint;
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores cambian la rama' using errcode = '42501';
  end if;
  if p_gender is not null and p_gender not in ('masculino', 'femenino') then
    raise exception 'rama_invalida' using errcode = 'P0001';
  end if;

  select p.gender, p.player_id into v_old, v_player
  from public.profiles p
  where p.id = p_user_id
  for update;
  if not found then
    raise exception 'usuario_no_existe' using errcode = 'P0001';
  end if;
  if v_player is not null then
    raise exception 'cuenta_vinculada' using errcode = 'P0001';
  end if;
  if v_old is not distinct from p_gender then
    return;
  end if;

  update public.profiles set gender = p_gender where id = p_user_id;

  if p_gender is not null then
    insert into public.notifications (user_id, title, body, href)
    values (
      p_user_id,
      'Tu rama ahora es ' || case p_gender when 'masculino' then 'masculina' else 'femenina' end,
      'La cambió el organizador. Define en qué torneos te podés anotar.',
      '/torneos'
    );
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Foto de la cuenta para la página pública del jugador (solo la URL).
-- ---------------------------------------------------------------------
create function public.get_player_account_avatar(p_player_id bigint)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.avatar_url from public.profiles p where p.player_id = p_player_id;
$$;

revoke execute on function public.get_player_account_avatar(bigint) from public;
grant execute on function public.get_player_account_avatar(bigint) to anon, authenticated;
