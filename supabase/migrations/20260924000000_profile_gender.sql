-- =====================================================================
-- Rama de cada cuenta (masculino o femenino). La elige el jugador al
-- registrarse; las cuentas que ya existían la eligen una sola vez en
-- Mi cuenta. Después solo la cambia un admin.
-- =====================================================================

alter table public.profiles
  add column gender text check (gender in ('masculino', 'femenino'));

comment on column public.profiles.gender is
  'Rama del jugador. La elige al registrarse (o una vez con set_my_gender); después solo la cambia un admin con set_profile_gender.';

-- Sin grant de update: los usuarios no la tocan directo.

-- Igual que 20260919010000, más la rama que viene del formulario de registro.
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
begin
  for v_attempt in 1..5 loop
    begin
      insert into public.profiles (id, full_name, avatar_url, email, username, gender)
      values (
        new.id,
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'avatar_url',
        new.email,
        public.unique_username(v_base),
        v_gender
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

-- El jugador elige su rama una sola vez (si todavía no tiene).
create function public.set_my_gender(p_gender text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  if p_gender is null or p_gender not in ('masculino', 'femenino') then
    raise exception 'rama_invalida' using errcode = 'P0001';
  end if;

  update public.profiles
  set gender = p_gender
  where id = (select auth.uid()) and gender is null;
  if not found then
    raise exception 'rama_ya_elegida' using errcode = 'P0001';
  end if;
end;
$$;

-- Un admin asigna o corrige la rama (null la borra). Le avisa al jugador.
create function public.set_profile_gender(
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
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores cambian la rama' using errcode = '42501';
  end if;
  if p_gender is not null and p_gender not in ('masculino', 'femenino') then
    raise exception 'rama_invalida' using errcode = 'P0001';
  end if;

  select p.gender into v_old
  from public.profiles p
  where p.id = p_user_id
  for update;
  if not found then
    raise exception 'usuario_no_existe' using errcode = 'P0001';
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

revoke execute on function public.set_my_gender(text) from public, anon;
revoke execute on function public.set_profile_gender(uuid, text) from public, anon;
grant execute on function public.set_my_gender(text) to authenticated;
grant execute on function public.set_profile_gender(uuid, text) to authenticated;
